import { useAccount } from 'wagmi'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { DollarSign, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import '../../styles/tokenbalance.css'

export function TokenBalances() {
  const { address, chain } = useAccount()
  
  // 查询多种代币余额
  const usdc = useTokenBalance('USDC')
  const eth = useTokenBalance('ETH')

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
            <div className="network-unsupported-title">Unsupported network</div>
            <div className="network-unsupported-subtitle">Please use in Sepolia Testnet</div>
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
            {balanceHook.isLoading ? 'Searching...' : 'Balance'}
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
        <h3 className="balance-title">My Balance</h3>
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
        <TokenBalanceItem 
          symbol="ETH" 
          balanceHook={eth} 
          isPrimary={true}
        />
      </div>

      {/* 网络提示 */}
      <div className="network-tip">
        <div className="tip-text">
          💡 Tips: You can get test USDC from {''}
          <a 
            href="https://faucet.circle.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="tip-link"
          >
            Circle Faucet
          </a>.
        </div>
      </div>
    </div>
  )
}