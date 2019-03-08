$( document ).ready(function() {
    $('#incoming_transactions_refresh').click(function(){
        if(sending_account == null){
            popup('Need to load a wallet first.');
            return;
        }
        if(connectionMaintainer.isConnected()) {
            refreshIncomingTransactions();
        }else{
            popup('Not connected to a node. Please check your internet connection and retry.');
        }

    })


    $('#incoming_transactions_accept').click(function (e){
        if(sending_account == null){
            popup('Need to load a wallet to do this.');
            return
        }
        if(!connectionMaintainer.isConnected()) {
            popup('Not connected to a node. Please check your internet connection and retry.');
            return;
        }
        if(current_incoming_transactions.length > 0) {
            web3.hls.sendRewardBlock(sending_account.address)
            .then(function () {
                popup("Block successfully sent");
                clear_vars();
                current_incoming_transactions = [];
                setTimeout(refreshDashboard, 2000);
            })
            .catch(function (error) {
                var error_message = getNodeMessageFromError(error);
                popup("Error when sending block: " + error_message);

            });
        }else{
            popup("There are no incoming transactions to accept.")
        }
    });

});


function refreshIncomingTransactions(){
    if(sending_account == null){
        return;
    }
    if(connectionMaintainer.isConnected()) {
        web3.hls.getReceivableTransactions(sending_account.address)
        .then(function (receivableTxs) {
            console.log("receivable transactions:")
            console.log(receivableTxs);
            current_incoming_transactions = receivableTxs;
            var tableRef = document.getElementById('incoming_transactions_list').getElementsByTagName('tbody')[0];

            //clear all rows
            tableRef.innerHTML = "";

            receivableTxs.forEach(function(tx){

                var row = tableRef.insertRow(tableRef.rows.length);
                var cell0 = row.insertCell(0);
                var cell1 = row.insertCell(1);

                var amount = numerical.weiToHls(tx['value'] - tx['remainingRefund']);
                cell0.innerHTML = getAutocompleteStringFromAddressIfExist(tx.from);
                cell1.innerHTML = amount;
            });
        })
    }
}