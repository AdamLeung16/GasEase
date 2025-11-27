import { useQuery } from '@tanstack/react-query'
import { Server, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Alert } from './ui/Alert'
import '../styles/relayer.css'
import '../styles/index.css'

async function fetchRelayerStatus() {
  const response = await fetch('/api/status/relayer')
  if (!response.ok) throw new Error('Failed to fetch relayer status')
  return response.json()
}

export function RelayerStatus() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['relayer-status'],
    queryFn: fetchRelayerStatus,
    refetchInterval: 30000, // 30秒刷新一次
  })

  if (isLoading) {
    return (
      <div className="relayer-status-container">
        <div className="relayer-status-header">
          <Server className="relayer-status-icon status-loading" />
          <div className="relayer-status-info">
            <div className="relayer-status-title">Relayer Status</div>
            <div className="relayer-status-subtitle">checking...</div>
          </div>
          <Clock className="status-indicator status-warning pulse-animation" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relayer-status-container">
        <div className="relayer-status-header">
          <Server className="relayer-status-icon status-error" />
          <div className="relayer-status-info">
            <div className="relayer-status-title">Relayer Status</div>
            <div className="relayer-status-subtitle">failed</div>
          </div>
          <XCircle className="status-indicator status-error" />
        </div>
        <div className="error-alert">
          <Alert type="error" className="text-sm">
            Connection to relayer failed. Ensure the backend is running on port 3001.
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="relayer-status-container">
      <div className="relayer-status-header">
        <Server className="relayer-status-icon status-success" />
        <div className="relayer-status-info">
          <div className="relayer-status-title">Relayer Status</div>
          <div className="relayer-status-subtitle">connected</div>
        </div>
        <CheckCircle className="status-indicator status-success" />
      </div>

      <div className="relayer-details">
        <div className="detail-row">
          <span className="detail-label">Relayer Address:</span>
          <span className="detail-value detail-address">{data?.address?.slice(0, 10)}...</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Balance:</span>
          <span className="detail-value">{data?.balance} ETH</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Transactions completed:</span>
          <span className="detail-value">{data?.transactionCount}</span>
        </div>
      </div>
    </div>
  )
}