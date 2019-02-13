var web3_main = require('./web3.js');
var web3 = web3_main.web3;
var accountHelpers = require('./account_helpers.js');
var fileSaver = require("file-saver");
var numerical = require("./numerical_helpers");
var ConnectionMaintainer = require("./node_connection_helpers.js").ConnectionMaintainer;

var available_nodes = [
    "ws://127.0.0.1:30304",
    "ws://142.58.49.25:30304"
];

var connectionMaintainer = new ConnectionMaintainer(available_nodes);
connectionMaintainer.startNetworkConnectionMaintainerLoop();

if (typeof window !== 'undefined') {
    if (typeof window.web3 === 'undefined'){
        window.web3 = web3;
    }
    if (typeof window.fileSaver === 'undefined'){
        window.fileSaver = fileSaver;
    }
    if (typeof window.accountHelpers === 'undefined'){
        window.accountHelpers = accountHelpers;
    }
    if (typeof window.numerical === 'undefined'){
        window.numerical = numerical;
    }
    if (typeof window.connectionMaintainer === 'undefined'){
        window.connectionMaintainer = connectionMaintainer;
    }
}


module.exports = {
    fileSaver: fileSaver,
    web3: web3,
    accountHelpers: accountHelpers,
    numerical: numerical,
    connectionMaintainer:connectionMaintainer
};
