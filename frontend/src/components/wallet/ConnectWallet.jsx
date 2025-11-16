import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut, User } from 'lucide-react'
import '../../styles/connector.css'
import '../../styles/index.css'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div className="wallet-container">
        <div className="wallet-info">
          <User className="wallet-icon" />
          <span className="wallet-address">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        <button onClick={() => disconnect()} className="disconnect-btn" >
          <LogOut className="wallet-icon" />
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="connectors-container">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="connect-btn"
        >
          <Wallet className="wallet-icon" />
          Connect to {connector.name}
          {/* {!connector.ready && ' (未安装)'} */}
        </button>
      ))}
    </div>
  )
}