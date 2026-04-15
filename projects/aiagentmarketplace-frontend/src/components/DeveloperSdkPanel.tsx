interface DeveloperSdkPanelProps {
  appId?: bigint | null
  selectedApiId?: string
}

export function DeveloperSdkPanel({ appId, selectedApiId }: DeveloperSdkPanelProps) {
  const appIdText = appId ? `${appId.toString()}n` : '123456789n'
  const apiIdText = selectedApiId ?? 'weather-pro'

  const installSnippet = `npm install @algorandfoundation/algokit-utils @txnlab/use-wallet-react algosdk`

  const usageSnippet = `import { MarketplaceSdk } from './sdk'

const sdk = new MarketplaceSdk({
  network: 'testnet',
  appId: ${appIdText},
})

const apis = await sdk.listApis()
const permission = await sdk.getPermission('${apiIdText}', walletAddress)
const analytics = await sdk.getApiAnalytics('${apiIdText}')`

  const paymentSnippet = `const sdk = new MarketplaceSdk({
  network: 'testnet',
  appId: ${appIdText},
}).withSigner(activeAddress, transactionSigner)

const txId = await sdk.payForAccess('${apiIdText}')
console.log('Payment txId:', txId)`

  return (
    <div className="space-y-6">
      <div className="card-premium">
        <h3 className="subsection-title">Step 3: Developer SDK</h3>
        <p className="text-dark-300 text-sm">
          Use the Marketplace SDK to integrate listing discovery, permission checks,
          analytics, and pay-for-access flows in external apps and agent runtimes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h4 className="font-semibold text-dark-100">1) Install Dependencies</h4>
          <pre className="bg-dark-950 border border-dark-700 rounded-lg p-4 overflow-x-auto text-xs text-dark-200">
            <code>{installSnippet}</code>
          </pre>
        </div>

        <div className="card space-y-3">
          <h4 className="font-semibold text-dark-100">2) Query Marketplace Data</h4>
          <pre className="bg-dark-950 border border-dark-700 rounded-lg p-4 overflow-x-auto text-xs text-dark-200">
            <code>{usageSnippet}</code>
          </pre>
        </div>
      </div>

      <div className="card space-y-3">
        <h4 className="font-semibold text-dark-100">3) Execute Access Payment</h4>
        <pre className="bg-dark-950 border border-dark-700 rounded-lg p-4 overflow-x-auto text-xs text-dark-200">
          <code>{paymentSnippet}</code>
        </pre>
      </div>

      <div className="card">
        <h4 className="font-semibold text-dark-100 mb-3">SDK Surface</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-dark-300">
          <p>listApis(): Discover all on-chain APIs</p>
          <p>getPermission(apiId, sender): Check access status</p>
          <p>getEarnings(): Read app earnings snapshot</p>
          <p>getApiAnalytics(apiId): Usage and trend data</p>
          <p>getMarketplaceAnalytics(): Global marketplace metrics</p>
          <p>payForAccess(apiId): Execute contract payment call</p>
        </div>
      </div>
    </div>
  )
}
