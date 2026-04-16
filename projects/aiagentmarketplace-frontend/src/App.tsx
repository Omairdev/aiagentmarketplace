import { useEffect, useMemo, useState } from 'react'
import { useNetwork, useWallet } from '@txnlab/use-wallet-react'
import { Layers3, LayoutGrid, Sparkles } from 'lucide-react'
import { marketplaceConfig, type MarketplaceNetwork } from './config'
import { MarketplaceDashboard } from './components/MarketplaceDashboard'
import { SdkHarnessPage } from './components/SdkHarnessPage'
import { WalletPanel } from './components/WalletPanel'
import type { ApiListing, EarningsSnapshot, PermissionStatus } from './lib/marketplace'
import type { ApiAnalytics, ReputationScore, MarketplaceAnalytics } from './lib/analytics'
import {
  loadEarningsSnapshot,
  loadMarketplaceListings,
  loadPermissionStatus,
  payForAccess,
  submitRating,
} from './lib/marketplace'
import { loadApiAnalytics, loadReputationScore, loadMarketplaceAnalytics } from './lib/analytics'

export default function App() {
  const { activeAddress, transactionSigner } = useWallet()
  const { activeNetwork, setActiveNetwork } = useNetwork()
  const network = (activeNetwork as MarketplaceNetwork) ?? marketplaceConfig.defaultNetwork

  const [listings, setListings] = useState<ApiListing[]>([])
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('')
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null)
  const [earnings, setEarnings] = useState<EarningsSnapshot | null>(null)
  const [apiAnalytics, setApiAnalytics] = useState<ApiAnalytics | null>(null)
  const [marketplaceAnalytics, setMarketplaceAnalytics] = useState<MarketplaceAnalytics | null>(null)
  const [reputationScores, setReputationScores] = useState<Map<string, ReputationScore>>(new Map())
  
  const [loadingListings, setLoadingListings] = useState(false)
  const [loadingPermission, setLoadingPermission] = useState(false)
  const [loadingEarnings, setLoadingEarnings] = useState(false)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [paymentBusy, setPaymentBusy] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [view, setView] = useState<'marketplace' | 'sdk'>('marketplace')

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.identifier === selectedIdentifier),
    [listings, selectedIdentifier],
  )

  // Load listings on network change
  useEffect(() => {
    if (!marketplaceConfig.appId) {
      setMessage('Set VITE_MARKETPLACE_APP_ID to enable direct-to-contract calls.')
      return
    }

    let cancelled = false
    setLoadingListings(true)
    loadMarketplaceListings(network, marketplaceConfig.appId)
      .then((nextListings) => {
        if (cancelled) {
          return
        }

        setListings(nextListings)
        setSelectedIdentifier((current) => current || nextListings[0]?.identifier || '')
        setMessage(nextListings.length > 0 ? 'Loaded on-chain listings from box storage.' : 'No listings were found on-chain yet.')
        
        // Load reputation scores for all listings
        const scores = new Map<string, ReputationScore>()
        nextListings.forEach((listing) => {
          scores.set(listing.identifier, loadReputationScore(listing.identifier))
        })
        setReputationScores(scores)
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setMessage(error.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingListings(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [network])

  // Load permission status on sender or selection change
  useEffect(() => {
    if (!marketplaceConfig.appId || !activeAddress || !selectedListing) {
      setPermissionStatus(null)
      return
    }

    let cancelled = false
    setLoadingPermission(true)
    loadPermissionStatus(network, marketplaceConfig.appId, selectedListing, activeAddress)
      .then((status) => {
        if (!cancelled) {
          setPermissionStatus(status)
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setMessage(error.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPermission(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [network, activeAddress, selectedListing])

  // Load earnings on network change
  useEffect(() => {
    if (!marketplaceConfig.appId) {
      setEarnings(null)
      return
    }

    let cancelled = false
    setLoadingEarnings(true)
    loadEarningsSnapshot(network, marketplaceConfig.appId)
      .then((snapshot) => {
        if (!cancelled) {
          setEarnings(snapshot)
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setMessage(error.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingEarnings(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [network])

  // Load marketplace analytics
  useEffect(() => {
    if (!marketplaceConfig.appId) {
      return
    }

    let cancelled = false
    setLoadingAnalytics(true)
    loadMarketplaceAnalytics(network, marketplaceConfig.appId, listings.length)
      .then((analytics) => {
        if (!cancelled) {
          setMarketplaceAnalytics(analytics)
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          console.error('Failed to load marketplace analytics:', error)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAnalytics(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [network, listings.length])

  // Load API-specific analytics on selection change
  useEffect(() => {
    if (!marketplaceConfig.appId || !selectedListing) {
      setApiAnalytics(null)
      return
    }

    let cancelled = false
    setLoadingAnalytics(true)
    loadApiAnalytics(network, marketplaceConfig.appId, selectedListing.identifier)
      .then((analytics) => {
        if (!cancelled) {
          setApiAnalytics(analytics)
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          console.error('Failed to load API analytics:', error)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAnalytics(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [network, selectedListing?.identifier])

  const refreshListings = () => {
    setSelectedIdentifier('')
    setMessage('Refreshing on-chain listings...')
    if (!marketplaceConfig.appId) {
      return
    }

    setLoadingListings(true)
    loadMarketplaceListings(network, marketplaceConfig.appId)
      .then((nextListings) => {
        setListings(nextListings)
        setSelectedIdentifier(nextListings[0]?.identifier || '')
        setMessage('Listings refreshed from box storage.')
        
        const scores = new Map<string, ReputationScore>()
        nextListings.forEach((listing) => {
          scores.set(listing.identifier, loadReputationScore(listing.identifier))
        })
        setReputationScores(scores)
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoadingListings(false))
  }

  const refreshPermission = () => {
    if (!marketplaceConfig.appId || !activeAddress || !selectedListing) {
      return
    }

    setLoadingPermission(true)
    loadPermissionStatus(network, marketplaceConfig.appId, selectedListing, activeAddress)
      .then(setPermissionStatus)
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoadingPermission(false))
  }

  const refreshEarnings = () => {
    if (!marketplaceConfig.appId) {
      return
    }

    setLoadingEarnings(true)
    loadEarningsSnapshot(network, marketplaceConfig.appId)
      .then(setEarnings)
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoadingEarnings(false))
  }

  const handlePayForAccess = async () => {
    if (!marketplaceConfig.appId || !activeAddress || !transactionSigner || !selectedListing) {
      setMessage('Connect a wallet and select an API before paying for access.')
      return
    }

    setPaymentBusy(true)
    setMessage('Submitting on-chain access payment...')
    try {
      await payForAccess({
        network,
        appId: marketplaceConfig.appId,
        sender: activeAddress,
        transactionSigner,
        apiListing: selectedListing,
      })
      setMessage('Payment confirmed. Refreshing permission status and listings.')
      await Promise.all([refreshPermission(), refreshEarnings(), refreshListings()])
    } catch (error) {
      const failure = error instanceof Error ? error : new Error('Access payment failed')
      setMessage(failure.message)
    } finally {
      setPaymentBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/25">
                <Layers3 className="size-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">AI API Marketplace</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-400">
                  Direct wallet-to-contract integration for on-chain API discovery and access control.
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">
                    <Sparkles className="size-3.5 text-cyan-400" />
                    Loaded on-chain listings from box storage
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">
                    <LayoutGrid className="size-3.5 text-blue-400" />
                    App ID {marketplaceConfig.appId?.toString() ?? 'Not configured'}
                  </span>
                </div>
              </div>
            </div>

            <WalletPanel />
          </div>

          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-1">
              <button
                type="button"
                className={view === 'marketplace' ? 'rounded-xl bg-blue-500 px-4 py-2 font-semibold text-white shadow-lg shadow-blue-500/20' : 'rounded-xl px-4 py-2 font-medium text-slate-400 transition hover:text-white'}
                onClick={() => setView('marketplace')}
              >
                Marketplace
              </button>
              <button
                type="button"
                className={view === 'sdk' ? 'rounded-xl bg-blue-500 px-4 py-2 font-semibold text-white shadow-lg shadow-blue-500/20' : 'rounded-xl px-4 py-2 font-medium text-slate-400 transition hover:text-white'}
                onClick={() => setView('sdk')}
              >
                SDK Harness
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-slate-500">Network</span>
                <select
                  value={network}
                  onChange={(event) => setActiveNetwork(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  <option value="localnet">localnet</option>
                  <option value="testnet">testnet</option>
                  <option value="mainnet">mainnet</option>
                </select>
              </label>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-slate-500">Status</span>
                <p className="text-sm text-slate-200">
                  {activeAddress ? 'Wallet connected and ready' : 'No wallet connected'}
                </p>
                {message && <p className="mt-1 text-xs text-slate-500">{message}</p>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {view === 'marketplace' ? (
          <MarketplaceDashboard
            listings={listings}
            selectedListing={selectedListing}
            permissionStatus={permissionStatus}
            earnings={earnings}
            loadingListings={loadingListings}
            loadingPermission={loadingPermission}
            loadingEarnings={loadingEarnings}
            paymentBusy={paymentBusy}
            onSelectListing={setSelectedIdentifier}
            onRefreshListings={refreshListings}
            onRefreshPermission={refreshPermission}
            onRefreshEarnings={refreshEarnings}
            onPayForAccess={handlePayForAccess}
            appId={marketplaceConfig.appId}
            apiAnalytics={apiAnalytics ?? undefined}
            loadingAnalytics={loadingAnalytics}
            marketplaceAnalytics={marketplaceAnalytics ?? undefined}
            reputationScores={reputationScores}
            network={network}
            activeAddress={activeAddress}
            onSubmitRating={async (_apiId, rating) => {
              const targetListing = listings.find((listing) => listing.identifier === _apiId)

              if (!targetListing || !marketplaceConfig.appId || !activeAddress || !transactionSigner) {
                setMessage('Connect a wallet before submitting a rating.')
                return
              }

              await submitRating({
                network,
                appId: marketplaceConfig.appId,
                sender: activeAddress,
                transactionSigner,
                apiListing: targetListing,
                rating,
              })

              setMessage(`Submitted rating ${rating} for ${targetListing.title}.`)
            }}
          />
        ) : (
          <SdkHarnessPage
            network={network}
            appId={marketplaceConfig.appId}
            activeAddress={activeAddress}
            transactionSigner={transactionSigner}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/60 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-slate-500">
            Powered by Algorand | Direct contract integration via AlgoKit Utils
          </p>
        </div>
      </footer>
    </div>
  )
}
