import { ethers } from 'ethers';

let provider = null;
let relayerWallet = null;

/**
 * 获取Provider实例
 */
export function getProvider() {
  if (!provider) {
    const rpcUrl = process.env.RPC_URL;
    
    if (!rpcUrl) {
      throw new Error('RPC_URL environment variable is required');
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log('🔗 Connected to RPC:', rpcUrl);
  }

  return provider;
}

/**
 * 获取中继器钱包实例
 */
export function getRelayerWallet() {
  if (!relayerWallet) {
    let privateKey = process.env.RELAYER_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('RELAYER_PRIVATE_KEY environment variable is required');
    }

    // 自动添加 0x 前缀（如果缺少）
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
      console.log('⚠️  私钥缺少0x前缀，已自动添加');
    }

    // 验证私钥格式
    if (privateKey.length !== 66) {
      throw new Error(`Invalid private key length: expected 66 characters (with 0x), got ${privateKey.length}`);
    }

    relayerWallet = new ethers.Wallet(privateKey);
    console.log('👛 Relayer wallet address:', relayerWallet.address);
  }

  return relayerWallet;
}

