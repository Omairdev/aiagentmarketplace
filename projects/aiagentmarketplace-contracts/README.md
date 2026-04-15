# AI API Marketplace Contracts

Algorand TypeScript (PuyaTs) smart contracts for the AI API Marketplace.

## Contract scope

This implementation starts with a unified contract (`AiApiMarketplace`) that includes:

- API Registry: `register_api`, `update_api`, `deactivate_api`, `get_api`, `list_apis_by_category`
- Payment / Access flow: `pay_for_access`, `create_payment_channel`, `verify_payment`, `release_to_publisher`, `handle_refund`
- Reputation: `submit_rating`, `get_reputation`, `flag_api`

## Build

```bash
npm install
npm run build
```

Build does all of the following:

1. Compile contracts with PuyaTs
2. Generate a typed TypeScript client at `src/client/AiApiMarketplaceClient.ts`
3. Sync ARC56 spec to frontend public contracts path

Main artifact path:

- `src/contracts/artifacts/AiApiMarketplace.arc56.json`

## Deploy (LocalNet)

```bash
algokit localnet start
npm run deploy:localnet
```

The deployment script is in `deploy-config.ts` and uses idempotent deployment options.

## Integration tests

```bash
algokit localnet start
npm run test
```

Tests are in `tests/contracts.e2e.spec.ts` and cover:

- Registry: register + read + category listing
- Access payments + payment-channel verification
- Reputation aggregation
