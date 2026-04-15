import { Star, TrendingUp, Users, Clock } from 'lucide-react'
import type { ReputationScore } from '../lib/analytics'
import { useState } from 'react'
import type { ApiListing } from '../lib/marketplace'
import AccessApiModal from './AccessApiModal'

interface ApiCardProps {
  api: ApiListing
  onSelect: () => void
  isSelected: boolean
  hasPermission: boolean
  reputation?: ReputationScore
  onRatingSubmit?: (rating: number) => Promise<void>
}

export function ApiCard({
  api,
  onSelect,
  isSelected,
  hasPermission,
  reputation,
  onRatingSubmit,
}: ApiCardProps) {
  const rating = reputation?.rating ?? 0
  const stars = Math.round(rating * 2) / 2
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false)

  const handleAccessClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasPermission) {
      setIsModalOpen(true)
    }
  }

  const handleSubmitRating = async (rating: number) => {
    if (!onRatingSubmit) return
    try {
      setIsRatingSubmitting(true)
      await onRatingSubmit(rating)
    } finally {
      setIsRatingSubmitting(false)
    }
  }

  return (
    <>
    <button
      onClick={onSelect}
      className={`text-left card transition-all ${
        isSelected
          ? 'ring-2 ring-accent-blue border-accent-blue'
          : 'hover:border-accent-blue/50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-dark-50">{api.title}</h3>
          <p className="text-sm text-dark-400 line-clamp-1">{api.description}</p>
        </div>
        {hasPermission && <span className="badge-success">Authorized</span>}
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold text-accent-blue">{Number(api.priceMicroAlgos) / 1_000_000} ALGO</span>
        {reputation && (
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i < Math.floor(stars)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-dark-600'
                  }
                />
              ))}
            </div>
            <span className="text-xs text-dark-400">{stars.toFixed(1)}</span>
          </div>
        )}
      </div>

      {api.endpoint && (
        <div className="text-xs text-dark-500 font-mono break-all">{api.endpoint}</div>
      )}

      <div className={`mt-3 pt-3 border-t border-dark-700 flex gap-4 text-xs ${
        reputation ? 'grid grid-cols-4' : ''
      }`}>
        {reputation && (
          <>
            <div className="flex items-center gap-1 text-dark-400">
              <TrendingUp size={12} />
              <span>{reputation.reliability}% uptime</span>
            </div>
            <div className="flex items-center gap-1 text-dark-400">
              <Clock size={12} />
              <span>{reputation.responseTime}ms</span>
            </div>
            <div className="flex items-center gap-1 text-dark-400">
              <Users size={12} />
              <span>{reputation.totalRatings} ratings</span>
            </div>
            {reputation.verified && (
              <span className="badge-success text-xs py-1 px-2">Verified</span>
            )}
          </>
        )}
      </div>
      
      {hasPermission && (
        <button
          onClick={handleAccessClick}
          className="mt-3 w-full px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded font-semibold text-sm transition-colors"
        >
          Access API
        </button>
      )}
    </button>

    <AccessApiModal
      api={api}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmitRating={handleSubmitRating}
      ratingLoading={isRatingSubmitting}
    />
    </>
  )
}
