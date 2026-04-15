import { useState } from 'react'
import { RefreshCw, TrendingUp, Shield } from 'lucide-react'
import type { ApiListing, EarningsSnapshot, PermissionStatus } from '../lib/marketplace'
import type { ApiAnalytics, ReputationScore, MarketplaceAnalytics } from '../lib/analytics'
import { formatMicroAlgos, checkUserAccess, type MarketplaceNetwork } from '../lib/marketplace'
import { ApiCard } from './ApiCard'
import { AnalyticsChart, MarketplaceAnalyticsChart, StatsGrid } from './AnalyticsPanel'
import { ReputationPanel } from './ReputationPanel'
import { DeveloperSdkPanel } from './DeveloperSdkPanel'
import { PurchaseHistoryPanel } from './PurchaseHistoryPanel'
import { RatingComponent } from './RatingComponent'

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
  const [userAccessCache, setUserAccessCache] = useState<Map<string, boolean>>(new Map())
  const [checkingAccess, setCheckingAccess] = useState(false)

  const selectedReputation = selectedListing && reputationScores?.get(selectedListing.identifier)

  return (
    <section className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-dark-700 flex-wrap">
        {(['browse', 'purchases', 'analytics', 'earnings', 'sdk'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === tab
                ? 'text-accent-blue border-b-2 border-accent-blue'
                : 'text-dark-400 hover:text-dark-200'
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

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={onRefreshListings}
              disabled={loadingListings}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw size={16} />
              {loadingListings ? 'Refreshing...' : 'Refresh listings'}
            </button>
            {selectedListing && (
              <button
                type="button"
                onClick={onRefreshPermission}
                disabled={loadingPermission}
                className="btn-secondary flex items-center gap-2"
              >
                <Shield size={16} />
                {loadingPermission ? 'Checking...' : 'Check access'}
              </button>
            )}
          </div>

          {/* API Listings Grid */}
          <div>
            <h3 className="subsection-title">Available APIs</h3>
            {listings.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-dark-400">No on-chain listings found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Selected API Details */}
          {selectedListing && (
            <div className="space-y-4">
              <h3 className="subsection-title">API Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Reputation Panel */}
                {selectedReputation && (
                  <div className="md:col-span-1">
                    <ReputationPanel reputation={selectedReputation} />
                  </div>
                )}

                {/* Details and Access */}
                <div className={`${selectedReputation ? 'md:col-span-2' : 'md:col-span-3'}`}>
                  <div className="card space-y-4">
                    <div>
                      <h4 className="font-semibold text-dark-100 mb-2">Description</h4>
                      <p className="text-dark-400 text-sm">{selectedListing.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-dark-400">Currency</label>
                        <p className="font-medium text-dark-100">{selectedListing.currency}</p>
                      </div>
                      <div>
                        <label className="text-xs text-dark-400">Price</label>
                        <p className="font-medium text-accent-blue">
                          {formatMicroAlgos(selectedListing.priceMicroAlgos)}
                        </p>
                      </div>
                    </div>

                    {permissionStatus?.permitted ? (
                      <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-sm font-medium text-emerald-300">
                            Access Granted
                          </span>
                        </div>
                        <p className="text-xs text-emerald-300/80 font-mono break-all">
                          {selectedListing.endpoint || 'Loading endpoint...'}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onPayForAccess}
                        disabled={paymentBusy || loadingPermission}
                        className="btn-primary w-full"
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

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
              {/* Purchases Tab */}
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

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
        <div className="space-y-6">
          {marketplaceAnalytics && <StatsGrid analytics={marketplaceAnalytics} type="marketplace" />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {marketplaceAnalytics && <MarketplaceAnalyticsChart data={marketplaceAnalytics} />}

            {selectedListing && apiAnalytics && (
              <div className="space-y-4">
                <div>
                  <h3 className="subsection-title flex items-center gap-2">
                    <TrendingUp size={20} />
                    {selectedListing.title} Performance
                  </h3>
                </div>
                {loadingAnalytics ? (
                  <div className="card text-center py-12">
                    <p className="text-dark-400">Loading analytics...</p>
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
            <div className="card text-center py-12">
              <p className="text-dark-400">Select an API to view its analytics</p>
            </div>
          )}
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRefreshEarnings}
              disabled={loadingEarnings}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw size={16} />
              {loadingEarnings ? 'Refreshing...' : 'Refresh earnings'}
            </button>
          </div>

          {earnings ? (
            <div className="space-y-6">
              <div className="card-premium">
                <h3 className="subsection-title">Provider Account</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-dark-400">Contract Address</label>
                    <p className="font-mono text-xs text-dark-200 break-all">
                      {earnings.appAddress}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Total Balance</label>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-accent-blue">
                        {formatMicroAlgos(earnings.balanceMicroAlgos)}
                      </span>
                      <span className="text-dark-400">ALGO</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="subsection-title">Recent Payments</h3>
                {earnings.recentPayments.length === 0 ? (
                  <p className="text-dark-400 text-sm">No recent payments</p>
                ) : (
                  <div className="space-y-2">
                    {earnings.recentPayments.map((payment) => (
                      <div
                        key={payment.id || `${payment.sender}-${payment.confirmedRound ?? 'pending'}`}
                        className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-dark-200 font-mono truncate">
                              {payment.sender ?? 'Unknown sender'}
                            </p>
                            <p className="text-xs text-dark-500">
                              Round {payment.confirmedRound ?? 'pending'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-accent-blue">
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
            <div className="card text-center py-12">
              <p className="text-dark-400">No earnings data loaded.</p>
            </div>
          )}
        </div>
      )}

      {/* Developer SDK Tab */}
      {activeTab === 'sdk' && (
        <DeveloperSdkPanel appId={appId} selectedApiId={selectedListing?.identifier} />
      )}
    </section>
  )
}
