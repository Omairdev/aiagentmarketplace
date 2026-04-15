import React, { useEffect, useState } from 'react'
import { checkUserAccess, fetchUserPurchaseHistory, type ApiListing } from '../lib/marketplace'
import { marketplaceConfig, type MarketplaceNetwork } from '../config'
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
      // Visual feedback could be added here
      setTimeout(() => {
        setExpandedId(null)
      }, 1000)
    } catch (err) {
      console.error('Failed to copy:', err)
      const [modalOpen, setModalOpen] = useState(false)
      const [modalApi, setModalApi] = useState<ApiListing | null>(null)
      const [ratingSubmitting, setRatingSubmitting] = useState(false)
    }
  }

  const generateCurlExample = (api: ApiListing): string => {

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
    if (!api.endpoint) return 'curl https://example.com/api'
    return `curl -H "Authorization: Bearer YOUR_TOKEN" ${api.endpoint}`
  }
          <div style={{ padding: '20px', backgroundColor: '#262626', borderRadius: '8px', border: '1px solid #333' }}>
            <h3 style={{ marginBottom: '10px', color: '#fff' }}>Purchase History</h3>
            <p style={{ color: '#999' }}>Connect your wallet to view purchased APIs</p>
      <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '10px' }}>Purchase History</h3>
        <p style={{ color: '#666' }}>Connect your wallet to view purchased APIs</p>
      </div>
    )
        <>
        <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#fff' }}>
  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
        Your Purchased APIs ({purchasedApis.length})
            <p style={{ color: '#999', fontStyle: 'italic' }}>Loading purchase history...</p>

      {loading && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>Loading purchase history...</p>
            <div style={{ padding: '10px', backgroundColor: '#5D1F1F', borderRadius: '4px', color: '#FF6B6B', marginBottom: '15px' }}>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px', color: '#d32f2f', marginBottom: '15px' }}>
          <strong>Error:</strong> {error}
        </div>
            <p style={{ color: '#999' }}>No purchased APIs yet. Browse the marketplace to get started.</p>

      {!loading && purchasedApis.length === 0 && (
        <p style={{ color: '#999' }}>No purchased APIs yet. Browse the marketplace to get started.</p>
      )}

      <div style={{ display: 'grid', gap: '12px', marginTop: '15px' }}>
        {purchasedApis.map((api) => (
                  border: '1px solid #333',
            key={api.identifier}
            style={{
                  backgroundColor: '#262626',
              borderRadius: '6px',
              padding: '12px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#fff' }}>{api.title}</h4>
                    <p style={{ margin: '0', fontSize: '13px', color: '#999' }}>{api.description}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '12px', color: '#666' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{api.title}</h4>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>{api.description}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '12px', color: '#999' }}>
                  <span>📍 {api.publisher}</span>
                  <span>💰 {Number(api.priceMicroAlgos) / 1_000_000} ALGO</span>
                </div>
              </div>
              <div
                style={{
                  width: '24px',
                      backgroundColor: '#333',
                  display: 'flex',
                      fontSize: '14px',
                      color: '#ffb800',
                  justifyContent: 'center',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                {expandedId === api.identifier ? '▼' : '▶'}
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333' }}>
            </div>

                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '600', color: '#BBB' }}>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                {api.endpoint ? (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '600', color: '#333' }}>
                      Endpoint
                    </p>
                            backgroundColor: '#1a1a1a',
                      style={{
                        display: 'block',
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                            color: '#4CAF50',
                        borderRadius: '4px',
                        fontSize: '11px',
                        wordBreak: 'break-all',
                        userSelect: 'all',
                      }}
                    >
                      {api.endpoint}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyEndpoint(api.endpoint)
                      }}
                      style={{
                        marginTop: '6px',
                        padding: '6px 12px',
                        backgroundColor: '#4285F4',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        <button
                          onClick={(e) => handleOpenAccessModal(api, e)}
                          style={{
                            marginLeft: '6px',
                            marginTop: '6px',
                            padding: '6px 12px',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          📊 View & Rate
                        </button>
                      }}
                    >
                      📋 Copy Endpoint
                    </button>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '600', color: '#BBB' }}>
                ) : null}

                <div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '600', color: '#333' }}>
                    Example Usage
                  </p>
                          backgroundColor: '#1a1a1a',
                    style={{
                      display: 'block',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                          color: '#FFB74D',
                      borderRadius: '4px',
                      fontSize: '11px',
                      wordBreak: 'break-all',
                      userSelect: 'all',
                    }}
                  >
                    {generateCurlExample(api)}
                  </code>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <span
                          color: '#1a1a1a',
                      display: 'inline-block',
                      padding: '6px 12px',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    ✓ Authorized
                  </span>
                </div>
              </div>
            )}

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
        </>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PurchaseHistoryPanel
