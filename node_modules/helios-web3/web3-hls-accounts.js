 /*
 Parts of this code are from web3.js

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
 * @file accounts.js
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2017
 */

"use strict";

var _ = require("underscore");
var core = require('web3-core');
var Method = require('web3-core-method');
var Promise = require('any-promise');
//todo: fix this
var Account = require("eth-lib/lib/account");
var Hash = require("eth-lib/lib/hash");
var RLP = require("eth-lib/lib/rlp");
var Nat = require("eth-lib/lib/nat");
var Bytes = require("eth-lib/lib/bytes");
var cryp = (typeof global === 'undefined') ? require('crypto-browserify') : require('crypto');
var scryptsy = require('scrypt.js');
var uuid = require('uuid');
var utils = require('web3-utils');
var helpers = require('web3-core-helpers');
var Trie = require('merkle-patricia-tree');

var hls_formatters = require('./web3-hls-formatters.js');
var hlsConstants = require('./web3-hls-constants.js');

var isNot = function(value) {
    return (_.isUndefined(value) || _.isNull(value));
};

var trimLeadingZero = function (hex) {
    while (hex && hex.startsWith('0x0')) {
        hex = '0x' + hex.slice(3);
    }
    return hex;
};

var makeEven = function (hex) {
    if(hex.length % 2 === 1) {
        hex = hex.replace('0x', '0x0');
    }
    return hex;
};

var getTransactionType = function (networkId, txTimestamp){
    var photonTimestamp = hlsConstants.getPhotonTimestamp(networkId);
    if(txTimestamp >= photonTimestamp){
        return 1;
    }else{
        return 0;
    }
}

var Accounts = function Accounts() {
    var _this = this;

    // sets _requestmanager
    core.packageInit(this, arguments);

    // remove unecessary core functions
    delete this.BatchRequest;
    delete this.extend;

    var _ethereumCall = [
        new Method({
            name: 'getId',
            call: 'net_version',
            params: 0,
            outputFormatter: utils.hexToNumber
        }),
        new Method({
            name: 'getGasPrice',
            call: 'eth_gasPrice',
            params: 0
        }),
        new Method({
            name: 'getBlockCreationParams',
            call: 'hls_getBlockCreationParams',
            params: 1,
            inputFormatter: [function (address) {
                if (utils.isAddress(address)) {
                    return address;
                } else {
                    throw new Error('Address '+ address +' is not a valid address to get the "BlockCreationParams".');
                }
            }],
            outputFormatter: hls_formatters.outputBlockCreationParamsFormatter
        }),
        new Method({
            name: 'getRewardBundle',
            call: 'hls_getRewardBundle',
            params: 1,
            inputFormatter: [function (address) {
                if (utils.isAddress(address)) {
                    return address;
                } else {
                    throw new Error('Address '+ address +' is not a valid address to get the "BlockCreationParams".');
                }
            }]
        }),
        new Method({
            name: 'getTransactionCount',
            call: 'eth_getTransactionCount',
            params: 2,
            inputFormatter: [function (address) {
                if (utils.isAddress(address)) {
                    return address;
                } else {
                    throw new Error('Address '+ address +' is not a valid address to get the "transactionCount".');
                }
            }, function () { return 'latest'; }]
        })
    ];
    // attach methods to this._ethereumCall
    this._ethereumCall = {};
    _.each(_ethereumCall, function (method) {
        method.attachToObject(_this._ethereumCall);
        method.setRequestManager(_this._requestManager);
    });


    this.wallet = new Wallet(this);
    this.pendingTransactions = [];
};

Accounts.prototype._addAccountFunctions = function (account) {
    var _this = this;

    // add sign functions
    account.signTransaction = function signTransaction(tx, callback) {
        return _this.signTransaction(tx, account.privateKey, callback);
    };
    account.signHeader = function signHeader(header, callback) {
        return _this.signHeader(header, account.privateKey, callback);
    };
    account.signBlock = function signBlock(transactions, callback) {
        return _this.signBlock(transactions, account.privateKey, callback);
    };
    account.sign = function sign(data) {
        return _this.sign(data, account.privateKey);
    };

    account.encrypt = function encrypt(password, options) {
        return _this.encrypt(account.privateKey, password, options);
    };


    return account;
};

Accounts.prototype.create = function create(entropy) {
    return this._addAccountFunctions(Account.create(entropy || utils.randomHex(32)));
};

Accounts.prototype.privateKeyToAccount = function privateKeyToAccount(privateKey) {
    return this._addAccountFunctions(Account.fromPrivate(privateKey));
};




Accounts.prototype.signTransaction = function signTransaction(tx, privateKey, blockTimestamp, callback) {
    var _this = this,
        error = false,
        result;

    callback = callback || function () {};

    if (!tx) {
        error = new Error('No transaction object given!');

        callback(error);
        return Promise.reject(error);
    }

    function signed (tx) {

        if (!tx.gas && !tx.gasLimit) {
            error = new Error('"gas" is missing');
        }

        if (tx.nonce  < 0 ||
            tx.gas  < 0 ||
            tx.gasPrice  < 0 ||
            tx.chainId  < 0) {
            error = new Error('Gas, gasPrice, nonce or chainId is lower than 0');
        }

        if (error) {
            callback(error);
            return Promise.reject(error);
        }

        try {
            tx = helpers.formatters.inputCallFormatter(tx);

            var transaction = tx;
            transaction.to = tx.to || '0x';
            transaction.data = tx.data || '0x';
            transaction.value = tx.value || '0x';
            transaction.chainId = utils.numberToHex(tx.chainId);
            transaction.nonce = utils.numberToHex(tx.nonce);

            var txType = getTransactionType(tx.chainId, blockTimestamp);
            if(txType == 0){
                var numTxRLPParams = 6
                // Pre Photon type tx
                var rlpEncoded = RLP.encode([
                    Bytes.fromNat(transaction.nonce),
                    Bytes.fromNat(transaction.gasPrice),
                    Bytes.fromNat(transaction.gas),
                    transaction.to.toLowerCase(),
                    Bytes.fromNat(transaction.value),
                    transaction.data,
                    Bytes.fromNat(transaction.chainId || "0x1"),
                    "0x",
                    "0x"]);

            }else if(txType == 1){
                // Post Photon type tx
                var numTxRLPParams = 11

                transaction.caller = tx.caller || '0x';
                transaction.origin = tx.origin || '0x';
                transaction.codeAddress = tx.codeAddress || '0x';
                transaction.createAddress = tx.createAddress || '0x';
                transaction.executeOnSend = Bytes.fromNat(tx.executeOnSend ? '0x0' : '0x1');

                console.log('test2')
                console.log(transaction.caller)
                console.log(transaction.origin)
                console.log(transaction.codeAddress)
                console.log(transaction.createAddress)
                console.log(transaction.executeOnSend)

                var rlpEncoded = RLP.encode([
                    Bytes.fromNat(transaction.nonce),
                    Bytes.fromNat(transaction.gasPrice),
                    Bytes.fromNat(transaction.gas),
                    transaction.to.toLowerCase(),
                    Bytes.fromNat(transaction.value),
                    transaction.data,
                    transaction.caller.toLowerCase(),
                    transaction.origin.toLowerCase(),
                    transaction.codeAddress.toLowerCase(),
                    transaction.createAddress.toLowerCase(),
                    transaction.executeOnSend,
                    Bytes.fromNat(transaction.chainId || "0x1"),
                    "0x",
                    "0x"]);
            }




            var hash = Hash.keccak256(rlpEncoded);

            var signature = Account.makeSigner(Nat.toNumber(transaction.chainId || "0x1") * 2 + 35)(Hash.keccak256(rlpEncoded), privateKey);

            var rawTx = RLP.decode(rlpEncoded).slice(0, numTxRLPParams).concat(Account.decodeSignature(signature));



            rawTx[numTxRLPParams] = makeEven(trimLeadingZero(rawTx[numTxRLPParams]));
            rawTx[numTxRLPParams+1] = makeEven(trimLeadingZero(rawTx[numTxRLPParams+1]));
            rawTx[numTxRLPParams+2] = makeEven(trimLeadingZero(rawTx[numTxRLPParams+2]));

            var rawTransaction = RLP.encode(rawTx);

            console.log('test3');
            console.log(rawTransaction);

            var values = RLP.decode(rawTransaction);
            result = {
                messageHash: hash,
                v: trimLeadingZero(values[numTxRLPParams]),
                r: trimLeadingZero(values[numTxRLPParams+1]),
                s: trimLeadingZero(values[numTxRLPParams+2]),
                rawTransaction: rawTransaction
            };

        } catch(e) {
            callback(e);
            return Promise.reject(e);
        }

        callback(null, result);
        return result;
    }

    // Resolve immediately if nonce, chainId and price are provided
    if (tx.nonce !== undefined && tx.chainId !== undefined && tx.gasPrice !== undefined) {
        return Promise.resolve(signed(tx));
    }


    // Otherwise, get the missing info from the Ethereum Node
    return Promise.all([
        isNot(tx.chainId) ? _this._ethereumCall.getId() : tx.chainId,
        isNot(tx.gasPrice) ? _this._ethereumCall.getGasPrice() : tx.gasPrice,
        isNot(tx.nonce) ? _this._ethereumCall.getTransactionCount(_this.privateKeyToAccount(privateKey).address) : tx.nonce
    ]).then(function (args) {
        if (isNot(args[0]) || isNot(args[1]) || isNot(args[2])) {
            throw new Error('One of the values "chainId", "gasPrice", or "nonce" couldn\'t be fetched: '+ JSON.stringify(args));
        }
        console.log("chainId = " + args[0] + ", gasPrice = " + args[1] + ", nonce = " + args[2])
        return signed(_.extend(tx, {chainId: args[0], gasPrice: args[1], nonce: args[2]}))
    }).catch(function(error){
        return Promise.reject(error);
    });
};

Accounts.prototype.signHeader = function signHeader(header, privateKey, callback) {
    var _this = this,
        error = false,
        result;

    callback = callback || function () {};

    if (!header) {
        error = new Error('No header object given!');

        callback(error);
        return Promise.reject(error);
    }

    function signed (header) {

        try {
            header = helpers.formatters.inputCallFormatter(header);


            header.chainId =  utils.numberToHex(header.chainId);
            header.block_number =  utils.numberToHex(header.block_number);
            header.timestamp = utils.numberToHex(header.timestamp)

            var rlpEncoded = RLP.encode([
                header.chain_address.toLowerCase(),
                header.parent_hash,
                Bytes.fromUint8Array(header.transaction_root),
                Bytes.fromUint8Array(header.receive_transaction_root),
                Bytes.fromNat(header.block_number),
                Bytes.fromNat(header.timestamp),
                header.extra_data,
                header.reward_hash,
                Bytes.fromNat(header.chainId || '0x1'),
                "0x",
                "0x"]);


            var hash = Hash.keccak256(rlpEncoded);

            var signature = Account.makeSigner(Nat.toNumber(header.chainId || "0x1") * 2 + 35)(Hash.keccak256(rlpEncoded), privateKey);

            var rawHd = RLP.decode(rlpEncoded).slice(0, 8).concat(Account.decodeSignature(signature));

            rawHd[8] = makeEven(trimLeadingZero(rawHd[8]));
            rawHd[9] = makeEven(trimLeadingZero(rawHd[9]));
            rawHd[10] = makeEven(trimLeadingZero(rawHd[10]));

            var rawHeader = RLP.encode(rawHd);

            var values = RLP.decode(rawHeader);
            result = {
                messageHash: hash,
                v: trimLeadingZero(values[8]),
                r: trimLeadingZero(values[9]),
                s: trimLeadingZero(values[10]),
                rawHeader: rawHeader
            };

            console.log(Bytes.toNumber(values[5]))

        } catch(e) {
            callback(e);
            return Promise.reject(e);
        }

        callback(null, result);
        return result;
    }

    // Resolve immediately if nonce, chainId and price are provided
    if (header.chainId !== undefined) {
        return Promise.resolve(signed(header));
    }


    // Otherwise, get the missing info from the Ethereum Node
    return Promise.all([
        isNot(header.chainId) ? _this._ethereumCall.getId() : header.chainId
    ]).then(function (args) {
        if (isNot(args[0])) {
            throw new Error('Chainid couldn\'t be fetched: '+ JSON.stringify(args));
        }
        return signed(_.extend(header, {chainId: args[0]}));
    });
};

//block is of format {header, send_transactions}
Accounts.prototype.signBlock = function signBlock(txs, privateKey, callback) {
    var _this = this,
        error = false,
        result;

    callback = callback || function () {};


    var transactions = txs || [];
    var chainId = 1;
    var timestamp = Math.floor(Date.now() / 1000);

    if (transactions.length > 0){
        chainId = transactions[0].chainId;
    }


    var signTransactions = function(transactions){
        return new Promise(function(resolve, reject) {
            var signed_transactions = []
            var itemsProcessed = 0;
            transactions.forEach(function(tx, i) {
                _this.signTransaction(tx, privateKey, timestamp)
                .then(function(signed_tx){

                    signed_transactions.push(signed_tx);
                    itemsProcessed++;
                    if(itemsProcessed === transactions.length){
                        resolve(signed_transactions);
                    }
                 })
                .catch(function(error){
                    reject(error);
                });
            })
            if(itemsProcessed === transactions.length){
                resolve(signed_transactions);
            }

        })
     }

    var setTransactionsNonce = function(transactions, first_nonce){
        var current_nonce = 0;
        var output_transactions = [];
        transactions.forEach(function(tx, i) {
            current_nonce = first_nonce + i;
            _.extend(tx, {nonce: current_nonce});
            output_transactions.push(tx);
        })
        return output_transactions
    }

    var getTrieRootFromEncoded = function(encoded){
        return new Promise(function(resolve, reject) {
            var ops = [];
            var trie = new Trie();
            encoded.forEach(function(item, i) {
                var index = RLP.encode(Bytes.fromNat(utils.numberToHex(i)));
                ops.push({ type: 'put', key: index, value: item});
            });
            trie.batch(ops, function () {
                resolve(trie.root);
            });
        })
     }

     var getRewardBundleHash = function(encoded_bundle){
        return new Promise(function(resolve, reject) {
            var decoded_bundle = RLP.decode(encoded_bundle)
            var encoded_proof_list = []
            decoded_bundle[1][1].forEach(function(decoded_proof){
                encoded_proof_list.push(RLP.encode(decoded_proof))
            })

            getTrieRootFromEncoded(encoded_proof_list)
            .then(function(proof_trie_root){
                var parts_to_encode = [decoded_bundle[0], decoded_bundle[1][0], Bytes.fromUint8Array(proof_trie_root)];
                console.log(parts_to_encode);
                var hash = Hash.keccak256(RLP.encode(parts_to_encode));
                resolve(hash);
            })
            .catch(function(error){
                reject(error)
            });
        })
     }

    //GET BLOCK CREATION PARAMS
    return Promise.all([
        _this._ethereumCall.getBlockCreationParams(_this.privateKeyToAccount(privateKey).address)
    ]).then(function (args) {
        if (isNot(args[0])) {
            throw new Error('Block creation params could not be fetched from node. '+ JSON.stringify(args[0]));
        }

        var block_creation_params = args[0];
        var initial_nonce = 0;

        //create correct nonces. Can have multiple transactions, need nonces to increment.
        if(transactions && transactions.length > 0){
            if(!transactions[0].nonce){
                initial_nonce = block_creation_params.nonce;
            } else {
                initial_nonce = transactions[0].nonce;
            }
        }

        transactions = setTransactionsNonce(transactions, initial_nonce);

        //SIGN TRANSACTIONS
        return Promise.all([
            signTransactions(transactions)
        ]).then(function (args) {


            var signed_transaction_bundles = args[0];

            var signed_transactions_encoded = []

            signed_transaction_bundles.forEach(function(bundle) {
                signed_transactions_encoded.push(bundle.rawTransaction)
            });

            var receive_transactions_encoded = block_creation_params.receive_transactions;

            var reward_bundle_encoded = block_creation_params.reward_bundle;

            var total_reward_amount = _this.getRewardAmountFromEncodedRewardBundle(reward_bundle_encoded);

            if ((!transactions || (transactions.length < 1)) && (!receive_transactions_encoded || (receive_transactions_encoded.length < 1)) && (total_reward_amount == 0)) {
                error = new Error('Cannot send a block with no send transactions, no receive transactions, and 0 staking reward.');

                callback(error);
                return Promise.reject(error);
            }

            //GET SEND AND RECEIVE TRANSACTION ROOTS
            return Promise.all([
                getTrieRootFromEncoded(signed_transactions_encoded),
                getTrieRootFromEncoded(receive_transactions_encoded),
                getRewardBundleHash(reward_bundle_encoded)
            ]).then(function(args){
                var send_tx_root = args[0];
                var receive_tx_root = args[1];
                var reward_bundle_hash = args[2];
                console.log("Signing block header with timestamp");
                console.log(timestamp);
                var header = {
                    chain_address: _this.privateKeyToAccount(privateKey).address,
                    parent_hash: block_creation_params.parent_hash,
                    transaction_root: send_tx_root,
                    receive_transaction_root: receive_tx_root,
                    block_number: block_creation_params.block_number,
                    timestamp: timestamp,
                    extra_data: '0x',
                    reward_hash: reward_bundle_hash,
                    chainId: chainId
                };

                //SIGN HEADER
                return _this.signHeader(header, privateKey)
                .then(function(signed_header){

                    var d_txs = []
                    //DECODE EACH PART SO IT CAN BE RE-ENCODED PROPERLY
                    signed_transactions_encoded.forEach(function(tx) {
                        d_txs.push(RLP.decode(tx));
                    })

                    var d_r_txs = []
                    receive_transactions_encoded.forEach(function(tx) {
                        d_r_txs.push(RLP.decode(tx));
                    })


                    //RETURN ENCODED BLOCK
                    var rlpEncoded = RLP.encode([
                        RLP.decode(signed_header.rawHeader),
                        d_txs,
                        d_r_txs,
                        RLP.decode(reward_bundle_encoded)]);


                    result = {
                        messageHash: signed_header.messageHash,
                        v: trimLeadingZero(signed_header.v),
                        r: trimLeadingZero(signed_header.r),
                        s: trimLeadingZero(signed_header.s),
                        rawBlock: rlpEncoded
                    };
                    return result;

                });
            })
            .catch(function(error){
                return Promise.reject(error);
            })
        });
    })
    .catch(function(error){
        return Promise.reject(error);
    })

};


Accounts.prototype.getRewardAmountFromEncodedRewardBundle = function getRewardAmountFromEncodedRewardBundle(encoded_reward_bundle) {
    var decoded_bundle = RLP.decode(encoded_reward_bundle);
    var type_1_amount = Bytes.toNumber(decoded_bundle[0][0]) || 0;
    var type_2_amount = Bytes.toNumber(decoded_bundle[1][0]) || 0;
    return type_1_amount + type_2_amount
};



/* jshint ignore:start */
Accounts.prototype.recoverTransaction = function recoverTransaction(rawTx) {
    var values = RLP.decode(rawTx);
    var signature = Account.encodeSignature(values.slice(6,9));
    var recovery = Bytes.toNumber(values[6]);
    var extraData = recovery < 35 ? [] : [Bytes.fromNumber((recovery - 35) >> 1), "0x", "0x"];
    var signingData = values.slice(0,6).concat(extraData);
    var signingDataHex = RLP.encode(signingData);
    return Account.recover(Hash.keccak256(signingDataHex), signature);
};
/* jshint ignore:end */

Accounts.prototype.hashMessage = function hashMessage(data) {
    var message = utils.isHexStrict(data) ? utils.hexToBytes(data) : data;
    var messageBuffer = Buffer.from(message);
    var preamble = "\x19Ethereum Signed Message:\n" + message.length;
    var preambleBuffer = Buffer.from(preamble);
    var ethMessage = Buffer.concat([preambleBuffer, messageBuffer]);
    return Hash.keccak256s(ethMessage);
};

Accounts.prototype.sign = function sign(data, privateKey) {
    var hash = this.hashMessage(data);
    var signature = Account.sign(hash, privateKey);
    var vrs = Account.decodeSignature(signature);
    return {
        message: data,
        messageHash: hash,
        v: vrs[0],
        r: vrs[1],
        s: vrs[2],
        signature: signature
    };
};

Accounts.prototype.recover = function recover(message, signature, preFixed) {
    var args = [].slice.apply(arguments);


    if (_.isObject(message)) {
        return this.recover(message.messageHash, Account.encodeSignature([message.v, message.r, message.s]), true);
    }

    if (!preFixed) {
        message = this.hashMessage(message);
    }

    if (args.length >= 4) {
        preFixed = args.slice(-1)[0];
        preFixed = _.isBoolean(preFixed) ? !!preFixed : false;

        return this.recover(message, Account.encodeSignature(args.slice(1, 4)), preFixed); // v, r, s
    }
    return Account.recover(message, signature);
};

// Taken from https://github.com/ethereumjs/ethereumjs-wallet
Accounts.prototype.decrypt = function (v3Keystore, password, nonStrict) {
    /* jshint maxcomplexity: 10 */

    if(!_.isString(password)) {
        throw new Error('No password given.');
    }

    var json = (_.isObject(v3Keystore)) ? v3Keystore : JSON.parse(nonStrict ? v3Keystore.toLowerCase() : v3Keystore);

    if (json.version !== 3) {
        throw new Error('Not a valid V3 wallet');
    }

    var derivedKey;
    var kdfparams;
    if (json.crypto.kdf === 'scrypt') {
        kdfparams = json.crypto.kdfparams;

        // FIXME: support progress reporting callback
        derivedKey = scryptsy(new Buffer(password), new Buffer(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
    } else if (json.crypto.kdf === 'pbkdf2') {
        kdfparams = json.crypto.kdfparams;

        if (kdfparams.prf !== 'hmac-sha256') {
            throw new Error('Unsupported parameters to PBKDF2');
        }

        derivedKey = cryp.pbkdf2Sync(new Buffer(password), new Buffer(kdfparams.salt, 'hex'), kdfparams.c, kdfparams.dklen, 'sha256');
    } else {
        throw new Error('Unsupported key derivation scheme');
    }

    var ciphertext = new Buffer(json.crypto.ciphertext, 'hex');

    var mac = utils.sha3(Buffer.concat([ derivedKey.slice(16, 32), ciphertext ])).replace('0x','');
    if (mac !== json.crypto.mac) {
        throw new Error('Key derivation failed - possibly wrong password');
    }

    var decipher = cryp.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 16), new Buffer(json.crypto.cipherparams.iv, 'hex'));
    var seed = '0x'+ Buffer.concat([ decipher.update(ciphertext), decipher.final() ]).toString('hex');

    return this.privateKeyToAccount(seed);
};

Accounts.prototype.encrypt = function (privateKey, password, options) {
    /* jshint maxcomplexity: 20 */
    var account = this.privateKeyToAccount(privateKey);

    options = options || {};
    var salt = options.salt || cryp.randomBytes(32);
    var iv = options.iv || cryp.randomBytes(16);

    var derivedKey;
    var kdf = options.kdf || 'scrypt';
    var kdfparams = {
        dklen: options.dklen || 32,
        salt: salt.toString('hex')
    };

    if (kdf === 'pbkdf2') {
        kdfparams.c = options.c || 262144;
        kdfparams.prf = 'hmac-sha256';
        derivedKey = cryp.pbkdf2Sync(new Buffer(password), salt, kdfparams.c, kdfparams.dklen, 'sha256');
    } else if (kdf === 'scrypt') {
        // FIXME: support progress reporting callback
        kdfparams.n = options.n || 8192; // 2048 4096 8192 16384
        kdfparams.r = options.r || 8;
        kdfparams.p = options.p || 1;
        derivedKey = scryptsy(new Buffer(password), salt, kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
    } else {
        throw new Error('Unsupported kdf');
    }

    var cipher = cryp.createCipheriv(options.cipher || 'aes-128-ctr', derivedKey.slice(0, 16), iv);
    if (!cipher) {
        throw new Error('Unsupported cipher');
    }

    var ciphertext = Buffer.concat([ cipher.update(new Buffer(account.privateKey.replace('0x',''), 'hex')), cipher.final() ]);

    var mac = utils.sha3(Buffer.concat([ derivedKey.slice(16, 32), new Buffer(ciphertext, 'hex') ])).replace('0x','');

    return {
        version: 3,
        id: uuid.v4({ random: options.uuid || cryp.randomBytes(16) }),
        address: account.address.toLowerCase().replace('0x',''),
        crypto: {
            ciphertext: ciphertext.toString('hex'),
            cipherparams: {
                iv: iv.toString('hex')
            },
            cipher: options.cipher || 'aes-128-ctr',
            kdf: kdf,
            kdfparams: kdfparams,
            mac: mac.toString('hex')
        }
    };
};


// Note: this is trying to follow closely the specs on
// http://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html

function Wallet(accounts) {
    this._accounts = accounts;
    this.length = 0;
    this.defaultKeyName = "web3js_wallet";
}

Wallet.prototype._findSafeIndex = function (pointer) {
    pointer = pointer || 0;
    if (_.has(this, pointer)) {
        return this._findSafeIndex(pointer + 1);
    } else {
        return pointer;
    }
};

Wallet.prototype._currentIndexes = function () {
    var keys = Object.keys(this);
    var indexes = keys
        .map(function(key) { return parseInt(key); })
        .filter(function(n) { return (n < 9e20); });

    return indexes;
};

Wallet.prototype.create = function (numberOfAccounts, entropy) {
    for (var i = 0; i < numberOfAccounts; ++i) {
        this.add(this._accounts.create(entropy).privateKey);
    }
    return this;
};

Wallet.prototype.add = function (account) {

    if (_.isString(account)) {
        account = this._accounts.privateKeyToAccount(account);
    }
    if (!this[account.address]) {
        account = this._accounts.privateKeyToAccount(account.privateKey);
        account.index = this._findSafeIndex();

        this[account.index] = account;
        this[account.address] = account;
        this[account.address.toLowerCase()] = account;

        this.length++;

        return account;
    } else {
        return this[account.address];
    }
};

Wallet.prototype.remove = function (addressOrIndex) {
    var account = this[addressOrIndex];

    if (account && account.address) {
        // address
        this[account.address].privateKey = null;
        delete this[account.address];
        // address lowercase
        this[account.address.toLowerCase()].privateKey = null;
        delete this[account.address.toLowerCase()];
        // index
        this[account.index].privateKey = null;
        delete this[account.index];

        this.length--;

        return true;
    } else {
        return false;
    }
};

Wallet.prototype.clear = function () {
    var _this = this;
    var indexes = this._currentIndexes();

    indexes.forEach(function(index) {
        _this.remove(index);
    });

    return this;
};

Wallet.prototype.encrypt = function (password, options) {
    var _this = this;
    var indexes = this._currentIndexes();

    var accounts = indexes.map(function(index) {
        return _this[index].encrypt(password, options);
    });

    return accounts;
};


Wallet.prototype.decrypt = function (encryptedWallet, password) {
    var _this = this;

    encryptedWallet.forEach(function (keystore) {
        var account = _this._accounts.decrypt(keystore, password);

        if (account) {
            _this.add(account);
        } else {
            throw new Error('Couldn\'t decrypt accounts. Password wrong?');
        }
    });

    return this;
};

Wallet.prototype.save = function (password, keyName) {
    localStorage.setItem(keyName || this.defaultKeyName, JSON.stringify(this.encrypt(password)));

    return true;
};

Wallet.prototype.load = function (password, keyName) {
    var keystore = localStorage.getItem(keyName || this.defaultKeyName);

    if (keystore) {
        try {
            keystore = JSON.parse(keystore);
        } catch(e) {

        }
    }

    return this.decrypt(keystore || [], password);
};

if (typeof localStorage === 'undefined') {
    delete Wallet.prototype.save;
    delete Wallet.prototype.load;
}


module.exports = Accounts;
