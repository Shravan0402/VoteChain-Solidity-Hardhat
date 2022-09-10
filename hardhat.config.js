require("@nomicfoundation/hardhat-toolbox");
require('hardhat-deploy');
require('dotenv').config()
RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
PRIVATE_RINKEBY_KEY = process.env.PRIVATE_RINKEBY_KEY
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks:{
    hardhat:{
      chainId: 31337,
    },
    rinkeby:{
      chainId:4,
      url: RINKEBY_RPC_URL,
      accounts:[PRIVATE_RINKEBY_KEY]
    }
  },
};
