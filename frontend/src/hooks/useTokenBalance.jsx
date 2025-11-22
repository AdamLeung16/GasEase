import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { ethers } from 'ethers'

// ERC-20 标准 ABI（只需要 balanceOf 函数）
const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
]

// 测试网 USDC 地址（需要根据实际部署的合约更新）
const TOKEN_ADDRESSES = {
  sepolia: {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Sepolia USDC
  },
  polygonAmoy: {
    USDC: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582' // Polygon Amoy USDC
  }
}

export function useTokenBalance(tokenSymbol = 'USDC') {
  const { address, chain } = useAccount()
  const publicClient = usePublicClient()
  
  const [balance, setBalance] = useState(null)
  const [decimals, setDecimals] = useState(6) // USDC 默认6位小数
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchBalance() {
      if (!address || !chain) {
        setBalance(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // 获取对应网络的代币地址
        const chainId = chain.id
        const tokenAddress = getTokenAddress(chainId, tokenSymbol)
        
        if (!tokenAddress) {
          throw new Error(`网络 ${chain.name} 不支持 ${tokenSymbol}`)
        }

        // 创建合约实例
        const provider = new ethers.BrowserProvider(window.ethereum)
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

        // 并行获取余额和小数位
        const [balanceResult, decimalsResult, symbolResult] = await Promise.all([
          tokenContract.balanceOf(address),
          tokenContract.decimals(),
          tokenContract.symbol()
        ])

        setBalance(balanceResult)
        setDecimals(decimalsResult)
        
        console.log(`余额查询成功: ${ethers.formatUnits(balanceResult, decimalsResult)} ${symbolResult}`)

      } catch (err) {
        console.error('获取余额失败:', err)
        setError(err.message)
        setBalance(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()

    // 监听账户变化和网络变化
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', fetchBalance)
      window.ethereum.on('chainChanged', fetchBalance)
      
      return () => {
        window.ethereum.removeListener('accountsChanged', fetchBalance)
        window.ethereum.removeListener('chainChanged', fetchBalance)
      }
    }
  }, [address, chain, tokenSymbol])

  // 获取格式化的余额
  const formattedBalance = balance ? ethers.formatUnits(balance, decimals) : '0'

  return {
    balance,
    formattedBalance,
    decimals,
    isLoading,
    error,
    isSupported: !!getTokenAddress(chain?.id, tokenSymbol)
  }
}

// 根据链ID和代币符号获取地址
function getTokenAddress(chainId, tokenSymbol) {
  const chainMap = {
    11155111: 'sepolia',    // Sepolia
    80002: 'polygonAmoy'    // Polygon Amoy
  }
  
  const chainName = chainMap[chainId]
  return chainName ? TOKEN_ADDRESSES[chainName]?.[tokenSymbol] : null
}