import '../../styles/loadingspinner.css'

export function LoadingSpinner({ size = 'md', color = 'primary', variant = 'solid' }) {
  const sizeClass = `loading-spinner-${size}`
  const colorClass = `loading-spinner-${color}`
  const variantClass = `loading-spinner-${variant}`
  
  return (
    <div className={`loading-spinner ${sizeClass} ${colorClass} ${variantClass}`} />
  )
}