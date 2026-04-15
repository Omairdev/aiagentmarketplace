import type { TransactionSigner } from 'algosdk'
import { marketplaceConfig, type MarketplaceNetwork } from '../config'
import {
  loadEarningsSnapshot,
  loadMarketplaceListings,
  loadPermissionStatus,
  payForAccess,
  type ApiListing,
  type EarningsSnapshot,
  type PermissionStatus,
} from '../lib/marketplace'
import {
  loadApiAnalytics,
  loadMarketplaceAnalytics,
  loadReputationScore,
  type ApiAnalytics,
  type MarketplaceAnalytics,
  type ReputationScore,
} from '../lib/analytics'

export interface MarketplaceSdkOptions {
  network: MarketplaceNetwork
  appId: bigint
  sender?: string
  transactionSigner?: TransactionSigner
}

export class MarketplaceSdk {
  private options: MarketplaceSdkOptions

  constructor(options: MarketplaceSdkOptions) {
    this.options = options
  }

  static fromRuntimeConfig(network: MarketplaceNetwork): MarketplaceSdk {
    if (!marketplaceConfig.appId) {
      throw new Error('VITE_MARKETPLACE_APP_ID must be configured to use MarketplaceSdk.fromRuntimeConfig()')
    }

    return new MarketplaceSdk({
      network,
      appId: marketplaceConfig.appId,
    })
  }

  withSigner(sender: string, transactionSigner: TransactionSigner): MarketplaceSdk {
    this.options = {
      ...this.options,
      sender,
      transactionSigner,
    }
    return this
  }

  setNetwork(network: MarketplaceNetwork): MarketplaceSdk {
    this.options = {
      ...this.options,
      network,
    }
    return this
  }

  async listApis(): Promise<ApiListing[]> {
    return loadMarketplaceListings(this.options.network, this.options.appId)
  }

  async getApiById(apiIdentifier: string): Promise<ApiListing | null> {
    const listings = await this.listApis()
    return listings.find((listing) => listing.identifier === apiIdentifier) ?? null
  }

  async getPermission(apiIdentifier: string, sender?: string): Promise<PermissionStatus> {
    const resolvedSender = sender ?? this.options.sender
    if (!resolvedSender) {
      throw new Error('Sender is required to check permissions')
    }

    const listing = await this.getApiById(apiIdentifier)
    if (!listing) {
      throw new Error(`API listing not found for identifier: ${apiIdentifier}`)
    }

    return loadPermissionStatus(this.options.network, this.options.appId, listing, resolvedSender)
  }

  async getEarnings(): Promise<EarningsSnapshot> {
    return loadEarningsSnapshot(this.options.network, this.options.appId)
  }

  async getApiAnalytics(apiIdentifier: string): Promise<ApiAnalytics> {
    return loadApiAnalytics(this.options.network, this.options.appId, apiIdentifier)
  }

  async getMarketplaceAnalytics(totalListingsHint = 0): Promise<MarketplaceAnalytics> {
    return loadMarketplaceAnalytics(this.options.network, this.options.appId, totalListingsHint)
  }

  getReputation(apiIdentifier: string): ReputationScore {
    return loadReputationScore(apiIdentifier)
  }

  async payForAccess(apiIdentifier: string): Promise<string> {
    const sender = this.options.sender
    const transactionSigner = this.options.transactionSigner

    if (!sender || !transactionSigner) {
      throw new Error('Sender and transactionSigner are required. Call withSigner() before payForAccess().')
    }

    const listing = await this.getApiById(apiIdentifier)
    if (!listing) {
      throw new Error(`API listing not found for identifier: ${apiIdentifier}`)
    }

    return payForAccess({
      network: this.options.network,
      appId: this.options.appId,
      sender,
      transactionSigner,
      apiListing: listing,
    })
  }
}
