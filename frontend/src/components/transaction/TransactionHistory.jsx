// GasEase/frontend/src/components/transaction/TransactionHistory.jsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { History, ExternalLink, CheckCircle, Clock, XCircle, Loader } from 'lucide-react';
import '../../styles/transaction.css';

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

// Etherscan API V2配置
const getEtherscanConfig = () => {
  const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
  return {
    url: 'https://api.etherscan.io/v2/api',
    key: apiKey
  };
};

// 将交易状态映射到我们的状态
const mapTxStatus = (txReceiptStatus, isError) => {
  if (isError === '1') return 'failed';
  if (txReceiptStatus === '0') return 'failed';
  if (txReceiptStatus === '1') return 'success';
  return 'pending';
};

// 格式化交易金额
const formatAmount = (value, decimals = 6) => {
  const amount = parseFloat(value) / Math.pow(10, decimals);
  return amount > 0 ? `${amount.toFixed(2)} USDC` : '0 USDC';
};

// 获取交易类型
const getTransactionType = (from, to, currentAddress) => {
  if (from.toLowerCase() === currentAddress.toLowerCase()) {
    return 'Send';
  } else if (to.toLowerCase() === currentAddress.toLowerCase()) {
    return 'Receive';
  }
  return 'Pending';
};

// 格式化地址显示
const formatAddress = (address) => {
  if (!address) return '未知地址';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function TransactionHistory() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchTransactionHistory = async () => {
    const gaslessTransferContractAddress = import.meta.env.VITE_GASLESS_TRANSFER_CONTRACT_ADDRESS;
    if (!gaslessTransferContractAddress) return;
    const tokenAddress = import.meta.env.VITE_USDC_TOKEN_ADDRESS;
    if (!tokenAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const config = getEtherscanConfig();
      
      // 使用V2 API端点 - 获取普通交易
      let apiUrl = config.url;
      apiUrl += `?apikey=${config.key}`;
      apiUrl +=`&chainid=11155111&module=account&action=tokentx`;
      apiUrl += `&contractAddress=${tokenAddress}`;
      apiUrl += `&address=${address}`;
      apiUrl += `&tag=latest&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`;
      
      
      console.log('调用Etherscan V2 API:', apiUrl);
      await delay(400);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Etherscan V2 API响应:', result);
      
      if (result.status === '1' || result.status === '0') {
        // V2 API返回格式可能不同，需要检查
        const txList = result.result || result.items || [];
        
        if (txList.length === 0 && result.message === 'No transactions found') {
          setTransactions([]); // 没有交易记录是正常情况
          return;
        }
        
        const txList2Results = [];
        for (let i = 0; i < txList.length; i++) {
          const tx = txList[i];
          let txapiUrl = config.url;
          txapiUrl += `?apikey=${config.key}`;
          txapiUrl +=`&chainid=11155111&module=proxy&action=eth_getTransactionReceipt`;
          txapiUrl += `&txhash=${tx.hash}`;

          console.log('调用Etherscan V2 API for tx:', txapiUrl);
          
          // 添加延迟以避免速率限制（每400ms一个请求）
          if (i >= 0) {
            await delay(400);
          }
          
          const txResponse = await fetch(txapiUrl);
          const txResult = await txResponse.json();
          txList2Results.push(txResult);
        }
        console.log('Etherscan V2 API for tx响应:', txList2Results);

        const formattedTransactions = txList.map((tx, index) => {
          const internalTxResult = txList2Results[index];
          const internalTxList = internalTxResult.result;
          // console.log(internalTxList);
          return {
            hash: tx.hash,
            type: getTransactionType(tx.from, tx.to, address),
            amount: formatAmount(tx.value),
            to: tx.to,
            from: tx.from,
            status: "success",
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString('zh-CN'),
            blockNumber: tx.blockNumber,
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice,
            confirmations: tx.confirmations,
            contractAddress: tx.contractAddress,
            methodId: tx.methodId,
            gasPaidFrom: internalTxList.from
          };
        });
        // console.log(formattedTransactions);
          setTransactions(formattedTransactions);
      } else {
        // 处理Etherscan API错误
        if (result.message && result.message.includes('No transactions found')) {
          setTransactions([]); // 没有交易记录是正常情况
        } else {
          throw new Error(result.result || result.message || '获取交易历史失败');
        }
      }
    } catch (err) {
      console.error('获取交易历史错误:', err);
      setError(`获取交易历史失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionHistory();
  }, [address]);

  if (!address) return null;

  return (
    <div className="transaction-history-container">
      <div className="transaction-header">
        <History className="transaction-header-icon" />
        <h3 className="transaction-title">Transfers History</h3>
        <button 
          onClick={fetchTransactionHistory}
          disabled={loading}
          className="refresh-button"
        >
          {loading ? <Loader className="refresh-icon spinning" /> : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-state">
          <p className="error-text">{error}</p>
          <button onClick={fetchTransactionHistory} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="transaction-list">
        {loading && transactions.length === 0 ? (
          <div className="loading-state">
            <Loader className="loading-icon spinning" />
            <p className="loading-text">Loading transfers history...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <History className="empty-state-icon" />
            <p className="empty-state-text">暂无交易记录</p>
            <p className="empty-state-subtext">在Sepolia网络上完成交易后，记录将显示在这里</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const StatusIcon = statusIcons[tx.status];
            const statusClass = statusClasses[tx.status];
            
            return (
              <div key={tx.hash} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-header-row">
                    <span className="transaction-type">{tx.type}</span>
                    <StatusIcon className={`status-icon ${statusClass}`} />
                  </div>
                  <div className="transaction-address">
                    {tx.type === 'Send' ? 'to' : 'from'}: {formatAddress(tx.type === 'Send' ? tx.to : tx.from)}
                  </div>
                  <div className="transaction-amount">{tx.amount}</div>
                  {tx.gasUsed && tx.gasPrice && (
                    <div className="transaction-gas">
                      Gas: {(parseInt(tx.gasUsed) * parseInt(tx.gasPrice) / 1e18).toFixed(18)} ETH
                      <div className="transaction-address">
                        Gas paid by {formatAddress(tx.gasPaidFrom)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="transaction-meta">
                  <div className="transaction-time">{tx.timestamp}</div>
                  <div className="transaction-block">Block: {tx.blockNumber}</div>
                  <div className="transaction-confirmations">
                    Confirmations: {tx.confirmations || '0'}
                  </div>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transaction-link"
                  >
                    <ExternalLink className="transaction-link-icon" />
                    View on Etherscan
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}