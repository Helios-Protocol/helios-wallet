//
// Contains all website functionality for the send transactions block on the dashboard.
//
var pending_send_transactions = [];

//
// Jquery router
//

$( document ).ready(function() {

    calculate_estimated_tx_fee_loop();



    $('#add_transaction_form').submit(function (e) {
        e.preventDefault();

        if (sending_account == null) {
            $('#error_status').text('Need to load a wallet first')
            return
        }

        add_transaction_to_block_from_form();

    });

    $('body').on('click', '.delete_transaction', function () {
        var index = $(this).data('index');
        pending_send_transactions.splice(index, 1);
        refresh_pending_transaction_table()
    });

    $('#send_block_pre_confirmation').submit(function (e) {
        e.preventDefault();
        if (sending_account == null) {
            popup('Need to load a wallet first.');
            return
        }
        if(!connectionMaintainer.isConnected()){
            popup('Need to be connected to a node to do this.');
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

        if(getSumPendingTransactionsCost() > current_hls_balance_in_wei){
            var required_cost = numerical.weiToHls(getSumPendingTransactionsCost());
            var hls_balance = numerical.weiToHls(current_hls_balance_in_wei);
            popup("You don't have enough HLS to cover the transactions and fees. " +
                "You have a balance of "+hls_balance+" But the transactions and fees add up to "+required_cost +
                "<br><br>If your balance is incorrect, try sending it again in a few moments.");
            return;
        }

        if(!checkPendingTransactionsGasPrice()){
            popup("One or more of your transactions does not meet the minimum gas price requirement. " +
                "The current minimum allowed gas price is "+current_min_gas_price);
            return;
        }
        if(!checkBlockGasLimit()){
            popup("Your transactions require more gas than the block gas limit. " +
                "Reduce the number of transactions in this block before sending again. " +
                "The block gas limit is "+numerical.block_gas_limit);
            return;
        }
        if(!checkIntrinsicGas()){
            popup("One or more of your transactions do not have a gas limit high enough. " +
                "The minimum gas required to send a transaction is 21000.")
        }

        if(pending_send_transactions.length === 0){
            popup("You must add at least one transaction to the block.");
        }

        var popup_content = document.getElementById("popup_content_confirm_transactions").innerHTML;

        //ensure correct
        popup(popup_content, 800);
        refresh_pending_transaction_table('final_tx_list_for_confirmation', false);

    });

    //TODO:catch errors here
    $('body').on('submit', '#send_block_post_confirmation', function (e) {
        e.preventDefault();
        if(!connectionMaintainer.isConnected()){
            popup("You must be connected to a node to do this.")
            return;
        }
        web3.hls.sendTransactions(pending_send_transactions)
        .then(function(args){
            console.log(args)
            if (pending_send_transactions.length <= 1) {
                popup("Transaction sent successfully")
            } else {
                popup("Block sent successfully")
            }
            clear_vars();
            setTimeout(refreshDashboard, 2000);
        })
        .catch(function(error){
            var error_message = getNodeMessageFromError(error);
            popup("Error when sending block: "+error_message);

        });

    });

});

//
// Loops
//

function calculate_estimated_tx_fee_loop(){
    //Gwei
    var gas_price =numerical.gweiToHls($('#input_gas_price').val());
    var tx_amount = $('#input_amount').val();
    var estimated_fee = Math.round(21000*gas_price*10000000)/10000000;
    var estimated_fee_percentage = Math.round(estimated_fee/tx_amount*100000)/100000*100;
    $('.fee_estimation').text(estimated_fee+" or "+estimated_fee_percentage+"%")
    setTimeout(calculate_estimated_tx_fee_loop, 1000);
}

// 
// Functions
//
function add_transaction_to_block_from_form(){
    var amount =numerical.hlsToWei($('#input_amount').val());
    var to = $('#input_to').val();

    to = getAddressFromAutocompleteStringIfExist(to);

    //Gwei
    var gas_price =numerical.gweiToWei($('#input_gas_price').val());
    var total_gas = parseInt($('#input_total_gas').val());

    if(!(validateInputs(amount, 'tx_amount') === true)){
        popup(validateInputs(amount, 'tx_amount'));
        return false;
    }
    if(!(validateInputs(gas_price, 'gas_price') === true)){
        popup(validateInputs(gas_price, 'gas_price'));
        return false;
    }
    if(!(validateInputs(total_gas, 'total_gas') === true)){
        popup(validateInputs(total_gas, 'total_gas'));
        return false;
    }

    if(!(validateInputs(to, 'wallet_address') === true)){
        popup(validateInputs(to, 'wallet_address'));
        return false;
    }

    var transaction = {
                    from: sending_account.address,
                    to: to,
                    value: amount,
                    gas: total_gas,
                    gasPrice: gas_price,
                    chainId: 1
                }

    pending_send_transactions.push(transaction);

    refresh_pending_transaction_table()

    return true;

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
        var amount_shortened = numerical.roundD(numerical.weiToHls(transaction.value), 10);

        var row = tableRef.insertRow(tableRef.rows.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        if(include_delete_button){
            cell1.innerHTML = "<img src='images/x.png' class='delete_transaction' data-index=" + index + ">"+to_shortened;
        }else{
            cell1.innerHTML = to_shortened;
        }

        cell2.innerHTML = amount_shortened;
        cell3.innerHTML =numerical.weiToGwei(transaction.gasPrice); //show in gwei
        cell4.innerHTML =transaction.gas; //show in wei
    }
}

function getSumPendingTransactionsCost(){
    var total_amount = 0;
    pending_send_transactions.forEach(function(tx){
        total_amount += tx.value + tx.gas*tx.gasPrice
    });
    return total_amount;
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
        gas_used += tx.gas;
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