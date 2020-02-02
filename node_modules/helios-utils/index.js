var ConnectionMaintainer = require("./node_connection_helpers.js").ConnectionMaintainer;
var getNodeMessageFromError = require("./node_connection_helpers.js").getNodeMessageFromError;
var KeystoreServer = require("./server_interaction.js").Server;

// var availableNodes = [
//     "wss://bootnode.heliosprotocol.io:30304"
// ];
//
// var connectionMaintainer = new ConnectionMaintainer(availableNodes);
// connectionMaintainer.startNetworkConnectionMaintainerLoop();

// var onlineKeystoreServerUrl = 'https://heliosprotocol.io/wallet-serverside/';
//
// var keystoreServer = new KeystoreServer(onlineKeystoreServerUrl);

module.exports = {
    ConnectionMaintainer:ConnectionMaintainer,
    KeystoreServer:KeystoreServer,
    getNodeMessageFromError:getNodeMessageFromError
};
