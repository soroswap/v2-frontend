# Wallet & Global State Module

> **Living document.** Read this before modifying the module. Update it in the same change whenever the module's behavior, endpoints, files, or dependencies change.

**Source:** `src/contexts/` · **Last verified:** 2026-09-04

## Purpose

Two responsibilities: the wallet connection (address, kit instance, transaction signing) exposed as a React context, and the persisted user settings held in Zustand stores. Every transaction in the app, swap, liquidity, vault, and bridge trustline, is signed through this module's `signTransaction`.

## Structure

| File | Purpose |
|---|---|
| `UserContext.tsx` | `UserProvider`, `UserContext`, `useUserContext`. Wallet kit lifecycle and signing. |
| `store/swap-settings.tsx` | `useSwapSettingsStore`, persisted under `swap-settings-storage`. |
| `store/pools-settings.tsx` | `usePoolsSettingsStore`, persisted under `pools-settings-storage`. |
| `index.ts` / `store/index.ts` | Barrels. |

## Public surface

- `useUserContext()` returns `{ address, setAddress, kit, connectWallet, disconnect, signTransaction, selectedWallet }` (`UserContext.tsx:24-32`).
- `useSwapSettingsStore()` returns `{ swapSettings, setSwapSettings }` (`store/swap-settings.tsx:6-9`).
- `usePoolsSettingsStore()` returns `{ poolsSettings, setPoolsSettings }` (`store/pools-settings.tsx:6-9`).

## Key methods

- **Kit construction** (`UserContext.tsx:46-74`) runs once inside an effect guarded by `kitRef`, only when `window` exists. Modules are `allowAllModules()` plus `LedgerModule` plus a `WalletConnectModule` whose `projectId` is checked into source at `:59` and whose `url` is `window.location.origin`, falling back to `https://app.soroswap.finance`.
- **`connectWallet()`** (`:76`) opens the kit modal, sets the chosen wallet on the kit, and stores the returned address.
- **`signTransaction(xdr, userAddress)`** (`:97`) calls `kit.signTransaction` and throws if `signedTxXdr` is falsy. It is the only signing path in the app.
- **Store persistence** uses Zustand `persist` middleware, so both settings survive reloads (`store/swap-settings.tsx:20-22`, `store/pools-settings.tsx:20-22`).

## Dependencies

- `@creit.tech/stellar-wallets-kit` (`package.json:15`), including the `ledger.module` and `walletconnect.module` subpath entry points.
- `STELLAR.WALLET_NETWORK` from `src/shared/lib/environmentVars.ts:47-50`, which is `WalletNetwork.TESTNET` or `WalletNetwork.PUBLIC` depending on `NEXT_PUBLIC_ENV`.
- `zustand` with the `persist` middleware.
- `DEFAULT_SWAP_SETTINGS` (`src/shared/lib/constants/swap.ts:4`) and `DEFAULT_POOLS_SETTINGS` (`src/shared/lib/constants/pools.ts:4`).
- `UserProvider` is mounted in the root layout (`src/app/layout.tsx:52`). Consumed by swap, pools, earn, and bridge.

## Gotchas & invariants

- **`signTransaction` passes `networkPassphrase: STELLAR.WALLET_NETWORK`** (`UserContext.tsx:105`), which is a `WalletNetwork` enum value, not the `STELLAR.NETWORK_PASSPHRASE` string defined right next to it in `src/shared/lib/environmentVars.ts:59-62`. The same substitution appears in the bridge trustline builder. Verify against the wallets-kit API before changing either, and change both together if you change one.
- **The connected address is not persisted.** It lives in React state only (`UserContext.tsx:39`), so a page reload disconnects the user even though the wallet extension is still authorized.
- Both settings stores are typed as `SwapSettings` (`store/pools-settings.tsx:7`). Pools reuses the swap shape rather than having its own type, so a field added for swap silently appears in pools settings too. The two defaults differ: pools omits `SDEX` from `protocols` (`src/shared/lib/constants/pools.ts:8-12` vs `src/shared/lib/constants/swap.ts:8-13`).
- `customSlippage` is a string, and `slippageBps` multiplies it by 100 (`src/shared/lib/utils/slippageBps.ts:2`). A TODO at `src/shared/lib/constants/swap.ts:6` flags that the default `"1"` may not mean what the UI implies.
- The WalletConnect `projectId` is a public client identifier, not a secret, but it is hardcoded rather than configured by env.

## Testing

No automated tests exist. Wallet behavior has to be checked manually against at least one browser wallet and one WalletConnect wallet on both networks.
