import React from 'react'
import ReactDOM from 'react-dom/client'
import { NetworkId, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { marketplaceConfig } from './config'
import App from './App'
import './styles.css'

const walletManager = new WalletManager({
  wallets: [
    { id: WalletId.PERA },
    { id: WalletId.DEFLY },
    { id: WalletId.KIBISIS },
  ],
  defaultNetwork: marketplaceConfig.defaultNetwork === 'localnet'
    ? NetworkId.LOCALNET
    : marketplaceConfig.defaultNetwork === 'mainnet'
      ? NetworkId.MAINNET
      : NetworkId.TESTNET,
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider manager={walletManager}>
      <App />
    </WalletProvider>
  </React.StrictMode>,
)
