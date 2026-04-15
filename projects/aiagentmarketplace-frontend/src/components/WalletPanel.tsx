import { useWallet } from '@txnlab/use-wallet-react'
import { Wallet, LogOut, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export function WalletPanel() {
  const { wallets, activeAddress, isReady } = useWallet()
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center px-4 py-2">
        <div className="text-sm text-dark-400">Initializing wallets...</div>
      </div>
    )
  }

  const activeWallet = wallets.find((wallet) => wallet.isActive)

  if (activeAddress && activeWallet) {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-dark-700/50 border border-dark-600 rounded-lg px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-dark-200 font-medium">
            {activeWallet.metadata?.name ?? activeWallet.id}
          </span>
        </div>
        <button
          onClick={handleCopyAddress}
          className="bg-dark-700/50 hover:bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm font-mono text-dark-300 flex items-center gap-2 transition-colors"
          title="Click to copy address"
        >
          <Wallet size={16} />
          <span>{activeAddress.slice(0, 8)}...{activeAddress.slice(-6)}</span>
          {copied ? (
            <Check size={16} className="text-emerald-400" />
          ) : (
            <Copy size={16} />
          )}
        </button>
        <button
          onClick={() => activeWallet.disconnect()}
          className="btn-secondary flex items-center gap-2"
        >
          <LogOut size={16} />
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {wallets.map((wallet) => (
        <button
          key={wallet.id}
          onClick={() => wallet.connect()}
          className="btn-primary flex items-center gap-2"
        >
          <Wallet size={16} />
          Connect {wallet.metadata?.name ?? wallet.id}
        </button>
      ))}
    </div>
  )
}
