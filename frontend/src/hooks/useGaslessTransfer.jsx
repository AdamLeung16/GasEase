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
      // 获取 GaslessTransfer 合约地址（从环境变量或配置）
      const gaslessTransferContractAddress = import.meta.env.VITE_GASLESS_TRANSFER_CONTRACT_ADDRESS
      
      if (!gaslessTransferContractAddress) {
        throw new Error('GaslessTransfer 合约地址未配置')
      }

      // 1. 获取代币信息（name, version, nonce）
      const provider = new ethers.BrowserProvider(window.ethereum)
      const tokenContract = new ethers.Contract(tokenAddress, [
        "function name() view returns (string)",
        "function nonces(address owner) view returns (uint256)"
      ], provider)

      const [tokenName, nonce] = await Promise.all([
        tokenContract.name(),
        tokenContract.nonces(owner)
      ])

      // 2. 准备 EIP-2612 Permit 结构化数据
      const domain = {
        name: tokenName,
        version: '2',
        chainId: 11155111, // Sepolia
        verifyingContract: tokenAddress  // 使用代币合约地址
      }

      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
      const valueData = {
        owner,
        spender: gaslessTransferContractAddress, // spender 是 GaslessTransfer 合约
        value: ethers.parseUnits(value.toString(), 6).toString(),
        nonce: nonce.toString(),
        deadline
      }

      // 3. 请求用户签名
      console.log('请求用户签名...')
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Permit',
        message: valueData
      })

      // 4. 发送到中继服务（调用我们的 GaslessTransfer 合约）
      console.log('发送到中继服务...')
      const relayApiUrl = import.meta.env.VITE_RELAY_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${relayApiUrl}/relay/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          owner,
          spender,
          value,
          signature,
          deadline,
          tokenAddress
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      // 5. 设置交易结果
      setLastTransaction({
        hash: result.transactionHash,
        status: 'success',
        timestamp: new Date().toISOString()
      })

      return result

    } catch (err) {
      console.error('Gasless transfer failed:', err)
      const errorMessage = err.message || '交易失败，请重试'
      setError(new Error(errorMessage))
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
    reset: () => {
      setError(null)
      setLastTransaction(null)
    }
  }
}