import { useState } from 'react'
import { useSignTypedData, useAccount } from 'wagmi'
import { ethers } from 'ethers'

export function useGaslessTransfer() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)
  const [lastTransaction, setLastTransaction] = useState(null)
  
  const { address } = useAccount()
  const { signTypedDataAsync } = useSignTypedData()

  const transfer = async ({ owner, spender, value, tokenAddress }) => {
    setIsPending(true)
    setError(null)
    setLastTransaction(null)

    try {
      const gaslessTransferContractAddress = import.meta.env.VITE_GASLESS_TRANSFER_CONTRACT_ADDRESS
      if (!gaslessTransferContractAddress) throw new Error('GaslessTransfer 合约地址未配置')

      const provider = new ethers.BrowserProvider(window.ethereum)
      const tokenContract = new ethers.Contract(tokenAddress, [
        "function name() view returns (string)",
        "function nonces(address owner) view returns (uint256)"
      ], provider)

      // 1) token 的 name 和 token.nonces(owner)
      const [tokenName, tokenNonce] = await Promise.all([
        tokenContract.name(),
        tokenContract.nonces(owner)
      ])

      // 2) GaslessTransfer 合约的 nonce（合约自己的防重放 nonce）
      const gaslessContract = new ethers.Contract(gaslessTransferContractAddress, [
        "function nonces(address owner) view returns (uint256)",
        "function DOMAIN_SEPARATOR() view returns (bytes32)"
      ], provider)
      const gaslessNonce = await gaslessContract.nonces(owner)

      // 3) 构造 token permit（EIP-2612）签名数据（domain = token domain）
      const chainId = (await provider.getNetwork()).chainId
      const permitDomain = {
        name: tokenName,
        version: '2', // 如果代币实际 version 不是 '2'，请改成正确值
        chainId,
        verifyingContract: tokenAddress
      }
      const permitTypes = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600 // 1小时有效期
      const decimals = 6 // 注意：根据代币实际 decimals 调整
      const valueUnits = ethers.parseUnits(value.toString(), decimals).toString()

      const permitMessage = {
        owner,
        spender: gaslessTransferContractAddress,
        value: valueUnits,
        nonce: tokenNonce.toString(),
        deadline: deadline.toString()
      }

      // 4) 构造 transfer authorization（合约 domain）
      const transferDomain = {
        name: "GaslessTransfer",
        version: "1",
        chainId,
        verifyingContract: gaslessTransferContractAddress
      }
      const transferTypes = {
        Transfer: [
          { name: 'owner', type: 'address' },
          { name: 'recipient', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }

      const transferMessage = {
        owner,
        recipient:spender,
        value: valueUnits,
        nonce: gaslessNonce.toString(),
        deadline: deadline.toString()
      }

      // 5) 请求用户签名（两次）
      console.log('请求用户签名（permit）...')
      const signature_user2contract = await signTypedDataAsync({
        domain: permitDomain,
        types: permitTypes,
        primaryType: 'Permit',
        message: permitMessage
      })

      console.log('请求用户签名（transfer authorization）...')
      const signature_user2target = await signTypedDataAsync({
        domain: transferDomain,
        types: transferTypes,
        primaryType: 'Transfer',
        message: transferMessage
      })

      // 6) 发送到中继服务
      const relayApiUrl = import.meta.env.VITE_RELAY_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${relayApiUrl}/relay/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          recipient:spender,
          value,
          signature_user2contract,
          signature_user2target,
          deadline,
          tokenAddress
        })
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      setLastTransaction({
        hash: result.transactionHash,
        status: 'success',
        timestamp: new Date().toISOString()
      })

      return result
    } catch (err) {
      console.error('Gasless transfer failed:', err)
      setError(new Error(err.message || '交易失败'))
      throw err
    } finally {
      setIsPending(false)
    }
  }

  return {
    transfer,
    isPending,
    error,
    lastTransaction,
    reset: () => { setError(null); setLastTransaction(null) }
  }
}
