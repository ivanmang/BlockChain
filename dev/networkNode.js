const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const port = process.argv[2];
const rp = require('request-promise');

const nodeAddress = uuid().split('-').join('');

const coin = new Blockchain();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// get entire blockchain
app.get('/blockchain', function (req, res) {
  res.send(coin);
});


// create a new transaction
app.post('/transaction', function(req, res) {
  const newTransaction = req.body;
  const blockIndex = coin.addTransactionToPendingTransactions(newTransaction);
  res.json({ note: `Transaction will be added in block ${blockIndex}.`});
});


app.post('/transaction/broadcast', function(req, res) {
  const newTransaction = coin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
  coin.addTransactionToPendingTransactions(newTransaction);

  const requestPromises = [];
  coin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/transaction',
      method: 'POST',
      body: newTransaction,
      json: true
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises)
  .then(data => {
    res.json({ note: 'Transaction created and broadcast successfully' });
  });
});



// mine a block
app.get('/mine', function(req, res) {
	const lastBlock = coin.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transactions: coin.pendingTransactions,
		index: lastBlock['index'] + 1
	};
	const nonce = coin.proofOfWork(previousBlockHash, currentBlockData);
	const blockHash = coin.hashBlock(previousBlockHash, currentBlockData, nonce);
	const newBlock = coin.createNewBlock(nonce, previousBlockHash, blockHash);

	const requestPromises = [];
	coin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/receive-new-block',
			method: 'POST',
			body: { newBlock: newBlock },
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		const requestOptions = {
			uri: coin.currentNodeUrl + '/transaction/broadcast',
			method: 'POST',
			body: {
				amount: 12.5,
				sender: "00",
				recipient: nodeAddress
			},
			json: true
		};

		return rp(requestOptions);
	})
	.then(data => {
		res.json({
			note: "New block mined & broadcast successfully",
			block: newBlock
		});
	});
});

// receive new block
app.post('/receive-new-block', function(req, res) {
	const newBlock = req.body.newBlock;
	const lastBlock = coin.getLastBlock();
	const correctHash = lastBlock.hash === newBlock.previousBlockHash;
	const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

	if (correctHash && correctIndex) {
		coin.chain.push(newBlock);
		coin.pendingTransactions = [];
		res.json({
			note: 'New block received and accepted.',
			newBlock: newBlock
		});
	} else {
		res.json({
			note: 'New block rejected.',
			newBlock: newBlock
		});
	}
});

// register a node and broadcast it to the network
app.post('/register-and-broadcast-node', function(req, res) {
	const newNodeUrl = req.body.newNodeUrl;
  //if the newNodeUrl is not alreadt present in array, then push it in
	if (coin.networkNodes.indexOf(newNodeUrl) == -1) coin.networkNodes.push(newNodeUrl);

	const regNodesPromises = [];
  //for every nodes in the array, we will register the new node by hitting /register-node
	coin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/register-node',
			method: 'POST',
			body: { newNodeUrl: newNodeUrl },
			json: true
		};
    //pushing all requests to regNodesPromises
		regNodesPromises.push(rp(requestOptions));
	});

  //Running all requests
	Promise.all(regNodesPromises)
	.then(data => {
    //register all the nodes to the new nodes
		const bulkRegisterOptions = {
			uri: newNodeUrl + '/register-nodes-bulk',
			method: 'POST',
			body: { allNetworkNodes: [ ...coin.networkNodes, coin.currentNodeUrl ] },
			json: true
		};

		return rp(bulkRegisterOptions);
	})
	.then(data => {
		res.json({ note: 'New node registered with network successfully.' });
	});
});


// register a node with the network
app.post('/register-node', function(req, res) {
	const newNodeUrl = req.body.newNodeUrl;
	const nodeNotAlreadyPresent = coin.networkNodes.indexOf(newNodeUrl) == -1;
	const notCurrentNode = coin.currentNodeUrl !== newNodeUrl;
	if (nodeNotAlreadyPresent && notCurrentNode) coin.networkNodes.push(newNodeUrl);
	res.json({ note: 'New node registered successfully with node.' });
});


// register multiple nodes at once
app.post('/register-nodes-bulk', function(req, res) {
	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl => {
		const nodeNotAlreadyPresent = coin.networkNodes.indexOf(networkNodeUrl) == -1;
		const notCurrentNode = coin.currentNodeUrl !== networkNodeUrl;
		if (nodeNotAlreadyPresent && notCurrentNode) coin.networkNodes.push(networkNodeUrl);
	});

	res.json({ note: 'Bulk registration successful.' });
});

app.listen(port, function() {
	console.log(`Listening on port ${port}...`);
});
