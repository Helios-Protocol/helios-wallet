function getMetamaskAccount(){
    metamaskWeb3.eth.getAccounts(function(err, accounts){
        if (err != null) {
            console.log(err)
        }
        else if (accounts.length === 0) {
            console.log('MetaMask is locked')
        }
        else {
            return accounts[0];
        }
    });
}
