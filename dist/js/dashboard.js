$(document).ready(function(){
    var username = sessionStorage.getItem("username");
    var password = sessionStorage.getItem("password");
    var facode = sessionStorage.getItem("facode");
    set_two_factor_authentication_status(facode);
    if(username == null && password == null){
        window.location.href = './login.html';
    }
    
    $("#lusername").text(username);
    var keystores = sessionStorage.getItem("online_keystores");
    populateOnlineKeystores($.parseJSON(keystores), password);
    sessionStorage.setItem("online_keystores", keystores);
    afterLoginInit();
    console.log(new Date().getTime());
    refresh_transactions(0);
    $(".netselect").find("a").click(function(){
        var selected_network_id = $(this).data("id");
        var selectedtext = $(this).text();
        $(".networkidselect").text(selectedtext);
        if(connectionMaintainer.networkId !== selected_network_id){
            set_connection_status("Connecting to network with id "+selected_network_id, false)
            connectionMaintainer.setNetworkIdAndReconnect(parseInt(selected_network_id));
        }
    })
    $('body').on('click', '.switch_wallet_link', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var wallet_address = $(this).data('address');
        var wallet_name = $(this).data('name');

        if(wallet_address in available_offline_accounts || wallet_address in available_online_accounts) {
            if(wallet_address in available_offline_accounts){
                sending_account = available_offline_accounts[wallet_address];
            }else if(wallet_address in available_online_accounts){
                sending_account = available_online_accounts[wallet_address];
            }

            refreshDashboard();
            if(wallet_name !== undefined && wallet_name !== ""){
                var note = "Wallet "+wallet_name+" is now loaded.";
                $("#address_wallet_modal_note").text(note);
                $("#wallet_address_display").modal("show");
                //alertify.success("Wallet "+wallet_name+" is now loaded.", 600);
            }else{
                var note = "Wallet "+sending_account.address+" is now loaded.";
                $("#address_wallet_modal_note").text(note);
                $("#wallet_address_display").modal("show");
                //alertify.success("Wallet "+sending_account.address+" is now loaded.", 600);
            }
            //closeMenu();

        }else{
            alertify.error("Error: Problem loading wallet.");
        }

    });
   
    $('#send_transaction_advanced_options_link').click(function(){
        if($(this).hasClass('active')){
            //$('#send_transaction_advanced_options_container').hide();
            $(this).removeClass('active');
            $("#send_block_pre_confirmation").removeClass("form2bind_opem");
            $('#send_block_submit').text("Send")
            //$('.send_block_submit').attr("id","send_block_submit");
            //Need to clear any transactions they may have added
            clear_vars();
        }else{
            //$('#send_transaction_advanced_options_container').show();
            $(this).addClass('active');
            $("#send_block_pre_confirmation").addClass("form2bind_opem");
            $('#send_block_submit').text("Send Block With Transactions in List");
        }
    });
    $('#add_transaction_form').submit(function (e) {
        e.preventDefault();
        if (sending_account == null) {
            $('#error_status').text('Need to load a wallet first')
            return
        }
        add_transaction_to_block_from_form();
    })
    $('#send_block_pre_confirmation').submit(function (e) {
        
        e.preventDefault();
        if (sending_account == null) {
            alertify.error('Need to load a wallet first.');
            return
        }
        if(!connectionMaintainer.isConnected()){
            alertify.error('Need to be connected to a node to do this.');
            return
        }

        var is_advanced = $('#send_transaction_advanced_options_link').hasClass('active');

        if (!is_advanced) {
            //need to add the transaction first
            //the non advanced mode is only 1 tx. so lets clear any that might be sitting in the block from a previously cancelled attempt
            pending_send_transactions = [];
            if (!add_transaction_to_block_from_form()) {
                return false;
            }
        }

        if(pending_send_transactions === null || pending_send_transactions === undefined || pending_send_transactions.length == 0){
            alertify.error("You need to have at least one transaction to do this.");
            return;
        }

        if(getSumPendingTransactionsCost().gt(web3.utils.toBN(current_hls_balance_in_wei))){
            var required_cost = web3.utils.fromWei(web3.utils.toBN(getSumPendingTransactionsCost()), 'ether').toString();
            var hls_balance = web3.utils.fromWei(web3.utils.toBN(current_hls_balance_in_wei), 'ether').toString();
            alertify.error("You don't have enough HLS to cover the transactions and fees. " +
                "You have a balance of "+hls_balance+" But the transactions and fees add up to "+required_cost +
                "<br><br>If your balance is incorrect, try sending it again in a few moments.");
            return;
        }

        if(!checkPendingTransactionsGasPrice()){
            alertify.error("One or more of your transactions does not meet the minimum gas price requirement. " +
                "The current minimum allowed gas price is "+current_min_gas_price);
            return;
        }
        if(!checkBlockGasLimit()){
            alertify.error("Your transactions require more gas than the block gas limit. " +
                "Reduce the number of transactions in this block before sending again. " +
                "The block gas limit is "+numerical.block_gas_limit);
            return;
        }
        if(!checkIntrinsicGas()){
            alertify.error("One or more of your transactions do not have a gas limit high enough. " +
                "The minimum gas required to send a transaction is 21000.")
        }

        if(pending_send_transactions.length === 0){
            alertify.error("You must add at least one transaction to the block.");
        }

        var popup_content = document.getElementById("popup_content_confirm_transactions").innerHTML;

        //ensure correct
        $("#modal-transaction-confirm").find(".tran_send_modal").append(popup_content);
        $("#modal-transaction-confirm").modal("show");
       
        refresh_pending_transaction_table('final_tx_list_for_confirmation', false);
        
       
    });
    $('body').on('submit', '#send_block_post_confirmation', function (e) {
        e.preventDefault();
        if(!connectionMaintainer.isConnected()){
            alertify.error("You must be connected to a node to do this.")
            return;
        }
        web3.hls.sendTransactions(pending_send_transactions)
        .then(function(args){
            if (pending_send_transactions.length <= 1) {
                alertify.success("Transaction sent successfully");
            } else {
                alertify.success("Block sent successfully");
            }
            $("#modal-transaction-confirm").find(".tran_send_modal").html("");
            $("#modal-transaction-confirm").modal("hide");
            $("#modal-transaction-success").modal("show");
            clear_vars();
            //setTimeout(refreshDashboard, 2000);
            $('#input_amount').val("").trigger("change");
            $('#input_to').val("").trigger("change");
            updateInputLabels();
             
        })
        .catch(function(error){
            var error_message = getNodeMessageFromError(error);
            $("#modal-transaction-confirm").find(".tran_send_modal").html("");
            $("#modal-transaction-confirm").modal("hide");
            $("#modal-transaction-failed").modal("show");
            //alertify.error("Error when sending block: "+error_message);
            throw error;

        });

    });
    $('body').on('click', '.delete_transaction', function () {
        var index = $(this).data('index');
        pending_send_transactions.splice(index, 1);
        refresh_pending_transaction_table()
    });

    
    //contact list
     $('#add_contact_form').submit(function (e) {
        e.preventDefault();
        
        var contact_name = $("#add_contact_form_name").val();
        var contact_address = $("#add_contact_form_address").val();
        if(!(validateInputs(contact_name, 'contact_name') === true)){
            alertify.error(validateInputs(contact_name, 'contact_name'));
            return;
        }
        if(!(validateInputs(contact_address, 'wallet_address') === true)){
            alertify.error(validateInputs(contact_address, 'wallet_address'));
            return;
        }
        server.addContact(contact_name, contact_address)
        .then(function(response){
            //console.log(response);
            if(response !== false && "success" in response) {
                $("#add_contact_form_name").val('');
                $("#add_contact_form_address").val('');
                refreshContactList();
                alertify.success("New contact added successfully.");
            }else{
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                alertify.error(popup_content);
            }
        });

    });
    $('#modal-contact-remove-wallet-success , #modal-contact-remove-wallet-failed').on('hidden.bs.modal', function () {
        location.reload();
    })
    //add local wallet
    $('#generate_offline_wallet_form').submit(function (e) {
        e.preventDefault();
        var password = $("#generate_offline_wallet_password").val();
        if(!(validateInputs(password, 'password') === true)){
            alertify.error(validateInputs(password, 'password'));
            return;
        }
        var new_wallet = web3.eth.accounts.create();
        var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);
        var filename = "HLS_wallet_" + new_wallet.address;
        alertify.success(JSON.stringify(keystore));
        var blob = new Blob([JSON.stringify(keystore)], {type: "text/plain;charset=utf-8"});
        //fileSaver.saveAs(blob, filename + ".txt");

        $('#generate_offline_wallet_password').val("");
        $('#generate_offline_wallet_password').trigger("change");
        addOfflineWallet(new_wallet);
        refreshDashboard();
        alertify.success("The new wallet has been loaded and added to local wallets on the top menu.");
    });
    $('#load_offline_wallet_private_key_form').submit(function (e) {
        e.preventDefault();
        var privateKey = $("#load_offline_wallet_from_private_key").val();

        if(privateKey === '' || privateKey === undefined){
            alertify.error("You must enter a private key to be loaded");
            return;
        }
        if(!web3.utils.isHexStrict(privateKey)){
            // Try adding the 0x and see if it passes then.
            privateKey = "0x" + privateKey;
            if(!web3.utils.isHexStrict(privateKey)){
                // If it still fails, then it is malformed
                alertify.error('Private key appears to be incorrectly formatted.');
                return;
            }
        }

        if(!isPrivateKey(privateKey)){
            alertify.error('Private key appears to be incorrectly formatted.');
            return;
        }

        try {
            var new_wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
        }catch(err){
            alertify.error('Private key appears to be incorrectly formatted.');
            return;
        }

        if(new_wallet.address in available_offline_accounts){
            alertify.error("You have already added a wallet with this address to your offline wallets.")
            return
        }

        $('#load_offline_wallet_from_private_key').val("").trigger("change");
        addOfflineWallet(new_wallet);
        refreshDashboard();
        alertify.success("The new wallet has been loaded and added to offline wallets on the top menu.");
        //console.log("private key added")

    });
    $('#load_offline_wallet_keystore_form').submit(function (e) {
        e.preventDefault();
        //console.log("loading new wallet address")
        var password = $("#load_offline_wallet_from_keystore_password").val();
        var keystore_file = $("#load_offline_wallet_from_keystore_file_input").prop('files')[0]

        if(password === '' || keystore_file === '' || keystore_file === undefined){
            alertify.error("You must choose a keystore file and enter a password");
            return;
        }
        var reader = new FileReader();

        reader.onload = function(e) {
            var json_account = reader.result;
            try {
                //console.log("Decrypting keystore");
                //console.log(json_account);
                //This fixes a bug with keystores generated by MEW. They sometimes capitalize crypto
                json_account = fixMEWWalletJSON(json_account);
                //console.log("After fix")
                //console.log(json_account)
                var new_wallet = web3.eth.accounts.decrypt(JSON.parse(json_account), password)
            }catch(err){
                alertify.error('Incorrect keystore password');
                return;
            }

            if(new_wallet.address in available_offline_accounts){
                alertify.error("You have already added a wallet with this address to your offline wallets.")
                return
            }

            $('#load_offline_wallet_from_keystore_file_input').val("").trigger("change");
            $('#load_offline_wallet_from_keystore_fake_file_input').text("Select keystore file");
            $('#load_offline_wallet_from_keystore_password').val("").trigger("change");
            addOfflineWallet(new_wallet);
            refreshDashboard();
            alertify.success("The new wallet has been loaded and added to offline wallets on the top menu.");
            console.log("private key added")
        }

        reader.readAsText(keystore_file);

    });

    //add online wallet
    $('#generate_online_wallet_form').submit(function (e) {
        e.preventDefault();
        // loaderPopup();
        var password = $("#generate_online_wallet_password").val();
        var username = $("#generate_online_wallet_username").val();
        var wallet_name = $("#generate_online_wallet_name").val();
        if(!(validateInputs(username, 'username') === true)){
            alertify.error(validateInputs(username, 'username'));
            return;
        }
        if(!(validateInputs(wallet_name, 'wallet_name') === true)){
            alertify.error(validateInputs(wallet_name, 'wallet_name'));
            return;
        }

        //Need to sign in to confirm their username and password is correct before encrypting the keystore.
        server.signIn(username, password)
        .then(function(response){
            if(response !== false && "success" in response) {
                var new_wallet = web3.eth.accounts.create();
                var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);

                server.addOnlineWallet(keystore, wallet_name)
                .then(function(response2){
                    $('#generate_online_wallet_username').val("");
                    $('#generate_online_wallet_username').trigger("change");

                    $('#generate_online_wallet_name').val("");
                    $('#generate_online_wallet_name').trigger("change");

                    $('#generate_online_wallet_password').val("");
                    $('#generate_online_wallet_password').trigger("change");
                    addOnlineWallet(new_wallet, response2['id'], wallet_name);
                    refreshDashboard();
                    alertify.success("The new wallet has been added.");
                });

            }else{
                alertify.error("The username and password you entered didn't match. Please type the username and password you use to log in to your account.")
            }
        });

    });

    $('#load_online_wallet_keystore_form').submit(function (e) {
        e.preventDefault();
        //console.log("loading wallet from keystore")
       // loaderPopup();
        var password = $("#load_online_wallet_password").val();
        var username = $("#load_online_wallet_username").val();
        var wallet_name = $("#load_online_wallet_name").val();
        if(!(validateInputs(username, 'username') === true)){
            alertify.error(validateInputs(username, 'username'));
            return;
        }
        if(!(validateInputs(wallet_name, 'wallet_name') === true)){
            alertify.error(validateInputs(wallet_name, 'wallet_name'));
            return;
        }

        var keystore_password = $("#load_online_wallet_from_keystore_password").val();
        var keystore_file = $("#load_online_wallet_from_keystore_file_input").prop('files')[0]

        if(keystore_password === '' || keystore_file === '' || keystore_file === undefined){
            alertify.error("You must choose a keystore file and enter a password");
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            var json_account = reader.result;
            try {
                json_account = fixMEWWalletJSON(json_account);
                var new_wallet = web3.eth.accounts.decrypt(JSON.parse(json_account), keystore_password)
            }catch(err){
                alertify.error('Incorrect keystore password');
                return;
            }

            if(new_wallet.address in available_online_accounts){
                alertify.error("You have already added a wallet with this address to your online wallets.")
                return
            }
            var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);

            server.addOnlineWallet(keystore, wallet_name)
            .then(function(response2){

                $('#load_online_wallet_username').val("").trigger("change");
                $('#load_online_wallet_name').val("").trigger("change");
                $('#load_online_wallet_password').val("").trigger("change");

                $('#load_online_wallet_from_keystore_file_input').val("");
                $('#load_online_wallet_from_keystore_fake_file_input').text("Select keystore file");
                $('#load_online_wallet_from_keystore_password').val("");

                addOnlineWallet(new_wallet, response2['id'], wallet_name);
                refreshDashboard();
                updateInputLabels();
                alertify.success("The new wallet has been added.");
            });


        }

        //Need to sign in to confirm their username and password is correct before encrypting the keystore.
        server.signIn(username, password)
        .then(function(response){
            if(response !== false && "success" in response) {
                reader.readAsText(keystore_file);
            }else{
                popup("The username and password you entered didn't match. Please type the username and password you use to log in to your account.")
            }
        });


    });
    
    $('#load_online_wallet_private_key_form').submit(function (e) {
        e.preventDefault();
        //console.log("loading wallet from private key")
        //loaderPopup();
        var password = $("#load_online_wallet_from_private_key_password").val();
        var username = $("#load_online_wallet_from_private_key_username").val();
        var wallet_name = $("#load_online_wallet_from_private_key_name").val();
        if(!(validateInputs(username, 'username') === true)){
            alertify.error(validateInputs(username, 'username'));
            return;
        }
        if(!(validateInputs(wallet_name, 'wallet_name') === true)){
            alertify.error(validateInputs(wallet_name, 'wallet_name'));
            return;
        }

        var privateKey = $("#load_online_wallet_from_private_key").val();

        if(privateKey === '' || privateKey === undefined){
            alertify.error("You must enter a private key to be loaded");
            return;
        }
        if(!web3.utils.isHexStrict(privateKey)){
            // Try adding the 0x and see if it passes then.
            privateKey = "0x" + privateKey;
            if(!web3.utils.isHexStrict(privateKey)){
                // If it still fails, then it is malformed
                alertify.error('Private key appears to be incorrectly formatted.');
                return;
            }
        }

        if(!isPrivateKey(privateKey)){
            alertify.error('Private key appears to be incorrectly formatted.');
            return;
        }

        try {
            var new_wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
        }catch(err){
            alertify.error('Private key appears to be incorrectly formatted.');
            return;
        }

        if(new_wallet.address in available_online_accounts){
            alertify.error("You have already added a wallet with this address to your online wallets.")
            return
        }
        var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);

        //Need to sign in to confirm their username and password is correct before encrypting the keystore.
        server.signIn(username, password)
            .then(function(response){
                if(response !== false && "success" in response) {
                    server.addOnlineWallet(keystore, wallet_name)
                        .then(function(response2){


                            $('#load_online_wallet_from_private_key_username').val("").trigger("change");
                            $('#load_online_wallet_from_private_key_name').val("").trigger("change");
                            $('#load_online_wallet_from_private_key_password').val("").trigger("change");
                            $('#load_online_wallet_from_private_key').val("").trigger("change");


                            addOnlineWallet(new_wallet, response2['id'], wallet_name);
                            refreshDashboard();
                            updateInputLabels();
                            alertify.success("The new wallet has been added.");
                        });
                }else{
                    alertify.error("The username and password for your account that you entered didn't match. Please type the username and password you use to log in to your account.")
                }
            });




    });
    $('body').on('click', '.edit_online_wallet', function(e) {
        var wallet_address = $(this).data('address');
        // var wallet_id = online_wallet_to_id_lookup[wallet_address];
        var wallet_name = online_wallet_to_name_lookup[wallet_address];

        //Add the correct data to the editing page
        prepareEditOnlineWalletPage(wallet_address, wallet_name);

    });
    $('.generate_new_two_factor').click(function(){
        var val = $(this).data('val');
        server.getNew2FASecret()
        .then(function(response){
            if(response !== false && "success" in response) {
                //success
                // var popup_content = document.getElementById("popup_content_new_two_factor_authentication").innerHTML;

                // //ensure correct
                // popup(popup_content, 400);

                $('#two_factor_authentication_confirm_qr_code').attr('src', response['img_url']);
                $('#two_factor_authentication_confirm_secret').html(response['secret']);
               
                    $('#modal-enable-2fa').modal("show");
              
            }else{
                //fail
                var popup_content = "Oops, something went wrong:" + response['error_description'];
                alertify.error(popup_content);
            }
        })
    });
    $('body').on('submit', '#confirm_new_two_factor_authentication_secret', function (e) {
        e.preventDefault();
        var secret = $('#two_factor_authentication_confirm_secret').html();
        var code = $('#new_two_factor_authentication_code').val();
        server.save2FASecret(secret, code)
        .then(function(response){
            if(response !== false && "success" in response) {
                $('#modal-enable-2fa').modal("hide");
                $("#modal-enable-2fa-success").modal("show");
                sessionStorage.setItem("facode",true);
                set_two_factor_authentication_status(true);
            }else{
                $('#modal-enable-2fa').modal("hide");
                $("#modal-enable-2fa-failed").modal("show");
            }
        })

    });
    $('#two_factor_disable').click(function(){
        server.delete2FASecret()
        .then(function(response){
            if(response !== false && "success" in response) {
                $("#modal-disable-2fa").modal("show");
                sessionStorage.setItem("facode",false);
                set_two_factor_authentication_status(false);
            }else{
                var popup_content = "Oops, something went wrong:" + response['error_description'];
                alertify.error(popup_content);
            }
        })
    });
});
function set_two_factor_authentication_status(tfa_enabled){
    if(tfa_enabled) {
        
        $('#two_factor_authentication_status').text('');
        $('#two_factor_authentication_status').removeClass("Disabled").addClass("Enabled");
        $('#two_factor_authentication_status').append('<i class="uil uil-shield"></i> Enabled');
    }else{
        
        $('#two_factor_authentication_status').text('');
        $('#two_factor_authentication_status').removeClass("Enabled").addClass("Disabled");
        $('#two_factor_authentication_status').append('<i class="uil uil-shield-slash"></i> Disabled');
    }
}
function addOfflineWallet(new_wallet, do_not_make_active_account){
    web3.hls.accounts.wallet.add(new_wallet);
    
    available_offline_accounts[new_wallet.address] = new_wallet;
    if(!(do_not_make_active_account === true)) {
        sending_account = new_wallet;
        refreshDashboard();
    }

    var wallet_name_short = new_wallet.address.substr(0,15) + "...";

    var wallet_menu_item = "<li><a href='existing_online_wallet.html'>"+wallet_name_short+"</a><img class='switch_wallet_link' style='height: 20px;margin: 7px 0px 0px;' data-address='"+new_wallet.address+"' src='dist/assets/icon/use_button.png'></li>"; 
    $('.local_wallet').prepend(wallet_menu_item);
    //Now add it to the menu
    // var wallet_menu_item = " <li role=\"presentation\" class=\"nav__item\">\n" +
    //     "                            <a href='#main_page-offline_wallet' id='main_page-offline_wallet-menu_item' class='nav__link edit_offline_wallet' data-address='"+new_wallet.address+"'>\n" +
    //     "                                <div class='wallet_menu_item'>\n" +
    //     "                                     <div class='wallet_menu_item_name'>"+wallet_name_short+"</div><img class='switch_wallet_link' data-address='"+new_wallet.address+"' src='images/use_button.png'>\n" +
    //     "                                </div>\n" +
    //     "                            </a>\n" +
    //     "                        </li>"
    // $('#offline_wallets_menu_list').prepend(wallet_menu_item);
}
function addOnlineWallet(new_wallet, wallet_id, wallet_name, do_not_make_active_account){
    web3.hls.accounts.wallet.add(new_wallet);
    available_online_accounts[new_wallet.address] = new_wallet;
    online_wallet_to_id_lookup[new_wallet.address] = wallet_id;
    online_wallet_to_name_lookup[new_wallet.address] = wallet_name;
    if(!(do_not_make_active_account === true)) {
        sending_account = new_wallet;
        refreshDashboard();
    }

    var wallet_name_short = wallet_name.substr(0,15);
    if(wallet_name.length > 25){
        wallet_name_short = wallet_name_short + "...";
    }

    var wallet_menu_item = "<li style='display:inline-flex;'><a href='existing_online_wallet.html'>"+wallet_name_short+"</a><img class='switch_wallet_link' style='height: 20px;margin: 7px 0px 0px;' data-address='"+new_wallet.address+"' src='dist/assets/icon/use_button.png'></li>"; 
                           
    $('.live_wallet').prepend(wallet_menu_item);
    //Now add it to the menu
    // var wallet_menu_item = " <li role=\"presentation\" class=\"nav__item\">\n" +
    //     "                            <a href='#main_page-online_wallet' id='main_page-online_wallet-menu_item' class='nav__link edit_online_wallet' data-address='"+new_wallet.address+"'>\n" +
    //     "                                <div class='wallet_menu_item'>\n" +
    //     "                                     <div class='wallet_menu_item_name'>"+wallet_name_short+"</div><img class='switch_wallet_link' data-address='"+new_wallet.address+"' src='images/use_button.png'>\n" +
    //     "                                </div>\n" +
    //     "                            </a>\n" +
    //     "                        </li>"
    // $('#online_wallets_menu_list').prepend(wallet_menu_item);
}
function updateInputLabels(){
    $('input, textarea').each(function(){
        // Don't remove the active class if we click on the label
        if($(this).is(":focus")) {
            return;
        }
        if(!$(this).val() || $(this).val() === "") {
            $(this).siblings('.input__label').removeClass('input__label--active');
        }else{

            $(this).siblings('.input__label').addClass('input__label--active');
        }
    })
}
function checkPendingTransactionsGasPrice(){
    pending_send_transactions.forEach(function(tx){
        if(tx.gasPrice < current_min_gas_price){
            return false;
        }
    });
    return true;
}
function checkBlockGasLimit(){
    var gas_used = 0;
    pending_send_transactions.forEach(function(tx){
        gas_used += parseFloat(tx.gas);
    });

    return gas_used < numerical.block_gas_limit;
}
function checkIntrinsicGas(){
    pending_send_transactions.forEach(function(tx){
        if(tx.gas < 21000){
            return false;
        }
    });

    return true;
}
async function refresh_transactions(start_index){
    if(sending_account == null){
        return
    }

    if(start_index === undefined){
        start_index = 0
    }

    // var from_month = $('select.from_month').children("option:selected").val();
    // var from_year = $('select.from_year').children("option:selected").val();
    // var to_month = $('select.to_month').children("option:selected").val();
    // var to_year = $('select.to_year').children("option:selected").val();

    // var start_timestamp = new Date(from_year, from_month, '01').getTime() / 1000
    // var end_timestamp = new Date(to_year, to_month, '01').getTime() / 1000

    var start_timestamp =new Date("2019", "02", '01').getTime() / 1000;
    var end_timestamp = new Date().getTime();
    var txs = await accountHelpers.get_all_transactions_from_account(sending_account, start_timestamp, end_timestamp, start_index);

    console.log(txs);
    // var tableRef = document.getElementById('transaction_history_list').getElementsByTagName('tbody')[0];

    // //clear all rows
    // tableRef.innerHTML = "";

    // if(!txs){
    //     popup("No transactions found for this date range.")
    // } else {
    //     console.log(txs);
    //     if (txs.length > 0) {
    //         prev_block_number = null
    //         for (i = 0; i < txs.length; i++) {


    //             var row = tableRef.insertRow(tableRef.rows.length);
    //             row.className = 'tx_history_row';
    //             var cell0 = row.insertCell(0);
    //             var cell1 = row.insertCell(1);
    //             var cell2 = row.insertCell(2);
    //             var cell3 = row.insertCell(3);
    //             var cell4 = row.insertCell(4);



    //             var tx = txs[i];
    //             var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
    //             d.setUTCSeconds(tx.timestamp);
    //             var options = { day: 'numeric', year: 'numeric', month: 'short'};

    //             cell0.innerHTML = d.toLocaleString('en-US',options);
    //             cell1.innerHTML = tx.description;
    //             cell2.innerHTML = numerical.roundD(parseFloat(web3.utils.fromWei(web3.utils.toBN(tx.value))),6);
    //             cell3.innerHTML = numerical.roundD(parseFloat(web3.utils.fromWei(web3.utils.toBN(tx.gas_cost))),6);

    //             if (prev_block_number == null || prev_block_number != tx.block_number) {
    //                 cell4.innerHTML = numerical.roundD(parseFloat(web3.utils.fromWei(web3.utils.toBN(tx.balance))),6);
    //             }else{
    //                 cell4.innerHTML = "";
    //             }


    //             //now lets add the details:
    //             var detail_row = tableRef.insertRow(tableRef.rows.length);
    //             detail_row.className = 'tx_history_detail_row';
    //             var detail_cell0 = detail_row.insertCell(0);
    //             detail_cell0.className = 'tx_history_cell_full_width';
    //             detail_cell0.colSpan = 5;
    //             options = { day: 'numeric', year: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName:'short'};
    //             var details_content =   "<h3>Transaction details</h3>" +
    //                                     "<span class='bold'>Date:</span> "+d.toLocaleString('en-US',options)+"<br>" +
    //                                     "<span class='bold'>Description:</span> "+tx.description+"<br>" +
    //                                     "<span class='bold'>From:</span> "+getAutocompleteStringFromAddressIfExist(tx.from)+"<br>" +
    //                                     "<span class='bold'>To:</span> "+getAutocompleteStringFromAddressIfExist(tx.to)+"<br>" +
    //                                     "<span class='bold'>Value:</span> "+web3.utils.fromWei(web3.utils.toBN(tx.value)).toString() +"<br>" +
    //                                     "<span class='bold'>Fees:</span> "+web3.utils.fromWei(web3.utils.toBN(tx.gas_cost)).toString() +"<br>" +
    //                                     "<span class='bold'>Block number:</span> "+tx.block_number+"<br>"+
    //                                     "<span class='bold'>Block final balance:</span> "+web3.utils.fromWei(web3.utils.toBN(tx.balance)).toString();
    //             detail_cell0.innerHTML = details_content;

    //             prev_block_number = tx.block_number


    //         }
    //     }

    //     if(start_index <= 0){
    //         $('.newest_blocks_nav.explorer_prev_nav').hide();
    //     }else{
    //         $('.newest_blocks_nav.explorer_prev_nav').show();
    //     }

    //     if((start_index-newBlockListLength) < 0){
    //         var prev = 0;
    //     }else{
    //         var prev = start_index-newBlockListLength;
    //     }

    //     var next = start_index+newBlockListLength
    //     $('.tx_hist_nav.tx_hist_prev_nav').data('start', prev);
    //     $('.tx_hist_nav.tx_hist_next_nav').data('start', next);
    //     $('.tx_hist_page_nav').html(start_index + " - " + next);
    // }
}
async function populateOnlineKeystores(keystores, password){
    if(keystores.length > 0){
        for(var i = 0; i < keystores.length; i++){
            var keystore = keystores[i]['keystore'];
            var wallet_id = keystores[i]['id'];
            var wallet_name = keystores[i]['name'];
            var new_wallet = web3.eth.accounts.decrypt(JSON.parse(keystore), password);
            if(i === 0) {
                addOnlineWallet(new_wallet, wallet_id, wallet_name);
            }else{
                addOnlineWallet(new_wallet, wallet_id, wallet_name, true);
            }
        }
        return true
    }
}



async function refreshContactList(){
    $(".contact_div").remove();
    server.getContacts()
    .then(function(response){
        if(response !== false && "success" in response) {
            //console.log(response['contacts'].length);
            var contacts = response['contacts'];
            var html = '';
            contact_name_to_address_lookup = {};
            contact_address_to_name_lookup = {};
            contact_autocomplete_list = [];
            for(i=0; i < response['contacts'].length; i++){
                
                html +=  '<div class="d-flex contact_div">';
                html +=  '<div class="contact_table_1 align-self-center">';
                html +=  '<p class="mb-0 mr-2">'+contacts[i]['name']+'</p>';
                html +=  '</div>';
                html +=  '<div class="contact_table_2 align-self-center">';
                html +=  ' <p class="mb-0 mr-2">'+contacts[i]['address']+'</p>';
                html +=  '</div>';
                html +=  '<div class="contact_table_3">';
                html +=  '<button class="btn btn-contact-remove btn-rounded" id="delete_contact" data-toggle="modal" data-target="#modal-remove-contact-wallet" data-id="'+contacts[i]['id']+'" data-name="'+contacts[i]['name']+'" data-address="'+contacts[i]['address']+'" >Remove <i class="uil uil-trash-alt ml-1"></i></button>';
                html +=  '</div>';
                html +=  '</div>';
                contact_name_to_address_lookup[contacts[i]['name']] = contacts[i]['address'];
                contact_address_to_name_lookup[contacts[i]['address']] = contacts[i]['name'];
                var autocomplete_entry = contacts[i]['name'] + " <" + contacts[i]['address'] + ">";
                contact_autocomplete_list.push(autocomplete_entry);
                contact_autocomplete_list_to_address_lookup[autocomplete_entry] = contacts[i]['address'];
                
            }
            $( html ).insertAfter( ".contact_head" );
            return true;
        }
    });
}
$('body').on('click', '.delete_id', function(e) {
    var contact_id = $(this).data('id');
    //Need to sign in to confirm their username and password is correct before encrypting the keystore.
    server.deleteContact(contact_id)
    .then(function(response){
        if(response !== false && "success" in response) {
            $('#modal-remove-contact-wallet').modal('hide');
            $("#modal-contact-remove-wallet-success").modal("toggle");
            refreshContactList();
            //popup("Contact deleted successfully.");
        }else{
            $('#modal-remove-contact-wallet').modal('hide');
            $("#modal-contact-remove-wallet-failed").modal("toggle");

            var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
            //popup(popup_content, 500);
        }
    });
});
$('body').on('click',".btn-contact-remove",function(){
    var name = $(this).data('name');
    var address = $(this).data('address');
    $(".delete_modal_content #contact_name").text(name);
    $(".delete_modal_content #contact_address").text(address);
    $(".delete_id").attr("data-id",$(this).data('id'));
});


var set_balance_status = function(status){
    $('#h-balance').text(status);
    $('.h-balance').text(status);
}

var set_connection_status = function(status, connected){
    if(connected){
        $('#connection_status_icon').attr('src', 'dist/assets/icon/node.png');
    }else{
        $('#connection_status_icon').attr('src', 'dist/assets/icon/x.png');
    }
    $('#connection_status').text(status);
}
var set_min_gas_price_status = function(status){
    $('#min_gas_price_status').text(status);
    calculate_estimated_tx_fee_loop()
}
var set_account_status = function(address, name){
    
    if(name === undefined){
        $("#hls-name").text(name);
        $('#account_status').val(address);
    }else{
        $("#hls-name").text(name);
        $('#account_status').val(address);
    }

    if(web3 !== undefined && address !== undefined && web3.utils.isAddress(address.toLowerCase())){
        $('.sending_account_copy').show().data('copy', address);
    }else{
        $('.sending_account_copy').hide().data('copy', '');
    }
}

function calculate_estimated_tx_fee_loop(){
    var gas_price = web3.utils.toWei($('#input_gas_price').val(), 'gwei')
    gas_price = parseFloat(web3.utils.fromWei(web3.utils.toBN(gas_price), 'ether'));
    var tx_amount = $('#input_amount').val();
    var estimated_fee = Math.round(21000*gas_price*10000000)/10000000;
    if(!isNaN(parseFloat(tx_amount)) && isFinite(tx_amount)){
        var estimated_fee_percentage = Math.round(estimated_fee/tx_amount*100000)/100000*100;
    }else{
        var estimated_fee_percentage = 0;
    }
    $('.fee_estimation').text("Estimated fee per tx: "+estimated_fee+" or "+estimated_fee_percentage+"%")
    setTimeout(calculate_estimated_tx_fee_loop, 1000);
}
async function receiveAnyIncomingTransactions(wallet_address, notify_if_none){
    //console.log("Getting receivable transactions")
    return web3.hls.getReceivableTransactions(wallet_address)
    .then(function (receivableTxs) {
        //console.log('Finished getting receivable transactions')
        if (receivableTxs.length > 0) {
            return sendRewardBlock(wallet_address)
            .then(function (res) {
                popup("You have received new transactions!");
                return true;
            });
        }else {
            if(notify_if_none) {
                popup("There are no new incoming transactions");
            }
            return false;
        }
    });
}

function getAddressFromAutocompleteStringIfExist(autocomplete_string){
    if(!web3.utils.isAddress(autocomplete_string)){
        if(autocomplete_string in contact_autocomplete_list_to_address_lookup){
            return contact_autocomplete_list_to_address_lookup[autocomplete_string];
        }
    }
    return autocomplete_string;
}
function getSumPendingTransactionsCost(){
    var total_amount = web3.utils.toBN(0);
    pending_send_transactions.forEach(function(tx){
        var gas_cost = web3.utils.toBN(tx.gas).mul(web3.utils.toBN(tx.gasPrice))
        total_amount = total_amount.add(web3.utils.toBN(tx.value)).add(web3.utils.toBN(gas_cost))
    });
    return total_amount;
}
var pending_send_transactions = [];
function add_transaction_to_block_from_form(){

    var amount =$('#input_amount').val();
    var to = $('#input_to').val();

    to = getAddressFromAutocompleteStringIfExist(to);

    var gas_price =$('#input_gas_price').val();
    var total_gas = parseInt($('#input_total_gas').val());

    if(!(validateInputs(amount, 'tx_amount') === true)){
        alertify.error(validateInputs(amount, 'tx_amount'));
        return false;
    }
    if(!(validateInputs(gas_price, 'gas_price') === true)){
        alertify.error(validateInputs(gas_price, 'gas_price'));
        return false;
    }
    if(!(validateInputs(total_gas, 'total_gas') === true)){
        alertify.error(validateInputs(total_gas, 'total_gas'));
        return false;
    }

    if(!(validateInputs(to, 'wallet_address') === true)){
        alertify.error(validateInputs(to, 'wallet_address'));
        return false;
    }

    amount = web3.utils.toWei(amount.toString(), 'ether');
    gas_price = web3.utils.toWei(gas_price.toString(), 'gwei');

    var transaction = {
                    from: sending_account.address,
                    to: to,
                    value: amount,
                    gas: total_gas.toString(),
                    gasPrice: gas_price,
                }
               
    pending_send_transactions.push(transaction);

    refresh_pending_transaction_table();

    $('#input_amount').val("").trigger("change");
    $('#input_to').val("").trigger("change");
    //updateInputLabels();
   // console.log(pending_send_transactions);
    return true;

}
function getAutocompleteStringFromAddressIfExist(address){
    if(address in contact_address_to_name_lookup){
        return contact_address_to_name_lookup[address] + " <" + address + ">";
    }else{
        return address
    }
}
function refresh_pending_transaction_table(table_id, include_delete_button){
    if(table_id === undefined){
        table_id = "multiple_transaction_list";
    }
    if(include_delete_button === undefined){
        include_delete_button = true;
    }

    var tableRef = document.getElementById(table_id).getElementsByTagName('tbody')[0];

    //clear all rows
    tableRef.innerHTML = "";

    for (var i = 0; i < pending_send_transactions.length; i++) {
        var transaction = pending_send_transactions[i];
        var index = i;
        var to_shortened = getAutocompleteStringFromAddressIfExist(transaction.to);
        var amount_shortened = numerical.roundD(parseFloat(web3.utils.fromWei(transaction.value, 'ether')), 10);

        var row = tableRef.insertRow(tableRef.rows.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        if(include_delete_button){
            cell1.innerHTML = "<img src='dist/assets/icon/x.png' class='delete_transaction pr-1' style='width: 4%;' data-index=" + index + ">"+to_shortened;
        }else{
            cell1.innerHTML = to_shortened;
        }

        cell2.innerHTML = amount_shortened;
        cell3.innerHTML = web3.utils.fromWei(transaction.gasPrice, 'gwei'); //show in gwei
        cell4.innerHTML =transaction.gas; //show in wei
    }
}
var clear_vars = function(include_account = false){
    if (include_account){
        deleteAllOnlineWallets();
        deleteAllOfflineWallets();
        sending_account = null;
        available_offline_accounts = {};
        available_online_accounts = {};
        online_wallet_to_id_lookup = {};
        online_wallet_to_name_lookup = {};
    }
    pending_send_transactions = [];
    document.getElementById("multiple_transaction_list").getElementsByTagName('tbody')[0].innerHTML = "";
};
function validateInputs(value, type){
    try {
        switch (type) {
            case "password":
                if (value === undefined || value === '') {
                    return "Password cannot be left blank";
                }
                if (value.length < 16) {
                    return "Password must be at least 16 characters long";
                }
                break;
            case "email":
                if (value === undefined || value === '') {
                    return "Email cannot be left blank";
                }
                if (!validateEmail(value)) {
                    return "Invalid email";
                }
                break;
            case "username":
                if (value === undefined || value === '') {
                    return "Username cannot be left blank";
                }
                break;
            case "wallet_name":
                if (value === undefined || value === '') {
                    return "Wallet name cannot be left blank";
                }
                break;
            case "contact_name":
                if (value === undefined || value === '') {
                    return "Contact name cannot be left blank";
                }
                if (value.length > 50) {
                    return "Contact name can be a maximum of 50 characters in length.";
                }
                break;
            case "wallet_address":
                if (value === undefined || value === '') {
                    return "Wallet address cannot be left blank";
                }
                if (!web3.utils.isAddress(value.toLowerCase())) {
                    if (!(value in contact_autocomplete_list_to_address_lookup)) {
                        return "The given wallet address is not a valid address or contact.";
                    }
                }
                break;
            case "tx_amount":
                if (value === undefined || value === '') {
                    return "Transaction amount cannot be left blank";
                }
                if (Number(value) === value && value % 1 === 0) {
                    //intiger
                    if (!web3.utils.toWei(web3.utils.toBN(value), 'ether').gt(web3.utils.toBN(1))) {
                        return "Transaction amount must be at least 1 wei.";
                    }
                } else {
                    //need to convert to wei
                    value = web3.utils.toWei(value.toString(), 'ether');
                    if (!web3.utils.toWei(web3.utils.toBN(value), 'ether').gt(web3.utils.toBN(1))) {
                        return "Transaction amount must be at least 1 wei.";
                    }
                }


                break;
            case "gas_price":
                if (value === undefined || value === '') {
                    return "Transaction gas price cannot be left blank";
                }
                if (!web3.utils.toWei(web3.utils.toBN(value), 'gwei').gt(web3.utils.toBN(1))) {
                    return "Transaction gas price must be at least 1 wei.";
                }
                break;
            case "total_gas":
                if (value === undefined || value === '') {
                    return "Transaction total gas cannot be left blank";
                }
                if (!Number.isInteger(value)) {
                    return "Transaction total gas must be an integer";
                }
                break;
            case "two_factor_code":
                if (value.trim().length > 6) {
                    return "Two factor must be less than 6 characters long.";
                }
                break;
        }
    }catch(err){
        return "An error has occurred: "+err;
    }
    return true;
}

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function isPrivateKey(privateKey) {
    // check if it has the basic requirements of a private key
    if (!/^(0x)?[0-9a-f]{64}$/i.test(privateKey)) {
        return false;
        // If it's ALL lowercase or ALL upppercase
    }
    return true
}