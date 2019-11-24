var web3_main = require('./web3.js');
var helios_web3 = web3_main.web3;
var accountHelpers = require('./account_helpers.js');
var fileSaver = require("file-saver");
var numerical = require("./numerical_helpers");

var HeliosUtils = require('helios-utils');
var ConnectionMaintainer = HeliosUtils.ConnectionMaintainer;
var getNodeMessageFromError = HeliosUtils.getNodeMessageFromError;
var KeystoreServer = HeliosUtils.KeystoreServer;

// var ConnectionMaintainer = require("./node_connection_helpers.js").ConnectionMaintainer;
// var getNodeMessageFromError = require("./node_connection_helpers.js").getNodeMessageFromError;
// var Server = require("./server_interaction.js").Server;

// var availableNodes = [
//     "ws://127.0.0.1:30304",
//     "ws://142.58.49.25:30304"
// ];

// var availableNodes = [
//     "ws://127.0.0.1:30304",
// ];

var availableNodes = {
    1: [
        "wss://bootnode.heliosprotocol.io:30304",
        "wss://bootnode2.heliosprotocol.io:30304",
        "wss://bootnode3.heliosprotocol.io:30304",
        "wss://masternode1.heliosprotocol.io:30304"
    ],
    42: [
        "wss://hypothesis1.heliosprotocol.io:30304"
    ]
};


// var availableNodes = [
//     "wss://bootnode2.heliosprotocol.io:30304"
// ];

var connectionMaintainer = new ConnectionMaintainer(helios_web3, availableNodes);
connectionMaintainer.startNetworkConnectionMaintainerLoop();

var onlineKeystoreServerUrl = 'https://heliosprotocol.io/wallet-serverside/';

var server = new KeystoreServer(onlineKeystoreServerUrl);

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
