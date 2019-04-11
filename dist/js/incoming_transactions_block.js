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
        receiveAnyIncomingTransactions(sending_account.address, true)
        .then(function(){
            clear_vars();
            setTimeout(refreshDashboard, 2000);
        })
    });

});

async function receiveAnyIncomingTransactions(wallet_address, notify_if_none){
    return web3.hls.getReceivableTransactions(wallet_address)
    .then(function (receivableTxs) {
        if (receivableTxs.length > 0) {
            return sendRewardBlock(wallet_address)
            .then(function (res) {
                popup("You have received new transactions!");
                return true;
            });
        }else {
            if(notify_if_none) {
                popup("There are no new incoming transactions");
            }
            return false;
        }
    });
}

async function sendRewardBlock(address){
    return web3.hls.sendRewardBlock(address)
    .then(function () {
        return true;
    })
    .catch(function (error) {
        return false;
    });
}