
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

export default {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.RPC_URL,
      accounts: [process.env.RELAYER_PRIVATE_KEY]
    }
  }
};