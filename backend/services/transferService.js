import { ethers } from 'ethers';
import { getProvider, getRelayerWallet } from './blockchainService.js';

/**
 * 验证 EIP-2612 permit 签名（token domain）
 */
export async function verifySignature_user2contract({ owner, recipient, value, deadline, tokenAddress, signature_user2contract }) {
  try {
    const provider = getProvider();
    const gaslessContractAddress = process.env.GASLESS_TRANSFER_CONTRACT_ADDRESS;
    if (!gaslessContractAddress) {
      throw new Error('GASLESS_TRANSFER_CONTRACT_ADDRESS environment variable is not set');
    }

    // token contract minimal ABI
    const tokenContract = new ethers.Contract(tokenAddress, [
      "function name() view returns (string)",
      "function nonces(address owner) view returns (uint256)"
    ], provider);

    const nonce = await tokenContract.nonces(owner);
    const tokenName = await tokenContract.name();
    const chainId = Number((await provider.getNetwork()).chainId);

    const domain = {
      name: tokenName,
      version: "2", // 根据 token 实际 version 调整
      chainId,
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

    // 注意 decimals 需与 token 一致，这里默认 6（如 USDC）
    const valueUnits = ethers.parseUnits(value.toString(), 6).toString();

    const valueData = {
      owner,
      spender: gaslessContractAddress,
      value: valueUnits,
      nonce: nonce.toString(),
      deadline: deadline.toString()
    };

    const recoveredAddress = ethers.verifyTypedData(domain, types, valueData, signature_user2contract);
    return recoveredAddress.toLowerCase() === owner.toLowerCase();
  } catch (error) {
    console.error('Signature_user2contract verification error:', error);
    return false;
  }
}

/**
 * 验证 Transfer 授权签名（GaslessTransfer 合约 domain）
 */
export async function verifySignature_user2target({ owner, recipient, value, deadline, tokenAddress, signature_user2target }) {
  try {
    const provider = getProvider();
    const gaslessContractAddress = process.env.GASLESS_TRANSFER_CONTRACT_ADDRESS;
    if (!gaslessContractAddress) {
      throw new Error('GASLESS_TRANSFER_CONTRACT_ADDRESS environment variable is not set');
    }

    // 获取合约 nonce（合约自己的防重放 nonce）
    const gaslessContract = new ethers.Contract(gaslessContractAddress, [
      "function nonces(address owner) view returns (uint256)",
      "function DOMAIN_SEPARATOR() view returns (bytes32)"
    ], provider);

    const nonce = await gaslessContract.nonces(owner);
    const chainId = Number((await provider.getNetwork()).chainId);

    const domain = {
      name: "GaslessTransfer",
      version: "1",
      chainId,
      verifyingContract: gaslessContractAddress
    };

    const types = {
      Transfer: [
        { name: 'owner', type: 'address' },
        { name: 'recipient', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    const valueUnits = ethers.parseUnits(value.toString(), 6).toString();

    const valueData = {
      owner,
      recipient,
      value: valueUnits,
      nonce: nonce.toString(),
      deadline: deadline.toString()
    };

    const recoveredAddress = ethers.verifyTypedData(domain, types, valueData, signature_user2target);
    return recoveredAddress.toLowerCase() === owner.toLowerCase();
  } catch (error) {
    console.error('Signature_user2target verification error:', error);
    return false;
  }
}

/**
 * 执行 EIP-2612 permit 转账（调用合约）
 */
export async function executeTransfer({ owner, recipient, value, deadline, tokenAddress, signature_user2contract, signature_user2target }) {
  const provider = getProvider();
  const relayerWallet = getRelayerWallet();
  const signer = relayerWallet.connect(provider);

  try {
    const gaslessContractAddress = process.env.GASLESS_TRANSFER_CONTRACT_ADDRESS;
    if (!gaslessContractAddress) throw new Error('GASLESS_TRANSFER_CONTRACT_ADDRESS environment variable is not set');

    // 拆出 v,r,s
    const sig_u2c = ethers.Signature.from(signature_user2contract);
    const sig_u2t = ethers.Signature.from(signature_user2target);

    const contractABI = [
      "function executeGaslessTransfer(address token, address owner, address recipient, uint256 value, uint256 deadline, uint8 v_u2c, bytes32 r_u2c, bytes32 s_u2c, uint8 v_u2t, bytes32 r_u2t, bytes32 s_u2t) external"
    ];

    const gaslessContract = new ethers.Contract(gaslessContractAddress, contractABI, signer);

    const valueWei = ethers.parseUnits(value.toString(), 6);

    const tx = await gaslessContract.executeGaslessTransfer(
      tokenAddress,
      owner,
      recipient,
      valueWei,
      deadline,
      sig_u2c.v,
      sig_u2c.r,
      sig_u2c.s,
      sig_u2t.v,
      sig_u2t.r,
      sig_u2t.s,
      { gasLimit: 300000 }
    );

    console.log(`⏳ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    return tx.hash;
  } catch (error) {
    console.error('Transfer execution error:', error);
    if (error.message.includes('call revert') || error.message.includes('execution reverted')) {
      throw new Error('Contract execution failed. Please ensure the GaslessTransfer contract is deployed and configured correctly.');
    }
    throw new Error(`Failed to execute transfer: ${error.message}`);
  }
}
