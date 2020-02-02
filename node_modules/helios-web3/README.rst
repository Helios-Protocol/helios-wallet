===========================
Web3.js for Helios Protocol
===========================

This is web3.js for Helios Protocol. It is currently under active development.

How to use
----------
If you are building an application in nodejs:

    .. code:: bash

        $ npm install helios-web3

If you are building a application to run in the browser:

1)  Copy the compiled browser file from the dist directory, and then include it into your html file normally

2)  Access web3 from within your javascript using either of the window variables:

        .. code:: bash

            web3
            heliosWeb3

3)  Access Helios functions using:

        .. code:: bash

            web3.hls
            heliosWeb3.hls

If you would like to develop helios-web3:

1)  Clone this repo

        .. code:: bash

            $ git clone https://github.com/Helios-Protocol/helios-web3.js

2)  Install using npm

        .. code:: bash

            $ cd helios-web3.js
            $ npm install

How to compile the browser version using browserify:

.. code:: bash

    $ browserify export_for_website.js -o dist/helios_web3.js




Documentation
-------------
Documentation is a work in progress

Many of the functions used on Ethereum's web3.js will work on Helios as long as they are applicable.
You can see the documentation for that `here <https://web3js.readthedocs.io>`_.

Here we will show documentation for Helios specific functionality.

web3.hls.getBlock()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This has been removed. Use getBlockByNumber of getBlockByHash instead.


web3.hls.getBlockByHash(blockHash [, returnTransactionObjects = false] [, callback])
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Parameters**
blockHash is the hex hash of the block. If returnTransactionsObjects is false, only the hashes of transactions are
included in the block, otherwise the transaction objects are included in the block.

**Returns**
"chainAddress"
"sender" -> The address that signed the block.
"extraData"
"gasLimit"
"gasUsed"
"hash"
"logsBloom"
"number"
"parentHash"
"rewardHash"
"accountHash"
"receiptsRoot"
"timestamp"
"accountBalance"
"transactionsRoot"
"receiveTransactionsRoot"
"transactions"
"receiveTransactions"
"rewardBundle"

**example transactions**
includes "gasUsed", unlike eth
includes "isReceive": false

**example receiveTransactions**
hash: "0xb52610ea9fefb6a2af025edc8e56d07c78d7446f1f0fe34005672ec3127ed965"
isRefund: "0x0"
remainingRefund: "0"
sendTransactionHash: "0xe5b564e507e45e24b789164aecb124f451ffc446c6f1c12a0a11ef0678eedf8e"
from: "0xdb4ca426d53b59f60370274ffb19f2268dc33ddf"
senderBlockHash: "0xd69c6653e39d625ce19eb445563a55712666972d695e8ac904f988166b085d10"
value: "14000000000000000000000"
isReceive: true

this needs updating

web3.hls.getBlockByNumber(blockNumber, chainAddress [, returnTransactionObjects = false] [, callback])
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Parameters**
blockNumber is an integer, chainAddress is a hex encoded address of the chain on which the block lives.

web3.hls.getNewestBlocks([numberOfBlocksToReturn = 10 (max 10), startIdx = 0, afterHash, chainAddress = None, includeTransactions = False] [, callback])
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Gets a list of new blocks starting from start_idx and increasing the index to a max of numberOfBlocksToReturn, but it will stop when it hits the block with hash = afterHash.
includeTransactions tells it whether to include transactions.
Returns a list of the same kind of blocks as the getBlock function.
Returns newest to oldest blocks.


web3.hls.getBlockNumber(chainAddress [, callback])
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Parameters**
Same as web3.hls.getBlockNumber with the addition of chainAddress and beforeTimestamp.
chainAddress is the address of the chain that you would like the block number for. if beforeTimestamp
is specified, it will return the latest block number before the timestamp. It will produce an error if
there are no matching blocks.

**Returns**
Same as web3.hls.getBlockNumber

web3.hls.getHistoricalGasPrice([callback])
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
**Returns**
A list of [timestamp, gas_price] entries for as far back as the node saves.

web3.hls.getTransactionReceipt(hash [, callback])
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Same as with ethereum web3 except it returns 1 additional parameter:
"is_receive"


web3.hls.getTransactionByHash(tx_hash)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Gets the canonical transaction corresponding to the hash.

