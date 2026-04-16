import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AiApiMarketplaceFactory } from './src/client/AiApiMarketplaceClient'

type SeedListing = {
  apiId: string
  title: string
  description: string
  endpoint: string
  category: string
  publisher: string
  priceMicroAlgos: bigint
}

const seedListings: SeedListing[] = [
  {
    apiId: 'weather-v1',
    title: 'Weather API',
    description: 'Global weather insights with hourly and daily forecasts',
    endpoint: 'https://api.example.com/weather',
    category: 'weather',
    publisher: 'ravi',
    priceMicroAlgos: 1_000n,
  },
  {
    apiId: 'stock-v1',
    title: 'Stocks API',
    description: 'Realtime equities prices and intraday market snapshots',
    endpoint: 'https://api.example.com/stocks',
    category: 'finance',
    publisher: 'ravi',
    priceMicroAlgos: 3_000n,
  },
  {
    apiId: 'news-sentiment-v1',
    title: 'News Sentiment API',
    description: 'Sentiment scoring for headlines across major publications',
    endpoint: 'https://api.example.com/news/sentiment',
    category: 'analytics',
    publisher: 'ravi',
    priceMicroAlgos: 2_000n,
  },
  {
    apiId: 'crypto-prices-v1',
    title: 'Crypto Prices API',
    description: 'Spot and OHLC crypto price feed across top exchanges',
    endpoint: 'https://api.example.com/crypto',
    category: 'finance',
    publisher: 'ravi',
    priceMicroAlgos: 1_500n,
  },
  {
    apiId: 'geo-intel-v1',
    title: 'Geo Intelligence API',
    description: 'IP-to-location, region mapping, and timezone enrichment',
    endpoint: 'https://api.example.com/geo',
    category: 'location',
    publisher: 'ravi',
    priceMicroAlgos: 1_200n,
  },
  {
    apiId: 'image-moderation-v1',
    title: 'Image Moderation API',
    description: 'Detect NSFW, violence, and unsafe visual content signals',
    endpoint: 'https://api.example.com/moderation/image',
    category: 'safety',
    publisher: 'ravi',
    priceMicroAlgos: 2_500n,
  },
]

const box = (name: string | Uint8Array) => ({ appId: 0n, name })

async function seedMarketplaceListings(appClient: Awaited<ReturnType<AiApiMarketplaceFactory['deploy']>>['appClient']) {
  for (const listing of seedListings) {
    const existing = await appClient.send.getApi({
      args: { apiId: listing.apiId },
      boxReferences: [box(`api:${listing.apiId}`)],
      suppressLog: true,
    })

    if (existing.return) {
      continue
    }

    await appClient.send.registerApi({
      args: listing,
      boxReferences: [
        box(`api:${listing.apiId}`),
        box(`price:${listing.apiId}`),
        box(`publisher:${listing.apiId}`),
        box(`status:${listing.apiId}`),
        box(`category:${listing.category}`),
      ],
      suppressLog: true,
    })
  }
}

export async function deploy() {
  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  const factory = new AiApiMarketplaceFactory({
    algorand,
    defaultSender: deployer.addr,
  })

  const { appClient, result } = await factory.deploy({
    onSchemaBreak: 'append',
    onUpdate: 'append',
    createParams: {
      method: 'create',
      args: [],
    },
  })

  if (result.operationPerformed === 'create' || result.operationPerformed === 'replace') {
    await algorand.send.payment({
      amount: (2).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    })
  }

  await seedMarketplaceListings(appClient)

  console.log(`AiApiMarketplace appId: ${appClient.appId.toString()}`)
  return appClient.appId
}

if (process.argv[1]?.endsWith('deploy-config.ts')) {
  deploy().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
