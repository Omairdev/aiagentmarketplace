import React, { useState } from 'react'
import { Star, Send } from 'lucide-react'
import type { ApiListing } from '../lib/marketplace'

interface RatingComponentProps {
  apiListing: ApiListing
  onSubmitRating: (rating: number) => Promise<void>
  isLoading?: boolean
}

export const RatingComponent: React.FC<RatingComponentProps> = ({
  apiListing,
  onSubmitRating,
  isLoading = false,
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [selectedRating, setSelectedRating] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmitRating = async (rating: number) => {
    if (rating < 1 || rating > 5) {
      return
    }

    try {
      setSubmitting(true)
      await onSubmitRating(rating)
      setSelectedRating(rating)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Rating submission error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#262626',
        borderRadius: '8px',
        border: '1px solid #333',
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#fff' }}>
        Rate this API
      </h4>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleSubmitRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={submitting || isLoading}
              style={{
                background: 'none',
                border: 'none',
                cursor: submitting || isLoading ? 'not-allowed' : 'pointer',
                padding: '4px',
                opacity: submitting || isLoading ? 0.6 : 1,
              }}
            >
              <Star
                size={24}
                style={{
                  fill: star <= (hoverRating || selectedRating) ? '#FFB800' : '#DDD',
                  color: star <= (hoverRating || selectedRating) ? '#FFB800' : '#DDD',
                  transition: 'all 0.2s ease',
                }}
              />
            </button>
          ))}
        </div>

        {selectedRating > 0 && (
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFB800' }}>
            {selectedRating} / 5 Stars
          </span>
        )}
      </div>

      {success && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#1B5E20',
            borderRadius: '4px',
            color: '#81C784',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          ✓ Thank you! Your rating has been recorded on-chain.
        </div>
      )}

      {submitting && (
        <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
          <span style={{ color: '#BBB' }}>Submitting rating to blockchain...</span>
        </div>
      )}

      {!selectedRating && !success && (
        <p style={{ margin: '0', fontSize: '12px', color: '#999', lineHeight: '1.4' }}>
          Click a star to rate your experience with this API
        </p>
      )}
    </div>
  )
}

export default RatingComponent
