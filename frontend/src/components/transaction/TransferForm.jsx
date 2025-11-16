import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Send, Zap } from 'lucide-react'
import { useGaslessTransfer } from '../../hooks/useGaslessTransfer'
import { Alert } from '../ui/Alert'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import '../../styles/transaction.css'

const TOKENS = [
//   { 
//     symbol: 'GUSD', 
//     name: 'Gasless USD', 
//     address: import.meta.env.VITE_GUSD_TOKEN_ADDRESS || '0xYourGUSDTokenAddress' 
//   },
  { 
    symbol: 'USDC', 
    name: 'USD Coin', 
    address: import.meta.env.VITE_USDC_TOKEN_ADDRESS || '0xYourUSDCTokenAddress' 
  },
//   { 
//     symbol: 'DAI', 
//     name: 'Dai Stablecoin', 
//     address: import.meta.env.VITE_DAI_TOKEN_ADDRESS || '0xYourDAITokenAddress' 
//   },
]

export function TransferForm() {
  const { address, chain } = useAccount()
  const { transfer, isPending, error, lastTransaction } = useGaslessTransfer()
  
  const [formData, setFormData] = useState({
    to: '',
    amount: '',
    token: TOKENS[0].symbol
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!address) return
    
    const token = TOKENS.find(t => t.symbol === formData.token)
    
    try {
      await transfer({
        from: address,
        to: formData.to,
        amount: formData.amount,
        tokenAddress: token.address
      })
      
      // 成功后可清空表单
      setFormData(prev => ({ ...prev, to: '', amount: '' }))
    } catch (err) {
      // 错误由 hook 处理
      console.error('Transfer failed:', err)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!address) {
    return (
      <div className="wallet-not-connected">
        <div className="wallet-not-connected-icon">
          <Send />
        </div>
        <p className="wallet-not-connected-text">请先连接钱包开始使用 Gasless 转账</p>
      </div>
    )
  }

  return (
    <div className="transfer-form-container">
      <div className="transfer-header">
        <div className="transfer-icon-container">
          <Zap className="transfer-icon" />
        </div>
        <div>
          <h2 className="transfer-title">Gasless transfer</h2>
          {/* <p className="transfer-subtitle">零 Gas 费体验，赞助商为您支付费用</p> */}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="transfer-form">
        {/* 收款地址 */}
        <div className="form-group">
          <label className="form-label">
            Recipient Address
          </label>
          <input
            type="text"
            value={formData.to}
            onChange={(e) => handleChange('to', e.target.value)}
            placeholder="0x742d35Cc6634C0532925a3b8D..."
            className="form-input"
            required
            pattern="^0x[a-fA-F0-9]{40}$"
          />
        </div>

        {/* 金额和代币选择 */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0.00"
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Token
            </label>
            <select
              value={formData.token}
              onChange={(e) => handleChange('token', e.target.value)}
              className="form-input"
            >
              {TOKENS.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <Alert type="error" title="交易失败">
            {error.message}
          </Alert>
        )}

        {/* 成功提示 */}
        {lastTransaction?.status === 'success' && (
          <Alert type="success" title="交易成功">
            交易已确认！哈希: 
            <a 
              href={`${chain?.blockExplorers?.default?.url}/tx/${lastTransaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline ml-1"
            >
              {lastTransaction.hash.slice(0, 10)}...
            </a>
          </Alert>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={isPending || !formData.to || !formData.amount}
          className="submit-button"
        >
          {isPending ? (
            <>
              <LoadingSpinner size="sm" />
              Sending...
            </>
          ) : (
            <>
              <Send className="transfer-icon" />
                 Send
            </>
          )}
        </button>

        {/* 功能提示 */}
        {/* <div className="feature-tips">
          <div className="tip-item">
            <Zap className="tip-icon tip-icon-free" />
            <span>完全免费 - 赞助商支付所有 Gas 费用</span>
          </div>
          <div className="tip-item">
            <Send className="tip-icon tip-icon-gas" />
            <span>只需签名，无需持有 {chain?.nativeCurrency?.symbol}</span>
          </div>
        </div> */}
      </form>
    </div>
  )
}