import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AiApiMarketplaceFactory } from './src/client/AiApiMarketplaceClient'

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

  console.log(`AiApiMarketplace appId: ${appClient.appId.toString()}`)
  return appClient.appId
}

if (process.argv[1]?.endsWith('deploy-config.ts')) {
  deploy().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
