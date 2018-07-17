const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

bitcoin.createNewBlock(216472,'ASDSERW32234','REWR12342FDWSF');

bitcoin.createNewTransaction(100, 'IVANW4322RWR', 'OVENQQ234RQWERF');

bitcoin.createNewBlock(123432,'FWS324RFSWF2','DFSA3242RRDFA');

bitcoin.createNewTransaction(130, 'IVANW4322RWR', 'OVENQQ234RQWERF');
bitcoin.createNewTransaction(340, 'IVANW4322RWR', 'OVENQQ234RQWERF');
bitcoin.createNewTransaction(20, 'IVANW4322RWR', 'OVENQQ234RQWERF');

bitcoin.createNewBlock(53452,'sfgfdsg','TGWET35');

console.log(bitcoin.chain[2]);
