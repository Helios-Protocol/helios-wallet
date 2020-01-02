// Create the main instance of web3 to be shared by everything in the app
var Web3 = require('helios-web3');
var web3 = new Web3();

module.exports = {
    web3: web3,
};