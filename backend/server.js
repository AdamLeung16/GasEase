import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { relayTransfer } from './routes/relay.js';
import { getRelayerStatus } from './routes/status.js';
import { getProvider, getRelayerWallet } from './services/blockchainService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.post('/api/relay/transfer', relayTransfer);
app.get('/api/status/relayer', getRelayerStatus);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 GasEase Backend Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  
  // 初始化并验证配置
  try {
    console.log('🔧 初始化配置...');
    
    // 初始化Provider（会输出RPC连接信息）
    const provider = getProvider();
    
    // 初始化Relayer钱包（会输出钱包地址）
    const relayerWallet = getRelayerWallet();
    
    // 检查Relayer余额
    try {
      const balance = await provider.getBalance(relayerWallet.address);
      const balanceInEth = parseFloat(ethers.formatEther(balance));
      console.log(`💰 Relayer balance: ${balanceInEth.toFixed(4)} ETH`);
      
      if (balanceInEth < 0.01) {
        console.log('⚠️  警告: 余额较低，可能无法支付Gas费');
        console.log(`   建议: 从水龙头获取测试ETH到地址 ${relayerWallet.address}`);
      } else {
        console.log('✅ 余额充足，可以处理交易');
      }
    } catch (error) {
      console.log('⚠️  无法查询余额:', error.message);
    }
    
    console.log('');
    console.log('✅ 配置验证完成，服务器就绪！');
  } catch (error) {
    console.error('❌ 配置错误:', error.message);
    console.error('   请检查 .env 文件中的 RPC_URL 和 RELAYER_PRIVATE_KEY');
    console.error('   服务器已启动，但某些功能可能无法正常工作');
  }
});

