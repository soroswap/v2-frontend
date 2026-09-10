# Shared Module

> **Living document.** Read this before modifying the module. Update it in the same change whenever the module's behavior, endpoints, files, or dependencies change.

**Source:** `src/shared/` · **Last verified:** 2026-09-04

## Purpose

Cross-feature building blocks: the token list and user balance hooks every feature depends on, UI primitives, unit and currency formatting, and the environment/server plumbing. Because `useTokensList` feeds the swap picker, the pools table, and the earn table, a change here has the widest blast radius in the repo.

Note: `src/shared/lib/server/` and `src/shared/lib/environmentVars.ts` are documented in [api.md](api.md), since that is where they are used.

## Structure

| Path | Purpose |
|---|---|
| `hooks/useTokensList.ts` | Canonical token list plus `tokenMap` (by contract) and `tokenCodeMap` (by symbol). |
| `hooks/useUserBalances.ts` | Wallet balances with an O(1) lookup map and spendable-amount helper. |
| `hooks/useUserAssetList.ts` | Tokens the user added manually, read from `localStorage`. |
| `hooks/useAllTokensList.ts` | Curated list plus user-added tokens, merged. |
| `components/` | `TokenIcon`, `TheTable`, `Modal`, `AnnouncementDialog`, `Footer`, and `buttons/`. |
| `lib/utils/` | `parseUnits`/`formatUnits`, `calculateTvl`, `slippageBps`, `formatNumber`, `formatCurrency`, `formatAddress`, `cn`, `bigIntReplacer`, `isStellarAddress`, `validators`, `addUserToken`. |
| `lib/constants/` | `tokenList` (XLM fallback), `swap`, `pools`, `ipfsGateways`, `announcements`. |
| `lib/geo/blocked-countries.ts` | `BLOCKED_COUNTRIES` and `GEOBLOCKED_ERROR`, consumed by `src/proxy.ts`. |
| `providers/PostHogProvider.tsx` | PostHog init. Documented in [app-shell.md](app-shell.md). |

## Public surface

`hooks/index.ts:1-3` exports `useTokensList`, `useUserAssetList`, `useUserBalances`. Note `useAllTokensList` is **not** in the barrel. `components/index.ts:1-5` exports the buttons barrel, `Modal`, `TheTable`, `TokenIcon`, `AnnouncementDialog`. `lib/utils/index.ts:1-11` exports the utilities.

## Key methods

- **`useTokensList()`** (`hooks/useTokensList.ts:54`) fetches `/api/tokens` under the SWR key `token-list-${network}`, with a 12 hour deduping window and a 24 hour refresh (`:61-62`). `fallbackData` is precomputed at module load and contains only the XLM entry for the current network (`:41-52`), so the first render always has one token. It also derives `tokenMap` by contract and `tokenCodeMap` by uppercased code.
- **`useUserBalances(userAddress)`** (`hooks/useUserBalances.ts:90`) fetches `/api/balance` with a 1 minute deduping window and a 5 minute refresh. `getAvailableAmount` returns `available` for XLM and `amount` for everything else, because XLM has base reserves that are not spendable (`:129-141`).
- **`parseUnits` / `formatUnits`** (`lib/utils/parseUnits.tsx:5`, `:30`) convert between decimal strings and smallest units. Both default to `decimals = 7`.
- **`addUserToken(token)`** (`lib/utils/addUserToken.ts:3`) appends to `localStorage.userAddedTokens` and then dispatches a synthetic `StorageEvent` (`:27-33`) so `useUserAssetList` in the same tab picks up the change. A native `storage` event only fires in *other* tabs, which is why the synthetic dispatch is required.
- **`TokenIcon`** (`components/TokenIcon.tsx:14`) accepts `src`, `alt`, `code`, `name`, `size` (default 28), `className`. With no usable image it renders initials taken from `code`, or from `name` when `code` is absent, on a flat brand background.
- **`isDecimalInRange(text, min, max, maxDecimals)`** (`lib/utils/validators.ts:1`) allows the empty string while typing, which is what lets amount inputs be cleared.

## Dependencies

- `@soroswap/sdk` for the `AssetInfo` type across hooks and utilities.
- API module routes `/api/tokens` and `/api/balance`.
- `swr` for all data fetching here. `@tanstack/react-query` is not used outside the bridge.
- `@tanstack/react-table` in `components/TheTable.tsx`, `clsx` + `tailwind-merge` in `lib/utils/cn.ts`, `lucide-react` for icons.
- Consumed by every feature module.

## Gotchas & invariants

- **`xlmTokenList` is only XLM.** It holds one asset per network for `mainnet`, `testnet`, `standalone`, and `futurenet` (`lib/constants/tokenList.ts`), not a large curated fallback. If `/api/tokens` fails, the app shows XLM alone.
- `useAllTokensList` recomputes `allTokens` on every render and then memoizes `tokenMapAllTokens` against that new array (`hooks/useAllTokensList.ts:12-23`), so the memo never hits. It is also absent from the hooks barrel.
- `useUserAssetList` reads `localStorage` inside an effect, so the first render is always an empty array. Do not use it for SSR-visible content.
- `calculateTvl` returns **cents** as a `bigint`. See [pools.md](pools.md).
- `TokenIcon`'s fallback background is the hardcoded constant `"#8866DD"` (`components/TokenIcon.tsx:42`), despite the comment on the line above claiming a color is generated from the contract address. There is no hash-based color logic. Earlier documentation claimed there was.
- `IPFS_GATEWAYS` (`lib/constants/ipfsGateways.ts:1`) has no importer anywhere in `src/`. It is dead configuration; icon URLs are used as returned by the API.
- The raffle announcement is disabled by a single flag, `RAFFLE_ANNOUNCEMENT_ENABLED = false` (`lib/constants/announcements.ts:23`). `getActiveAnnouncement()` returns `null` while it is off, and the navbar renders nothing.
- `BLOCKED_COUNTRIES` is a compliance list. Changing it changes who can reach the app, so treat edits as a legal decision, not a code one.

## Testing

No automated tests exist. `parseUnits`, `formatUnits`, and `calculateTvl` are pure functions and are the obvious first candidates if a test runner is ever added.
