$( document ).ready(function() {
    $('#generate_online_wallet_form').submit(function (e) {
        e.preventDefault();
        loaderPopup();
        var password = $("#generate_online_wallet_password").val();
        var username = $("#generate_online_wallet_username").val();
        var wallet_name = $("#generate_online_wallet_name").val();
        if(!(validateInputs(username, 'username') === true)){
            popup(validateInputs(username, 'username'));
            return;
        }
        if(!(validateInputs(wallet_name, 'wallet_name') === true)){
            popup(validateInputs(wallet_name, 'wallet_name'));
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
                    popup("The new wallet has been added.");
                });

            }else{
                popup("The username and password you entered didn't match. Please type the username and password you use to log in to your account.")
            }
        });

    });

    $('#edit_online_wallet_rename_form').submit(function (e) {
        e.preventDefault();
        var new_wallet_name = $("#edit_online_wallet_rename_name_input").val();
        var wallet_address = $('#currently_editing_online_wallet_address').val();
        var wallet_id = online_wallet_to_id_lookup[wallet_address];
        var previous_wallet_name = online_wallet_to_name_lookup[wallet_address];
        var existing_account = available_online_accounts[wallet_address];

        if(!(validateInputs(new_wallet_name, 'wallet_name') === true)){
            popup(validateInputs(new_wallet_name, 'wallet_name'));
            return;
        }
        loaderPopup();

        //Need to sign in to confirm their username and password is correct before encrypting the keystore.
        server.renameOnlineWallet(wallet_id, previous_wallet_name, new_wallet_name)
        .then(function(response){
            if(response !== false && "success" in response) {
                online_wallet_to_name_lookup[wallet_address] = new_wallet_name;
                if(sending_account.address === wallet_address)
                {
                    deleteOnlineWallet(wallet_address);
                    addOnlineWallet(existing_account,wallet_id,new_wallet_name);
                }else{
                    deleteOnlineWallet(wallet_address);
                    addOnlineWallet(existing_account,wallet_id,new_wallet_name, true);
                }

                prepareEditOnlineWalletPage(wallet_address, new_wallet_name);
                popup("Wallet renamed successfully.");

            }else{
                popup("An error has occured.");
            }
        });

    });

    $('#save_online_wallet_keystore_form').submit(function (e) {
        e.preventDefault();
        var password = $("#save_online_wallet_keystore_form_password").val();
        if(!(validateInputs(password, 'password') === true)){
            popup(validateInputs(password, 'password'));
            return;
        }
        var wallet_address = $('#currently_editing_online_wallet_address').val();
        var existing_account = available_online_accounts[wallet_address];

        var keystore = web3.eth.accounts.encrypt(existing_account.privateKey, password);
        var filename = "HLS_wallet_" + existing_account.address;
        var blob = new Blob([JSON.stringify(keystore)], {type: "text/plain;charset=utf-8"});
        fileSaver.saveAs(blob, filename + ".txt");

        $('#save_online_wallet_keystore_form_password').val("");
        $('#save_online_wallet_keystore_form_password').trigger("change");

    });


    $('body').on('click', '.edit_online_wallet', function(e) {
        var wallet_address = $(this).data('address');
        // var wallet_id = online_wallet_to_id_lookup[wallet_address];
        var wallet_name = online_wallet_to_name_lookup[wallet_address];

        //Add the correct data to the editing page
        prepareEditOnlineWalletPage(wallet_address, wallet_name);

    });

    $('body').on('click', '.delete_online_wallet_link', function(e) {
        var wallet_address = $(this).data('address');
        var wallet_name = online_wallet_to_name_lookup[wallet_address];
        var popup_content = document.getElementById("popup_content_confirm_online_wallet_delete").innerHTML;
        popup(popup_content, 600);

        var tableRef = document.getElementById('delete_online_wallet_confirmation_table').getElementsByTagName('tbody')[0];

        //clear all rows
        tableRef.innerHTML = "";
        var row = tableRef.insertRow(tableRef.rows.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        cell1.innerHTML = wallet_name;
        cell2.innerHTML = wallet_address;
        $('#delete_online_wallet_confirmation_popup_submit').data('address', wallet_address)

    });

    $('body').on('click', '#delete_online_wallet_confirmation_popup_submit', function(e) {
        var wallet_address = $(this).data('address');
        var wallet_id = online_wallet_to_id_lookup[wallet_address];
        var wallet_name = online_wallet_to_name_lookup[wallet_address];
        server.deleteOnlineWallet(wallet_id, wallet_name)
        .then(function(response){
            if(response !== false && "success" in response) {
                popup("Wallet deleted successfully.");
                deleteOnlineWallet(wallet_address);
                switchToTab('main_page-dashboard');
            }else{
                popup("An error occured.");
            }
        })

    });

    $('body').on('click', '#load_online_wallet_from_keystore_fake_file_input', function(e) {
        $('#load_online_wallet_from_keystore_file_input').click();
    });

    $('body').on('change', '#load_online_wallet_from_keystore_file_input', function(e) {
        var filename = $(this).val().split(/(\\|\/)/g).pop().substr(0,20);
        if(filename == ""){
            $('#load_online_wallet_from_keystore_fake_file_input').removeClass('filled');
            $('#load_online_wallet_from_keystore_fake_file_input').text("Select keystore file");
        }else {
            $('#load_online_wallet_from_keystore_fake_file_input').addClass('filled');
            $('#load_online_wallet_from_keystore_fake_file_input').text(filename + "...");
        }
    });

    $('#load_online_wallet_keystore_form').submit(function (e) {
        e.preventDefault();
        console.log("loading wallet from keystore")
        loaderPopup();
        var password = $("#load_online_wallet_password").val();
        var username = $("#load_online_wallet_username").val();
        var wallet_name = $("#load_online_wallet_name").val();
        if(!(validateInputs(username, 'username') === true)){
            popup(validateInputs(username, 'username'));
            return;
        }
        if(!(validateInputs(wallet_name, 'wallet_name') === true)){
            popup(validateInputs(wallet_name, 'wallet_name'));
            return;
        }

        var keystore_password = $("#load_online_wallet_from_keystore_password").val();
        var keystore_file = $("#load_online_wallet_from_keystore_file_input").prop('files')[0]

        if(keystore_password === '' || keystore_file === '' || keystore_file === undefined){
            popup("You must choose a keystore file and enter a password");
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            var json_account = reader.result;
            try {
                json_account = fixMEWWalletJSON(json_account);
                var new_wallet = web3.eth.accounts.decrypt(JSON.parse(json_account), keystore_password)
            }catch(err){
                popup('Incorrect keystore password');
                return;
            }

            if(new_wallet.address in available_online_accounts){
                popup("You have already added a wallet with this address to your online wallets.")
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
                popup("The new wallet has been added.");
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

});

function populateOnlineKeystores(keystores, password){
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

function addOnlineWallet(new_wallet, wallet_id, wallet_name, do_not_make_active_account){
    web3.hls.accounts.wallet.add(new_wallet);
    available_online_accounts[new_wallet.address] = new_wallet;
    online_wallet_to_id_lookup[new_wallet.address] = wallet_id;
    online_wallet_to_name_lookup[new_wallet.address] = wallet_name;
    if(!(do_not_make_active_account === true)) {
        sending_account = new_wallet;
        refreshDashboard();
    }

    var wallet_name_short = wallet_name.substr(0,25);
    if(wallet_name.length > 25){
        wallet_name_short = wallet_name_short + "...";
    }

    //Now add it to the menu
    var wallet_menu_item = " <li role=\"presentation\" class=\"nav__item\">\n" +
        "                            <a href='#main_page-online_wallet' id='main_page-online_wallet-menu_item' class='nav__link edit_online_wallet' data-address='"+new_wallet.address+"'>\n" +
        "                                <div class='wallet_menu_item'>\n" +
        "                                     <div class='wallet_menu_item_name'>"+wallet_name_short+"</div><img class='switch_wallet_link' data-address='"+new_wallet.address+"' src='images/use_button.png'>\n" +
        "                                </div>\n" +
        "                            </a>\n" +
        "                        </li>"
    $('#online_wallets_menu_list').prepend(wallet_menu_item);
}

function deleteOnlineWallet(wallet_address){
    delete available_online_accounts[wallet_address];
    delete online_wallet_to_name_lookup[wallet_address];
    delete online_wallet_to_id_lookup[wallet_address];
    $('.nav__link.edit_online_wallet[data-address="'+wallet_address+'"]').parent('.nav__item').remove();
    if(sending_account !== undefined && sending_account !== null && sending_account.address === wallet_address){
        sending_account = null;
        refreshDashboard();
    }
}

function deleteAllOnlineWallets(){
    Object.keys(available_online_accounts).forEach(function(wallet_address) {
        deleteOnlineWallet(wallet_address);
    });
}

function prepareEditOnlineWalletPage(wallet_address, wallet_name){
    //Add the correct data to the editing page
    $('#currently_editing_online_wallet_address').val(wallet_address);
    $('#edit_online_wallet_enable_wallet_submit').data('address', wallet_address);
    $('#edit_online_wallet_delete_wallet_submit').data('address', wallet_address);
    $('#edit_online_wallet_rename_name_input').val(wallet_name).trigger("change");
    $('#currently_editing_online_wallet_address_status').html(wallet_name + " <br>" + wallet_address)
}