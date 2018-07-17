const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

bitcoin.createNewBlock(1234, '9UFYUSAIHNGFUS9HFS', 'SADH82U344234');
bitcoin.createNewBlock(4653, 'FDSGT5636345DG', 'DSRT4353ERT345');
bitcoin.createNewBlock(7563, '45RGFDS435GFE', '345QTAERTGEA');
bitcoin.createNewBlock(1583, '345GFDG345WEA4', 'AWE4Q3RA43AR');


console.log(bitcoin);
