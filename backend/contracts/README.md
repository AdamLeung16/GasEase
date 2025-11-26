# 智能合约部署指南

## GaslessTransfer 合约

这个合约实现了通过EIP-712签名进行零Gas费转账的功能。

### 部署步骤

1. **安装依赖**
   ```bash
   npm install --save-dev @openzeppelin/contracts hardhat @nomicfoundation/hardhat-toolbox
   ```

2. **配置 Hardhat**
   创建 `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   
   module.exports = {
     solidity: "0.8.20",
     networks: {
       sepolia: {
         url: process.env.RPC_URL,
         accounts: [process.env.DEPLOYER_PRIVATE_KEY]
       }
     }
   };
   ```

3. **部署合约**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

4. **配置环境变量**
   在 `.env` 中添加：
   ```
   GASLESS_TRANSFER_CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ```

### 合约功能

- `transferWithSignature`: 通过签名执行单笔转账
- `batchTransferWithSignature`: 批量转账（可选）

### 安全特性

- ✅ EIP-712 签名验证
- ✅ Deadline 过期检查
- ✅ 签名重放攻击防护
- ✅ 使用 OpenZeppelin 安全库

### 注意事项

1. 用户需要先approve代币给GaslessTransfer合约
2. 合约需要足够的权限来transferFrom用户的代币
3. 建议在测试网上充分测试后再部署到主网

