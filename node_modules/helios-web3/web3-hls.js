 
/*
 This file is part of web3.js.

 web3.js is free software: you can redistribute it and/or modify
 it under the terms of the GNU Lesser General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 web3.js is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public License
 along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * @file index.js
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2017
 */

"use strict";

var _ = require('underscore');
var core = require('web3-core');
var helpers = require('web3-core-helpers');
var Subscriptions = require('web3-core-subscriptions').subscriptions;
var Method = require('web3-core-method');
var utils = require('web3-utils');
var Net = require('web3-net');

var ENS = require('web3-eth-ens');
var Personal = require('web3-eth-personal');
var BaseContract = require('web3-eth-contract');
var Iban = require('web3-eth-iban');
var Accounts = require('./web3-hls-accounts.js');
var abi = require('web3-eth-abi');

var getNetworkType = require('./getNetworkType.js');
var formatter = helpers.formatters;
var hls_formatter = require('./web3-hls-formatters.js');



var transactionFromBlockCall = function (args) {
    return (_.isString(args[0]) && args[0].indexOf('0x') === 0) ? 'hls_getTransactionByBlockHashAndIndex' : 'hls_getTransactionByBlockNumberAndIndex';
};

var getBlockTransactionCountCall = function (args) {
    return (_.isString(args[0]) && args[0].indexOf('0x') === 0) ? 'hls_getBlockTransactionCountByHash' : 'hls_getBlockTransactionCountByNumber';
};



var Hls = function Hls() {
    var _this = this;

    // sets _requestmanager
    core.packageInit(this, arguments);

    // overwrite setProvider
    var setProvider = this.setProvider;
    this.setProvider = function () {
        setProvider.apply(_this, arguments);
        _this.net.setProvider.apply(_this, arguments);
        _this.personal.setProvider.apply(_this, arguments);
        _this.accounts.setProvider.apply(_this, arguments);
        _this.Contract.setProvider(_this.currentProvider, _this.accounts);
    };


    var defaultAccount = null;
    var defaultBlock = 'latest';

    Object.defineProperty(this, 'defaultAccount', {
        get: function () {
            return defaultAccount;
        },
        set: function (val) {
            if(val) {
                defaultAccount = utils.toChecksumAddress(formatter.inputAddressFormatter(val));
            }

            // also set on the Contract object
            _this.Contract.defaultAccount = defaultAccount;
            _this.personal.defaultAccount = defaultAccount;

            // update defaultBlock
            methods.forEach(function(method) {
                method.defaultAccount = defaultAccount;
            });

            return val;
        },
        enumerable: true
    });
    Object.defineProperty(this, 'defaultBlock', {
        get: function () {
            return defaultBlock;
        },
        set: function (val) {
            defaultBlock = val;
            // also set on the Contract object
            _this.Contract.defaultBlock = defaultBlock;
            _this.personal.defaultBlock = defaultBlock;

            // update defaultBlock
            methods.forEach(function(method) {
                method.defaultBlock = defaultBlock;
            });

            return val;
        },
        enumerable: true
    });


    this.clearSubscriptions = _this._requestManager.clearSubscriptions;

    // add net
    this.net = new Net(this.currentProvider);
    // add chain detection
    this.net.getNetworkType = getNetworkType.bind(this);

    // add accounts
    this.accounts = new Accounts(this.currentProvider);

    // add personal
    this.personal = new Personal(this.currentProvider);
    this.personal.defaultAccount = this.defaultAccount;

    // create a proxy Contract type for this instance, as a Contract's provider
    // is stored as a class member rather than an instance variable. If we do
    // not create this proxy type, changing the provider in one instance of
    // web3-eth would subsequently change the provider for _all_ contract
    // instances!
    var self = this;
    var Contract = function Contract() {
        BaseContract.apply(this, arguments);

        // when Eth.setProvider is called, call packageInit
        // on all contract instances instantiated via this Eth
        // instances. This will update the currentProvider for
        // the contract instances
        var _this = this;
        var setProvider = self.setProvider;
        self.setProvider = function() {
          setProvider.apply(self, arguments);
          core.packageInit(_this, [self.currentProvider]);
        };
    };

    Contract.setProvider = function() {
        BaseContract.setProvider.apply(this, arguments);
    };

    // make our proxy Contract inherit from web3-eth-contract so that it has all
    // the right functionality and so that instanceof and friends work properly
    Contract.prototype = Object.create(BaseContract.prototype);
    Contract.prototype.constructor = Contract;

    // add contract
    this.Contract = Contract;
    this.Contract.defaultAccount = this.defaultAccount;
    this.Contract.defaultBlock = this.defaultBlock;
    this.Contract.setProvider(this.currentProvider, this.accounts);

    // add IBAN
    this.Iban = Iban;

    // add ABI
    this.abi = abi;

    // add ENS
    this.ens = new ENS(this);

    var methods = [
        new Method({
            name: 'ping',
            call: 'hls_ping'
        }),
        new Method({
            name: 'getProtocolVersion',
            call: 'eth_protocolVersion',
            params: 0
        }),
        new Method({
            name: 'sendRawBlock',
            call: 'hls_sendRawBlock',
            params: 1
        }),
        new Method({
            name: 'getBlockByHash',
            call: 'hls_getBlockByHash',
            params: 2,
            inputFormatter: [formatter.inputBlockNumberFormatter, function (val) { return !!val }],
            outputFormatter: hls_formatter.outputBlockFormatter
        }),
        new Method({
            name: 'getBlockByNumber',
            call: 'hls_getBlockByNumber',
            params: 3,
            inputFormatter: [function (val) { return  val }, function (val) { return  val }, function (val) { return !!val }],
            outputFormatter: hls_formatter.outputBlockFormatter
        }),
        new Method({
            name: 'getNewestBlocks',
            call: 'hls_getNewestBlocks',
            params: 5,
            inputFormatter: [formatter.inputBlockNumberFormatter, formatter.inputBlockNumberFormatter, hls_formatter.inputOptionalHexHashFormatter, hls_formatter.inputOptionalHexHashFormatter, function (val) { return !!val; }],
            outputFormatter: hls_formatter.outputBlockFormatter
        }),
        new Method({
            name: 'getBlockNumber',
            call: 'hls_getBlockNumber',
            params: 2,
            inputFormatter: [formatter.inputAddressFormatter, hls_formatter.inputTimestampFormatter],
            outputFormatter: utils.hexToNumber
        }),
        new Method({
            name: 'getGasPrice',
            call: 'hls_getGasPrice',
            params: 0,
            outputFormatter: utils.hexToNumber
        }),

        new Method({
            name: 'getTransactionReceipt',
            call: 'hls_getTransactionReceipt',
            params: 1,
            outputFormatter: hls_formatter.outputTransactionReceiptFormatter
        }),
        new Method({
            name: 'getTransactionByHash',
            call: 'hls_getTransactionByHash',
            params: 1,
            outputFormatter: hls_formatter.outputTransactionFormatter
        }),
        new Method({
            name: 'getBalance',
            call: 'hls_getBalance',
            params: 2,
            inputFormatter: [formatter.inputAddressFormatter, formatter.inputDefaultBlockNumberFormatter],
            outputFormatter: formatter.outputBigNumberFormatter
        }),
        new Method({
            name: 'getReceivableTransactions',
            call: 'hls_getReceivableTransactions',
            params: 1,
            inputFormatter: [formatter.inputAddressFormatter],
            outputFormatter: hls_formatter.outputReceiveTransactionFormatter
        }),
        new Method({
            name: 'getFaucet',
            call: 'hls_getFaucet',
            params: 1,
            inputFormatter: [formatter.inputAddressFormatter]
        }),
        new Method({
            name: 'getConnectedNodes',
            call: 'hls_getConnectedNodes',
            params: 0,
            outputFormatter: hls_formatter.outputConnectedNodesFormatter
        }),

        new Method({
            name: 'getHistoricalGasPrice',
            call: 'hls_getHistoricalGasPrice',
            params: 0,
            outputFormatter: hls_formatter.outputHistoricalGas
        }),
        new Method({
            name: 'getApproximateHistoricalNetworkTPCCapability',
            call: 'hls_getApproximateHistoricalNetworkTPCCapability',
            params: 0,
            outputFormatter: hls_formatter.outputHistoricalGas
        }),
        new Method({
            name: 'getApproximateHistoricalTPC',
            call: 'hls_getApproximateHistoricalTPC',
            params: 0,
            outputFormatter: hls_formatter.outputHistoricalGas
        }),

    ];

    methods.forEach(function(method) {
        method.attachToObject(_this);
        method.setRequestManager(_this._requestManager, _this.accounts); // second param means is eth.accounts (necessary for wallet signing)
        method.defaultBlock = _this.defaultBlock;
        method.defaultAccount = _this.defaultAccount;
    });

};


var getAccountFromWallet = function(from, accounts) {
    var wallet = null;

    // is index given
    if (_.isNumber(from)) {
        wallet = accounts.wallet[from];

        // is account given
    } else if (_.isObject(from) && from.address && from.privateKey) {
        wallet = from;

        // search in wallet for address
    } else {
        wallet = accounts.wallet[from.toLowerCase()];
    }

    return wallet;
};


//Override the sendTransaction method to make it compatible with helios
Hls.prototype.sendTransaction = function sendTransaction(tx) {
    var _this = this,
        error = false,
        result;

    if(!tx){
        error = new Error('No transaction provided');

        return Promise.reject(error);
    }
    try{
        var account = getAccountFromWallet(tx.from, _this.accounts);
    }catch(error){
        var err = new Error('Error loading account from wallet:' +error);
        return Promise.reject(err);
    }
    if (account && account.privateKey) {

        return Promise.all([
            account.signBlock([_.omit(tx, 'from')])
        ]).then(function(args){
            var signed_block = args[0];
            return _this.sendRawBlock(signed_block.rawBlock);
        });



    } else {
        error = new Error('Not implemented yet. You must use sendTransaction with a local wallet so that it can be signed here.');

        return Promise.reject(error);
    }
}


Hls.prototype.sendTransactions = function sendTransactions(txs) {
    var _this = this,
        error = false,
        result;



    if(!txs || txs.length == 0){
        error = new Error('No transactions provided');

        return Promise.reject(error);
    }


    //make sure all the transactions are from the same wallet, and remove the from field
    var from = txs[0].from;
    for (var i = 0; i < txs.length; i++) {
        var tx = txs[i];
        if(tx.from != from){
            error = new Error('When sending multiple transactions at once, they must be from the same wallet');

            return Promise.reject(error);
        }
        txs[i] = _.omit(txs[i], 'from');
    }


    try {
        var account = getAccountFromWallet(from, _this.accounts);
    }catch(error){
        var err = new Error('Error loading account from wallet:' +error);
        return Promise.reject(err);
    }
    if (account && account.privateKey) {

        return Promise.all([
            account.signBlock(txs)
        ]).then(function(args){
            var signed_block = args[0];
            return _this.sendRawBlock(signed_block.rawBlock);
        });


    } else {
        error = new Error('Not implemented yet. You must use sendTransactions with a local wallet so that it can be signed here.');

        return Promise.reject(error);
    }
}

//This sends a block containing all pending receive transactions including the reward block
Hls.prototype.sendRewardBlock = function sendRewardBlock(from) {
    var _this = this,
        error = false,
        result;


    var account = getAccountFromWallet(from, _this.accounts);
    if (account && account.privateKey) {

        return Promise.all([
            account.signBlock()
        ]).then(function(args){
            var signed_block = args[0];
            return _this.sendRawBlock(signed_block.rawBlock);
        });


    } else {
        error = new Error('Not implemented yet. You must use sendRewardBlock with a local wallet so that it can be signed here.');

        return Promise.reject(error);
    }
}


core.addProviders(Hls);


module.exports = Hls;

