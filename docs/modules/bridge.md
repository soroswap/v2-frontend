# Bridge Module (Rozo)

> **Living document.** Read this before modifying the module. Update it in the same change whenever the module's behavior, endpoints, files, or dependencies change.

**Source:** `src/features/bridge/` · **Last verified:** 2026-09-04

## Purpose

Moves USDC between Stellar and EVM/Solana chains using the Rozo intent-pay SDK. Unlike swap, pools, and earn, this module does **not** go through this repo's `/api` routes for the bridge itself: the Rozo SDK talks to Rozo's own backend from the browser. The only local API call is `/api/send`, used to submit the Stellar USDC trustline transaction.

## Structure

| File | Purpose |
|---|---|
| `providers/RozoProvider.tsx` | Wraps the page in `RozoWagmiProvider`, a React Query client, and `RozoPayProvider`, handing the Stellar Wallets Kit instance to Rozo. |
| `hooks/useBridgeController.tsx` | The whole feature controller: form reducer, debounced fee quoting, Rozo payment config, history writes. |
| `hooks/useGetFee.ts` | React Query wrapper over `getFee` from `@rozoai/intent-common`. |
| `hooks/useUSDCTrustline.tsx` | Checks account existence, XLM balance, and USDC trustline; creates the trustline. |
| `hooks/useBridgeState.tsx` | Derives a single readiness state from account and trustline status. |
| `hooks/useBridgeValidation.tsx` | Single source of truth for whether the bridge button is enabled and why not. |
| `utils/bridge.ts` | Horizon lookups for XLM balance and USDC trustline. |
| `utils/history.ts` | `localStorage` bridge history, keyed by wallet address. |
| `constants/bridge.ts` | `BRIDGE_APP_ID` and the mainnet/testnet USDC issuers. |
| `components/` | `BridgeLayout` (hosts the `RozoPayButton`), panels, chain selector, history, footer. |
| `types/` | `bridge.ts`, `history.ts`, `rozo.ts` (`IntentPayConfig`). |

## Public surface

No barrel export. `src/app/bridge/page.tsx` imports `RozoProvider`, `BridgeLayout`, and `BridgeFooter` by path.

## Key methods

- **`useBridgeController()`** (`hooks/useBridgeController.tsx:188`) owns a reducer with `TYPE_INPUT`, `SWITCH_CHAINS`, `SET_DESTINATION_ADDRESS`, `SET_DESTINATION_ADDRESS_ERROR`, `SET_DESTINATION_CHAIN` (`:68`). Direction is expressed as `isTokenSwitched = fromChain === "stellar"` (`:298`); the initial state is Base to Stellar (`:48-56`).
- **`createPaymentConfig`** (`hooks/useBridgeController.tsx:433`) assembles the `IntentPayConfig` (`:550-574`) and hands it to `resetPayment` from `useRozoPayUI`. When bridging out of Stellar it targets the selected chain's USDC and the typed destination address; otherwise it targets `rozoStellarUSDC` and the connected Stellar address. `paymentOptions` is `[Stellar]` when leaving Stellar and `[Ethereum, Solana]` when arriving (`:563-565`).
- **`useGetFee(params, options)`** (`hooks/useGetFee.ts:76`) calls `getFee` from `@rozoai/intent-common` and normalizes the response. `enabled` deliberately requires a positive amount **and** a destination address **and** both chain ids, so a doomed request is not fired on every keystroke (`:100-105`). `staleTime` is 30 s and retries are off.
- **fee validity gate** (`hooks/useBridgeController.tsx:264-268`) only trusts `feeData` when `feeData.amount === debouncedAmount === currentAmount`. This is what prevents a stale quote from a previous keystroke being shown against a newer amount. `getFeeRequest` mirrors the user's independent field into `amount` precisely so this comparison holds for both `ExactIn` and `ExactOut` (`hooks/useGetFee.ts:59-62`).
- **`useUSDCTrustline(autoCheck)`** (`hooks/useUSDCTrustline.tsx:54`) tracks `checkedAddressRef` and `checkingAddressRef` so a wallet switch never shows the previous wallet's trustline state. The returned status is derived at the end (`:259-275`) rather than reset in an effect.
- **`createTrustline`** (`hooks/useUSDCTrustline.tsx:183`) builds a `changeTrust` operation, signs it through `UserContext`, and submits it via `POST /api/send`.
- **`useBridgeState(trustlineData)`** (`hooks/useBridgeState.tsx:4`) returns one of `loading`, `account_creation_needed`, `insufficient_xlm`, `trustline_needed`, `ready`. The XLM threshold for creating a trustline is **1.5 XLM** (`:25`).
- **`handlePaymentCompleted(e)`** (`hooks/useBridgeController.tsx:673`) writes a history entry keyed by `e.rozoPaymentId` and then dispatches a `bridge-payment-completed` `CustomEvent` on `window`, which is how the history component refreshes.

## Dependencies

- **Rozo**: `@rozoai/intent-pay` `0.1.39` and `@rozoai/intent-common` `0.1.26` (`package.json:17-18`). `RozoPayProvider` receives the Stellar Wallets Kit instance directly (`providers/RozoProvider.tsx:53`).
- `@tanstack/react-query` is used **only** here; `RozoProvider` creates its own `QueryClient` (`providers/RozoProvider.tsx:31`). The rest of the app uses SWR.
- `@stellar/stellar-sdk` Horizon client for account and trustline reads.
- API module route `/api/send` for trustline submission.
- `useUserContext` for the kit, the address, and signing.
- External Rozo assets and links: `https://bridge.rozo.ai/...` images (`components/BridgeFooter.tsx:20-100`) and receipt links `https://invoice.rozo.ai/receipt?id=...` (`components/BridgeHistory.tsx:209`).

## Gotchas & invariants

- **Horizon is hardcoded to mainnet** in three places: `utils/bridge.ts:11`, `utils/bridge.ts:44`, and `hooks/useUSDCTrustline.tsx:193` all construct `new Horizon.Server("https://horizon.stellar.org")` instead of using `STELLAR.HORIZON_URL`. On testnet the trustline check and creation read and build against mainnet. The USDC asset itself *is* network-aware (`constants/bridge.ts:4-12`), so the two halves disagree.
- `TransactionBuilder` in `createTrustline` is passed `networkPassphrase: envVars.STELLAR.WALLET_NETWORK` (`hooks/useUSDCTrustline.tsx:208`), which is a `WalletNetwork` enum value, not `STELLAR.NETWORK_PASSPHRASE`. Verify against the SDK before relying on this path.
- `UserContext.signTransaction` has the same substitution (`src/contexts/UserContext.tsx:105`). Both are noted in the wallet-state doc.
- **Bridge history lives only in `localStorage`**, under `soroswap_bridge_history` keyed by wallet address (`utils/history.ts:3`). Clearing site data loses it; it is not recoverable from any backend.
- `RozoProvider` renders a loader until a `setTimeout(0)` has elapsed and the wallet kit exists (`providers/RozoProvider.tsx:35-47`). This defers `createConfig` off the SSR path because wallet connectors touch `window` and `localStorage`. Do not hoist the config to module scope.
- `useUSDCTrustline` is called with `autoCheck: false` from the controller (`hooks/useBridgeController.tsx:210`) but defaults to `true`; other callers get automatic checking.
- The bridge only ever moves USDC. Token symbols are hardcoded to `"USDC"` in the fee request (`hooks/useBridgeController.tsx:247`, `:250`).
- The page banner says Beta, not Alpha (`src/app/bridge/page.tsx:13`).

## Testing

No automated tests exist. This module has the most external moving parts, so test with small amounts against mainnet as the in-app banner instructs, and re-check the trustline flow whenever `useUSDCTrustline` changes.
