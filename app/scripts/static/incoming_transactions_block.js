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
        web3.hls.getReceivableTransactions(sending_account.address)
        .then(function (receivableTxs) {
            console.log('test')
            if (receivableTxs.length > 0) {
                console.log('tes2t')
                sendRewardBlock(sending_account.address)
                .then(function (res) {
                    popup("You have received new transactions!");
                    clear_vars();
                    setTimeout(refreshDashboard, 2000);

                });
            }else {
                popup("There are no new incoming transactions");
            }
        });
    });

});

async function sendRewardBlock(address){
    web3.hls.sendRewardBlock(sending_account.address)
    .then(function () {
        return true;
    })
    .catch(function (error) {
        return false;
    });
}