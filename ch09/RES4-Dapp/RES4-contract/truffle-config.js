module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*" // Match any network id
    }
  },

  compilers: {
    solc: {
       version: "./node_modules/solc"
    }
  }
};
