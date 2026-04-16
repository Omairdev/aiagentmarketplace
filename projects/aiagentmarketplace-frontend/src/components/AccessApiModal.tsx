import React, { useState } from 'react'
import { Copy, X } from 'lucide-react'
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Access: {api.title}</h2>
            <p className="mt-1 text-sm text-slate-400">Copy the endpoint, review usage, and rate this API.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-950/60 p-2 text-slate-300 transition hover:border-blue-500/40 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4">
          {api.endpoint ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
                API Endpoint
              </label>
              <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3 sm:flex-row sm:items-center">
                <code className="flex-1 break-all font-mono text-xs text-cyan-300 select-all">
                  {api.endpoint}
                </code>
                <button
                  onClick={() => handleCopyToClipboard(api.endpoint || '', 'endpoint')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                >
                  <Copy size={14} />
                  {copiedField === 'endpoint' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
              Example Usage (curl)
            </label>
            <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3 sm:flex-row sm:items-start">
              <code className="flex-1 break-all font-mono text-xs leading-6 text-amber-200 select-all">
                {generateCurlExample()}
              </code>
              <button
                onClick={() => handleCopyToClipboard(generateCurlExample(), 'curl')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:border-blue-500/40 hover:bg-slate-800"
              >
                <Copy size={14} />
                {copiedField === 'curl' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Publisher</label>
              <p className="text-sm text-white">{api.publisher || 'N/A'}</p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Price</label>
              <p className="text-sm text-blue-400">{Number(api.priceMicroAlgos) / 1_000_000} ALGO</p>
            </div>
          </div>

          <RatingComponent
            apiListing={api}
            onSubmitRating={onSubmitRating}
            isLoading={ratingLoading}
          />

          <button
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccessApiModal
