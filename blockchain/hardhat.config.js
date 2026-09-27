require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: RPC_URL,
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    },
    polygon: {
      url: RPC_URL,
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    }
  }
};
