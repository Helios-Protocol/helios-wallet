var web3Main = require('./web3.js');
var web3 = web3Main.web3;


class ConnectionMaintainer {
    constructor(availableNodes, disconnectedLoopPeriod, connectedLoopPeriod) {
        this.wasConnected = false;
        this.availableNodes = availableNodes;

        //The period of time between each retry when we are disconnected.
        if(disconnectedLoopPeriod === undefined){
            disconnectedLoopPeriod = 5000;
        }
        this.disconnectedLoopPeriod = disconnectedLoopPeriod

        //The period of time between checking the connection status, and possibly retrying connection,
        // when we are connected to a node
        if(connectedLoopPeriod === undefined){
            connectedLoopPeriod = 10000;
        }
        this.connectedLoopPeriod = connectedLoopPeriod

        this.status = "Connecting to network";
    }

    isConnected(){
        var connected = !(web3.currentProvider == null || !web3.currentProvider.connected);
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
        console.log('setting callback');
        this.statusCallback = statusCallback;
        this.statusCallback(this.status, this.isConnected());
    }

    setStatus(status){
        this.status = status;
        console.log(status);
        if(!(this.statusCallback === undefined)){
            this.statusCallback(status, this.isConnected());
        }
    }

    startNetworkConnectionMaintainerLoop(){
        this.networkConnectionMaintainerLoop()
    }


    async networkConnectionMaintainerLoop(){
        console.log("network connection loop begin");
        if(this.isConnected()) {
            console.log("Pinging ws server for keepalive");
            await web3.hls.ping();
        }else{
            console.log("Attempting to connect to node");
            //this.setStatus('Connection to network failed. Retrying connection.');
            this.setStatus('Not connected. Helios network is undergoing maintenance.');
            await this.connectToFirstAvailableNode();
        }



        if(this.isConnected()){
            if(!this.wasConnected){
                if(this.connectedCallback !== undefined){
                    this.connectedCallback();
                }

            }
            this.setStatus('Connected to node ' + web3.currentProvider.connection.url.substr(0,25) + "...");
            await sleep(this.connectedLoopPeriod)
            this.networkConnectionMaintainerLoop()
            this.wasConnected = true;
        }else{
            await sleep(this.disconnectedLoopPeriod)
            this.networkConnectionMaintainerLoop()
            this.wasConnected = false;
        }
    }



    async connectToFirstAvailableNode(){
        for(var i=0;i<this.availableNodes.length;i++) {
            var API_address = this.availableNodes[i];
            console.log("Connecting to node " + API_address)
            web3.setProvider(new web3.providers.WebsocketProvider(API_address));
            await sleep(100);

            if(this.isConnected()) {
                console.log("Successfully connected to " + API_address)
                return true;
            }
            console.log("Failed to connect to node " + API_address)
        }
        return false
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


