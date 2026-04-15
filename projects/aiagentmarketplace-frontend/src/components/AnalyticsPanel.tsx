import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import type { ApiAnalytics, MarketplaceAnalytics } from '../lib/analytics'

interface AnalyticsChartProps {
  data: ApiAnalytics
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  return (
    <div className="card">
      <h3 className="subsection-title">Activity Trend (7 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data.weeklyTrend}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
          />
          <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface MarketplaceAnalyticsChartProps {
  data: MarketplaceAnalytics
}

export function MarketplaceAnalyticsChart({ data }: MarketplaceAnalyticsChartProps) {
  const chartData = [
    { name: 'Volume', value: Math.round(data.totalVolume) },
    { name: 'Transactions', value: Math.round(data.totalTransactions / 10) },
    { name: 'Active APIs', value: data.activeAPIs * 10 },
  ]

  return (
    <div className="card">
      <h3 className="subsection-title">Marketplace Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface StatsGridProps {
  analytics: ApiAnalytics | MarketplaceAnalytics
  type: 'api' | 'marketplace'
}

export function StatsGrid({ analytics, type }: StatsGridProps) {
  if (type === 'api') {
    const apiAnalytics = analytics as ApiAnalytics
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-xs text-dark-400 mb-1">Total Volume</div>
          <div className="text-2xl font-bold text-accent-blue">
            {apiAnalytics.totalVolumeAlgos.toFixed(2)} Ⓐ
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-dark-400 mb-1">Transactions</div>
          <div className="text-2xl font-bold text-accent-emerald">
            {apiAnalytics.totalTransactions}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-dark-400 mb-1">Unique Callers</div>
          <div className="text-2xl font-bold text-accent-purple">
            {apiAnalytics.uniqueCallers}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-dark-400 mb-1">Avg Call Value</div>
          <div className="text-2xl font-bold text-accent-pink">
            {apiAnalytics.avgCallValue.toFixed(4)} Ⓐ
          </div>
        </div>
      </div>
    )
  }

  const mkAnalytics = analytics as MarketplaceAnalytics
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="stat-card">
        <div className="text-xs text-dark-400 mb-1">Total Volume</div>
        <div className="text-2xl font-bold text-accent-blue">
          {mkAnalytics.totalVolume.toFixed(2)} Ⓐ
        </div>
      </div>
      <div className="stat-card">
        <div className="text-xs text-dark-400 mb-1">Total APIs</div>
        <div className="text-2xl font-bold text-accent-emerald">{mkAnalytics.totalAPIs}</div>
      </div>
      <div className="stat-card">
        <div className="text-xs text-dark-400 mb-1">Total Transactions</div>
        <div className="text-2xl font-bold text-accent-purple">
          {mkAnalytics.totalTransactions}
        </div>
      </div>
      <div className="stat-card">
        <div className="text-xs text-dark-400 mb-1">Avg Price</div>
        <div className="text-2xl font-bold text-accent-pink">
          {mkAnalytics.avgPrice.toFixed(4)} Ⓐ
        </div>
      </div>
    </div>
  )
}
