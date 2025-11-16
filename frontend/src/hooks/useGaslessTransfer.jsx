import { useState } from 'react'
import { useSignTypedData, useAccount } from 'wagmi'
import { ethers } from 'ethers'

export function useGaslessTransfer() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)
  const [lastTransaction, setLastTransaction] = useState(null)
  
  const { address } = useAccount()
  const { signTypedDataAsync } = useSignTypedData()

  const transfer = async ({ from, to, amount, tokenAddress }) => {
    setIsPending(true)
    setError(null)
    setLastTransaction(null)

    try {
      // 1. 准备 EIP-712 结构化数据
      const domain = {
        name: 'GaslessCheckout',
        version: '1',
        chainId: 11155111, // Sepolia
        verifyingContract: tokenAddress
      }

      const types = {
        Transfer: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
      const value = {
        from,
        to,
        amount: ethers.parseUnits(amount.toString(), 18).toString(),
        deadline
      }

      // 2. 请求用户签名
      console.log('请求用户签名...')
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Transfer',
        message: value
      })

      // 3. 发送到中继服务
      console.log('发送到中继服务...')
      const relayApiUrl = import.meta.env.VITE_RELAY_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${relayApiUrl}/relay/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to,
          amount,
          signature,
          deadline,
          tokenAddress
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      // 4. 设置交易结果
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