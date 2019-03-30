$( document ).ready(function() {
    $('#generate_offline_wallet_form').submit(function (e) {
        e.preventDefault();
        var password = $("#generate_offline_wallet_password").val();
        if(!(validateInputs(password, 'password') === true)){
            popup(validateInputs(password, 'password'));
            return;
        }
        var new_wallet = web3.eth.accounts.create();
        var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);
        var filename = "HLS_wallet_" + new_wallet.address;
        var blob = new Blob([JSON.stringify(keystore)], {type: "text/plain;charset=utf-8"});
        fileSaver.saveAs(blob, filename + ".txt");

        $('#generate_offline_wallet_password').val("");
        $('#generate_offline_wallet_password').trigger("change");
        addOfflineWallet(new_wallet);
        refreshDashboard();
        popup("The new wallet has been loaded and added to local wallets on the top menu.");
    });

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
                popup("Wallet "+wallet_name+" is now loaded.", 600);
            }else{
                popup("Wallet "+sending_account.address+" is now loaded.", 600);
            }
            closeMenu();

        }else{
            popup("Error: Problem loading wallet.");
        }

    });

    $('body').on('click', '#load_offline_wallet_from_keystore_fake_file_input', function(e) {
        $('#load_offline_wallet_from_keystore_file_input').click();
    });

    $('body').on('change', '#load_offline_wallet_from_keystore_file_input', function(e) {
        var filename = $(this).val().split(/(\\|\/)/g).pop().substr(0,20);
        if(filename == ""){
            $('#load_offline_wallet_from_keystore_fake_file_input').removeClass('filled');
            $('#load_offline_wallet_from_keystore_fake_file_input').text("Select keystore file");
        }else {
            $('#load_offline_wallet_from_keystore_fake_file_input').addClass('filled');
            $('#load_offline_wallet_from_keystore_fake_file_input').text(filename + "...");
        }
    });

    $('#load_offline_wallet_keystore_form').submit(function (e) {
        e.preventDefault();
        console.log("loading new wallet address")
        var password = $("#load_offline_wallet_from_keystore_password").val();
        var keystore_file = $("#load_offline_wallet_from_keystore_file_input").prop('files')[0]

        if(password === '' || keystore_file === '' || keystore_file === undefined){
            popup("You must choose a keystore file and enter a password");
            return;
        }
        var reader = new FileReader();

        reader.onload = function(e) {
            var json_account = reader.result;
            try {
                var new_wallet = web3.eth.accounts.decrypt(JSON.parse(json_account), password)
            }catch(err){
                popup('Incorrect keystore password');
                return;
            }

            if(new_wallet.address in available_offline_accounts){
                popup("You have already added a wallet with this address to your offline wallets.")
                return
            }

            $('#load_offline_wallet_from_keystore_file_input').val("");
            $('#load_offline_wallet_from_keystore_fake_file_input').text("Select keystore file");
            $('#load_offline_wallet_from_keystore_password').val("");
            addOfflineWallet(new_wallet);
            refreshDashboard();
            popup("The new wallet has been loaded and added to offline wallets on the top menu.");
            console.log("private key added")
        }

        reader.readAsText(keystore_file);

    });


    $('#save_offline_wallet_keystore_form').submit(function (e) {
        e.preventDefault();
        var password = $("#save_offline_wallet_keystore_form_password").val();
        if(!(validateInputs(password, 'password') === true)){
            popup(validateInputs(password, 'password'));
            return;
        }
        var wallet_address = $('#currently_editing_offline_wallet_address').val();
        var existing_account = available_offline_accounts[wallet_address];

        var keystore = web3.eth.accounts.encrypt(existing_account.privateKey, password);
        var filename = "HLS_wallet_" + existing_account.address;
        var blob = new Blob([JSON.stringify(keystore)], {type: "text/plain;charset=utf-8"});
        fileSaver.saveAs(blob, filename + ".txt");

        $('#save_offline_wallet_keystore_form_password').val("");
        $('#save_offline_wallet_keystore_form_password').trigger("change");

    });


    $('body').on('click', '.edit_offline_wallet', function(e) {
        var wallet_address = $(this).data('address');

        //Add the correct data to the editing page
        prepareEditOfflineWalletPage(wallet_address);

    });

    $('body').on('click', '.delete_online_wallet_link', function(e) {
        var wallet_address = $(this).data('address');
        deleteOfflineWallet(wallet_address);
    });

});


function addOfflineWallet(new_wallet, do_not_make_active_account){
    web3.hls.accounts.wallet.add(new_wallet);
    available_offline_accounts[new_wallet.address] = new_wallet;
    if(!(do_not_make_active_account === true)) {
        sending_account = new_wallet;
        refreshDashboard();
    }

    var wallet_name_short = new_wallet.address.substr(0,25) + "...";

    //Now add it to the menu
    var wallet_menu_item = " <li role=\"presentation\" class=\"nav__item\">\n" +
        "                            <a href='#main_page-offline_wallet' id='main_page-offline_wallet-menu_item' class='nav__link edit_offline_wallet' data-address='"+new_wallet.address+"'>\n" +
        "                                <div class='wallet_menu_item'>\n" +
        "                                     <div class='wallet_menu_item_name'>"+wallet_name_short+"</div><img class='switch_wallet_link' data-address='"+new_wallet.address+"' src='images/use_button.png'>\n" +
        "                                </div>\n" +
        "                            </a>\n" +
        "                        </li>"
    $('#offline_wallets_menu_list').prepend(wallet_menu_item);
}

function deleteOfflineWallet(wallet_address){
    delete available_offline_accounts[wallet_address];
    $('.nav__link.edit_offline_wallet[data-address="'+wallet_address+'"]').parent('.nav__item').remove();
    if(sending_account !== undefined && sending_account !== null && sending_account.address === wallet_address){
        sending_account = null;
        refreshDashboard();
    }
}

function deleteAllOfflineWallets(){
    Object.keys(available_offline_accounts).forEach(function(wallet_address) {
        deleteOfflineWallet(wallet_address);
    });
}

function prepareEditOfflineWalletPage(wallet_address){
    //Add the correct data to the editing page
    $('#currently_editing_offline_wallet_address').val(wallet_address);
    $('#currently_editing_offline_wallet_address_status').html(wallet_address);
    $('#edit_offline_wallet_enable_wallet_submit').data('address', wallet_address);
    $('#edit_offline_wallet_delete_wallet_submit').data('address', wallet_address);
}

