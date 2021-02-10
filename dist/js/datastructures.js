// object containing information for showing a list of recent transactions
class tx_info {
    constructor(timestamp, description, value, gas_cost, to, from, balance, block_number) {
        this.timestamp = timestamp;
        this.description = description;
        this.value = value;
        this.balance = balance;
        this.block_number = block_number;
        this.to = to;
        this.from = from;
        this.gas_cost = gas_cost;
    }
}

module.exports = {
    tx_info: tx_info
};