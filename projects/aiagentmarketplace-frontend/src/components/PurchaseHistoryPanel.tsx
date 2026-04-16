import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Copy, Star, TrendingUp } from 'lucide-react'
import { fetchUserPurchaseHistory, type ApiListing } from '../lib/marketplace'
import { type MarketplaceNetwork } from '../config'
import AccessApiModal from './AccessApiModal'

interface PurchaseHistoryPanelProps {
  network: MarketplaceNetwork
  appId: bigint | null
  userAddress: string | null
  isConnected: boolean
  onRatingSubmit?: (apiId: string, rating: number) => Promise<void>
}

interface PurchasedApi extends ApiListing {
  isExpanded?: boolean
  copiedEndpoint?: boolean
}

export const PurchaseHistoryPanel: React.FC<PurchaseHistoryPanelProps> = ({
  network,
  appId,
  userAddress,
  isConnected,
  onRatingSubmit,
}) => {
  const [purchasedApis, setPurchasedApis] = useState<PurchasedApi[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalApi, setModalApi] = useState<ApiListing | null>(null)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  const totals = useMemo(() => {
    const totalSpendMicroAlgos = purchasedApis.reduce((sum, api) => sum + api.priceMicroAlgos, 0n)
    return {
      activeCount: purchasedApis.length,
      totalSpendMicroAlgos,
    }
  }, [purchasedApis])

  useEffect(() => {
    if (!isConnected || !appId || !userAddress) {
      setPurchasedApis([])
      return
    }

    const loadHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        const history = await fetchUserPurchaseHistory(network, appId, userAddress)
        setPurchasedApis(history.map((api) => ({ ...api, isExpanded: false })))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load purchase history'
        setError(message)
        console.error('Purchase history error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [network, appId, userAddress, isConnected])

  const handleToggleExpand = (apiId: string) => {
    setExpandedId(expandedId === apiId ? null : apiId)
  }

  const handleCopyEndpoint = async (endpoint: string) => {
    try {
      await navigator.clipboard.writeText(endpoint)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpenAccessModal = (api: ApiListing, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setModalApi(api)
    setModalOpen(true)
  }

  const handleSubmitRating = async (rating: number) => {
    if (!onRatingSubmit || !modalApi) return
    try {
      setRatingSubmitting(true)
      await onRatingSubmit(modalApi.identifier, rating)
    } finally {
      setRatingSubmitting(false)
    }
  }

  const generateCurlExample = (api: ApiListing): string => {
    if (!api.endpoint) return 'curl https://example.com/api'
    return `curl -H "Authorization: Bearer YOUR_TOKEN" ${api.endpoint}`
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/40 p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-white">Your Purchased APIs ({purchasedApis.length})</h3>
          <p className="mt-1 text-sm text-slate-400">
            APIs and agents you&apos;ve purchased and can access immediately.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Active APIs</div>
            <div className="mt-1 text-2xl font-bold text-emerald-400">{totals.activeCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Spend</div>
            <div className="mt-1 text-2xl font-bold text-blue-400">
              {Number(totals.totalSpendMicroAlgos) / 1_000_000} ALGO
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          Loading purchase history...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && purchasedApis.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-8 text-center text-slate-400">
          No purchased APIs yet. Browse the marketplace to get started.
        </div>
      )}

      <div className="grid gap-4">
        {purchasedApis.map((api) => (
          <div
            key={api.identifier}
            className="cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-5 transition hover:-translate-y-0.5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10"
            onClick={() => handleToggleExpand(api.identifier)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h4 className="text-lg font-semibold text-white">{api.title}</h4>
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
                    {api.publisher ?? 'ravi'}
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    Authorized
                  </span>
                </div>
                <p className="max-w-3xl text-sm text-slate-400">{api.description}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <TrendingUp className="size-4 text-emerald-400" />
                    {Number(api.priceMicroAlgos) / 1_000_000} ALGO
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Star className="size-4 text-amber-400" />
                    Access granted
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-2 text-slate-300">
                {expandedId === api.identifier ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {expandedId === api.identifier && (
              <div className="mt-5 border-t border-slate-700 pt-5">
                {api.endpoint && (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Endpoint
                    </p>
                    <code className="block rounded-xl border border-slate-700 bg-slate-950/60 p-3 font-mono text-xs text-cyan-300 break-all select-all">
                      {api.endpoint}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyEndpoint(api.endpoint!)
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                    >
                      <Copy className="size-4" />
                      Copy Endpoint
                    </button>
                    <button
                      onClick={(e) => handleOpenAccessModal(api, e)}
                      className="ml-2 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                    >
                      View & Rate
                    </button>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Example Usage
                  </p>
                  <code className="block rounded-xl border border-slate-700 bg-slate-950/60 p-3 font-mono text-xs text-amber-200 break-all select-all">
                    {generateCurlExample(api)}
                  </code>
                </div>

                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                    Authorized
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {modalApi && (
        <AccessApiModal
          api={modalApi}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setModalApi(null)
          }}
          onSubmitRating={handleSubmitRating}
          ratingLoading={ratingSubmitting}
        />
      )}
    </div>
  )
}

export default PurchaseHistoryPanel
