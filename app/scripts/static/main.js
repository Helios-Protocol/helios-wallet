var available_nodes = [
    "ws://127.0.0.1:30304",
    "ws://142.58.49.25:30304"
]
//"ws://127.0.0.1:30304",
//var API_address = "ws://142.58.49.25:30304";
var sending_account = null
var pending_send_transactions = []

var testing_transactions = []

$( document ).ready(function() {



    hls = web3.hls;

    // //testing
    account = web3.hls.accounts.privateKeyToAccount('0x6edbbdf4e1a6e415b29444d38675364f67ae9c5a6192d3d755043f4b61e73cbb');
    sending_account = account;
    hls.accounts.wallet.add(account);
    var address = sending_account.address.substr(0,20);
    set_account_status('Sending from '+address+"...");

    $('#load_wallet_form').submit(function (e){
        e.preventDefault();

        //clear all variables when a new wallet is loaded
        clear_vars();
        var private_key_string = $('#input_private_key').val();

        account = web3.hls.accounts.privateKeyToAccount(private_key_string);
        sending_account = account;
        hls.accounts.wallet.add(account);

        set_account_status('Sending from '+account.address);

        console.log("private key added")
    });


    $('#add_transaction_form').submit(function (e){
        e.preventDefault();

        if(sending_account == null){
            $('#error_status').text('Need to load a wallet first')
            return
        }

        add_transaction_to_block_from_form();

    });

    $('body').on('click', '.delete_transaction', function() {
        var index = $(this).data('index');
        pending_send_transactions.splice(index, 1);
        refresh_pending_transaction_table()
    });

    $('#send_block_pre_confirmation').submit(function (e){
        e.preventDefault();
        if(sending_account == null){
            popup('Need to load a wallet first');
            return
        }

        var is_advanced = $('#send_transaction_advanced_options_link').hasClass('active');

        if(!is_advanced){
            //need to add the transaction first
            //the non advanced mode is only 1 tx. so lets clear any that might be sitting in the block from a previously cancelled attempt
            pending_send_transactions = [];
            if(!add_transaction_to_block_from_form()){
                return false;
            }
        }

        var popup_content = document.getElementById("popup_content_confirm_transactions").innerHTML;

        //ensure correct
        popup(popup_content, 800);
        refresh_pending_transaction_table('final_tx_list_for_confirmation', false);



    });

    //TODO:catch errors here
    $('body').on('submit', '#send_block_post_confirmation', function(){
        web3.hls.sendTransactions(pending_send_transactions);
        if(pending_send_transactions.length<=1){
            popup("Transaction sent successfully")
        }else{
            popup("Block sent successfully")
        }

        clear_vars();
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

    $('#refresh_transactions').click(function (e){
        if(sending_account == null){
            popup('Need to load a wallet first');
            return
        }

        refresh_transactions();
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
            hls.accounts.wallet.add(sending_account);
            set_account_status('Sending from '+sending_account.address);

            console.log("private key added")
        }

        reader.readAsText(keystore_file);

    });


    network_connection_maintainer_loop();
    calculate_estimated_tx_fee_loop();
    refresh_loop()

    init_min_gas_price();
});

//
// Loops
//

async function network_connection_maintainer_loop(){
    if(!is_connected()){
        set_connection_status('Connecting to network.', false);
        await connect_to_first_available_node()
    }

    if(is_connected()){
        var url = web3.currentProvider.connection.url;
        set_connection_status('Connected to node '+url, true);
    } else{
        set_connection_status('Connection to network failed. Retrying connection.', false);
        if(await connect_to_first_available_node()){
            var url = web3.currentProvider.connection.url;
            set_connection_status('Connected to node '+url, true);
        }
    }
    setTimeout(network_connection_maintainer_loop, 1000);

}

async function connect_to_first_available_node(){
    for(i=0;i<available_nodes.length;i++) {
        var API_address = available_nodes[i];
        if(!is_connected()) {
            web3.setProvider(new web3.providers.WebsocketProvider(API_address));
            await sleep(100);
        }else{
            return true;
        }
    }
    return false
}

function refresh_loop(){
    if(sending_account != null){
        refresh_transactions()
        refresh_balance()
    }
    setTimeout(refresh_loop, 1000);

}

function calculate_estimated_tx_fee_loop(){
    //Gwei
    var gas_price = gwei_to_hls($('#input_gas_price').val());
    var tx_amount = $('#input_amount').val();
    var estimated_fee = Math.round(21000*gas_price*10000000)/10000000
    var estimated_fee_percentage = Math.round(estimated_fee/tx_amount*100000)/100000
    $('.fee_estimation').text(estimated_fee+" or "+estimated_fee_percentage+"%")
    setTimeout(calculate_estimated_tx_fee_loop, 1000);
}


//
// General functionality
//

function refresh_pending_transaction_table(table_id, include_delete_button){
    if(table_id == undefined){
        table_id = "multiple_transaction_list";
    }
    if(include_delete_button == undefined){
        include_delete_button = true;
    }

    var tableRef = document.getElementById(table_id).getElementsByTagName('tbody')[0];

    //clear all rows
    tableRef.innerHTML = "";

    for (var i = 0; i < pending_send_transactions.length; i++) {
        var transaction = pending_send_transactions[i];
        var index = i;
        var to_shortened = transaction.to.substr(0, 22);
        var amount_shortened = round_d(wei_to_hls(transaction.value), 10);

        var row = tableRef.insertRow(tableRef.rows.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        if(include_delete_button){
            cell1.innerHTML = "<img src='images/x.png' class='delete_transaction' data-index=" + index + ">"+to_shortened+"...";
        }else{
            cell1.innerHTML = to_shortened+"...";
        }

        cell2.innerHTML = amount_shortened;
        cell3.innerHTML = wei_to_gwei(transaction.gasPrice);
        cell4.innerHTML = wei_to_gwei(transaction.gas);
    }
}

function add_transaction_to_block_from_form(){
    var amount = hls_to_wei($('#input_amount').val());
    var to = $('#input_to').val();
    //Gwei
    var gas_price = gwei_to_wei($('#input_gas_price').val());
    var total_gas = gwei_to_wei($('#input_total_gas').val());

    if(!Number.isInteger(amount) || !Number.isInteger(gas_price) || !Number.isInteger(total_gas)){
        popup("Check that Amount, Gas price, Maximum gas are all valid numbers.")
        return false;
    }
    var transaction = {
                    from: sending_account.address,
                    to: to,
                    value: amount,
                    gas: parseInt(total_gas),
                    gasPrice: gas_price,
                    chainId: 1
                }

    pending_send_transactions.push(transaction);

    refresh_pending_transaction_table()

    return true;

}

function is_connected(){
    if(web3.currentProvider == null || !web3.currentProvider.connected) {
        return false;
    }
    return true
}
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
function refresh_transactions(){
    if(sending_account == null){
        return
    }

    var from_month = $('select.from_month').children("option:selected").val();
    var from_year = $('select.from_year').children("option:selected").val();
    var to_month = $('select.to_month').children("option:selected").val();
    var to_year = $('select.to_year').children("option:selected").val();

    var start_timestamp = new Date(from_year, from_month, 01).getTime() / 1000
    var end_timestamp = new Date(to_year, to_month, 01).getTime() / 1000

    get_all_transactions(start_timestamp, end_timestamp)
    .then(function(txs){
        if(!txs){
            $('#transactions').html("Connecting to server");
        } else {

            if (txs.length > 0) {
                $('#transactions').html('<table class="transaction_list_table">');
                $('#transactions').append("<tr><th>Date</th><th>Description</th><th>Amount</th><th>Fees</th><th>Balance</th><th>Block Number</th></tr>")
                var prev_block_number = null
                for (i = 0; i < txs.length; i++) {
                    var tx = txs[i];
                    var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
                    d.setUTCSeconds(tx.timestamp);

                    if (prev_block_number == null || prev_block_number != tx.block_number) {
                        $('#transactions').append("<tr><td>" + d.toLocaleString() + "</td><td>" + tx.description + "</td><td>" + tx.value + "</td><td>" + tx.gas_cost + "</td><td>" + tx.balance + "</td><td>" + tx.block_number + "</td></tr>");
                    } else {
                        $('#transactions').append("<tr><td>" + d.toLocaleString() + "</td><td>" + tx.description + "</td><td>" + tx.value + "</td><td></td><td>" + tx.block_number + "</td></tr>");
                    }
                    prev_block_number = tx.block_number
                }
                $('#transactions').append("</table>");
            }
        }
    });
}



//returns a list of tx_info
async function get_all_transactions(start_timestamp, end_timestamp){
    if (start_timestamp < end_timestamp){
        start_timestamp = [end_timestamp, end_timestamp = start_timestamp][0];
    }

    try{
        var start_block_number = await web3.hls.getBlockNumber(sending_account.address)
    }catch(err) {
        return false
    }
    var output = []

    for (i = start_block_number; i >= 0; i--) {
        var new_block = await web3.hls.getBlock(i, sending_account.address, true);
        if(new_block.timestamp > start_timestamp){
            continue;
        }
        if(new_block.timestamp < end_timestamp){
            break;
        }
        if(new_block.transactions.length > 0){
            for (j = 0; j < new_block.transactions.length; j++) {
                var tx = new_block.transactions[j]
                output.push(new tx_info(new_block.timestamp, "Send transaction", -1*tx.value, -1*tx.gasUsed, tx.to, null, new_block.accountBalance, new_block.number))

            }
        }
        if(new_block.receiveTransactions.length > 0){
            for (j = 0; j < new_block.receiveTransactions.length; j++) {
                var tx = new_block.receiveTransactions[j]
                if (tx.isRefund == "0x0"){
                    var description = "Refund transaction"
                } else {
                    var description = "Receive transaction"
                }
                output.push(new tx_info(new_block.timestamp, description, tx.value,-1*tx.gasUsed, null, tx.from, new_block.accountBalance, new_block.number))
            }
        }
        output.push(new tx_info(new_block.timestamp, "Reward type 1", new_block.rewardBundle.rewardType1.amount, 0, null, null, new_block.accountBalance, new_block.number))
        output.push(new tx_info(new_block.timestamp, "Reward type 2", new_block.rewardBundle.rewardType2.amount, 0, null, null, new_block.accountBalance, new_block.number))
    }
    return output
}


function init_min_gas_price(){
    if(!is_connected()) {
        //Not connected yet. Try again in a few seconds.
        setTimeout(init_min_gas_price, 1000);
    }else {
        web3.hls.getGasPrice()
            .then(function (min_gas_price) {
                $('#input_gas_price').attr('value', min_gas_price + 1);
                $('#input_gas_price').attr('min', min_gas_price);
            });
    }
}


