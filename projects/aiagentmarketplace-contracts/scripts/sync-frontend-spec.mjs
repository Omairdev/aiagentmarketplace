import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const source = resolve('src/contracts/artifacts/AiApiMarketplace.arc56.json')
const destination = resolve('../aiagentmarketplace-frontend/public/contracts/ai-api-marketplace.arc56.json')

mkdirSync(dirname(destination), { recursive: true })
copyFileSync(source, destination)
console.log(`Synced ARC56 spec to ${destination}`)
