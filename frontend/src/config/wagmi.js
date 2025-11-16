import { createConfig, http } from 'wagmi'
import { sepolia, polygonAmoy } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia, polygonAmoy],
  connectors: [
    // injected(),
    metaMask(),
    // walletConnect({
    //   projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    // }),
  ],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/'),
    [polygonAmoy.id]: http(import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-amoy.infura.io/v3/'),
  },
  ssr: false,
})