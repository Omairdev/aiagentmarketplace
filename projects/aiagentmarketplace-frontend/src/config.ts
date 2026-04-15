export type MarketplaceNetwork = 'localnet' | 'testnet' | 'mainnet'

export interface NetworkSettings {
  algodServer: string
  algodToken: string
  indexerServer: string
  indexerToken: string
}

export interface MarketplaceConfig {
  defaultNetwork: MarketplaceNetwork
  appId: bigint | null
  appSpecUrl: string
  boxPrefix: string
  permissionBoxTemplate: string
  payForAccessMethod: string
  endpointKey: string
  apiTitleKey: string
  apiDescriptionKey: string
  apiPriceKey: string
  apiCurrencyKey: string
  publisherKey: string
  localnet: NetworkSettings
  testnet: NetworkSettings
  mainnet: NetworkSettings
}

const DEFAULT_TOKEN = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

function readStringEnv(name: string, fallback: string): string {
  return import.meta.env[name]?.trim() || fallback
}

function readBigIntEnv(name: string): bigint | null {
  const value = import.meta.env[name]?.trim()
  if (!value) {
    return null
  }

  try {
    return BigInt(value)
  } catch {
    return null
  }
}

function readNetworkSettings(prefix: 'LOCALNET' | 'TESTNET' | 'MAINNET', fallbackAlgodServer: string, fallbackIndexerServer: string): NetworkSettings {
  return {
    algodServer: readStringEnv(`VITE_${prefix}_ALGOD_SERVER`, fallbackAlgodServer),
    algodToken: readStringEnv(`VITE_${prefix}_ALGOD_TOKEN`, DEFAULT_TOKEN),
    indexerServer: readStringEnv(`VITE_${prefix}_INDEXER_SERVER`, fallbackIndexerServer),
    indexerToken: readStringEnv(`VITE_${prefix}_INDEXER_TOKEN`, DEFAULT_TOKEN),
  }
}

export const marketplaceConfig: MarketplaceConfig = {
  defaultNetwork: (readStringEnv('VITE_DEFAULT_NETWORK', 'localnet') as MarketplaceNetwork) ?? 'localnet',
  appId: readBigIntEnv('VITE_MARKETPLACE_APP_ID'),
  appSpecUrl: readStringEnv('VITE_MARKETPLACE_APP_SPEC_URL', '/contracts/ai-api-marketplace.arc56.json'),
  boxPrefix: readStringEnv('VITE_MARKETPLACE_BOX_PREFIX', 'api:'),
  permissionBoxTemplate: readStringEnv('VITE_MARKETPLACE_PERMISSION_BOX_TEMPLATE', 'permission:{apiId}'),
  payForAccessMethod: readStringEnv('VITE_MARKETPLACE_PAY_FOR_ACCESS_METHOD', 'pay_for_access'),
  endpointKey: readStringEnv('VITE_MARKETPLACE_ENDPOINT_KEY', 'endpoint'),
  apiTitleKey: readStringEnv('VITE_MARKETPLACE_API_TITLE_KEY', 'title'),
  apiDescriptionKey: readStringEnv('VITE_MARKETPLACE_API_DESCRIPTION_KEY', 'description'),
  apiPriceKey: readStringEnv('VITE_MARKETPLACE_API_PRICE_KEY', 'priceMicroAlgos'),
  apiCurrencyKey: readStringEnv('VITE_MARKETPLACE_API_CURRENCY_KEY', 'currency'),
  publisherKey: readStringEnv('VITE_MARKETPLACE_PUBLISHER_KEY', 'publisher'),
  localnet: readNetworkSettings('LOCALNET', 'http://localhost:4001', 'http://localhost:8980'),
  testnet: readNetworkSettings('TESTNET', 'https://testnet-api.algonode.cloud', 'https://testnet-idx.algonode.cloud'),
  mainnet: readNetworkSettings('MAINNET', 'https://mainnet-api.algonode.cloud', 'https://mainnet-idx.algonode.cloud'),
}

export function getNetworkSettings(network: MarketplaceNetwork): NetworkSettings {
  return marketplaceConfig[network]
}

export function toAlgo(microAlgos: bigint | number): string {
  const raw = typeof microAlgos === 'number' ? BigInt(microAlgos) : microAlgos
  const sign = raw < 0n ? '-' : ''
  const absolute = raw < 0n ? -raw : raw
  const whole = absolute / 1_000_000n
  const fraction = (absolute % 1_000_000n).toString().padStart(6, '0')
  return `${sign}${whole.toString()}.${fraction}`
}
