var sending_account = null;


$( document ).ready(function() {

    connectionMaintainer.setStatusCallback(set_connection_status);

    //testing
    account = web3.hls.accounts.privateKeyToAccount('0x6edbbdf4e1a6e415b29444d38675364f67ae9c5a6192d3d755043f4b61e73cbb');
    sending_account = account;
    web3.hls.accounts.wallet.add(account);
    var address = sending_account.address.substr(0,20);
    set_account_status('Sending from '+address+"...");

    $('#load_wallet_form').submit(function (e){
        e.preventDefault();

        //clear all variables when a new wallet is loaded
        clear_vars();
        var private_key_string = $('#input_private_key').val();

        account = web3.hls.accounts.privateKeyToAccount(private_key_string);
        sending_account = account;
        web3.hls.accounts.wallet.add(account);

        set_account_status('Sending from '+account.address);

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

    $('#generate_wallet_form').submit(function (e) {
        e.preventDefault();
        var password = $("#generate_wallet_form_password").val();
        var new_wallet = web3.eth.accounts.create();
        var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);
        var filename = "HLS_wallet_" + new_wallet.address;
        var blob = new Blob([JSON.stringify(keystore)], {type: "text/plain;charset=utf-8"});
        fileSaver.saveAs(blob, filename+".txt");
    });

    $('#load_wallet_keystore_form').submit(function (e) {
        e.preventDefault();
        var password = $("#load_wallet_keystore_form_password").val();
        var keystore_file = $("#load_wallet_keystore_form_file").prop('files')[0]

        var reader = new FileReader();

        reader.onload = function(e) {
            var json_account = reader.result;
            try {
                sending_account = web3.eth.accounts.decrypt(JSON.parse(json_account), password)
            }catch(err){
                popup('Incorrect keystore password');
                return;
            }
            // console.log("private key");
            // console.log(sending_account.privateKey);
            web3.hls.accounts.wallet.add(sending_account);
            set_account_status('Sending from '+sending_account.address);

            console.log("private key added")
        }

        reader.readAsText(keystore_file);

    });

    // $('#test').click(function(){
    //     console.log('clicked');
    //     var start_timestamp = new Date('2018', '01', '01').getTime() / 1000
    //     var end_timestamp = new Date('2020', '01', '01').getTime() / 1000
    //     accountHelpers.get_all_transactions_from_account(sending_account, start_timestamp, end_timestamp)
    //         .then(console.log)
    //     // accountHelpers.test()
    //     //     .then(console.log)
    // })

    //refresh_loop();

    console.log("Starting");
});

//
// Loops
//



function refresh_loop(){
    if(sending_account != null){
        refresh_transactions()
        refresh_balance()
    }
    setTimeout(refresh_loop, 1000);
}




//
// General functionality
//


//TODO: add getbalance to web3
function refresh_balance(){
    if(sending_account == null){
        return
    }
    if(is_connected()){
        web3.hls.getBalance(sending_account.address)
            .then(function(args){
                set_balance_status(args);
            });
    }
}






