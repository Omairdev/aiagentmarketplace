# AI API Marketplace Frontend

React frontend for the AI API Marketplace direct-to-contract integration.

## What this step covers

- Wallet connection with Pera, Defly, and Kibisis
- On-chain discovery from application box storage
- Permission lookup for a selected sender/API pair
- Direct pay-for-access contract calls through the Algorand SDK and AlgoKit Utils
- Provider earnings reads from the contract account and payment history

## Step 3 started: Developer SDK

This frontend now includes a reusable SDK entry point at `src/sdk/index.ts`.

Key exports:

- `MarketplaceSdk`
- `MarketplaceSdkOptions`
- Analytics, listing, permission, and earnings types

Main capabilities in `MarketplaceSdk`:

- `listApis()`
- `getPermission(apiId, sender)`
- `getApiAnalytics(apiId)`
- `getMarketplaceAnalytics(totalListingsHint)`
- `getEarnings()`
- `payForAccess(apiId)` via `withSigner(sender, transactionSigner)`

The app now also includes an SDK Harness view so you can verify the public SDK API surface without touching the lower-level marketplace helpers.

## Required runtime configuration

Copy `.env.example` to `.env` and set at least:

- `VITE_MARKETPLACE_APP_ID`
- `VITE_MARKETPLACE_APP_SPEC_URL`

The frontend expects the contract app spec to be available at the configured URL so it can build the app client for the payment flow.

## Local development

```bash
npm install
npm run dev
```

## Contract conventions

The discovery and permission lookups are driven by config so they can match the deployed contract's box naming scheme:

- API listings default to boxes prefixed with `api:`
- Permission records default to `permission:{apiId}:{sender}`
- The payment method defaults to `pay_for_access`

Adjust the `.env` values if the deployed contract uses different naming.
