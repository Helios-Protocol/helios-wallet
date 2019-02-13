var web3Main = require('./web3.js');
var web3 = web3Main.web3;


class ConnectionMaintainer {
    constructor(availableNodes, disconnectedLoopPeriod, connectedLoopPeriod) {
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
        return !(web3.currentProvider == null || !web3.currentProvider.connected);
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
        //console.log(web3.currentProvider.connected);
        if(!this.isConnected()){
            this.setStatus('Connection to network failed. Retrying connection.');
            if(await this.connectToFirstAvailableNode()){
                this.setStatus('Connected to node '+web3.currentProvider.connection.url);
            }
        }

        if(this.isConnected()){
            await sleep(this.connectedLoopPeriod)
            this.networkConnectionMaintainerLoop()
        }else{
            await sleep(this.disconnectedLoopPeriod)
            this.networkConnectionMaintainerLoop()
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
        }
        return false
    }



}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = {
    ConnectionMaintainer: ConnectionMaintainer
};


