import { useAccount, useSwitchChain } from 'wagmi'
import { sepolia, polygonAmoy } from 'wagmi/chains'
import '../../styles/netswitcher.css'

const SUPPORTED_CHAINS = [
  { id: sepolia.id, name: 'Sepolia', testnet: true },
  { id: polygonAmoy.id, name: 'Polygon Amoy', testnet: true },
]

export function NetworkSwitcher() {
  const { chain } = useAccount()
  const { switchChain } = useSwitchChain()

  if (!chain) return null

  const isSupported = SUPPORTED_CHAINS.some(c => c.id === chain.id)

  return (
    <div className="network-container">
      <div className={`network-status ${
        isSupported 
          ? 'network-status-supported' 
          : 'network-status-unsupported'
      }`}>
        {chain.name} {!isSupported && '(不支持)'}
      </div>
      
      <select
        value={chain.id}
        onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
        className="network-select"
      >
        {SUPPORTED_CHAINS.map((network) => (
          <option key={network.id} value={network.id}>
            {network.name}
          </option>
        ))}
      </select>
    </div>
  )
}