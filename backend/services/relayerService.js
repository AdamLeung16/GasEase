import { ethers } from 'ethers';
import { getProvider, getRelayerWallet } from './blockchainService.js';

/**
 * 获取中继器信息
 */
export async function getRelayerInfo() {
  const provider = getProvider();
  const relayerWallet = getRelayerWallet();
  const address = relayerWallet.address;

  try {
    // 获取余额
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);
    
    // 获取交易数量（nonce）
    const transactionCount = await provider.getTransactionCount(address, 'pending');

    return {
      address,
      balance: parseFloat(balanceInEth).toFixed(4),
      transactionCount
    };
  } catch (error) {
    console.error('Failed to get relayer info:', error);
    throw error;
  }
}

