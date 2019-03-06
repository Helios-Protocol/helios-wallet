var web3_main = require('./web3.js');
var helios_web3 = web3_main.web3;
var accountHelpers = require('./account_helpers.js');
var fileSaver = require("file-saver");
var numerical = require("./numerical_helpers");
var ConnectionMaintainer = require("./node_connection_helpers.js").ConnectionMaintainer;
var getNodeMessageFromError = require("./node_connection_helpers.js").getNodeMessageFromError;
var Server = require("./server_interaction.js").Server;

var cookies = require('browser-cookies');

// var availableNodes = [
//     "ws://127.0.0.1:30304",
//     "ws://142.58.49.25:30304"
// ];

var availableNodes = [
    "wss://sfu.hyperevo.com:30304"
];

var connectionMaintainer = new ConnectionMaintainer(availableNodes);
connectionMaintainer.startNetworkConnectionMaintainerLoop();

var onlineKeystoreServerUrl = 'https://heliosprotocol.io/wallet-serverside/';

var server = new Server(onlineKeystoreServerUrl);

if (typeof window !== 'undefined') {
    if (typeof window.helios_web3 === 'undefined'){
        window.helios_web3 = helios_web3;
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
    if (typeof window.server === 'undefined'){
        window.server = server;
    }
    if (typeof window.getNodeMessageFromError === 'undefined'){
        window.getNodeMessageFromError = getNodeMessageFromError;
    }
}


module.exports = {
    fileSaver: fileSaver,
    helios_web3: helios_web3,
    accountHelpers: accountHelpers,
    numerical: numerical,
    connectionMaintainer:connectionMaintainer,
    server:server,
    getNodeMessageFromError:getNodeMessageFromError
};
