import { useAccount } from 'wagmi'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { DollarSign, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import '../../styles/tokenbalance.css'

export function TokenBalances() {
  const { address, chain } = useAccount()
  
  // 查询多种代币余额
  const usdc = useTokenBalance('USDC')

  if (!address) {
    return (
      <div className="token-balances-container wallet-not-connected-balance">
        <div className="wallet-not-connected-icon">
          <DollarSign />
        </div>
        <p className="wallet-not-connected-text">连接钱包查看余额</p>
      </div>
    )
  }

  // 检查当前网络是否支持
  const isNetworkSupported = usdc.isSupported

  if (!isNetworkSupported) {
    return (
      <div className="token-balances-container">
        <div className="network-unsupported">
          <AlertCircle className="network-unsupported-icon" />
          <div>
            <div className="network-unsupported-title">不支持的网络</div>
            <div className="network-unsupported-subtitle">请在 Sepolia 或 Polygon Amoy 测试网使用</div>
          </div>
        </div>
      </div>
    )
  }

  const TokenBalanceItem = ({ symbol, balanceHook, isPrimary = false }) => (
    <div className={`balance-item ${isPrimary ? 'balance-item-primary' : ''}`}>
      <div className="balance-item-left">
        <div className={`token-icon ${isPrimary ? 'token-icon-primary' : 'token-icon-default'}`}>
          <DollarSign />
        </div>
        <div className="token-info">
          <div className="token-symbol">{symbol}</div>
          <div className="token-label">
            {balanceHook.isLoading ? '查询中...' : '余额'}
          </div>
        </div>
      </div>
      
      <div className="balance-item-right">
        {balanceHook.isLoading ? (
          <LoadingSpinner size="sm" />
        ) : balanceHook.error ? (
          <div className="error-text">查询失败</div>
        ) : (
          <>
            <div className="balance-amount">
              {parseFloat(balanceHook.formattedBalance).toLocaleString()}
            </div>
            <div className="balance-unit">{symbol}</div>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="token-balances-container">
      <div className="balance-header">
        <h3 className="balance-title">我的余额</h3>
        <div className="network-indicator">
          <div className="network-dot"></div>
          {chain?.name || '未知网络'}
        </div>
      </div>

      <div className="balance-list">
        <TokenBalanceItem 
          symbol="USDC" 
          balanceHook={usdc} 
          isPrimary={true}
        />
        
      </div>

      {/* 网络提示 */}
      <div className="network-tip">
        <div className="tip-text">
          💡 提示: 在测试网使用，USDC 为测试代币
        </div>
      </div>
    </div>
  )
}