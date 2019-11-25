var web3Main = require('./web3.js');
var web3 = web3Main.web3;
var datastructures = require('./datastructures.js');

//returns a list of datastructures.tx_info
var get_all_transactions_from_account = async function get_all_transactions_from_account(account, start_timestamp, end_timestamp, start_index, length){
    if (start_timestamp < end_timestamp){
        start_timestamp = [end_timestamp, end_timestamp = start_timestamp][0];
    }

    if(start_index === undefined){
        start_index = 0
    }

    if(length === undefined){
        length = 10
    }

    try{
        var start_block_number = await web3.hls.getBlockNumber(account.address, start_timestamp);
        console.log("Getting all transactions starting at block number "+start_block_number);
    }catch(err) {
        console.log('error')
        console.log(err)
        return err
    }
    var output = [];

    start_block_number = start_block_number - start_index;
    end_block_number = start_block_number - length
    if(end_block_number < 0){
        end_block_number = 0;
    }
    console.log('test');
    console.log(start_block_number)
    console.log(end_block_number)

    for (var i = start_block_number; i >= end_block_number; i--) {
        console.log("Getting all transactions at block number "+i);
        var new_block = await web3.hls.getBlockByNumber(i, account.address, true);
        console.log("block number "+i+" received");
        if(new_block.timestamp > start_timestamp){
            continue;
        }
        if(new_block.timestamp < end_timestamp){
            break;
        }
        if(new_block.transactions.length > 0){
            for (var j = 0; j < new_block.transactions.length; j++) {
                var tx = new_block.transactions[j];
                output.push(new datastructures.tx_info(new_block.timestamp, "Send transaction", web3.utils.toBN(tx.value).mul(web3.utils.toBN(-1)), web3.utils.toBN(tx.gasUsed).mul(web3.utils.toBN(tx.gasPrice)).mul(web3.utils.toBN(-1)), tx.to, account.address, new_block.accountBalance, new_block.number))

            }
        }
        if(new_block.receiveTransactions.length > 0){
            for (var j = 0; j < new_block.receiveTransactions.length; j++) {
                var tx = new_block.receiveTransactions[j];
                if (tx.isRefund === "0x0"){
                    var description = "Refund transaction"
                } else {
                    var description = "Receive transaction"
                }
                output.push(new datastructures.tx_info(new_block.timestamp, description, tx.value, web3.utils.toBN(tx.gasUsed).mul(web3.utils.toBN(tx.gasPrice)).mul(web3.utils.toBN(-1)), account.address, tx.from, new_block.accountBalance, new_block.number))
            }
        }
        if(parseFloat(new_block.rewardBundle.rewardType1.amount) !== parseFloat(0)) {
            output.push(new datastructures.tx_info(new_block.timestamp, "Reward type 1", new_block.rewardBundle.rewardType1.amount, 0, account.address, "Coinbase", new_block.accountBalance, new_block.number))
        }
        if(parseFloat(new_block.rewardBundle.rewardType2.amount) !== parseFloat(0)) {
            output.push(new datastructures.tx_info(new_block.timestamp, "Reward type 2", new_block.rewardBundle.rewardType2.amount, 0, account.address, "Coinbase", new_block.accountBalance, new_block.number))
        }
    }
    return output
};



module.exports = {
    get_all_transactions_from_account: get_all_transactions_from_account
};