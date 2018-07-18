var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const port = process.argv[2];
const rp = require('request-promise');

const nodeAddress = uuid().split('-').join('');

const coin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/blockchain', function (req, res) {
  res.send(coin);
});

app.post('/transaction', function(req, res) {
  const blockIndex = coin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
  res.json({ note: "transaction will be added in block ${blockIndex}."});
});

app.get('/mine', function(req, res) {
  const lastBlock = coin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];
  const currentBlockData = {
      transactions: coin.pendingTransactions,
      index: lastBlock['index'] + 1
  };
  const nonce = coin.proofOfWork(previousBlockHash,currentBlockData);
  const blockHash =  coin.hashBlock(previousBlockHash,currentBlockData,nonce);

  coin.createNewTransaction(12.5, "00", nodeAddress);

  const newBlock = coin.createNewBlock(nonce, previousBlockHash, blockHash);

  res.json({
    note: "New block mined successfully",
    block: newBlock
  });
});

// register a node and broadcast it to the network
app.post('/register-and-broadcast-node', function(req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (coin.networkNodes.indexOf(newNodeUrl) == -1) coin.networkNodes.push(newNodeUrl);

  const regNodesPromises = [];
  coin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/resgister-node',
      method: 'POST',
      body: { newNodeUrl: newNodeUrl },
      json: true
    };

      regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises)
  .then(data => {
    const bulkRegisterOptions = {
        uri: newNodeUrl + '/register-nodes-bulk',
        method: 'POST',
        body: { allNetworkNodes: [...coin.networkNodes, coin.currentNodeUrl] },
        json: true
    };

    return rp(bulkRegisterOptions);
  });
  then(data => {
    res.json({note: 'New node register with network successfully'});
  })
});

// register a node with the network
app.post('/register-node', function(req, res) {
  
});

//register multiple nodes at once
app.post('/register-nodes-bulk', function(req,res){

});

app.listen(port, function() {
  console.log('Listening on port ${port}');
});
