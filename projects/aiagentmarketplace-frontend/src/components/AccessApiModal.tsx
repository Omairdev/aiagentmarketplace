import React, { useState } from 'react'
import { X, Copy } from 'lucide-react'
import type { ApiListing } from '../lib/marketplace'
import { RatingComponent } from './RatingComponent'

interface AccessApiModalProps {
  api: ApiListing
  isOpen: boolean
  onClose: () => void
  onSubmitRating: (rating: number) => Promise<void>
  ratingLoading?: boolean
}

export const AccessApiModal: React.FC<AccessApiModalProps> = ({
  api,
  isOpen,
  onClose,
  onSubmitRating,
  ratingLoading = false,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const generateCurlExample = (): string => {
    if (!api.endpoint) return 'curl https://api.example.com/endpoint'
    return `curl -H "Authorization: Bearer YOUR_API_KEY" "${api.endpoint}"`
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid #333',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>Access: {api.title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              padding: '4px',
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Endpoint Section */}
          {api.endpoint ? (
            <div style={{ backgroundColor: '#262626', borderRadius: '8px', padding: '12px' }}>
              <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>
                API Endpoint
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  padding: '8px',
                }}
              >
                <code
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    color: '#4CAF50',
                    userSelect: 'all',
                  }}
                >
                  {api.endpoint}
                </code>
                <button
                  onClick={() => handleCopyToClipboard(api.endpoint || '', 'endpoint')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: copiedField === 'endpoint' ? '#2196F3' : '#4285F4',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  <Copy size={14} />
                  {copiedField === 'endpoint' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ) : null}

          {/* Example Usage */}
          <div style={{ backgroundColor: '#262626', borderRadius: '8px', padding: '12px' }}>
            <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>
              Example Usage (curl)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                backgroundColor: '#1a1a1a',
                borderRadius: '4px',
                padding: '8px',
              }}
            >
              <code
                style={{
                  flex: 1,
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  color: '#FFB74D',
                  userSelect: 'all',
                  lineHeight: '1.4',
                }}
              >
                {generateCurlExample()}
              </code>
              <button
                onClick={() => handleCopyToClipboard(generateCurlExample(), 'curl')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: copiedField === 'curl' ? '#2196F3' : '#4285F4',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Copy size={14} />
                {copiedField === 'curl' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* API Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>
                Publisher
              </label>
              <p style={{ margin: 0, fontSize: '14px', color: '#fff' }}>{api.publisher || 'N/A'}</p>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>
                Price
              </label>
              <p style={{ margin: 0, fontSize: '14px', color: '#4CAF50' }}>
                {Number(api.priceMicroAlgos) / 1_000_000} ALGO
              </p>
            </div>
          </div>

          {/* Rating Section */}
          <RatingComponent
            apiListing={api}
            onSubmitRating={onSubmitRating}
            isLoading={ratingLoading}
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              backgroundColor: '#4285F4',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              width: '100%',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccessApiModal
