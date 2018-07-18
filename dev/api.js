var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');

const coin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/blockchain', function (req, res) {
  res.send(coin);
});

app.post('/transaction', function(req, res) {
  console.log(req.body);
  res.send('The amount of the transaction is ${req.body.amount} coins.');
});

app.get('/mine', function(req, res) {

});

app.listen(3000, function() {
  console.log('Listening on port 3000...');
});
