//
// Contains all website functionality for the transaction history block on the dashboard.
//

//
// Jquery router
//

$( document ).ready(function() {
     $('#transaction_history_date_selector').submit(function (e) {
         e.preventDefault();

         if(sending_account == null){
             popup('Need to load a wallet first');
             return
         }

         refresh_transactions();
    });

    populateSelectYears();
    selectDefaultYears();
});

function populateSelectYears(){
    $('select.to_year').html("");
    var max_year = (new Date()).getFullYear()+1;
    for(var i = 2018;i<=max_year;i++){
        $('select.to_year').append("<option value=" + i + ">" + i + "</option>")
    }
}

function selectDefaultYears(){
    console.log("selecting default years");
    var from_timestamp = new Date().getTime()/1000-(60*60*24*60)
    var from_date = new Date(0);
    from_date.setUTCSeconds(from_timestamp.toFixed(0));
    var from_year = from_date.getFullYear();
    var from_month = from_date.getMonth();

    var to_timestamp = new Date().getTime()/1000+(60*60*24*60)
    var to_date = new Date(0);
    to_date.setUTCSeconds(to_timestamp.toFixed(0));
    var to_year = to_date.getFullYear();
    var to_month = to_date.getMonth();

    $('select.from_year').children("option[value='"+from_year+"']").prop('selected', true)
    $('select.from_month').children("option[value='"+from_month+"']").prop('selected', true)
    $('select.to_year').children("option[value='"+to_year+"']").prop('selected', true)
    $('select.to_month').children("option[value='"+to_month+"']").prop('selected', true)
}

async function refresh_transactions(){
    if(sending_account == null){
        return
    }

    var from_month = $('select.from_month').children("option:selected").val();
    var from_year = $('select.from_year').children("option:selected").val();
    var to_month = $('select.to_month').children("option:selected").val();
    var to_year = $('select.to_year').children("option:selected").val();

    var start_timestamp = new Date(from_year, from_month, '01').getTime() / 1000
    var end_timestamp = new Date(to_year, to_month, '01').getTime() / 1000

    var txs = await accountHelpers.get_all_transactions_from_account(sending_account, start_timestamp, end_timestamp);

    var tableRef = document.getElementById('transaction_history_list').getElementsByTagName('tbody')[0];

    //clear all rows
    tableRef.innerHTML = "";

    if(!txs){
        popup("No transactions found for this date range.")
    } else {

        if (txs.length > 0) {
            prev_block_number = null
            for (i = 0; i < txs.length; i++) {

                //var amount_shortened = numerical.roundD(numerical.weiToHls(transaction.value), 10);

                var row = tableRef.insertRow(tableRef.rows.length);
                var cell0 = row.insertCell(0);
                var cell1 = row.insertCell(1);
                var cell2 = row.insertCell(2);
                var cell3 = row.insertCell(3);
                var cell4 = row.insertCell(4);



                var tx = txs[i];
                var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
                d.setUTCSeconds(tx.timestamp);
                var options = { day: 'numeric', year: 'numeric', month: 'short'};

                cell0.innerHTML = d.toLocaleString('en-US',options);
                cell1.innerHTML = tx.description;
                cell2.innerHTML = numerical.roundD(numerical.weiToHls(tx.value),6);
                cell3.innerHTML = numerical.roundD(numerical.weiToHls(tx.gas_cost),6);

                if (prev_block_number == null || prev_block_number != tx.block_number) {
                    cell4.innerHTML = numerical.roundD(numerical.weiToHls(tx.balance),6);
                }else{
                    cell4.innerHTML = "";
                }
                prev_block_number = tx.block_number


            }
        }
    }
}