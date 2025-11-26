import { ethers } from 'ethers';
import { getProvider, getRelayerWallet } from './blockchainService.js';

/**
 * 验证 EIP-2612 permit 签名
 */
export async function verifySignature({ owner, spender, value, deadline, tokenAddress, signature }) {
  try {
    const provider = getProvider();
    const gaslessContractAddress = process.env.GASLESS_TRANSFER_CONTRACT_ADDRESS;
    if (!gaslessContractAddress) {
      throw new Error('GASLESS_TRANSFER_CONTRACT_ADDRESS environment variable is not set');
    }
    // 获取代币合约的域分隔符
    const tokenContract = new ethers.Contract(tokenAddress, [
      "function name() view returns (string)",
        "function nonces(address owner) view returns (uint256)"
      ], provider);
    
    // 获取nonce
    const nonce = await tokenContract.nonces(owner);
    // 构建 EIP-2612 Permit 类型数据
    const domain = {
      name: await tokenContract.name(),
      version: "2",
      chainId: Number((await provider.getNetwork()).chainId),
      verifyingContract: tokenAddress
    };
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    const valueData = {
      owner,
      spender: gaslessContractAddress,
      value: ethers.parseUnits(value.toString(), 6).toString(),
      nonce: nonce.toString(),
      deadline: deadline.toString()
    };
    // console.log(domain)
    // console.log(types)
    console.log(valueData)
    // 验证签名
    const recoveredAddress = ethers.verifyTypedData(domain, types, valueData, signature);
    // console.log(recoveredAddress);
    // console.log(owner)
    // 检查恢复的地址是否与owner地址匹配（忽略大小写）
    return recoveredAddress.toLowerCase() === owner.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * 执行 EIP-2612 permit 转账
 */
export async function executeTransfer({ owner, spender, value, deadline, tokenAddress, signature }) {
  const provider = getProvider();
  const relayerWallet = getRelayerWallet();
  const signer = relayerWallet.connect(provider);

  try {
    // 获取GaslessTransfer合约地址
    const gaslessContractAddress = process.env.GASLESS_TRANSFER_CONTRACT_ADDRESS;
    if (!gaslessContractAddress) {
      throw new Error('GASLESS_TRANSFER_CONTRACT_ADDRESS environment variable is not set');
    }

    // 从签名中提取 v, r, s
    const sig = ethers.Signature.from(signature);
    
    // GaslessTransfer合约ABI - 更新为新的函数签名
    const contractABI = [
      "function executeGaslessTransfer(address token, address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external"
    ];

    const gaslessContract = new ethers.Contract(gaslessContractAddress, contractABI, signer);
    
    const valueWei = ethers.parseUnits(value.toString(), 6);
    
    console.log(owner);
    console.log(spender);
    // 调用合约的executeGaslessTransfer函数
    const tx = await gaslessContract.executeGaslessTransfer(
      tokenAddress,  // 代币合约地址
      owner,         // 代币所有者
      spender,       // 接收方
      valueWei,      // 金额
      deadline,      // 过期时间
      sig.v,         // v值
      sig.r,         // r值
      sig.s,         // s值
      {
        gasLimit: 300000 // 设置gas限制
      }
    );
    
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    return tx.hash;
  } catch (error) {
    console.error('Transfer execution error:', error);
    
    // 如果是合约不存在或函数不存在的错误，提供更友好的提示
    if (error.message.includes('call revert') || error.message.includes('execution reverted')) {
      throw new Error('Contract execution failed. Please ensure the GaslessTransfer contract is deployed and configured correctly.');
    }
    
    throw new Error(`Failed to execute transfer: ${error.message}`);
  }
}