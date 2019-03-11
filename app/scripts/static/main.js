var sending_account = null;
var available_offline_accounts = {};
var available_online_accounts = {};
var online_wallet_to_id_lookup = {};
var online_wallet_to_name_lookup = {};
var contact_name_to_address_lookup = {};
var contact_address_to_name_lookup = {};
var contact_autocomplete_list = [];
var contact_autocomplete_list_to_address_lookup = {};
var init_complete = false;


//CASHES
var current_hls_balance_in_wei = 0;
var current_min_gas_price = 1;
var current_incoming_transactions = []


$( document ).ready(function() {


    // Check for existing session and just refresh it
    // server.renewSession()
    // .then(function(result){
    //     if(result) {
    //         set_username_status(window.localStorage.getItem('username'));
    //         switchToPage('main_page');
    //     }
    // });

    // if (ethereum) {
    //     console.log('Metamask detected');
    //     ethereum.enable()
    //     .then(function(accounts){
    //         var metamaskAccounts = accounts;
    //         var metamaskAccount = metamaskAccounts[0];
    //         metamaskAccount.sign("Hello world", "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe")
    //     });
    //
    //     if(web3.currentProvider.isMetaMask === true){
    //         metamaskWeb3 = web3;
    //     }else{
    //         console.log("Unable to find injected metamask web3.")
    //     }
    //
    // }

    //server.newUser("username", undefined, "password");
    connectionMaintainer.setStatusCallback(set_connection_status);


    //testing
    //set web3 to the helios version in case metamask fucked with it.
    web3 = helios_web3;
    // account = web3.hls.accounts.privateKeyToAccount('0x6edbbdf4e1a6e415b29444d38675364f67ae9c5a6192d3d755043f4b61e73cbb');
    // sending_account = account;
    // web3.hls.accounts.wallet.add(account);

    calculate_estimated_tx_fee_loop();

    $('body').on('click', '#logout', function(e) {
        server.killSession();
        switchToPage('frontpage_page')
        window.location.hash = '';
        clear_vars(true);
    });

    //
    // dev stuff
    //




    $('#get_min_gas_price').click(function (e){
        if(sending_account == null){
            popup('Need to load a wallet first');
            return
        }
        web3.hls.getGasPrice()
            .then(console.log)
    });

    $('#get_transaction_receipt').click(function (e){
        if(sending_account == null){
            popup('Need to load a wallet first');
            return
        }
        web3.hls.getBlockNumber(sending_account.address)
            .then(function(args0){
                web3.hls.getBlock(args0, sending_account.address, true)
                    .then(function(args){
                        if(args.transactions.length > 0) {
                            web3.hls.getTransactionReceipt(args.transactions[0].hash)
                                .then(console.log);
                        }

                        if(args.receiveTransactions.length > 0) {
                            web3.hls.getTransactionReceipt(args.receiveTransactions[0].hash)
                                .then(console.log);
                        }


                    });

            })


    });

    $('#get_historical_min_gas_price').click(function (e){
        if(sending_account == null){
            popup('Need to load a wallet first');
            return
        }
        web3.hls.getHistoricalGasPrice()
            .then(function(args){
                div = document.getElementById("plot_div");
                var csv_string = toCSV(args)
                var g = new Dygraph(div, csv_string);
            })
    });


});

//
// Loops
//

function refresh_loop(){
    if(sending_account != null){
        refreshDashboard();
    }
    setTimeout(refresh_loop, 1000);
}

function refreshDashboard() {
    if(!init_complete){
        console.log("Skipping refreshDashboard because init not complete");
        return;
    }
    if (sending_account === null || sending_account === undefined) {
        console.log('Refreshing dashboard. No account loaded.')
        set_account_status("No wallet loaded");
    } else {
        console.log('Refreshing dashboard. Sending account = '+ sending_account.address);
        if (online_wallet_to_name_lookup[sending_account.address] !== undefined) {
            var name = online_wallet_to_name_lookup[sending_account.address].substr(0, 20)
            if (online_wallet_to_name_lookup[sending_account.address].length > 20) {
                name = name + "...";
            }
            var address = sending_account.address.substr(0, 18) + "...";
            set_account_status(address, name);
        } else {
            var address = sending_account.address.substr(0, 20) + "...";
            set_account_status(address);
        }
    }
    if(connectionMaintainer.isConnected()) {
        refresh_transactions();
        refreshIncomingTransactions();
        refresh_balance();
        init_min_gas_price();
    }else{
        console.log("Not refreshing some variables because we arent connected to a node.")
    }
}




//
// General functionality
//


//TODO: add getbalance to web3
function refresh_balance(){
    console.log("Refreshing balance.")
    if(sending_account == null){
        return
    }
    if(connectionMaintainer.isConnected()){
        web3.hls.getBalance(sending_account.address)
        .then(function(args){
            var hls = numerical.roundD(parseFloat(web3.utils.fromWei(web3.utils.toBN(args))),8);
            set_balance_status(hls);
            current_hls_balance_in_wei = args;
        });
    }
}

function init_min_gas_price(){
    console.log("Initializing min gas price");
    if(connectionMaintainer.isConnected()) {
        web3.hls.getGasPrice()
        .then(function (min_gas_price) {
            $('#input_gas_price').attr('value', min_gas_price + 2);
            $('#input_gas_price').attr('min', min_gas_price+1);
            set_min_gas_price_status(min_gas_price);
            current_min_gas_price = min_gas_price;
        });
    }
}

function afterLoginInit(){
    console.log("AfterLoginInit");
    init_complete = true;
    connectionMaintainer.setConnectedCallback(refreshDashboard);
    if(!connectionMaintainer.isConnected()){
        refreshDashboard();
    }
    initOnlineMenu();
    refreshContactList();
    console.log("Starting");
}

function offlineModeInit(){
    console.log("OfflineModeInit");
    init_complete = true;
    connectionMaintainer.setConnectedCallback(refreshDashboard);
    if(!connectionMaintainer.isConnected()){
        refreshDashboard();
    }
    initOfflineMenu();
    console.log("Starting");
}




