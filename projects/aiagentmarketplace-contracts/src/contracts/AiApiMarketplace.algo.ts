import type { gtxn, uint64 } from '@algorandfoundation/algorand-typescript'
import { abimethod, arc4, assert, Box, Bytes, Global, GlobalState, itxn, Txn, Uint64 } from '@algorandfoundation/algorand-typescript'

const API_PREFIX = 'api:'
const API_PRICE_PREFIX = 'price:'
const API_CATEGORY_PREFIX = 'category:'
const API_PUBLISHER_PREFIX = 'publisher:'
const API_STATUS_PREFIX = 'status:'
const PERMISSION_PREFIX = 'permission:'
const CHANNEL_PREFIX = 'channel:'
const CHANNEL_STATUS_PREFIX = 'channel-status:'
const REPUTATION_SCORE_PREFIX = 'rep-score:'
const REPUTATION_COUNT_PREFIX = 'rep-count:'
const REPUTATION_FLAG_PREFIX = 'rep-flag:'

export default class AiApiMarketplace extends arc4.Contract {
  public apiCount = GlobalState<uint64>({ initialValue: Uint64(0) })
  public activeApiCount = GlobalState<uint64>({ initialValue: Uint64(0) })

  @abimethod({ onCreate: 'require' })
  public create(): void {
    this.apiCount.value = Uint64(0)
    this.activeApiCount.value = Uint64(0)
  }

  // -----------------------
  // API REGISTRY
  // -----------------------

  public register_api(
    apiId: string,
    title: string,
    description: string,
    endpoint: string,
    category: string,
    publisher: string,
    priceMicroAlgos: uint64,
  ): void {
    const listing = Box<string>({ key: `${API_PREFIX}${apiId}` })
    assert(!listing.exists, 'API already exists')

    listing.value = this.makeApiRecordJson(apiId, title, description, endpoint, category, publisher, priceMicroAlgos, true)

    const price = Box<uint64>({ key: `${API_PRICE_PREFIX}${apiId}` })
    price.value = priceMicroAlgos

    const publisherBox = Box<string>({ key: `${API_PUBLISHER_PREFIX}${apiId}` })
    publisherBox.value = publisher

    const statusBox = Box<uint64>({ key: `${API_STATUS_PREFIX}${apiId}` })
    statusBox.value = Uint64(1)

    this.appendCategoryIndex(category, apiId)

    this.apiCount.value = this.apiCount.value + Uint64(1)
    this.activeApiCount.value = this.activeApiCount.value + Uint64(1)
  }

  public update_api(
    apiId: string,
    title: string,
    description: string,
    endpoint: string,
    category: string,
    publisher: string,
    priceMicroAlgos: uint64,
  ): void {
    const listing = Box<string>({ key: `${API_PREFIX}${apiId}` })
    assert(listing.exists, 'API does not exist')

    listing.value = this.makeApiRecordJson(apiId, title, description, endpoint, category, publisher, priceMicroAlgos, true)

    const price = Box<uint64>({ key: `${API_PRICE_PREFIX}${apiId}` })
    price.value = priceMicroAlgos

    const publisherBox = Box<string>({ key: `${API_PUBLISHER_PREFIX}${apiId}` })
    publisherBox.value = publisher

    const statusBox = Box<uint64>({ key: `${API_STATUS_PREFIX}${apiId}` })
    statusBox.value = Uint64(1)

    this.appendCategoryIndex(category, apiId)
  }

  public deactivate_api(apiId: string): void {
    const listing = Box<string>({ key: `${API_PREFIX}${apiId}` })
    assert(listing.exists, 'API does not exist')

    const statusBox = Box<uint64>({ key: `${API_STATUS_PREFIX}${apiId}` })
    statusBox.value = Uint64(0)

    if (this.activeApiCount.value > Uint64(0)) {
      this.activeApiCount.value = this.activeApiCount.value - Uint64(1)
    }
  }

  @abimethod({ readonly: true })
  public get_api(apiId: string): string {
    const listing = Box<string>({ key: `${API_PREFIX}${apiId}` })
    return listing.get({ default: '' })
  }

  @abimethod({ readonly: true })
  public list_apis_by_category(category: string): string {
    const categoryBox = Box<string>({ key: `${API_CATEGORY_PREFIX}${category}` })
    return categoryBox.get({ default: '' })
  }

  // -----------------------
  // PAYMENTS AND ACCESS
  // -----------------------

  public pay_for_access(apiId: string, senderAddress: string, payment: gtxn.PaymentTxn): void {
    const listing = Box<string>({ key: `${API_PREFIX}${apiId}` })
    assert(listing.exists, 'API does not exist')

    const price = Box<uint64>({ key: `${API_PRICE_PREFIX}${apiId}` }).get({ default: Uint64(0) })
    const isActive = Box<uint64>({ key: `${API_STATUS_PREFIX}${apiId}` }).get({ default: Uint64(0) })
    assert(isActive === Uint64(1), 'API is deactivated')
    assert(price > Uint64(0), 'API price is not configured')
    assert(payment.receiver.bytes === Global.currentApplicationAddress.bytes, 'Payment must be sent to the app')
    assert(payment.amount === price, 'Incorrect payment amount')
    assert(payment.sender.bytes === Txn.sender.bytes, 'Payment sender must match the caller')

    // Store per-user permission: key = concat("p", apiId, sender_bytes)
    const permissionKey = Bytes('p').concat(Bytes(apiId)).concat(payment.sender.bytes)
    const permissionBox = Box<string>({ key: permissionKey })
    permissionBox.value = 'authorized'
  }

  @abimethod({ readonly: true })
  public check_access(apiId: string): boolean {
    // Check per-user permission: key = concat("p", apiId, sender_bytes)
    const permissionKey = Bytes('p').concat(Bytes(apiId)).concat(Txn.sender.bytes)
    const permissionBox = Box<string>({ key: permissionKey })
    return permissionBox.exists
  }

  public create_payment_channel(
    channelId: string,
    apiId: string,
    payer: string,
    publisher: string,
    amount: uint64,
    expiryRound: uint64,
  ): void {
    const channel = Box<string>({ key: `${CHANNEL_PREFIX}${channelId}` })
    assert(!channel.exists, 'Channel already exists')

    channel.value =
      `{"channelId":"${channelId}",` +
      `"apiId":"${apiId}",` +
      `"payer":"${payer}",` +
      `"publisher":"${publisher}",` +
      `"amount":"${itoa(amount)}",` +
      `"expiryRound":"${itoa(expiryRound)}",` +
      `"status":"open"}`

    const status = Box<uint64>({ key: `${CHANNEL_STATUS_PREFIX}${channelId}` })
    status.value = Uint64(1)
  }

  @abimethod({ readonly: true })
  public verify_payment(channelId: string): boolean {
    const channel = Box<string>({ key: `${CHANNEL_PREFIX}${channelId}` })
    return channel.exists
  }

  public release_to_publisher(channelId: string, publisher: arc4.Address, amount: uint64): void {
    assert(Txn.sender === Global.creatorAddress, 'Only creator can release funds')

    const channel = Box<string>({ key: `${CHANNEL_PREFIX}${channelId}` })
    assert(channel.exists, 'Channel does not exist')

    itxn
      .payment({
        receiver: publisher.native,
        amount,
      })
      .submit()

    const status = Box<uint64>({ key: `${CHANNEL_STATUS_PREFIX}${channelId}` })
    status.value = Uint64(2)
  }

  public handle_refund(channelId: string, payer: arc4.Address, amount: uint64): void {
    assert(Txn.sender === Global.creatorAddress, 'Only creator can process refunds')

    const channel = Box<string>({ key: `${CHANNEL_PREFIX}${channelId}` })
    assert(channel.exists, 'Channel does not exist')

    itxn
      .payment({
        receiver: payer.native,
        amount,
      })
      .submit()

    const status = Box<uint64>({ key: `${CHANNEL_STATUS_PREFIX}${channelId}` })
    status.value = Uint64(3)
  }

  // -----------------------
  // REPUTATION
  // -----------------------

  public submit_rating(apiId: string, rating: uint64): void {
    assert(rating >= Uint64(1), 'Rating must be at least 1')
    assert(rating <= Uint64(5), 'Rating must be at most 5')

    const scoreBox = Box<uint64>({ key: `${REPUTATION_SCORE_PREFIX}${apiId}` })
    const countBox = Box<uint64>({ key: `${REPUTATION_COUNT_PREFIX}${apiId}` })

    const currentScore = scoreBox.get({ default: Uint64(0) })
    const currentCount = countBox.get({ default: Uint64(0) })

    scoreBox.value = currentScore + rating
    countBox.value = currentCount + Uint64(1)
  }

  @abimethod({ readonly: true })
  public get_reputation(apiId: string): [uint64, uint64, uint64] {
    const score = Box<uint64>({ key: `${REPUTATION_SCORE_PREFIX}${apiId}` }).get({ default: Uint64(0) })
    const count = Box<uint64>({ key: `${REPUTATION_COUNT_PREFIX}${apiId}` }).get({ default: Uint64(0) })
    const flags = Box<uint64>({ key: `${REPUTATION_FLAG_PREFIX}${apiId}` }).get({ default: Uint64(0) })

    if (count === Uint64(0)) {
      return [Uint64(0), Uint64(0), flags]
    }

    const avgBps: uint64 = (score * Uint64(10000)) / (count * Uint64(5))
    return [avgBps, count, flags]
  }

  public flag_api(apiId: string): void {
    const flagBox = Box<uint64>({ key: `${REPUTATION_FLAG_PREFIX}${apiId}` })
    const currentFlags = flagBox.get({ default: Uint64(0) })
    flagBox.value = currentFlags + Uint64(1)
  }

  // -----------------------
  // INTERNAL HELPERS
  // -----------------------

  private makeApiRecordJson(
    apiId: string,
    title: string,
    description: string,
    endpoint: string,
    category: string,
    publisher: string,
    priceMicroAlgos: uint64,
    active: boolean,
  ): string {
    const activeValue = active ? 'true' : 'false'
    return (
      `{"id":"${apiId}",` +
      `"title":"${title}",` +
      `"description":"${description}",` +
      `"endpoint":"${endpoint}",` +
      `"category":"${category}",` +
      `"publisher":"${publisher}",` +
      `"currency":"ALGO",` +
      `"priceMicroAlgos":"${itoa(priceMicroAlgos)}",` +
      `"active":${activeValue}}`
    )
  }

  private appendCategoryIndex(category: string, apiId: string): void {
    const categoryBox = Box<string>({ key: `${API_CATEGORY_PREFIX}${category}` })
    const current = categoryBox.get({ default: '' })

    if (current === '') {
      categoryBox.value = apiId
      return
    }

    categoryBox.value = `${current},${apiId}`
  }

}

function itoa(i: uint64): string {
  const digits = Bytes`0123456789`
  const radix = digits.length
  if (i < radix) {
    return digits.at(i).toString()
  }
  return `${itoa(i / radix)}${digits.at(i % radix)}`
}
