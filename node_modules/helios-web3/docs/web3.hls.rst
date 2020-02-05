======================
Web3.hls documentation
======================

Some functions are shared with ethereum's Web3, whos documentation can be found `here <https://web3js.readthedocs.io>`_.
Available functions:


**Web3.hls.getBlockByHash(blockHash [, returnTransactionObjects = false] [, callback])**

Fetches a block matching a given hash.

Example for a block with send and receive transactions, and returnTransactionObjects = false:

::

    web3.hls.getBlockByHash('0xc7ecd5fbd7f7cbfd6015cc7df85f4602ce73578f9d3f6d5bee5c55836f746eed')
    >>
    accountBalance: "97090998992000000000000"
    accountHash: "0x847d67c64ed3780ec77f39bf6823ae482dfa28b706b1d6b2cf9c5aa2c52e453e"
    chainAddress: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD"
    extraData: "0x"
    gasLimit: 31415926
    gasUsed: 0
    hash: "0xc7ecd5fbd7f7cbfd6015cc7df85f4602ce73578f9d3f6d5bee5c55836f746eed"
    logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    number: 2
    parentHash: "0xb808a42cb3e4028782e6dcb611844210d68d5a1e427bed04e999d5e3b5774d0b"
    receiptsRoot: "0x0eb361aad311072996f0f7ee7d0972c53cb9641c0f025aed65cc30cc01458101"
    receiveTransactions: Array(3)
        0: "0x5cf65d010b2a9dbdff33ab3070f62640bca1230e341eb40db6a2f1d768579199"
        1: "0x39e311559a5540dcd9bbf0de1c4dc581428750f5cddbffea98a32e83a861a015"
        2: "0xaefbf8eefd6a10730536a38db56f11063dfb23afe710e114cbe5ba351188bef5"
    receiveTransactionsRoot: "0xc3699c874b2a20ab03d13217e9ba2b930a4a117d37483d3f78215838a5ea6514"
    rewardBundle:
        hash: "0xb4f5375844e96b776d7a947561a4f9d045f5e80d06921d96e463cce078a246cc"
        isReward: true
        rewardType1: {amount: "0"}
        rewardType2: {amount: "0", proof: Array(0)}
    rewardHash: "0xb4f5375844e96b776d7a947561a4f9d045f5e80d06921d96e463cce078a246cc"
    sender: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD"
    size: 1126
    timestamp: 1562792888
    transactions: Array(3)
        0: "0x69cf5f0d6eb9d3bde0dcdd5398193a7bbe8dbc9d7239ae001963348db31f02e7"
        1: "0x7bcaee58e8284f95575773ac92c2accb682e2c4b7889b5d5e4309d23a00e8659"
        2: "0x5fb7f52cd86ce62250dc36c49b80587f4644498a2afa8a054801d6fa268741e1"
    transactionsRoot: "0x1d75f7f493ba63f89201066a1138a4c054576a0209b13b3390634e5897487916"

Example for a block with send and receive transactions, and returnTransactionObjects = true:

::

    accountBalance: "97090998992000000000000"
    accountHash: "0x847d67c64ed3780ec77f39bf6823ae482dfa28b706b1d6b2cf9c5aa2c52e453e"
    chainAddress: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD"
    extraData: "0x"
    gasLimit: 31415926
    gasUsed: 0
    hash: "0xc7ecd5fbd7f7cbfd6015cc7df85f4602ce73578f9d3f6d5bee5c55836f746eed"
    logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    number: 2
    parentHash: "0xb808a42cb3e4028782e6dcb611844210d68d5a1e427bed04e999d5e3b5774d0b"
    receiptsRoot: "0x0eb361aad311072996f0f7ee7d0972c53cb9641c0f025aed65cc30cc01458101"
    receiveTransactions: Array(3)
        0:
            blockHash: "0xc7ecd5fbd7f7cbfd6015cc7df85f4602ce73578f9d3f6d5bee5c55836f746eed"
            from: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6"
            gasPrice: "3000000000"
            gasUsed: "0"
            hash: "0x5cf65d010b2a9dbdff33ab3070f62640bca1230e341eb40db6a2f1d768579199"
            isReceive: true
            isRefund: false
            remainingRefund: "0"
            sendTransactionHash: "0x0df2b9dfec4c5e69698661393dd5f185ccfd73cccc8588a6f75f025d3053c2d7"
            senderBlockHash: "0x418955461e7df7fa9c2eb00c7ac6dbdeb511f0f608d21d0e564afa1e01b83477"
            to: "0x88c2d0707d24e09b23b24d011e9f7d3efc3ca4cd"
            transactionIndex: 3
            value: "1000000000000000000"
        1: {senderBlockHash: "0x418955461e7df7fa9c2eb00c7ac6dbdeb511f0f608d21d0e564afa1e01b83477", sendTransactionHash: "0xbaf2e68f0c3b056229ce739cd65f438076203e989d18565ce02ad1e97db519ee", isRefund: false, remainingRefund: "0", isReceive: true, ...}
        2: {senderBlockHash: "0x418955461e7df7fa9c2eb00c7ac6dbdeb511f0f608d21d0e564afa1e01b83477", sendTransactionHash: "0x78bdbc8fe218c8e5c2bfba4c08a80568d907473308188bc2b34ad8a6a09f908f", isRefund: false, remainingRefund: "0", isReceive: true, ...}
    receiveTransactionsRoot: "0xc3699c874b2a20ab03d13217e9ba2b930a4a117d37483d3f78215838a5ea6514"
    rewardBundle:
        hash: "0xb4f5375844e96b776d7a947561a4f9d045f5e80d06921d96e463cce078a246cc"
        isReward: true
        rewardType1: {amount: "0"}
        rewardType2: {amount: "0", proof: Array(0)}
    rewardHash: "0xb4f5375844e96b776d7a947561a4f9d045f5e80d06921d96e463cce078a246cc"
    sender: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD"
    size: 1126
    timestamp: 1562792888
    transactions: Array(3)
        0:
            blockHash: "0xc7ecd5fbd7f7cbfd6015cc7df85f4602ce73578f9d3f6d5bee5c55836f746eed"
            blockNumber: 2
            data: "0x"
            from: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD"
            gas: 800000
            gasPrice: "3000000000"
            gasUsed: "21000"
            hash: "0x69cf5f0d6eb9d3bde0dcdd5398193a7bbe8dbc9d7239ae001963348db31f02e7"
            input: "0x"
            isReceive: false
            nonce: 13
            r: "0xc59b360935c964a651a86fb659e5dfcaf0ff28d5d67add8c1f3d4c39d6c2ad7e"
            s: "0x7bca95262bbef31827fadb7fa6f1f8357936d3103c3d72233c3395ee133777fe"
            to: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6"
            transactionIndex: 0
            v: "0x25"
            value: "4000000000000000000"
        1: {nonce: 14, gasPrice: "3000000000", gas: 800000, to: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", value: "5000000000000000000", ...}
        2: {nonce: 15, gasPrice: "3000000000", gas: 800000, to: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", value: "6000000000000000000", ...}
    transactionsRoot: "0x1d75f7f493ba63f89201066a1138a4c054576a0209b13b3390634e5897487916"

Example reward bundle if the block contained a type 2 reward:
::

    rewardBundle:
        hash: "0x2be5f20678e0d35645bcd8ef0f7787b5fff52b19914a1e67c6713f80b878a1ea"
        isReward: true
        rewardType1: {amount: "0"}
        rewardType2:
            amount: "5483753614437156409"
            proof: Array(2)
            0:
                headHashOfSenderChain: "0xfd7b2144895721f1aa0b6246677b8a57adf495e4712ce42a0f1e4607a7b9105c"
                r: "0x98e5b5c596de7140ec76288dad0fc8366292abd57c46371c871279043e914358"
                recipientNodeWalletAddress: "0x2E8E56559685d44DF37EAc1019c414f362664eE8"
                s: "0x2c1e8dfbcca59cab8140849ed30edb8fda18d9620561baa72ca3cd7be44bf56e"
                score: 997690
                sender: "0x564021bB1449B393147E77476c1Ac7E2c71156d6"
                sinceBlockNumber: 6
                timestamp: 1562755834
                v: "0x25"
            1: {recipientNodeWalletAddress: "0x2E8E56559685d44DF37EAc1019c414f362664eE8", score: 997690, sinceBlockNumber: 6, timestamp: 1562755834, headHashOfSenderChain: "0x286a4f9ce14005e8f795917ef34cc95a079ad6eaa8dda84a7f303b06feba4f1a", …}




**web3.hls.getBlockByNumber(blockNumber, chainAddress [, returnTransactionObjects = false] [, callback])**

Returns the same thing as getBlockByHash(), so the output won't be shown

Example calling the function to get block #2 on the chain with the address 0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD
Note, block numbers start at 0, so block number 2 is the third block:
::

    web3.hls.getBlockByNumber(2,'0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD')


**web3.hls.getNewestBlocks([numberOfBlocksToReturn = 10 (max 10), startIdx = 0, afterHash = undefined, chainAddress = undefined, includeTransactions = False] [, callback])**

Retrieves the newest blocks from the blockchain database.

StartIdx is the index of where to start returning blocks from, starting from the newest block.
For example, 0 is the newest block, 3 is the 3rd newest block, 10 is the 10th newest block etc...

afterHash defines the earliest block hash that will be returned. So if there are only x blocks newer than the afterHash that you specify, then it will only return x blocks.

If chainAddress is specified, then it will return the newest blocks from that chain. If it is not specified,
it will return the newest blocks globally including all chains.

Example 1
::

    web3.hls.getNewestBlocks(5)
    >>
    0: {chainAddress: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD", sender: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD", extraData: "0x", gasLimit: 31415926, gasUsed: 0, …}
    1: {chainAddress: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", sender: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", extraData: "0x", gasLimit: 31415926, gasUsed: 21000, …}
    2: {chainAddress: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD", sender: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD", extraData: "0x", gasLimit: 31415926, gasUsed: 21000, …}
    3: {chainAddress: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", sender: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", extraData: "0x", gasLimit: 31415926, gasUsed: 21000, …}
    4: {chainAddress: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", sender: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", extraData: "0x", gasLimit: 31415926, gasUsed: 21000, …}

It has outputted a list of the 5 newest blocks. For a full printout of a block, check the getBlockByHash function above.

Example 2
::

    web3.hls.getNewestBlocks(5, 0, '0xb808a42cb3e4028782e6dcb611844210d68d5a1e427bed04e999d5e3b5774d0b')
    >>
    0: {chainAddress: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD", sender: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD", extraData: "0x", gasLimit: 31415926, gasUsed: 0, …}
    1: {chainAddress: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", sender: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", extraData: "0x", gasLimit: 31415926, gasUsed: 21000, …}

In this case, the third block in the list had the hash '0xb808a42cb3e4028782e6dcb611844210d68d5a1e427bed04e999d5e3b5774d0b', so it only returned the two blocks newer than that one.

Example 3
::

    web3.hls.getNewestBlocks(2, 2, undefined, "0x57D46695F7F3418A60EF3651b8cc3294F512Da30")
    >>
    0: {chainAddress: "0x57D46695F7F3418A60EF3651b8cc3294F512Da30", sender: "0x57D46695F7F3418A60EF3651b8cc3294F512Da30", extraData: "0x", gasLimit: 31415926, gasUsed: 0, …}
    1: {chainAddress: "0x57D46695F7F3418A60EF3651b8cc3294F512Da30", sender: "0x57D46695F7F3418A60EF3651b8cc3294F512Da30", extraData: "0x", gasLimit: 31415926, gasUsed: 0, …}

This fetched 2 blocks from the chain "0x57D46695F7F3418A60EF3651b8cc3294F512Da30" starting at the 3rd newest block.
If we define the blocks from newest to oldest to have indices: 0,1,2,3... This function would return blocks starting with the block at index 2 in that list.

**web3.hls.sendTransaction(transaction_dict)**

Adds a transaction to your blockchain. Also automatically adds any receivable transactions to your blockchain.

The transaction_dict is a dictionary of format:
::

    {
        from: wallet address of the sending account,
        to: wallet address the transaction is being sent to,
        value: the amount of the transaction (in Wei),
        gas: the maximum allowed gas the transaction can use (in Wei),
        gasPrice: the gas price of the transaction (in Wei),
        chainId: 1 for mainnet (optional),
        nonce: the transaction nonce (optional),
        data: the hex encoded data to be sent with the transaction (optional)
    }

**web3.hls.sendTransactions(list_of_transaction_dicts = undefined)**

Adds a list of transactions to your blockchain. Also automatically adds any receivable transactions to your blockchain.
The transaction dicts have the same format as sendTransaction above.

Unlike other blockchains, on Helios Protocol, you can send multiple transactions from the same address at once. Just make sure
the nonce increases by 1 for each transaction. Also be aware, if sending multiple transactions at once, they must be from
the same address.

Here is an example where we send 3 transactions at once:
::

    list_of_transaction_dicts =
    0:
        chainId: "0x1"
        data: "0x"
        gas: "0xc3500"
        gasPrice: "0xb2d05e00"
        nonce: "0x23"
        to: "0x4380f6759d696c06c03c90a32aca0cb59c1a6bb6"
        value: "0xde0b6b3a7640000"
    1: {to: "0x4380f6759d696c06c03c90a32aca0cb59c1a6bb6", value: "0x1bc16d674ec80000", gas: "0xc3500", gasPrice: "0xb2d05e00", chainId: "0x1", …}
    2: {to: "0x4380f6759d696c06c03c90a32aca0cb59c1a6bb6", value: "0x29a2241af62c0000", gas: "0xc3500", gasPrice: "0xb2d05e00", chainId: "0x1", …}

    web3.hls.sendTransactions(list_of_transaction_dicts)

**web3.hls.sendRewardBlock()**

Creates a block block with no send transactions, but it contains any pending receive transactions, or pending staking rewards.
Use this if you just want to receive any incoming transactions.


**web3.hls.getBlockNumber(chainAddress [, callback])**

Returns the length of the chain, which is the number of the next block to be added to the chain.

::

    web3.hls.getBlockNumber("0x57D46695F7F3418A60EF3651b8cc3294F512Da30")
    >>
    5

**web3.hls.getGasPrice([, callback])**

Returns the minimum allowed gas in GWei. Blocks containing send transactions with an average gas price of less than this will be rejected.

::

    web3.hls.getGasPrice()
    >>
    1

The current minimum gas price is 1 GWei, or 1000000000 Wei.

**web3.hls.getTransactionReceipt(hash [, callback])**

Same as with Ethereum's Web3 except it returns 1 additional parameter called is_receive (check `here <https://web3js.readthedocs.io>`_. for their documentation):
is_receive is a boolean that defines whether the transaction was a send or receive transaction. If it is true, then the transaction is a receive transaction.

::

    web3.hls.getTransactionReceipt("0x69cf5f0d6eb9d3bde0dcdd5398193a7bbe8dbc9d7239ae001963348db31f02e7")
    >>
    blockHash: "0xc7ecd5fbd7f7cbfd6015cc7df85f4602ce73578f9d3f6d5bee5c55836f746eed"
    blockNumber: 2
    bloom: "0x0"
    cumulativeGasUsed: 21000
    gasUsed: 21000
    isReceive: false
    logs: []
    sender: "0x88c2d0707d24e09b23b24d011e9f7d3efc3ca4cd"
    statusCode: "0x01"
    to: "0x4380f6759d696c06c03c90a32aca0cb59c1a6bb6"
    transactionHash: "0x69cf5f0d6eb9d3bde0dcdd5398193a7bbe8dbc9d7239ae001963348db31f02e7"
    transactionIndex: 0


**web3.hls.getTransactionByHash(tx_hash [, callback])**

Fetches the canonical transaction corresponding to the hash. It will return a transaction object of the same format as when you fetch a block
with getBlockByHash(). Check Ethereum's Web3 documentation for more details `here <https://web3js.readthedocs.io>`_.

::

    web3.hls.getTransactionByHash("0x69cf5f0d6eb9d3bde0dcdd5398193a7bbe8dbc9d7239ae001963348db31f02e7")
    >>
    blockHash: "0xc7ecd5fbd7f7cbfd6015cc7df85f4602ce73578f9d3f6d5bee5c55836f746eed"
    blockNumber: 2
    data: "0x"
    from: "0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD"
    gas: 800000
    gasPrice: "3000000000"
    gasUsed: "21000"
    hash: "0x69cf5f0d6eb9d3bde0dcdd5398193a7bbe8dbc9d7239ae001963348db31f02e7"
    input: "0x"
    isReceive: false
    nonce: 13
    r: "0xc59b360935c964a651a86fb659e5dfcaf0ff28d5d67add8c1f3d4c39d6c2ad7e"
    s: "0x7bca95262bbef31827fadb7fa6f1f8357936d3103c3d72233c3395ee133777fe"
    to: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6"
    transactionIndex: 0
    v: "0x25"
    value: "4000000000000000000"


**web3.hls.getBalance(wallet_address [, at_block = undefined, callback])**

Gets the balance of the account corresponding to wallet_address. If at_block is specified, it will get the balance at that block,
otherwise it will return the current balance. Returns the balance in Wei.

::

    web3.hls.getBalance("0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6", 0)
    >>
    100000000000000000000000

**web3.hls.getReceivableTransactions(wallet_address)**

Fetches a list of receive transactions that are ready to be added to the chain corresponding to the given wallet address.
The receive transactions are in the same format as is returned with getBlockByHash() above, except some parameters are null
because the transaction hasn't been added to a block and thus they are not known yet.

::

    web3.hls.getReceivableTransactions("0x88C2d0707d24e09B23b24D011E9f7d3EfC3cA4cD")
    >>
    0:
        blockHash: null
        from: "0x4380f6759D696C06C03c90A32ACA0cb59C1A6bB6"
        gasPrice: "3000000000"
        gasUsed: "0"
        hash: "0x1cb8e703630e3296e51546495eecc9e8b67c185db9a2ae95f09c44b3b8131adc"
        isReceive: true
        isRefund: false
        remainingRefund: "0"
        sendTransactionHash: "0xdc67bb48f2e1b6756c31a90f9c6fabf1a422c603a1f63ae2c0c5f28ba7c41cc4"
        senderBlockHash: "0xc60dac0cd97d09a502e40dda20f5b1605282f2f74fc0ba592f680698c91302ff"
        to: "0x88c2d0707d24e09b23b24d011e9f7d3efc3ca4cd"
        transactionIndex: null
        value: "1000000000000000000"
    1: {senderBlockHash: "0xc60dac0cd97d09a502e40dda20f5b1605282f2f74fc0ba592f680698c91302ff", sendTransactionHash: "0x3f10f4056160b801bdd5e8ce7abe3c66fc98c346d82c87f0020bf25fdd2f9974", isRefund: false, remainingRefund: "0", isReceive: true, …}
    2: {senderBlockHash: "0xc60dac0cd97d09a502e40dda20f5b1605282f2f74fc0ba592f680698c91302ff", sendTransactionHash: "0x55d6d50b873386958cc279bf725afa8afd3bb7dd53a5ecffc5eef837cf068d30", isRefund: false, remainingRefund: "0", isReceive: true, …}

Notice that blockHash, and transactionIndex are null because the transaction hasn't been added to a block yet.

**web3.hls.getConnectedNodes()**

Fetched a list of nodes that are currently connected to this node.
averageResponseTime is measured in microseconds

::

    web3.hls.getConnectedNodes()
    >>
    0:
        averageResponseTime: 98519
        failedRequests: 0
        ipAddress: "127.0.0.1"
        requestsSent: 1
        stake: "150544572338103728574418"
        tcpPort: 41294
        udpPort: 41294
        url: "<Node(0x90352c22d1f905be776f75eaf2790f67e6401c00757f554448abe21becb3a5506fe5b4dbfbdeaba8041eb60d226fdf91676d8dd0de2a6faf6ed5bed3615f22c3@127.0.0.1:41294)>"
    1: {url: "<Node(0x791f5148c3474e00661a3772361df95badfa980cb1…794f27b510420995cd5cd0c028@127.0.0.1:54114)>", ipAddress: "127.0.0.1", udpPort: 54114, tcpPort: 54114, stake: "10065762222775878194593397", …}
    2: {url: "<Node(0x1e95a05d9601763786055cd48e21c883be82981acb…ab9e0fbe73a56bbeb04e49a486e0@127.0.0.1:36086)>", ipAddress: "127.0.0.1", udpPort: 36086, tcpPort: 36086, stake: "10062569477880554435071646", …}
    3: {url: "<Node(0x989912604202ab3d8f8925844ad619e82be80df4c2…9c795b8c692da67a802100a38e1@127.0.0.1:30303)>", ipAddress: "127.0.0.1", udpPort: 30303, tcpPort: 30303, stake: "10010983816289129882113", …}
    4: {url: "<Node(0x849652f99e172296e89f8dcdc29098d6df57fcedda…c8d85509df3a9763821336f922@127.0.0.1:22447)>", ipAddress: "127.0.0.1", udpPort: 22447, tcpPort: 22447, stake: "150516164543333268616433", …}
    5: {url: "<Node(0xc096019233fd3d829c93b9b7b1849be20e44193eda…e785efc2f03bb8ac18c34a25eccc@127.0.0.1:54418)>", ipAddress: "127.0.0.1", udpPort: 54418, tcpPort: 54418, stake: "10000000000000000000000", …}
    6: {url: "<Node(0xe8ef306d22c5e3d47c744534e932c75f62d21dd4aa…d655bf853e487b1d8cda026de27@127.0.0.1:37636)>", ipAddress: "127.0.0.1", udpPort: 37636, tcpPort: 37636, stake: "150523980197589463130518", …}


**web3.hls.getHistoricalGasPrice()**

Fetches a list of minimum gas prices over time. The returned format is an array of (timestamp, min_gas_price) tuples.

::

    web3.hls.getHistoricalGasPrice()
    >>
    0: (2) [1562789200, 1]
    1: (2) [1562789300, 1]
    2: (2) [1562789400, 1]
    3: (2) [1562789500, 1]
    4: (2) [1562789600, 1]
    5: (2) [1562789700, 1]
    6: (2) [1562789800, 1]
    ...

**web3.hls.getApproximateHistoricalTPC()**

Fetches a list of the approximate transactions per hectosecond (100 seconds) over time. This is only approximate and is what
the nodes use to know when to begin throttling by increasing the minimum gas price. The returned format is an array of (timestamp, min_gas_price) tuples.

::

    web3.hls.getApproximateHistoricalTPC()
    >>
    0: (2) [1562789200, 0]
    1: (2) [1562789300, 0]
    2: (2) [1562789400, 0]
    3: (2) [1562789500, 0]
    4: (2) [1562789600, 0]
    5: (2) [1562789700, 0]
    ...

**web3.hls.getApproximateHistoricalNetworkTPCCapability()**

Fetches the network transaction throughput where throttling will occur, measured in transactions per hectosecond (100 seconds).
This is not the actual transaction throughput that the network can handle. This is a much smaller number that allows the network
to throttle early enough to remain stable. The returned format is an array of (timestamp, min_gas_price) tuples.

::

    web3.hls.getApproximateHistoricalNetworkTPCCapability()
    >>
   0: (2) [1562789200, 2900]
    1: (2) [1562789300, 2823]
    2: (2) [1562789400, 2771]
    3: (2) [1562789500, 2951]
    4: (2) [1562789600, 2606]
    5: (2) [1562789700, 2644]
    ...
