const HDWalletProvider = require('truffle-hdwallet-provider');
const beneficiary='';
const url='';
const devSolc = './node_modules/solc';
const prdSolc = '0.5.8';

module.exports = {
  networks: {
    ropsten: {
      provider: () => new HDWalletProvider(beneficiary, url),
      network_id: 3,       
      gas: 5000000,       
      skipDryRun: false
    },
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*" // Match any network id
    }
  },

  compilers: {
    solc: {
       version: devSolc
    }
  }
};