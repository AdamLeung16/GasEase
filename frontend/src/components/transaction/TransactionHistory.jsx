import { useAccount } from 'wagmi'
import { History, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react'
import '../../styles/transaction.css'

// 模拟交易历史数据
const MOCK_TRANSACTIONS = [
  {
    hash: '0x1234...5678',
    type: '发送',
    amount: '100 USDC',
    to: '0xabcd...efgh',
    status: 'success',
    timestamp: '2024-01-15 14:30',
  },
  {
    hash: '0x5678...9012',
    type: '发送',
    amount: '50 USDC',
    to: '0xefgh...ijkl',
    status: 'pending',
    timestamp: '2024-01-15 14:25',
  }
]

const statusIcons = {
  success: CheckCircle,
  pending: Clock,
  failed: XCircle,
}

const statusClasses = {
  success: 'status-success',
  pending: 'status-pending',
  failed: 'status-failed',
}

export function TransactionHistory() {
  const { address } = useAccount()
  const transactions = MOCK_TRANSACTIONS // 实际项目中从 API 获取

  if (!address) return null

  return (
    <div className="transaction-history-container">
      <div className="transaction-header">
        <History className="transaction-header-icon" />
        <h3 className="transaction-title">Transaction History</h3>
      </div>

      <div className="transaction-list">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <History className="empty-state-icon" />
            <p className="empty-state-text">暂无交易记录</p>
          </div>
        ) : (
          transactions.map((tx, index) => {
            const StatusIcon = statusIcons[tx.status]
            const statusClass = statusClasses[tx.status]
            
            return (
              <div key={index} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-header-row">
                    <span className="transaction-type">{tx.type}</span>
                    <StatusIcon className={`status-icon ${statusClass}`} />
                  </div>
                  <div className="transaction-address">
                    至: {tx.to}
                  </div>
                  <div className="transaction-amount">{tx.amount}</div>
                </div>
                <div className="transaction-meta">
                  <div className="transaction-time">{tx.timestamp}</div>
                  <a 
                    href="#" 
                    className="transaction-link"
                  >
                    <ExternalLink className="transaction-link-icon" />
                    查看
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}