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
var tfa_enabled = false;

var newBlockListLength = 10

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
    //     ////console.log('Metamask detected');
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
    //         ////console.log("Unable to find injected metamask web3.")
    //     }
    //
    // }

    //server.newUser("username", undefined, "password");
    connectionMaintainer.setStatusCallback(set_connection_status);


    //testing
    //set web3 to the helios version in case metamask fucked with it.
    web3 = helios_web3;
    //account = web3.hls.accounts.privateKeyToAccount('0x6edbbdf4e1a6e415b29444d38675364f67ae9c5a6192d3d755043f4b61e73cbb');
    //sending_account = account;
    // web3.hls.accounts.wallet.add(account);
    //testServer();

    //
    // RPC testing stuff
    //

    // testAccount = web3.hls.accounts.privateKeyToAccount('0x6edbbdf4e1a6e415b29444d38675364f67ae9c5a6192d3d755043f4b61e73cbb');
    // web3.hls.accounts.wallet.add(testAccount);
    //
    // ////console.log("RPC test start");
    // web3.hls.getProtocolVersion()
    //     .then(function(result){
    //         ////console.log("protocolVersion");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getBlockByHash('0x70b6dff94048c6e79deac2055d7d69d736b2f21f2fbf244eb74b645222c02ea6')
    //     .then(function(result){
    //         ////console.log("getBlockByHash with reward bundle, no transactions");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getBlockByHash('0xc7ecd5fbd7f7cbfd6015cc7df85f4602ce73578f9d3f6d5bee5c55836f746eed')
    //     .then(function(result){
    //         ////console.log("getBlockByHash, no transactions");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getBlockByHash('0xc7ecd5fbd7f7cbfd6015cc7df85f4602ce73578f9d3f6d5bee5c55836f746eed', true)
    //     .then(function(result){
    //         ////console.log("getBlockByHash, with transactions");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getBlockByNumber(2,'0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD')
    //     .then(function(result){
    //         ////console.log("getBlockByNumber, no transactions");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getNewestBlocks(5)
    //     .then(function(result){
    //         ////console.log("getNewestBlocks(5), no transactions");
    //         //console.log(result);
    //     });
    // web3.hls.getNewestBlocks(5, 0, '0xb808a42cb3e4028782e6dcb611844210d68d5a1e427bed04e999d5e3b5774d0b')
    //     .then(function(result){
    //         ////console.log("getNewestBlocks(5, 0, '0xb808a42cb3e4028782e6dcb611844210d68d5a1e427bed04e999d5e3b5774d0b'), no transactions");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getNewestBlocks(4, 2, undefined, "0x57D46695F7F3418A60EF3651b8cc3294F512Da30")
    //     .then(function(result){
    //         ////console.log("getNewestBlocks(2, 2, undefined, \"0x57D46695F7F3418A60EF3651b8cc3294F512Da30\"), no transactions");
    //         //console.log(result);
    //     });
    // web3.hls.getNewestBlocks(4, 0, undefined, "0x57D46695F7F3418A60EF3651b8cc3294F512Da30")
    //     .then(function(result){
    //         ////console.log("getNewestBlocks(2, 0, undefined, \"0x57D46695F7F3418A60EF3651b8cc3294F512Da30\"), no transactions");
    //         //console.log(result);
    //     });
    // web3.hls.getBlockNumber("0x57D46695F7F3418A60EF3651b8cc3294F512Da30")
    //     .then(function(result){
    //         ////console.log("getBlockNumber(\"0x57D46695F7F3418A60EF3651b8cc3294F512Da30\")");
    //         //console.log(result);
    //     });
    // web3.hls.getGasPrice()
    //     .then(function(result){
    //         ////console.log("getGasPrice");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getTransactionReceipt("0x69cf5f0d6eb9d3bde0dcdd5398193a7bbe8dbc9d7239ae001963348db31f02e7")
    //     .then(function(result){
    //         ////console.log("web3.hls.getTransactionReceipt(\"0x69cf5f0d6eb9d3bde0dcdd5398193a7bbe8dbc9d7239ae001963348db31f02e7\")");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getTransactionByHash("0x69cf5f0d6eb9d3bde0dcdd5398193a7bbe8dbc9d7239ae001963348db31f02e7")
    //     .then(function(result){
    //         ////console.log("web3.hls.getTransactionByHash(\"0x69cf5f0d6eb9d3bde0dcdd5398193a7bbe8dbc9d7239ae001963348db31f02e7\")");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getBalance("0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", 0)
    //     .then(function(result){
    //         ////console.log("web3.hls.getBalance(\"0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6\", 0)");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getReceivableTransactions("0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD")
    //     .then(function(result){
    //         ////console.log("web3.hls.getReceivableTransactions(\"0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD\")");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getConnectedNodes()
    //     .then(function(result){
    //         ////console.log("web3.hls.getConnectedNodes()");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getHistoricalGasPrice()
    //     .then(function(result){
    //         ////console.log("web3.hls.getHistoricalGasPrice()");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getApproximateHistoricalTPC()
    //     .then(function(result){
    //         ////console.log("web3.hls.getApproximateHistoricalTPC()");
    //         //console.log(result);
    //     });
    //
    // web3.hls.getApproximateHistoricalNetworkTPCCapability()
    //     .then(function(result){
    //         ////console.log("web3.hls.getApproximateHistoricalNetworkTPCCapability()");
    //         //console.log(result);
    //     });

   

    $('body').on('click', '#logout', function(e) {
        logout();
    });

    //
    // dev stuff
    //

    $('#get_faucet').click(function(){
         web3.hls.getFaucet(sending_account.address);
    });


    $('#get_min_gas_price').click(function (e){
        if(sending_account == null){
            alertify.error('Need to load a wallet first');
            return
        }
        web3.hls.getGasPrice()
            .then()
    });

    $('#get_transaction_receipt').click(function (e){
        if(sending_account == null){
            alertify.error('Need to load a wallet first');
            return
        }
        web3.hls.getBlockNumber(sending_account.address)
            .then(function(args0){
                web3.hls.getBlockByNumber(args0, sending_account.address, true)
                    .then(function(args){
                        if(args.transactions.length > 0) {
                            web3.hls.getTransactionReceipt(args.transactions[0].hash)
                                .then();
                        }

                        if(args.receiveTransactions.length > 0) {
                            web3.hls.getTransactionReceipt(args.receiveTransactions[0].hash)
                                .then();
                        }


                    });

            })


    });

    $('#get_historical_min_gas_price').click(function (e){
        if(sending_account == null){
            alertify.error('Need to load a wallet first');
            return
        }
        web3.hls.getHistoricalGasPrice()
            .then(function(args){
                div = document.getElementById("plot_div");
                var csv_string = toCSV(args)
                var g = new Dygraph(div, csv_string);
            })
    });


    $('body').on('click', '.copy', function(e) {
        var data = $(this).data('copy');
        ////console.log('copying '+data);
        copyToClipboard(data);
        alertify.error("Address copied to clipboard");
    });

//     var popup_content = document.getElementById("popup_content_frontpage_warning").innerHTML;
//    //alertify.error(popup_content, width=900);
//     $("#modal-popup_content_frontpage_warning").find(".war-content").append(popup_content);
//     $("#modal-popup_content_frontpage_warning").modal("show");

    $('#network_id_select').on('click',function(){
        var selected_network_id = $('select.network_id').children("option:selected").val();
        if(connectionMaintainer.networkId !== selected_network_id){
            //console.log("changing network id to "+selected_network_id);
            set_connection_status("Connecting to network with id "+selected_network_id, false)
            connectionMaintainer.setNetworkIdAndReconnect(parseInt(1));
       }
    });
    
   
});

//
// Loops
//
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testServer(){
    await sleep(100);
    var start_time = Date.now();
    if(connectionMaintainer.isConnected()){
        web3.hls.test()
        .then(function(res){
            var duration = Date.now()-start_time
            ////console.log('success '+duration+"ms");
            //console.log(res);
            testServer();
        })
        .catch(function(err){
            var duration = Date.now()-start_time
            ////console.log('fail '+duration+"ms");
            //console.log(err);
            testServer();
        });
    }else{
        ////console.log('Not connected');
        await sleep(2000);
        testServer();
    }


}
function refresh_loop(){
    if(sending_account != null){
        refreshDashboard();
    }
    setTimeout(refresh_loop, 1000);
}

async function refreshDashboard() {
    if(!init_complete){
        ////console.log("Skipping refreshDashboard because init not complete");
        return;
    }
   // console.log(sending_account);
    if (sending_account === null || sending_account === undefined) {
        ////console.log('Refreshing dashboard. No account loaded.')
        set_account_status("No wallet loaded");
    } else {
        var name = sending_account.walletname;
        var address = sending_account.address;
       
        set_account_status(address, name);
        // if (online_wallet_to_name_lookup[sending_account.address] !== undefined) {
           
        // } else {
        //     var address = sending_account.address;
        //     set_account_status(address);
        // }
    }
    if(connectionMaintainer.isConnected() && sending_account !== null && sending_account!== undefined && sending_account.address !== undefined) {
        receivingTransactions = await receiveAnyIncomingTransactions(sending_account.address)
        if(receivingTransactions === true){
            ////console.log('Received transactions');
            sleep(2000)
            .then(function(){
                refresh_transactions();
                refresh_balance();
                init_min_gas_price();
            });
        }else{
            ////console.log('No transactions to receive');
            refresh_transactions();
            refresh_balance();
            init_min_gas_price();
        }

    }else{
        ////console.log("Not refreshing some variables because we arent connected to a node.")
    }
}




//
// General functionality
//


//TODO: add getbalance to web3
function refresh_balance(){
    ////console.log("Refreshing balance.")
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
    ////console.log("Initializing min gas price");
    if(connectionMaintainer.isConnected()) {
        web3.hls.getGasPrice()
        .then(function (min_gas_price) {
            $('#input_gas_price').attr('value', min_gas_price + 2);
            $('#input_gas_price').attr('min', min_gas_price+1);
            set_min_gas_price_status(min_gas_price+1);
            current_min_gas_price = min_gas_price;
        });
    }
}

function afterLoginInit(){
    ////console.log("AfterLoginInit");
    init_complete = true;
    //loaderPopup();
    //Refresh contacts first to make sure they are populated in dashboard transactions.
    refreshContactList()
    .then(function(){
        connectionMaintainer.setConnectedCallback(refreshDashboard);
        if(!connectionMaintainer.isConnected()){
            refreshDashboard();
        }
        ////console.log(sending_account);
        receiveAnyIncomingTransactions(sending_account.address)
        //initOnlineMenu();
        //close_alertify.error();
    });
    ////console.log("Starting");
}

function offlineModeInit(){
    ////console.log("OfflineModeInit");
    init_complete = true;
    connectionMaintainer.setConnectedCallback(refreshDashboard);
    if(!connectionMaintainer.isConnected()){
        refreshDashboard();
    }
    //receiveAnyIncomingTransactions(sending_account.address)
    initOfflineMenu();
    ////console.log("Starting");
}


function logout(){
    server.killSession();
    switchToPage('frontpage_page')
    window.location.hash = '';
    clear_vars(true);
    resize_initial_background();
}


function copyToClipboard(data) {
    var $body = document.getElementsByTagName('body')[0];
    var $tempInput = document.createElement('INPUT');
    $body.appendChild($tempInput);
    $tempInput.setAttribute('value', data)
    $tempInput.select();
    document.execCommand('copy');
    $body.removeChild($tempInput);
}