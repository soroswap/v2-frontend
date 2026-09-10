# API Module (server-side BFF)

> **Living document.** Read this before modifying the module. Update it in the same change whenever the module's behavior, endpoints, files, or dependencies change.

**Source:** `src/app/api/`, `src/shared/lib/server/`, `src/shared/lib/environmentVars.ts` · **Last verified:** 2026-09-10

## Purpose

Every call this app makes to the Soroswap API and the DeFindex API goes through these Next.js route handlers. They exist so `SOROSWAP_API_KEY` and `DEFINDEX_API_KEY` never reach the browser: the SDK clients are constructed server-side and the browser only ever talks to same-origin `/api/*`. Change a route signature here and the feature hooks in `src/features/*` break immediately, because they hand-roll `fetch` calls against these exact paths and headers.

## Structure

| File | Purpose |
|---|---|
| `src/shared/lib/environmentVars.ts` | Single source for network selection, RPC/Horizon URLs, router contract addresses, and both API credentials. |
| `src/shared/lib/server/soroswapClient.ts` | Module-scope `SoroswapSDK` singleton. |
| `src/shared/lib/server/defindexClient.ts` | Module-scope `DefindexSDK` singleton. |
| `src/shared/lib/server/sodaxClient.ts` | Lazy `SwapsApi` singleton (`getSodaxClient`), plus the SODAX-specific `sodaxOriginGuard`, `sodaxJson`, and `sodaxErrorResponse` helpers. |
| `src/shared/lib/server/constants.ts` | `ALLOWED_ORIGINS` list used as a crude CORS/referer gate. |
| `src/shared/lib/server/errorUtils.ts` | `getErrorMessage` / `getErrorStatusCode` narrowing helpers for `unknown` errors. |
| `src/app/api/**/route.ts` | One handler per endpoint, listed below. |

## Endpoints / Public surface

All paths are same-origin. Unless noted, inputs arrive as **HTTP headers**, not query params or JSON bodies.

### Soroswap API (via `@soroswap/sdk`)

| Method | Path | Handler | Upstream SDK call |
|---|---|---|---|
| GET | `/api/tokens` | `src/app/api/tokens/route.ts:103` | mainnet: `soroswapClient.getAssetList(SupportedAssetLists.SOROSWAP)` (`:65`); testnet: plain `fetch` against `SOROSWAP.BASE_URL + "/api/tokens"` (`:37-38`) |
| GET | `/api/balance` | `src/app/api/balance/route.ts:14` | `soroswapClient.getBalances(address, SOROSWAP.NETWORK)` (`:41`). Header: `address`. |
| GET | `/api/price` | `src/app/api/price/route.ts:7` | `soroswapClient.getPrice(asset, SOROSWAP.NETWORK)` (`:55` single, `:69` batch). Query `?assets=a,b` or header `asset`. |
| GET | `/api/quote` | `src/app/api/quote/route.ts:7` | None. Health-check stub returning a static message. |
| POST | `/api/quote` | `src/app/api/quote/route.ts:15` | `soroswapClient.quote(body)` (`:41`). Body is a `QuoteRequest`. |
| POST | `/api/quote/build` | `src/app/api/quote/build/route.ts:7` | `soroswapClient.build(body, SOROSWAP.NETWORK)` (`:33`). Body is a `BuildQuoteRequest`. |
| POST | `/api/send` | `src/app/api/send/route.ts:11` | `soroswapClient.send(xdr, SOROSWAP.NETWORK)` (`:39`). Body is a bare JSON string (the signed XDR). |
| GET | `/api/pools` | `src/app/api/pools/route.ts:8` | `soroswapClient.getPools(NETWORK, [SupportedProtocols.SOROSWAP], [SupportedAssetLists.SOROSWAP])` (`:46`) |
| GET | `/api/pools/token` | `src/app/api/pools/token/route.ts:8` | `soroswapClient.getPoolByTokens(tokenA, tokenB, NETWORK, [SupportedProtocols.SOROSWAP])` (`:47`). Headers: `tokenA`, `tokenB`. |
| GET | `/api/pools/user` | `src/app/api/pools/user/route.ts:7` | `soroswapClient.getUserPositions(address, NETWORK)` (`:45`). Header: `address`. |
| POST | `/api/pools/add-liquidity` | `src/app/api/pools/add-liquidity/route.ts:8` | `soroswapClient.addLiquidity(body, NETWORK)` (`:53`) |
| POST | `/api/pools/remove-liquidity` | `src/app/api/pools/remove-liquidity/route.ts:8` | `soroswapClient.removeLiquidity(body, NETWORK)` (`:54`) |

### DeFindex API (via `@defindex/sdk`)

| Method | Path | Handler | Upstream SDK call |
|---|---|---|---|
| GET | `/api/earn/vaultInfo` | `src/app/api/earn/vaultInfo/route.ts:7` | `defindexClient.getVaultInfo(vaultId, network)` (`:19`). Headers: `vaultId`, `network`. |
| GET | `/api/earn/vaultBalance` | `src/app/api/earn/vaultBalance/route.ts:5` | `defindexClient.getVaultBalance(vaultId, userAddress, network)` (`:18`). Headers: `vaultId`, `userAddress`, `network`. |
| POST | `/api/earn/deposit` | `src/app/api/earn/deposit/route.ts:5` | `defindexClient.depositToVault(vaultId, { amounts, caller, slippageBps, invest: true }, network)` (`:41`) |
| POST | `/api/earn/withdraw` | `src/app/api/earn/withdraw/route.ts:5` | `defindexClient.withdrawFromVault(vaultId, { amounts, caller, slippageBps }, network)` (`:41`) |
| POST | `/api/earn/withdraw/share` | `src/app/api/earn/withdraw/share/route.ts:5` | `defindexClient.withdrawShares(vaultId, { shares, caller, slippageBps }, network)` (`:41`) |
| POST | `/api/earn/send` | `src/app/api/earn/send/route.ts:8` | `defindexClient.sendTransaction(xdr, DEFINDEX.NETWORK)` (`:36`). Body is a bare JSON string. |

### SODAX Swaps API (via `@sodax/swaps-api`)

Every route here starts with `sodaxOriginGuard`, not `ALLOWED_ORIGINS.includes` (see Gotchas). All but `/api/sodax/send` call `getSodaxClient()` (`src/shared/lib/server/sodaxClient.ts:15-31`); `/api/sodax/send` talks to Soroban RPC directly instead.

| Method | Path | Handler | Upstream call |
|---|---|---|---|
| GET | `/api/sodax/tokens?chain=stellar` | `src/app/api/sodax/tokens/route.ts:26` | `client.getTokensByChain(chain)` or `client.getTokens()` (`:46-49`). 1 h in-memory cache (`:15-16`); `chain` restricted to `"stellar"` (`:20,32-37`). |
| POST | `/api/sodax/quote` | `src/app/api/sodax/quote/route.ts:10` | `client.getQuote(body)` (`:16`). `quoteType` is always `"exact_input"`. |
| GET | `/api/sodax/deadline` | `src/app/api/sodax/deadline/route.ts:13` | `client.getDeadline({ offsetSeconds })` (`:37-39`). `offsetSeconds` query param must be an integer in `[1, 86400]` (`:9-10,21-26`). |
| POST | `/api/sodax/allowance` | `src/app/api/sodax/allowance/route.ts:13` | `client.checkAllowance(body)` (`:19`). |
| POST | `/api/sodax/approve` | `src/app/api/sodax/approve/route.ts:13` | `client.approve(body)` (`:19`). Returns an unsigned trustline (`changeTrust`) XDR. |
| POST | `/api/sodax/intents` | `src/app/api/sodax/intents/route.ts:10` | `client.createIntent(body)` (`:16`). |
| POST | `/api/sodax/send` | `src/app/api/sodax/send/route.ts:37` | Not the SDK — `rpc.Server(STELLAR.RPC_URL).sendTransaction(...)` (`:60,83`). See Gotchas for why this route bypasses `/api/send`. |
| POST | `/api/sodax/submit` | `src/app/api/sodax/submit/route.ts:13` | `client.submitTx(body)` (`:19`). |
| GET | `/api/sodax/submit/status` | `src/app/api/sodax/submit/status/route.ts:13` | `client.getSubmitTxStatus({ txHash, srcChainKey })` (`:32-35`). Query params `txHash`, `srcChainKey`. |

See `docs/modules/sodax.md` for the client-side integration and the execution flow these routes serve.

## Key methods

- **`soroswapClient`** (`src/shared/lib/server/soroswapClient.ts:4`) constructed at module scope with `{ apiKey, baseUrl, defaultNetwork }` from `SOROSWAP` in `environmentVars.ts:75-82`. Because it is module scope, a missing key does not fail at boot, it fails on the first upstream call.
- **`defindexClient`** (`src/shared/lib/server/defindexClient.ts:4`) constructed with `{ apiKey, baseUrl }` only. Network is passed per call instead, which is why every earn route needs a `network` header.
- **`getSodaxClient()`** (`src/shared/lib/server/sodaxClient.ts:15-31`) builds its `SwapsApi` singleton lazily, not at module scope like `soroswapClient`/`defindexClient` above, specifically so a missing `SODAX_SWAPS_API_URL` throws on the first request instead of crashing `next build` (`:17-21`). It attaches `x-api-key` only when `SODAX_API_KEY` is set (`:22-28`).
- **`fetchMainnetAssetListWithRetry`** (`src/app/api/tokens/route.ts:60`) retries up to `MAX_RETRIES = 3` with a fixed `RETRY_DELAY_MS = 2000` delay, but only when the error looks like a rate limit (`:79-83`). This is the only retry logic on the server side.
- **`fetchTestnetAssetList`** (`src/app/api/tokens/route.ts:36`) bypasses the SDK and hits the unauthenticated public endpoint `${SOROSWAP_API_URL}/api/tokens`, then picks the entry whose `network === "testnet"`.
- **`envVars`** (`src/shared/lib/environmentVars.ts:40`) derives everything from a single `NEXT_PUBLIC_ENV` value: wallet network, RPC URL, Horizon URL, network passphrase, and the hardcoded Soroswap router contract address per network (`:65-68`).

## Dependencies

- **Soroswap API** through `@soroswap/sdk` (pinned `0.4.0` in `package.json:19`). Base URL and key from `SOROSWAP_API_URL` / `SOROSWAP_API_KEY` (`src/shared/lib/environmentVars.ts:76-77`).
- **DeFindex API** through `@defindex/sdk` (pinned `0.3.0-alpha.1` in `package.json:16`). Base URL and key from `DEFINDEX_API_URL` / `DEFINDEX_API_KEY` (`src/shared/lib/environmentVars.ts:85-86`).
- **SODAX Swaps API** through `@sodax/swaps-api` (pinned **`2.1.0`** in `package.json:19`, an exact pin with no `^`). Base URL from `SODAX_SWAPS_API_URL` (required — `getSodaxClient` throws without it) and optional key from `SODAX_API_KEY` (`src/shared/lib/environmentVars.ts:93-98`). Production needs no key today.
- Consumed by every feature module: swap (`useQuote`, `useSwap`), pools (`usePools`, `usePool`, `useGetPoolByTokens`, `useUserPoolPositions`), earn (`useVaultInfo`, `useVaultBalance`, `useEarnVault`), bridge (`useUSDCTrustline` posts to `/api/send`), sodax (`useSodaxAvailability`, `useSodaxQuote`, `useSodaxSwap`, `useSodaxTrustline` — see sodax.md), and shared (`useTokensList`, `useUserBalances`).

## Gotchas & invariants

- **The origin gate is not applied uniformly.** Every Soroswap route and `/api/earn/send` check `ALLOWED_ORIGINS` (`src/shared/lib/server/constants.ts:1`) against the `origin` or `referer` header and return 403 otherwise. The five other earn routes (`vaultInfo`, `vaultBalance`, `deposit`, `withdraw`, `withdraw/share`) do **not** import `ALLOWED_ORIGINS` at all and are open to any caller. Match the existing pattern when adding an earn route.
- The check is a substring match (`origin.includes(allowed)`), and `".soroswap.finance"` is one of the entries, so any origin containing that string passes.
- **Earn routes read their inputs from headers, including POSTs.** `src/features/earn/hooks/useVaultDeposit.ts:38-50` sends `vaultId`/`amount`/`caller`/`slippageBps` in the JSON body instead, which the route never reads. That hook has no consumer anywhere in `src/`, so the mismatch is latent, not a live bug.
- **The `network` guard is not on every route.** Eleven of the seventeen handlers guard `if (!network)` and report `Missing "network" query parameter`; `/api/balance` and the five earn data routes have no such guard. Where it exists the branch is effectively unreachable anyway: `network` is a build-time constant from `NEXT_PUBLIC_ENV` (`src/shared/lib/environmentVars.ts:44`), never a query parameter, so the message is misleading.
- `src/app/api/price/route.ts:103` returns `{ status: 500 | error.statusCode }`. That is a bitwise OR, not a fallback, so the status is garbage on the error path. Do not copy this pattern.
- **There is no server-side cache anywhere in `src/app/api/`, except `/api/sodax/tokens`.** That route keeps an in-memory `Map` keyed by the `chain` param with a 1 hour TTL (`src/app/api/sodax/tokens/route.ts:15-16,40-43`), because token listings change rarely and the client-side SWR cache does not survive a page reload. Everywhere else, all caching is client-side SWR deduping in the feature hooks. Earlier documentation claimed a 3 minute in-memory price cache on `/api/price`; no such code exists there.
- **The SODAX routes use a different, stricter origin check than everything above.** `sodaxOriginGuard` (`src/shared/lib/server/sodaxClient.ts:67-79`) parses `Origin`/`Referer` with `new URL()` and compares the resulting **host** against `ALLOWED_ORIGINS` — exact match, or dot-suffix match for `.soroswap.finance`-style entries (`:40-61`) — instead of the substring check (`origin.includes(allowed)`) the Soroswap/earn routes above use inline. The SODAX routes include a direct-to-RPC broadcast endpoint, where the substring check would let `https://evil.com/?x=app.soroswap.finance` through (`:33-39`).
- **`/api/sodax/send` does not use `soroswapClient.send` and cannot.** The generic `/api/send` proxies Soroswap's send API, which rejects Soroban transactions that don't touch a Soroswap contract — every SODAX intent invocation does (`src/app/api/sodax/send/route.ts:29-32`). So `/api/sodax/send` submits directly to `rpc.Server(STELLAR.RPC_URL)` instead (`:60,83`), and allowlists only the operation types a SODAX swap legitimately needs (`invokeHostFunction`, `extendFootprintTtl`, `restoreFootprint`, `changeTrust`, `:19-24`) so it can't become a general-purpose broadcast relay.
- `/api/tokens` prepends XLM to the asset list from `xlmTokenList` when it is not already present (`src/app/api/tokens/route.ts:152-161`). The fallback token list contains only XLM per network, not a large curated list (`src/shared/lib/constants/tokenList.ts`).
- Amounts sent to `/api/earn/deposit` are cast with `Number(amount)` (`src/app/api/earn/deposit/route.ts:44`) with a TODO noting the unit conversion is unfinished. Callers already pass the smallest-unit integer (`src/features/earn/hooks/useEarnVault.ts:139-142`).
- `NEXT_PUBLIC_POSTHOG_HOST` appears in `.env.example:12` but is never read anywhere in `src/`; the PostHog host is hardcoded (`src/shared/providers/PostHogProvider.tsx:11-12`).

## Testing

No test framework, test script, or test files exist in this repo (`package.json:5-10` defines only `dev`, `build`, `start`, `lint`). Verification today is `pnpm lint` plus manual exercise against testnet and mainnet.
