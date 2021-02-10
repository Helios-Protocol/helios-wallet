var web3Main = require('./web3.js');
var web3 = web3Main.web3;


var roundD = function roundD(val, decimal_places){
    if(decimal_places === undefined){
        decimal_places = 0;
    }
    if(decimal_places < 0){
        decimal_places = 0;
    }
    return val.toFixed(decimal_places)
    //return Math.round(val*(Math.pow(10,(decimal_places+1))))/Math.pow(10,(decimal_places+1))
}
var block_gas_limit = 31415926;

module.exports = {
    roundD: roundD,
    block_gas_limit: block_gas_limit
};