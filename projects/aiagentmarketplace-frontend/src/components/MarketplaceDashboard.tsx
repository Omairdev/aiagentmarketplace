import { useMemo, useState } from 'react'
import { RefreshCw, Shield, Sparkles, TrendingUp } from 'lucide-react'
import type { ApiListing, EarningsSnapshot, PermissionStatus } from '../lib/marketplace'
import type { ApiAnalytics, MarketplaceAnalytics, ReputationScore } from '../lib/analytics'
import { formatMicroAlgos } from '../lib/marketplace'
import type { MarketplaceNetwork } from '../config'
import { ApiCard } from './ApiCard'
import { AnalyticsChart, MarketplaceAnalyticsChart, StatsGrid } from './AnalyticsPanel'
import { ReputationPanel } from './ReputationPanel'
import { DeveloperSdkPanel } from './DeveloperSdkPanel'
import { PurchaseHistoryPanel } from './PurchaseHistoryPanel'

interface MarketplaceDashboardProps {
  listings: ApiListing[]
  selectedListing?: ApiListing
  permissionStatus?: PermissionStatus | null
  earnings?: EarningsSnapshot | null
  loadingListings: boolean
  loadingPermission: boolean
  loadingEarnings: boolean
  paymentBusy: boolean
  onSelectListing: (identifier: string) => void
  onRefreshListings: () => void
  onRefreshPermission: () => void
  onRefreshEarnings: () => void
  onPayForAccess: () => void
  appId?: bigint | null
  apiAnalytics?: ApiAnalytics
  loadingAnalytics?: boolean
  marketplaceAnalytics?: MarketplaceAnalytics
  reputationScores?: Map<string, ReputationScore>
  network?: MarketplaceNetwork
  activeAddress?: string | null
  onSubmitRating?: (apiId: string, rating: number) => Promise<void>
}

type TabType = 'browse' | 'purchases' | 'analytics' | 'earnings' | 'sdk'

export function MarketplaceDashboard({
  listings,
  selectedListing,
  permissionStatus,
  earnings,
  loadingListings,
  loadingPermission,
  loadingEarnings,
  paymentBusy,
  onSelectListing,
  onRefreshListings,
  onRefreshPermission,
  onRefreshEarnings,
  onPayForAccess,
  appId,
  apiAnalytics,
  loadingAnalytics,
  marketplaceAnalytics,
  reputationScores,
  network = 'localnet',
  activeAddress,
  onSubmitRating,
}: MarketplaceDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('browse')

  const selectedReputation = selectedListing && reputationScores?.get(selectedListing.identifier)

  const dashboardStats = useMemo(() => {
    const totalListings = listings.length
    const averagePriceMicroAlgos =
      totalListings > 0
        ? listings.reduce((sum, listing) => sum + Number(listing.priceMicroAlgos), 0) / totalListings
        : 0

    return {
      totalListings,
      activeListings: marketplaceAnalytics?.activeAPIs ?? totalListings,
      totalVolume: marketplaceAnalytics?.totalVolume ?? 0,
      averagePriceMicroAlgos,
    }
  }, [listings, marketplaceAnalytics])

  return (
    <section className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_1.4fr]">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/25">
              <Sparkles className="size-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Marketplace Overview</h2>
              <p className="text-sm text-slate-400">On-chain API discovery and access control</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Network</div>
              <div className="mt-2 text-lg font-semibold text-white">{network}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">App ID</div>
              <div className="mt-2 text-lg font-semibold text-white">{appId?.toString() ?? 'Not configured'}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Volume</div>
              <div className="mt-2 text-lg font-semibold text-blue-400">
                {formatMicroAlgos(BigInt(Math.round(dashboardStats.totalVolume * 1_000_000)))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Listings</div>
              <div className="mt-2 text-lg font-semibold text-pink-400">
                {dashboardStats.activeListings}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl shadow-black/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Selected API</h3>
              <p className="mt-1 text-sm text-slate-400">Inspect the currently highlighted listing.</p>
            </div>
            {selectedListing && selectedReputation && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Verified Provider
              </span>
            )}
          </div>

          {selectedListing ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Title</div>
                <div className="mt-2 text-lg font-semibold text-white">{selectedListing.title}</div>
                <p className="mt-3 text-sm text-slate-400">{selectedListing.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                  <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1">
                    {selectedListing.currency}
                  </span>
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-blue-300">
                    {formatMicroAlgos(selectedListing.priceMicroAlgos)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Permission</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {permissionStatus?.permitted ? 'Granted' : 'Not granted'}
                </div>
                <div className="mt-4 text-sm text-slate-400">
                  {selectedListing.endpoint ? (
                    <>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Endpoint</div>
                      <code className="block rounded-xl border border-slate-700 bg-slate-950/60 p-3 font-mono text-xs text-cyan-300 break-all">
                        {selectedListing.endpoint}
                      </code>
                    </>
                  ) : (
                    'Endpoint hidden until the API is registered.'
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">
              Select an API to inspect pricing, permission, and access details.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {(['browse', 'purchases', 'analytics', 'earnings', 'sdk'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'browse' && 'Browse APIs'}
            {tab === 'purchases' && 'My Purchases'}
            {tab === 'analytics' && 'Analytics'}
            {tab === 'earnings' && 'Earnings'}
            {tab === 'sdk' && 'Developer SDK'}
          </button>
        ))}
      </div>

      {activeTab === 'browse' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRefreshListings}
              disabled={loadingListings}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} />
              {loadingListings ? 'Refreshing...' : 'Refresh listings'}
            </button>
            {selectedListing && (
              <button
                type="button"
                onClick={onRefreshPermission}
                disabled={loadingPermission}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-white transition hover:border-blue-500/40 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Shield size={16} />
                {loadingPermission ? 'Checking...' : 'Check access'}
              </button>
            )}
          </div>

          <div>
            <h3 className="mb-4 text-xl font-semibold text-white">Available APIs</h3>
            {listings.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/40 py-12 text-center text-slate-400">
                No on-chain listings found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <ApiCard
                    key={listing.identifier}
                    api={listing}
                    onSelect={() => onSelectListing(listing.identifier)}
                    isSelected={selectedListing?.identifier === listing.identifier}
                    hasPermission={
                      selectedListing?.identifier === listing.identifier
                        ? permissionStatus?.permitted ?? false
                        : false
                    }
                    reputation={reputationScores?.get(listing.identifier)}
                    onRatingSubmit={
                      onSubmitRating
                        ? (rating) => onSubmitRating(listing.identifier, rating)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {selectedListing && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">API Details</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {selectedReputation && (
                  <div className="md:col-span-1">
                    <ReputationPanel reputation={selectedReputation} />
                  </div>
                )}

                <div className={`${selectedReputation ? 'md:col-span-2' : 'md:col-span-3'}`}>
                  <div className="space-y-5 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl shadow-black/20">
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-white">Description</h4>
                      <p className="text-sm text-slate-400">{selectedListing.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500">Currency</label>
                        <p className="font-medium text-slate-100">{selectedListing.currency}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Price</label>
                        <p className="font-medium text-blue-400">{formatMicroAlgos(selectedListing.priceMicroAlgos)}</p>
                      </div>
                    </div>

                    {permissionStatus?.permitted ? (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="size-2 rounded-full bg-emerald-400" />
                          <span className="text-sm font-medium text-emerald-200">Access Granted</span>
                        </div>
                        <p className="break-all font-mono text-xs text-emerald-100/80">
                          {selectedListing.endpoint || 'Loading endpoint...'}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onPayForAccess}
                        disabled={paymentBusy || loadingPermission}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {paymentBusy ? 'Submitting payment...' : 'Pay for access'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="space-y-6">
          <PurchaseHistoryPanel
            network={network}
            appId={appId ?? null}
            userAddress={activeAddress ?? null}
            isConnected={!!activeAddress}
            onRatingSubmit={onSubmitRating}
          />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {marketplaceAnalytics && <StatsGrid analytics={marketplaceAnalytics} type="marketplace" />}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {marketplaceAnalytics && <MarketplaceAnalyticsChart data={marketplaceAnalytics} />}

            {selectedListing && apiAnalytics && (
              <div className="space-y-4">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                    <TrendingUp size={20} />
                    {selectedListing.title} Performance
                  </h3>
                </div>
                {loadingAnalytics ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/40 py-12 text-center text-slate-400">
                    Loading analytics...
                  </div>
                ) : (
                  <>
                    <StatsGrid analytics={apiAnalytics} type="api" />
                    <AnalyticsChart data={apiAnalytics} />
                  </>
                )}
              </div>
            )}
          </div>

          {!selectedListing && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/40 py-12 text-center text-slate-400">
              Select an API to view its analytics
            </div>
          )}
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRefreshEarnings}
              disabled={loadingEarnings}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} />
              {loadingEarnings ? 'Refreshing...' : 'Refresh earnings'}
            </button>
          </div>

          {earnings ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl shadow-black/20">
                <h3 className="text-xl font-semibold text-white">Provider Account</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500">Contract Address</label>
                    <p className="break-all font-mono text-xs text-slate-200">{earnings.appAddress}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Total Balance</label>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-blue-400">
                        {formatMicroAlgos(earnings.balanceMicroAlgos)}
                      </span>
                      <span className="text-slate-400">ALGO</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-6 shadow-2xl shadow-black/20">
                <h3 className="text-xl font-semibold text-white">Recent Payments</h3>
                {earnings.recentPayments.length === 0 ? (
                  <p className="text-sm text-slate-400">No recent payments</p>
                ) : (
                  <div className="space-y-2">
                    {earnings.recentPayments.map((payment) => (
                      <div
                        key={payment.id || `${payment.sender}-${payment.confirmedRound ?? 'pending'}`}
                        className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-blue-500/40 hover:bg-slate-900"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="size-2 flex-shrink-0 rounded-full bg-emerald-400" />
                          <div className="min-w-0">
                            <p className="truncate font-mono text-sm text-slate-200">
                              {payment.sender ?? 'Unknown sender'}
                            </p>
                            <p className="text-xs text-slate-500">
                              Round {payment.confirmedRound ?? 'pending'}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-semibold text-blue-400">
                            +{formatMicroAlgos(payment.amountMicroAlgos)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/40 py-12 text-center text-slate-400">
              No earnings data loaded.
            </div>
          )}
        </div>
      )}

      {activeTab === 'sdk' && <DeveloperSdkPanel appId={appId} selectedApiId={selectedListing?.identifier} />}
    </section>
  )
}
