import { useEffect, useMemo, useState } from 'react'
import { useNetwork, useWallet } from '@txnlab/use-wallet-react'
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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-dark-700 bg-dark-800/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-dark-50">AI API Marketplace</h1>
              <p className="text-sm text-dark-400 mt-1">
                Direct wallet-to-contract integration for on-chain API discovery and access control
              </p>
            </div>
            <WalletPanel />
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={view === 'marketplace' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setView('marketplace')}
            >
              Marketplace
            </button>
            <button
              type="button"
              className={view === 'sdk' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setView('sdk')}
            >
              SDK Harness
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('Error') || message.includes('failed')
                ? 'bg-red-900/20 border border-red-700/50 text-red-300'
                : 'bg-blue-900/20 border border-blue-700/50 text-blue-300'
            }`}>
              {message}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-dark-400">Network</span>
                <select
                  value={network}
                  onChange={(event) => setActiveNetwork(event.target.value)}
                  className="input-field mt-1"
                >
                  <option value="localnet">localnet</option>
                  <option value="testnet">testnet</option>
                  <option value="mainnet">mainnet</option>
                </select>
              </div>
              <div>
                <span className="text-dark-400">App ID</span>
                <p className="font-mono text-dark-200 mt-1">
                  {marketplaceConfig.appId?.toString() ?? 'Not configured'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            />
          ) : (
            <SdkHarnessPage
              network={network}
              appId={marketplaceConfig.appId}
              activeAddress={activeAddress}
              transactionSigner={transactionSigner}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-dark-700 bg-dark-800/50 backdrop-blur mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-xs text-dark-500 text-center">
            Powered by Algorand | Direct contract integration via AlgoKit Utils
          </p>
        </div>
      </footer>
    </div>
  )
}
