import React, { useState } from 'react'
import { Send, Star } from 'lucide-react'
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
    <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">Rate this API</h4>
        {selectedRating > 0 && <span className="text-sm font-semibold text-amber-400">{selectedRating} / 5</span>}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleSubmitRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={submitting || isLoading}
              className="rounded-lg p-1 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Star
                size={22}
                className={star <= (hoverRating || selectedRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
              />
            </button>
          ))}
        </div>
      </div>

      {success && (
        <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          ✓ Thank you! Your rating has been recorded on-chain.
        </div>
      )}

      {submitting && (
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
          <Send size={14} className="animate-pulse text-blue-400" />
          <span>Submitting rating to blockchain...</span>
        </div>
      )}

      {!selectedRating && !success && (
        <p className="text-xs leading-5 text-slate-500">
          Click a star to rate your experience with this API
        </p>
      )}
    </div>
  )
}

export default RatingComponent
