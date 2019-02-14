//
// Contains all website functionality for the send transactions block on the dashboard.
//
var pending_send_transactions = [];

//
// Jquery router
//

$( document ).ready(function() {

    calculate_estimated_tx_fee_loop();
    init_min_gas_price();


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
            popup('Need to load a wallet first');
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

        var popup_content = document.getElementById("popup_content_confirm_transactions").innerHTML;

        //ensure correct
        popup(popup_content, 800);
        refresh_pending_transaction_table('final_tx_list_for_confirmation', false);


    });

    //TODO:catch errors here
    $('body').on('submit', '#send_block_post_confirmation', function () {
        web3.hls.sendTransactions(pending_send_transactions);
        if (pending_send_transactions.length <= 1) {
            popup("Transaction sent successfully")
        } else {
            popup("Block sent successfully")
        }

        clear_vars();
    });

});

//
// Loops
//

function calculate_estimated_tx_fee_loop(){
    //Gwei
    var gas_price =numerical.gweiToHls($('#input_gas_price').val());
    var tx_amount = $('#input_amount').val();
    var estimated_fee = Math.round(21000*gas_price*10000000)/10000000
    var estimated_fee_percentage = Math.round(estimated_fee/tx_amount*100000)/100000
    $('.fee_estimation').text(estimated_fee+" or "+estimated_fee_percentage+"%")
    setTimeout(calculate_estimated_tx_fee_loop, 1000);
}

//
// Functions
//
function add_transaction_to_block_from_form(){
    var amount =numerical.hlsToWei($('#input_amount').val());
    var to = $('#input_to').val();
    //Gwei
    var gas_price =numerical.gweiToWei($('#input_gas_price').val());
    var total_gas = parseInt($('#input_total_gas').val());

    if(!Number.isInteger(amount) || !Number.isInteger(gas_price) || !Number.isInteger(total_gas)){
        popup("Check that Amount, Gas price, Maximum gas are all valid numbers.")
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

function init_min_gas_price(){
    if(!connectionMaintainer.isConnected()) {
        //Not connected yet. Try again in a few seconds.
        setTimeout(init_min_gas_price, 1000);
    }else {
        web3.hls.getGasPrice()
            .then(function (min_gas_price) {
                $('#input_gas_price').attr('value', min_gas_price + 1);
                $('#input_gas_price').attr('min', min_gas_price);
                set_min_gas_price_status(min_gas_price);
            });
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
        var to_shortened = transaction.to.substr(0, 22);
        var amount_shortened = numerical.roundD(numerical.weiToHls(transaction.value), 10);

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
        cell3.innerHTML =numerical.weiToGwei(transaction.gasPrice);
        cell4.innerHTML =numerical.weiToGwei(transaction.gas);
    }
}