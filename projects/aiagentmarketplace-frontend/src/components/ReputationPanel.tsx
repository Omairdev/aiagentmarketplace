import { CheckCircle, AlertCircle, Star } from 'lucide-react'
import type { ReputationScore } from '../lib/analytics'

interface ReputationPanelProps {
  reputation: ReputationScore
  onViewDetails?: () => void
}

export function ReputationPanel({ reputation, onViewDetails }: ReputationPanelProps) {
  const rating = reputation.rating
  const stars = Math.round(rating * 2) / 2
  const isHighQuality = rating >= 4.0
  const isVerified = reputation.verified

  const allStars = [...Array(5)].map((_, i) => i < Math.floor(stars))

  return (
    <div className="card-premium">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="subsection-title">Quality & Trust</h3>
        </div>
        {isVerified && (
          <span className="badge-success flex items-center gap-1">
            <CheckCircle size={14} />
            Verified Provider
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-dark-400 mb-2">User Ratings</div>
          <div className="flex items-end gap-3">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={
                    i < Math.floor(stars)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-dark-600'
                  }
                />
              ))}
            </div>
            <span className="text-lg font-bold text-dark-100">{rating.toFixed(1)}</span>
          </div>
          <span className="text-xs text-dark-500">({reputation.totalRatings} ratings)</span>
        </div>

        <div>
          <div className="text-xs text-dark-400 mb-2">Service Level</div>
          <div className="flex items-center gap-2">
            {isHighQuality ? (
              <div className="flex items-center gap-1 px-3 py-2 bg-emerald-900/20 rounded-lg border border-emerald-700/50">
                <CheckCircle size={16} className="text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">Premium</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-3 py-2 bg-yellow-900/20 rounded-lg border border-yellow-700/50">
                <AlertCircle size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">Standard</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-dark-700/50 rounded-lg p-3">
          <div className="text-xs text-dark-400 mb-1">Reliability</div>
          <div className="relative w-full bg-dark-600 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-accent-blue to-accent-emerald h-2 rounded-full"
              style={{ width: `${reputation.reliability}%` }}
            />
          </div>
          <div className="text-xs text-dark-300 mt-1">{reputation.reliability}% uptime</div>
        </div>

        <div className="bg-dark-700/50 rounded-lg p-3">
          <div className="text-xs text-dark-400 mb-1">Response Time</div>
          <div className="text-lg font-bold text-dark-100">{reputation.responseTime}ms</div>
          <div className="text-xs text-dark-500">avg latency</div>
        </div>
      </div>

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="w-full btn-secondary text-sm"
        >
          View Detailed Report
        </button>
      )}
    </div>
  )
}

interface ReputationBadgeProps {
  reputation: ReputationScore
  size?: 'sm' | 'md' | 'lg'
}

export function ReputationBadge({ reputation, size = 'md' }: ReputationBadgeProps) {
  const rating = reputation.rating
  const stars = Math.round(rating * 2) / 2

  const sizeMap = {
    sm: { star: 12, text: 'text-xs' },
    md: { star: 16, text: 'text-sm' },
    lg: { star: 20, text: 'text-base' },
  }

  const { star, text } = sizeMap[size]

  return (
    <div className={`flex items-center gap-1 ${text}`}>
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={star}
            className={
              i < Math.floor(stars)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-dark-600'
            }
          />
        ))}
      </div>
      <span className="font-medium text-dark-200">{rating.toFixed(1)}</span>
    </div>
  )
}
