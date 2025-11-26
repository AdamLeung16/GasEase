import { getRelayerInfo } from '../services/relayerService.js';

/**
 * 获取中继器状态
 */
export async function getRelayerStatus(req, res) {
  try {
    const relayerInfo = await getRelayerInfo();
    
    res.json({
      address: relayerInfo.address,
      balance: relayerInfo.balance,
      transactionCount: relayerInfo.transactionCount
    });
  } catch (error) {
    console.error('❌ Status error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get relayer status'
    });
  }
}

