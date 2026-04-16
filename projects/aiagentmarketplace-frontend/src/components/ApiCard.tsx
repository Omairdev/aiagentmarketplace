import { useState } from 'react'
import { CheckCircle2, Clock, Star, TrendingUp, Users } from 'lucide-react'
import type { ReputationScore } from '../lib/analytics'
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

  const handleAccessClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (hasPermission) {
      setIsModalOpen(true)
    }
  }

  const handleSubmitRating = async (nextRating: number) => {
    if (!onRatingSubmit) return

    try {
      setIsRatingSubmitting(true)
      await onRatingSubmit(nextRating)
    } finally {
      setIsRatingSubmitting(false)
    }
  }

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect()
          }
        }}
        className={`group flex h-full cursor-pointer flex-col rounded-3xl border bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 ${
          isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-700'
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-white group-hover:text-blue-300">
                {api.title}
              </h3>
              {reputation?.verified && (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              )}
            </div>
            <p className="line-clamp-2 text-sm text-slate-400">{api.description}</p>
          </div>
          {hasPermission && (
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              Authorized
            </span>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <span className="text-2xl font-bold text-blue-400">
            {Number(api.priceMicroAlgos) / 1_000_000} ALGO
          </span>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  size={14}
                  className={index < Math.floor(stars) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}
                />
              ))}
            </div>
            <span className="text-sm text-slate-400">{stars.toFixed(1)}</span>
          </div>
        </div>

        {api.endpoint && (
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 font-mono text-xs text-cyan-300 break-all">
            {api.endpoint}
          </div>
        )}

        <div className="mt-auto grid grid-cols-3 gap-3 text-xs text-slate-400">
          {reputation ? (
            <>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-400" />
                <div>
                  <div className="font-medium text-white">{reputation.reliability}%</div>
                  <div className="text-slate-500">uptime</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-400" />
                <div>
                  <div className="font-medium text-white">{reputation.responseTime}ms</div>
                  <div className="text-slate-500">response</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-violet-400" />
                <div>
                  <div className="font-medium text-white">{reputation.totalRatings}</div>
                  <div className="text-slate-500">ratings</div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-3 text-slate-500">Reputation data unavailable</div>
          )}
        </div>

        {hasPermission && (
          <button
            type="button"
            onClick={handleAccessClick}
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Access API
          </button>
        )}
      </article>

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
