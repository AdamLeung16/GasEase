import { verifySignature_user2contract, verifySignature_user2target, executeTransfer } from '../services/transferService.js';

/**
 * 中继转账端点
 * 接收用户签名，验证后代付Gas执行转账
 */
export async function relayTransfer(req, res) {
  try {
    const { owner, recipient, value, signature_user2contract, signature_user2target, deadline, tokenAddress } = req.body;

    // 验证必需字段
    if (!owner || !recipient || !value || !signature_user2contract || !signature_user2target || !deadline || !tokenAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: owner, recipient, value, signature_user2contract, signature_user2target, deadline, tokenAddress'
      });
    }

    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(owner) || !/^0x[a-fA-F0-9]{40}$/.test(recipient) || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    // 验证deadline（签名是否过期）
    const currentTime = Math.floor(Date.now() / 1000);
    if (parseInt(deadline) < currentTime) {
      return res.status(400).json({
        success: false,
        error: 'Signature expired'
      });
    }

    console.log(`📝 Processing transfer: ${owner} -> ${recipient}, Value: ${value}`);

    // 验证签名
    const isValid1 = await verifySignature_user2contract({
      owner,
      recipient,
      value,
      deadline,
      tokenAddress,
      signature_user2contract
    });

    if (!isValid1) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature_user2contract'
      });
    }

    const isValid2 = await verifySignature_user2target({
      owner,
      recipient,
      value,
      deadline,
      tokenAddress,
      signature_user2target
    });

    if (!isValid2) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature_user2target'
      });
    }

    console.log('✅ Signature verified');
    // console.log(signature)
    // 执行转账
    const transactionHash = await executeTransfer({
      owner,
      recipient,
      value,
      deadline,
      tokenAddress,
      signature_user2contract,
      signature_user2target
    });

    console.log(`✅ Transfer executed: ${transactionHash}`);

    res.json({
      success: true,
      transactionHash
    });

  } catch (error) {
    console.error('❌ Transfer error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute transfer'
    });
  }
}