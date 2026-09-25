# Pools Module

> **Living document.** Read this before modifying the module. Update it in the same change whenever the module's behavior, endpoints, files, or dependencies change.

**Source:** `src/features/pools/` · **Last verified:** 2026-09-04

## Purpose

Lists Soroswap liquidity pools with USD TVL, shows a connected user's positions, and drives the add-liquidity and remove-liquidity transaction flows. TVL is computed in the browser from pool reserves and batch prices, so this module depends on the swap module's price hooks.

## Structure

| File | Purpose |
|---|---|
| `hooks/usePools.ts` | Fetches all pools, enriches them with computed TVL, exposes a fallback pool. |
| `hooks/usePool.ts` | Add/remove liquidity transaction state machine (`PoolStep`). |
| `hooks/usePoolsController.tsx` | Form reducer for the add/remove liquidity pages, ratio-driven paired amounts. |
| `hooks/useGetPoolByTokens.ts` | Single pool lookup by token pair, plus the reserve ratio. |
| `hooks/useUserPoolPositions.ts` | SWR wrapper over `/api/pools/user`. |
| `utils/findAsset.ts` | Resolves an arbitrary asset string to `AssetInfo` via Horizon or a Soroban simulation. |
| `components/` | `SoroSwapAllLiquidityPools`, `UserLiquidity`, `PoolModal`, `UserPoolModal`, `PoolsSettingsModal`. |

## Public surface

Barrel `components/index.ts:1-5` exports the five components above. Hooks are imported by path.

## Key methods

- **`usePools()`** (`hooks/usePools.ts:42`) fetches `/api/pools` with a 5 minute SWR deduping window, collects the unique token contracts across all pools (`:87-96`), asks `useBatchTokenPrices` for their USD prices, and returns `enrichedPools` only once a non-empty price map exists, otherwise the unenriched list (`:137`).
- **`calculateTvl`** (`src/shared/lib/utils/calculateTvl.ts:22`) is the TVL formula. It returns `bigint` **in cents** (`Math.round(tvlUSD * 100)`, `:51`) so small positions do not round to zero. Callers must divide by 100 before display. `calculateIndividualTvl` (`:72`) does the same for a user position.
- **`usePool()`** (`hooks/usePool.ts:50`) exposes `executeAddLiquidity` (`:169`) and `executeRemoveLiquidity` (`:221`). Both run the same three steps: POST to the liquidity route, sign the returned XDR through `UserContext`, then POST the signed XDR to `/api/send`.
- **`useGetPoolByTokens({ tokenAContract, tokenBContract })`** (`hooks/useGetPoolByTokens.ts:32`) returns the first matching pool and a `ratio` that is orientation-aware: it inverts `reserveB/reserveA` when the pool stores the pair in the opposite order (`:53-58`).
- **`findAsset(assetString)`** (`utils/findAsset.ts:19`) has two paths. A `CODE:ISSUER` or `CODE-ISSUER` string is resolved through Horizon. Anything else is treated as a contract id and resolved by simulating `name`, `symbol`, and `decimals` in one batched `exec` call against the Soroswap router contract (`:99-135`).

## Dependencies

- API module routes `/api/pools`, `/api/pools/token`, `/api/pools/user`, `/api/pools/add-liquidity`, `/api/pools/remove-liquidity`, `/api/send`.
- `@soroswap/sdk` types: `Pool`, `AddLiquidityRequest`, `RemoveLiquidityRequest`, `LiquidityResponse`, `UserPositionResponse`.
- `@stellar/stellar-sdk` directly in `utils/findAsset.ts` for Horizon queries and Soroban simulation, using `STELLAR.HORIZON_URL`, `STELLAR.RPC_URL`, and `STELLAR.STELLAR_ROUTER_ADDRESS` from `environmentVars.ts`.
- `usePoolsSettingsStore` for slippage and protocols; `useBatchTokenPrices` from the swap module; `useTokensList` from shared.
- Consumed by `src/app/pools/page.tsx` and the two `[...tokens]` catch-all pages. `utils/findAsset.ts` is also imported by the swap module's `src/features/swap/TokenSelectorModal.tsx:10`.

## Gotchas & invariants

- **TVL is in cents, as `bigint`.** Treating the value as dollars silently inflates every number by 100x.
- `usePools` returns a hardcoded `FALLBACK_POOLS` single XLM/USDC entry whenever the fetch produced nothing or the token map is empty (`hooks/usePools.ts:9-31`, `:80`). It carries mainnet contract addresses, so on testnet the fallback is wrong. It is a placeholder, not a real safety net.
- The unenriched pool objects set `tvl` and `apr` to the literal string `"—"` (`hooks/usePools.ts:74-75`), so consumers see either that placeholder or a `bigint`. APR is never computed anywhere in this module.
- `/api/pools` requires an `asset` header (`src/app/api/pools/route.ts:34-44`) but ignores it, and `usePools` passes the literal string `"soroswap"` (`hooks/usePools.ts:51`). Do not read meaning into that value.
- `findAsset` loads a fixed helper account, `GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO`, purely as a simulation source (`utils/findAsset.ts:101-107`). The simulation is read-only, nothing is signed or submitted, but a Horizon outage breaks custom-asset lookup in the swap token selector too.
- `simulateMultipleInvocations` returns `null` when the simulation has no result (`utils/findAsset.ts:135`), and `findAsset` immediately indexes into it, so a failed simulation throws rather than returning a useful error.
- The remove-liquidity response shape is flagged as unverified in the source: a TODO at `hooks/usePool.ts:49` notes it does not return status or success.

## Testing

No automated tests exist. Exercise add and remove liquidity manually on testnet and confirm TVL numbers against a known pool before shipping changes to `calculateTvl`.
