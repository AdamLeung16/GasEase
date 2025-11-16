import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import '../../styles/alert.css'

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
}

const alertTypes = {
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error',
}

export function Alert({ type = 'info', title, children, className = '' }) {
  const Icon = icons[type]
  const alertClass = alertTypes[type]
  
  return (
    <div className={`alert-container ${alertClass} ${className}`}>
      <Icon className="alert-icon" />
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{children}</div>
      </div>
    </div>
  )
}