import { useWallet } from '@txnlab/use-wallet-react'
import { Check, Copy, LogOut, Wallet } from 'lucide-react'
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
      <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
        <div className="text-sm text-slate-400">Initializing wallets...</div>
      </div>
    )
  }

  const activeWallet = wallets.find((wallet) => wallet.isActive)

  if (activeAddress && activeWallet) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5">
          <div className="size-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-medium text-emerald-100">
            {activeWallet.metadata?.name ?? activeWallet.id}
          </span>
        </div>
        <button
          onClick={handleCopyAddress}
          className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-mono text-slate-200 transition hover:border-blue-500/40 hover:bg-slate-900"
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
          className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-blue-500/40 hover:bg-slate-900"
        >
          <LogOut size={16} />
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {wallets.map((wallet) => (
        <button
          key={wallet.id}
          onClick={() => wallet.connect()}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
        >
          <Wallet size={16} />
          Connect {wallet.metadata?.name ?? wallet.id}
        </button>
      ))}
    </div>
  )
}
