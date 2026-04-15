import { Config, microAlgo } from '@algorandfoundation/algokit-utils'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { AiApiMarketplaceFactory } from '../src/client/AiApiMarketplaceClient'

describe('AiApiMarketplace', () => {
  const localnet = algorandFixture()
  const box = (name: string) => ({ appId: 0n, name })

  beforeAll(() => {
    Config.configure({ debug: true })
  })

  beforeEach(localnet.newScope, 15_000)

  const deployApp = async () => {
    const { testAccount } = localnet.context
    const factory = new AiApiMarketplaceFactory({
      algorand: localnet.algorand,
      defaultSender: testAccount.addr,
    })

    const { appClient } = await factory.deploy({
      onUpdate: 'append',
      onSchemaBreak: 'append',
      createParams: {
        method: 'create',
        args: [],
      },
    })

    // Fund app account to cover box MBR and inner tx fees for test scenarios.
    await localnet.algorand.send.payment({
      amount: (2).algo(),
      sender: testAccount.addr,
      receiver: appClient.appAddress,
    })

    return { appClient, testAccount }
  }

  test('register_api and get_api round-trip', async () => {
    const { appClient } = await deployApp()

    await appClient.send.registerApi({
      args: {
        apiId: 'weather-v1',
        title: 'Weather API',
        description: 'Global weather insights',
        endpoint: 'https://api.example.com/weather',
        category: 'weather',
        publisher: 'ravi',
        priceMicroAlgos: 1_000n,
      },
      boxReferences: [
        box('api:weather-v1'),
        box('price:weather-v1'),
        box('publisher:weather-v1'),
        box('status:weather-v1'),
        box('category:weather'),
      ],
    })

    const api = await appClient.send.getApi({
      args: { apiId: 'weather-v1' },
      boxReferences: [box('api:weather-v1')],
    })
    expect(api.return).toContain('"id":"weather-v1"')
    expect(api.return).toContain('"title":"Weather API"')

    const byCategory = await appClient.send.listApisByCategory({
      args: { category: 'weather' },
      boxReferences: [box('category:weather')],
    })
    expect(byCategory.return).toContain('weather-v1')
  })

  test('update_api and deactivate_api lifecycle', async () => {
    const { appClient } = await deployApp()

    await appClient.send.registerApi({
      args: {
        apiId: 'stock-v1',
        title: 'Stocks API',
        description: 'Realtime prices',
        endpoint: 'https://api.example.com/stocks',
        category: 'finance',
        publisher: 'ravi',
        priceMicroAlgos: 2_500n,
      },
      boxReferences: [
        box('api:stock-v1'),
        box('price:stock-v1'),
        box('publisher:stock-v1'),
        box('status:stock-v1'),
        box('category:finance'),
      ],
    })

    await appClient.send.createPaymentChannel({
      args: {
        channelId: 'channel-001',
        apiId: 'stock-v1',
        payer: 'payer-1',
        publisher: 'publisher-1',
        amount: 3_000n,
        expiryRound: 999_999n,
      },
      boxReferences: [box('channel:channel-001'), box('channel-status:channel-001')],
    })

    await appClient.send.updateApi({
      args: {
        apiId: 'stock-v1',
        title: 'Stocks API v2',
        description: 'Realtime prices with alerts',
        endpoint: 'https://api.example.com/stocks/v2',
        category: 'finance',
        publisher: 'ravi',
        priceMicroAlgos: 3_000n,
      },
      boxReferences: [
        box('api:stock-v1'),
        box('price:stock-v1'),
        box('publisher:stock-v1'),
        box('status:stock-v1'),
        box('category:finance'),
      ],
    })

    await appClient.send.deactivateApi({
      args: { apiId: 'stock-v1' },
      boxReferences: [box('api:stock-v1'), box('status:stock-v1')],
    })

    const api = await appClient.send.getApi({
      args: { apiId: 'stock-v1' },
      boxReferences: [box('api:stock-v1')],
    })
    expect(api.return).toContain('Stocks API v2')
  })

  test('pay_for_access grants per-user permission after payment', async () => {
    const { appClient, testAccount } = await deployApp()
    const userA = testAccount.addr.toString()

    // Create a second account for testing cross-user denial
    const userBAccount = await localnet.algorand.account.random()
    const userB = userBAccount.addr.toString()
    await localnet.algorand.send.payment({
      amount: (1).algo(),
      sender: testAccount.addr,
      receiver: userB,
    })

    // Helper to compute permission box name: concat("p", apiId, sender_bytes)
    // Uses native base32 utility to decode Algorand addresses
    const computePermissionBoxName = (apiId: string, senderAddr: string): Uint8Array => {
      const { decodeAddress } = require('algosdk')
      const prefix = new TextEncoder().encode('p')
      const apiIdBytes = new TextEncoder().encode(apiId)
      const senderBytes = decodeAddress(senderAddr).publicKey
      return new Uint8Array([...prefix, ...apiIdBytes, ...senderBytes])
    }

    // Register API
    await appClient.send.registerApi({
      args: {
        apiId: 'shared-api-v1',
        title: 'Shared API',
        description: 'API accessible by paying users only',
        endpoint: 'https://api.example.com/shared',
        category: 'payments',
        publisher: 'ravi',
        priceMicroAlgos: 1_000n,
      },
      boxReferences: [
        box('api:shared-api-v1'),
        box('price:shared-api-v1'),
        box('publisher:shared-api-v1'),
        box('status:shared-api-v1'),
        box('category:payments'),
      ],
    })

    // SCENARIO 1: User A pays for access
    const userAPermissionBoxName = computePermissionBoxName('shared-api-v1', userA)
    const paymentTxnA = await localnet.algorand.createTransaction.payment({
      amount: microAlgo(1_000),
      sender: userA,
      receiver: appClient.appAddress,
    })

    await appClient.send.payForAccess({
      sender: userA,
      signer: testAccount.signer,
      args: {
        apiId: 'shared-api-v1',
        senderAddress: userA,
        payment: {
          txn: paymentTxnA,
          signer: testAccount.signer,
        },
      },
      boxReferences: [
        box('api:shared-api-v1'),
        box('price:shared-api-v1'),
        box('status:shared-api-v1'),
        box(userAPermissionBoxName),
      ],
    })

    // SCENARIO 2: Verify User A has access
    const userAAccess = await appClient.send.checkAccess({
      sender: userA,
      signer: testAccount.signer,
      args: { apiId: 'shared-api-v1' },
      boxReferences: [box(userAPermissionBoxName)],
    })
    expect(userAAccess.return).toBe(true)

    // SCENARIO 3: Verify User B does NOT have access yet
    const userBPermissionBoxName = computePermissionBoxName('shared-api-v1', userB)
    const userBAccess = await appClient.send.checkAccess({
      sender: userB,
      signer: userBAccount.signer,
      args: { apiId: 'shared-api-v1' },
      boxReferences: [box(userBPermissionBoxName)],
    })
    expect(userBAccess.return).toBe(false)

    // SCENARIO 4: User B pays for access
    const paymentTxnB = await localnet.algorand.createTransaction.payment({
      amount: microAlgo(1_000),
      sender: userB,
      receiver: appClient.appAddress,
    })

    await appClient.send.payForAccess({
      sender: userB,
      signer: userBAccount.signer,
      args: {
        apiId: 'shared-api-v1',
        senderAddress: userB,
        payment: {
          txn: paymentTxnB,
          signer: userBAccount.signer,
        },
      },
      boxReferences: [
        box('api:shared-api-v1'),
        box('price:shared-api-v1'),
        box('status:shared-api-v1'),
        box(userBPermissionBoxName),
      ],
    })

    // SCENARIO 5: Verify User B now has access
    const userBAccessAfterPayment = await appClient.send.checkAccess({
      sender: userB,
      signer: userBAccount.signer,
      args: { apiId: 'shared-api-v1' },
      boxReferences: [box(userBPermissionBoxName)],
    })
    expect(userBAccessAfterPayment.return).toBe(true)

    // SCENARIO 6: Verify User A still has access (permission persists)
    const userAAccessVerify = await appClient.send.checkAccess({
      sender: userA,
      signer: testAccount.signer,
      args: { apiId: 'shared-api-v1' },
      boxReferences: [box(userAPermissionBoxName)],
    })
    expect(userAAccessVerify.return).toBe(true)
  })

  test('submit_rating and get_reputation aggregates score', async () => {
    const { appClient } = await deployApp()

    await appClient.send.submitRating({
      args: { apiId: 'sentiment-v1', rating: 4n },
      boxReferences: [box('rep-score:sentiment-v1'), box('rep-count:sentiment-v1')],
    })
    await appClient.send.submitRating({
      args: { apiId: 'sentiment-v1', rating: 5n },
      boxReferences: [box('rep-score:sentiment-v1'), box('rep-count:sentiment-v1')],
    })

    const reputation = await appClient.send.getReputation({
      args: { apiId: 'sentiment-v1' },
      boxReferences: [
        box('rep-score:sentiment-v1'),
        box('rep-count:sentiment-v1'),
        box('rep-flag:sentiment-v1'),
      ],
    })
    const [avgBps, count, flags] = reputation.return

    expect(count).toBe(2n)
    expect(flags).toBe(0n)
    expect(avgBps).toBe(9_000n)
  })
})
