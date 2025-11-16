import { useAccount } from 'wagmi'
import { ConnectWallet } from './components/wallet/ConnectWallet'
import { NetworkSwitcher } from './components/wallet/NetworkSwitcher'
import { TransferForm } from './components/transaction/TransferForm'
import { TransactionHistory } from './components/transaction/TransactionHistory'
import { RelayerStatus } from './components/RelayerStatus'
import './styles/index.css'

function App() {
  const { isConnected } = useAccount()

  return (
    <div className="app-container">
        <nav className="nav-container">
        <div className="nav-inner">
          <div className="nav-left">
            <div className="nav-logo" />
            <div className='nav-title-center'>
              <h1 className="nav-main-title">GasEase</h1>
            </div>
          </div>
          
          <div className="nav-right">
            <NetworkSwitcher />
            <ConnectWallet />
          </div>
        </div>
      </nav>
      {/* 主内容区 */}
      <main className="main-container">
        {!isConnected ? (
          // 未连接钱包的欢迎页面
          <div className="welcome-container">
            <img src="../../public/vite.png" className='logo'></img>
            {/* <h2 className="welcome-title">
              GasEase
            </h2> */}
            <p className="welcome-description">
              Trade Gas-Free. Pay Like Always.
            </p>
            <div className="wallet-connect-card">
              <ConnectWallet />
            </div>
            
            {/* 功能特性展示 */}
            <div className="features-grid">
              {[
                { icon: '🚀', title: 'Completely Free', desc: 'Gas fees are fully sponsored' },
                { icon: '⚡', title: 'Instant Transactions', desc: 'Powered by streamlined meta-transactions' },
                { icon: '🔒', title: 'Secure & Reliable', desc: 'Built on EIP-2612 & EIP-2771 standards' }
              ].map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // 已连接钱包的主界面
          <div className="connected-container">
            <div className="connected-grid">
              {/* 左侧主功能区 */}
              <div className="main-section">
                <TransferForm />
                
                {/* 使用说明 */}
                <div className="instruction-card">
                  <h3 className="instruction-title">How to use?</h3>
                  <div className="instruction-steps">
                    <div className="instruction-step">
                      <div className="step-number">1</div>
                      <p>连接您的钱包（支持 MetaMask、WalletConnect 等）</p>
                    </div>
                    <div className="instruction-step">
                      <div className="step-number">2</div>
                      <p>输入收款地址、金额并选择代币</p>
                    </div>
                    <div className="instruction-step">
                      <div className="step-number">3</div>
                      <p>签署消息（不消耗 Gas）确认交易</p>
                    </div>
                    <div className="instruction-step">
                      <div className="step-number">4</div>
                      <p>中继器将您的交易提交上链，赞助商支付 Gas 费用</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧边栏 */}
              <div className="sidebar-section">
                <RelayerStatus />
                <TransactionHistory />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer>
        <div className="footer-text">
          <p>designed by LIANG Genming, TONG Shuwei, HUANG Runze</p>
        </div>
      </footer>
    </div>
  )
}

export default App