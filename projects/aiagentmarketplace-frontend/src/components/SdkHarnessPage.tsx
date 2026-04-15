import { useEffect, useMemo, useState } from 'react'
import { Loader2, Play, Wallet } from 'lucide-react'
import type { MarketplaceNetwork } from '../config'
import { MarketplaceSdk } from '../sdk'
import type {
  ApiAnalytics,
  ApiListing,
  EarningsSnapshot,
  MarketplaceAnalytics,
  PermissionStatus,
  ReputationScore,
} from '../sdk'
import { formatMicroAlgos } from '../lib/marketplace'

interface SdkHarnessPageProps {
  network: MarketplaceNetwork
  appId?: bigint | null
  activeAddress?: string | null
  transactionSigner?: unknown
}

type HarnessLogKind = 'info' | 'success' | 'error'

interface HarnessLogEntry {
  kind: HarnessLogKind
  message: string
}

export function SdkHarnessPage({ network, appId, activeAddress, transactionSigner }: SdkHarnessPageProps) {
  const [apis, setApis] = useState<ApiListing[]>([])
  const [apiIdentifierInput, setApiIdentifierInput] = useState<string>('')
  const [selectedListingId, setSelectedListingId] = useState<string>('')
  const [permission, setPermission] = useState<PermissionStatus | null>(null)
  const [earnings, setEarnings] = useState<EarningsSnapshot | null>(null)
  const [apiAnalytics, setApiAnalytics] = useState<ApiAnalytics | null>(null)
  const [marketplaceAnalytics, setMarketplaceAnalytics] = useState<MarketplaceAnalytics | null>(null)
  const [reputation, setReputation] = useState<ReputationScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [logs, setLogs] = useState<HarnessLogEntry[]>([])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const apiIdFromUrl = query.get('apiId')?.trim()

    if (apiIdFromUrl) {
      setApiIdentifierInput(apiIdFromUrl)
      setSelectedListingId(apiIdFromUrl)
      return
    }
  }, [])

  const sdk = useMemo(() => {
    if (!appId) {
      return null
    }

    const instance = new MarketplaceSdk({
      network,
      appId,
    })

    if (activeAddress && transactionSigner) {
      instance.withSigner(activeAddress, transactionSigner as never)
    }

    return instance
  }, [network, appId, activeAddress, transactionSigner])

  const selectedListing = useMemo(
    () => apis.find((api) => api.identifier === selectedListingId),
    [apis, selectedListingId],
  )

  const effectiveApiIdentifier = apiIdentifierInput.trim() || selectedListing?.identifier || ''

  const effectiveApi = useMemo(() => {
    if (!effectiveApiIdentifier) {
      return null
    }

    return apis.find((api) => api.identifier === effectiveApiIdentifier) ?? null
  }, [apis, effectiveApiIdentifier])

  const appendLog = (kind: HarnessLogKind, message: string) => {
    setLogs((current) => [{ kind, message }, ...current].slice(0, 8))
  }

  const syncApiIdToUrl = (nextApiId: string) => {
    const url = new URL(window.location.href)

    if (nextApiId.trim()) {
      url.searchParams.set('apiId', nextApiId.trim())
    } else {
      url.searchParams.delete('apiId')
    }

    window.history.replaceState({}, '', url)
  }

  const loadHarnessData = async () => {
    if (!sdk) {
      appendLog('error', 'Configure VITE_MARKETPLACE_APP_ID before using the harness.')
      return
    }

    setLoading(true)
    try {
      const [nextApis, nextMarketplaceAnalytics, nextEarnings] = await Promise.all([
        sdk.listApis(),
        sdk.getMarketplaceAnalytics(),
        sdk.getEarnings(),
      ])

      setApis(nextApis)
      setMarketplaceAnalytics(nextMarketplaceAnalytics)
      setEarnings(nextEarnings)
      setSelectedListingId((current) => current || nextApis[0]?.identifier || '')
      setApiIdentifierInput((current) => current || nextApis[0]?.identifier || '')
      appendLog('success', `Loaded ${nextApis.length} API listings via MarketplaceSdk.`)
    } catch (error) {
      const failure = error instanceof Error ? error.message : 'Unknown harness failure'
      appendLog('error', failure)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHarnessData()
  }, [sdk])

  useEffect(() => {
    const refreshSelected = async () => {
      if (!sdk || !effectiveApiIdentifier) {
        setPermission(null)
        setApiAnalytics(null)
        setReputation(null)
        return
      }

      try {
        const [nextPermission, nextAnalytics, nextReputation] = await Promise.all([
          activeAddress ? sdk.getPermission(effectiveApiIdentifier, activeAddress) : Promise.resolve(null),
          sdk.getApiAnalytics(effectiveApiIdentifier),
          Promise.resolve(sdk.getReputation(effectiveApiIdentifier)),
        ])

        if (nextPermission) {
          setPermission(nextPermission)
        } else {
          setPermission(null)
        }
        setApiAnalytics(nextAnalytics)
        setReputation(nextReputation)
      } catch (error) {
        const failure = error instanceof Error ? error.message : 'Failed to load API details'
        appendLog('error', failure)
      }
    }

    void refreshSelected()
  }, [sdk, effectiveApiIdentifier, activeAddress])

  const handleRefresh = async () => {
    await loadHarnessData()
  }

  const handleApiIdChange = (nextApiId: string) => {
    setApiIdentifierInput(nextApiId)
    syncApiIdToUrl(nextApiId)
  }

  const handleListingSelection = (nextListingId: string) => {
    setSelectedListingId(nextListingId)
    if (!apiIdentifierInput.trim()) {
      setApiIdentifierInput(nextListingId)
      syncApiIdToUrl(nextListingId)
    }
  }

  const handleCopyShareableUrl = async () => {
    syncApiIdToUrl(effectiveApiIdentifier)
    await navigator.clipboard.writeText(window.location.href)
    appendLog('success', 'Copied shareable harness URL to clipboard.')
  }

  const handleCheckPermission = async () => {
    if (!sdk || !effectiveApiIdentifier || !activeAddress) {
      appendLog('error', 'Connect a wallet and provide an API ID first.')
      return
    }

    try {
      const nextPermission = await sdk.getPermission(effectiveApiIdentifier, activeAddress)
      setPermission(nextPermission)
      appendLog('success', `Permission check complete: ${nextPermission.permitted ? 'granted' : 'missing'}.`)
    } catch (error) {
      const failure = error instanceof Error ? error.message : 'Permission check failed'
      appendLog('error', failure)
    }
  }

  const handlePayForAccess = async () => {
    if (!sdk || !effectiveApiIdentifier) {
      appendLog('error', 'Provide an API ID before paying for access.')
      return
    }

    if (!activeAddress || !transactionSigner) {
      appendLog('error', 'Connect a wallet before attempting payment.')
      return
    }

    setPaymentLoading(true)
    try {
      const txnId = await sdk.withSigner(activeAddress, transactionSigner as never).payForAccess(effectiveApiIdentifier)
      appendLog('success', `Payment sent successfully. TxID: ${txnId}`)
      await handleRefresh()
    } catch (error) {
      const failure = error instanceof Error ? error.message : 'Payment failed'
      appendLog('error', failure)
    } finally {
      setPaymentLoading(false)
    }
  }

  const selectedReputation = effectiveApi ? sdk?.getReputation(effectiveApi.identifier) ?? null : null

  return (
    <div className="space-y-6">
      <div className="card-premium">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-dark-50 mb-2">Developer SDK Harness</h2>
            <p className="text-dark-300 text-sm max-w-2xl">
              This page exercises only the MarketplaceSdk API surface for discovery, permission
              checks, analytics, reputation, and payment flows.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-dark-300">
            <Wallet size={16} />
            <span>{activeAddress ? 'Wallet connected' : 'No wallet connected'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="subsection-title mb-0">SDK Controls</h3>
            <button type="button" className="btn-secondary flex items-center gap-2" onClick={handleRefresh} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Refresh
            </button>
          </div>

          <div>
            <label className="text-xs text-dark-400 block mb-2">API ID</label>
            <input
              className="input-field"
              placeholder="Enter a concrete API identifier"
              value={apiIdentifierInput}
              onChange={(event) => handleApiIdChange(event.target.value)}
            />
            <p className="mt-2 text-xs text-dark-500">
              This field drives all SDK calls. You can also open this page with ?apiId=your-id.
            </p>
          </div>

          <div>
            <label className="text-xs text-dark-400 block mb-2">Suggest from discovered APIs</label>
            <select
              className="input-field"
              value={selectedListingId}
              onChange={(event) => handleListingSelection(event.target.value)}
            >
              <option value="">Choose an API</option>
              {apis.map((api) => (
                <option key={api.identifier} value={api.identifier}>
                  {api.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 text-sm text-dark-300">
            <p>Network: <span className="text-dark-100 font-medium">{network}</span></p>
            <p>App ID: <span className="text-dark-100 font-medium">{appId?.toString() ?? 'Not configured'}</span></p>
            <p>APIs: <span className="text-dark-100 font-medium">{apis.length}</span></p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={handleCheckPermission} disabled={!effectiveApiIdentifier || !activeAddress}>
              Check Permission
            </button>
            <button type="button" className="btn-secondary" onClick={handlePayForAccess} disabled={!effectiveApiIdentifier || !activeAddress || !transactionSigner || paymentLoading}>
              {paymentLoading ? 'Paying...' : 'Pay for Access'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void handleCopyShareableUrl()}
              disabled={!effectiveApiIdentifier}
            >
              Copy Shareable URL
            </button>
          </div>
        </div>

        <div className="card space-y-4 lg:col-span-2">
          <h3 className="subsection-title mb-0">Live SDK Results</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="stat-card">
              <div className="text-xs text-dark-400 mb-1">Marketplace Listings</div>
              <div className="text-2xl font-bold text-accent-blue">{apis.length}</div>
            </div>
            <div className="stat-card">
              <div className="text-xs text-dark-400 mb-1">Marketplace Volume</div>
              <div className="text-2xl font-bold text-accent-emerald">
                {marketplaceAnalytics ? `${marketplaceAnalytics.totalVolume.toFixed(2)} Ⓐ` : '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="text-xs text-dark-400 mb-1">Permission</div>
              <div className="text-2xl font-bold text-accent-purple">
                {permission?.permitted ? 'Granted' : permission === null ? '—' : 'Missing'}
              </div>
            </div>
            <div className="stat-card">
              <div className="text-xs text-dark-400 mb-1">Provider Balance</div>
              <div className="text-2xl font-bold text-accent-pink">
                {earnings ? formatMicroAlgos(earnings.balanceMicroAlgos) : '—'}
              </div>
            </div>
          </div>

          {effectiveApi ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="card">
                <h4 className="font-semibold text-dark-100 mb-3">Selected API</h4>
                <div className="space-y-2 text-sm text-dark-300">
                  <p><span className="text-dark-400">Title:</span> {effectiveApi.title}</p>
                  <p><span className="text-dark-400">Identifier:</span> {effectiveApi.identifier}</p>
                  <p><span className="text-dark-400">Endpoint:</span> {effectiveApi.endpoint ?? 'Hidden until permission is granted'}</p>
                  <p><span className="text-dark-400">Price:</span> {formatMicroAlgos(effectiveApi.priceMicroAlgos)}</p>
                  <p><span className="text-dark-400">Permission:</span> {permission?.permitted ? 'Granted' : 'Not granted'}</p>
                </div>
              </div>

              <div className="card">
                <h4 className="font-semibold text-dark-100 mb-3">Reputation & Analytics</h4>
                <div className="space-y-2 text-sm text-dark-300">
                  <p><span className="text-dark-400">Rating:</span> {selectedReputation ? selectedReputation.rating.toFixed(1) : '—'}</p>
                  <p><span className="text-dark-400">Reliability:</span> {selectedReputation ? `${selectedReputation.reliability}%` : '—'}</p>
                  <p><span className="text-dark-400">Response Time:</span> {selectedReputation ? `${selectedReputation.responseTime}ms` : '—'}</p>
                  <p><span className="text-dark-400">Transactions:</span> {apiAnalytics?.totalTransactions ?? '—'}</p>
                  <p><span className="text-dark-400">Unique Callers:</span> {apiAnalytics?.uniqueCallers ?? '—'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-dark-400 text-sm">Enter a concrete API ID to inspect it through the SDK.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="subsection-title">SDK Event Log</h3>
          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-sm text-dark-500">No SDK calls yet. Use the controls above to generate activity.</p>
            ) : (
              logs.map((entry, index) => (
                <div
                  key={`${entry.kind}-${index}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    entry.kind === 'success'
                      ? 'border-emerald-700/40 bg-emerald-900/20 text-emerald-200'
                      : entry.kind === 'error'
                        ? 'border-red-700/40 bg-red-900/20 text-red-200'
                        : 'border-dark-700 bg-dark-700/50 text-dark-200'
                  }`}
                >
                  {entry.message}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="subsection-title">Earnings Snapshot</h3>
          {earnings ? (
            <div className="space-y-3 text-sm text-dark-300">
              <p><span className="text-dark-400">Address:</span> {earnings.appAddress}</p>
              <p><span className="text-dark-400">Balance:</span> {formatMicroAlgos(earnings.balanceMicroAlgos)}</p>
              <p><span className="text-dark-400">Recent payments:</span> {earnings.recentPayments.length}</p>
            </div>
          ) : (
            <p className="text-sm text-dark-500">Load data from the SDK to inspect earnings.</p>
          )}
        </div>
      </div>
    </div>
  )
}
