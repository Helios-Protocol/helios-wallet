var sending_account = null;
var available_offline_accounts = {};
var available_online_accounts = {};
var online_wallet_to_id_lookup = {};
var online_wallet_to_name_lookup = {};
var contact_name_to_address_lookup = {};
var contact_address_to_name_lookup = {};
var contact_autocomplete_list = [];

$( document ).ready(function() {
    // Check for existing session and just refresh it
    server.renewSession()
    .then(function(result){
        if(result) {
            set_username_status(window.localStorage.getItem('username'));
            switchToPage('#main_page');
        }
    });

      if (typeof window['ethereum'] !== 'undefined') {
        console.log('testtest');
        console.log(window['ethereum']);
      } else {
        console.log('testtest2');
        console.log(window['ethereum']);
      }


    //server.newUser("username", undefined, "password");
    connectionMaintainer.setStatusCallback(set_connection_status);

    //testing
    account = web3.hls.accounts.privateKeyToAccount('0x6edbbdf4e1a6e415b29444d38675364f67ae9c5a6192d3d755043f4b61e73cbb');
    sending_account = account;
    web3.hls.accounts.wallet.add(account);

    $('body').on('click', '#logout', function(e) {
        server.killSession();
        switchToPage('#frontpage_page')
        window.location.hash = '';
        clear_vars(true);
    });

    $('#load_wallet_form').submit(function (e){
        e.preventDefault();

        //clear all variables when a new wallet is loaded
        clear_vars();
        var private_key_string = $('#input_private_key').val();

        account = web3.hls.accounts.privateKeyToAccount(private_key_string);
        sending_account = account;
        web3.hls.accounts.wallet.add(account);
        var address = sending_account.address.substr(0,20);
        set_account_status('Sending from '+address);

        console.log("private key added")
    });



    //
    // dev stuff
    //

    $('#receive_incoming_transactions').click(function (e){

        if(sending_account == null){
            popup('Need to load a wallet first');
            return
        }

        web3.hls.sendRewardBlock(sending_account.address)
        .then(function(){
            popup("Block successfully sent");
            clear_vars();
        })

    });


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
    if (sending_account === null || sending_account === undefined) {
        var address = "No wallet loaded";
        set_account_status(address);
    } else {
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
    refresh_transactions();
    refresh_balance();
}




//
// General functionality
//


//TODO: add getbalance to web3
function refresh_balance(){
    if(sending_account == null){
        return
    }
    if(connectionMaintainer.isConnected()){
        web3.hls.getBalance(sending_account.address)
        .then(function(args){
            set_balance_status(args);
        });
    }
}


function afterLoginInit(){
    refreshContactList();
    //refresh_loop();
    refreshDashboard();
    console.log("Starting");
}




