networkIDToName = {
    1: "Mainnet",
    42: "Hypothesis Testnet"
}

class ConnectionMaintainer {
    constructor(web3, availableNodes, connectionFailureRetryPeriod, networkId) {
        if(networkId === undefined){
            this.networkId = 1;
        }else{
            this.networkId = parseInt(networkId);
        }

        this.wasConnected = false;
        this.availableNodes = availableNodes
        this.web3 = web3;

        this.WSConnectTimeout = 5000;

        //The period of time between each retry when we are disconnected.
        if(connectionFailureRetryPeriod === undefined){
            connectionFailureRetryPeriod = 10000;
        }
        this.connectionFailureRetryPeriod = connectionFailureRetryPeriod



        this.status = "Connecting to network";
    }

    isConnected(){
        var connected = !(this.web3.currentProvider == null || !this.web3.currentProvider.connected);
        return connected;
    }

    setConnectedCallback(connectedCallback) {
        console.log('setting connected callback');
        this.connectedCallback = connectedCallback;
        if (this.isConnected()) {
            this.connectedCallback();
        }
    }



    setStatusCallback(statusCallback){
        this.statusCallback = statusCallback;
        this.statusCallback(this.status, this.isConnected());
    }

    setNetworkIdAndReconnect(networkId){
        console.log('Setting networkId to '+networkId);
        this.networkId = networkId;

        if(this.isConnected()) {
            // Disconnect from node, and then the onClose will be called, automatically reconnecting with new network id.
            console.log("Disconnecting from current node.")
            this.web3.currentProvider.disconnect();
        }else{
            this.connectToNetwork();
        }
    }

    setStatus(status){
        this.status = status;
        console.log(status);
        if(!(this.statusCallback === undefined)){
            this.statusCallback(status, this.isConnected());
        }
    }


    startNetworkConnectionMaintainerLoop(){
        this.connectToNetwork();
    }


    async connectToNetwork(){
        console.log("Initiating connection to network");
        if(this.isConnected()) {
            console.log("Already connected to network. Doing nothing.");
        }else{
            console.log("No active connection found. Starting new one.");
            try {
                var isConnected = await this.connectToFirstAvailableNode();
                if (isConnected) {
                    // We connected.
                    this.setStatus('Connected to node ' + this.web3.currentProvider.connection.url + " on " + networkIDToName[this.networkId]);
                    if (this.connectedCallback !== undefined) {
                        this.connectedCallback();
                    }
                } else {
                    // No nodes responded.
                    this.setStatus('Connection failure. Will retry in ' + this.connectionFailureRetryPeriod / 1000 + ' seconds.');
                    await sleep(this.connectionFailureRetryPeriod);
                    this.connectToNetwork();
                }
            }catch(err) {
                // Probably caused by no nodes with this netowork id
                console.log("Error when connecting to first available node: " + err);
                this.setStatus('Connection failure.');
            }
        }
    }

    async connectToFirstAvailableNode(){
        var _this = this;
        console.log("Connecting to nodes on network id "+ this.networkId);
        if(this.networkId in this.availableNodes){
            for (var i = 0; i < this.availableNodes[this.networkId].length; i++) {
                var API_address = this.availableNodes[this.networkId][i];
                try {
                    var newProvider = await this.connectToWebsocketProvider(API_address);
                    this.web3.setProvider(newProvider);
                    console.log("Successfully connected to " + API_address);

                    // Set close callback. Tell it to reconnect to network with first available node.
                    newProvider.on('end', function(){
                        console.log("Provider closed. Reconnecting to network");
                        _this.connectToNetwork();
                    })

                    return true;

                } catch(err) {
                    console.log("Failed to connect to node " + API_address);
                }

            }
            return false;
        }else{
            throw "No nodes found with network id " + this.networkId;
        }

    }

    connectToWebsocketProvider(API_address) {
        return new Promise((resolve, reject) => {
            console.log("Connecting to node " + API_address);
            var newProvider = new this.web3.providers.WebsocketProvider(API_address)

            // Add timeout
            var timeout = setTimeout(function(){
                // Cancel the connection
                console.log("Timeout on connection for "+ API_address);
                newProvider.disconnect();
                reject();
            }, this.WSConnectTimeout);

            // Add connected callback
            newProvider.on('connect', function(){
                clearTimeout(timeout);
                console.log("onOpen event fired for "+ API_address);
                resolve(newProvider);
            })

            // Check to make sure we havent already connected before we added the callback
            if(newProvider.connected){
                clearTimeout(timeout);
                console.log("connected fired for "+ API_address);
                resolve(newProvider);
            }
        });
    }


}

var getNodeMessageFromError = function getNodeMessageFromError(error) {

    if (error.message.indexOf('Returned error: ') !== -1) {
        try {
            var error_json = error.message.split("Returned error: ");
            error_json = error_json[error_json.length - 1];
            var error_array = JSON.parse(error_json);
            return error_array['error'];
        } catch (e) {
            return error.message;
        }
    } else {
        return error.message;
    }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = {
    ConnectionMaintainer: ConnectionMaintainer,
    getNodeMessageFromError: getNodeMessageFromError
};


