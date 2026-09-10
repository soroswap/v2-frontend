# SODAX Swaps Module

> **Living document.** Read this before modifying the module. Update it in the same change whenever the module's behavior, endpoints, files, or dependencies change.

**Source:** `src/features/sodax/`, `src/app/api/sodax/` · **Last verified:** 2026-09-10

## Purpose

Routes swaps for a curated set of Stellar assets — SODA plus 24 tokenized stocks, ETFs, and crypto majors — through the SODAX solver instead of the Soroswap AMM, inside the same swap card the rest of the app uses. `lib/pair.ts`'s `isSodaxPair` decides, per selected pair, whether a swap goes through SODAX (`useSodaxSwapIntegration`) or the existing Soroswap flow (`useQuote`/`useSwap`); `src/features/swap/hooks/useSwapController.tsx` holds both and switches between them (`hooks/useSwapController.tsx:128-135,289-293`). A pair routes through SODAX when both sides are SODAX registry assets, or one side is a registry asset and the other is XLM or USDC (`lib/pair.ts:13-26`).

## Structure

| File | Purpose |
|---|---|
| `constants/assets.ts` | The asset registry: 25 SODAX-routed Stellar classic assets (Soroban Asset Contract wrappers), the shared issuer, decimals. Import-free so `scripts/sodax-assets-check.mjs` can load it directly. |
| `constants/sodax.ts` | Re-exports the registry; chain key, poll intervals, `SODA_STELLAR`, `USDC_STELLAR`, `XLM_STELLAR_CONTRACT`, `SODAX_COUNTERPART_CONTRACTS`, and the registry lookup helpers (`getSodaxAsset`, `isSodaxAsset`, `toSodaxAssetInfo`). |
| `lib/pair.ts` | `isSodaxPair` (the routing rule) and `applySlippageToQuote`. |
| `lib/api.ts` | Typed `fetch` wrapper over every `/api/sodax/*` route: 20 s timeout, typed `SodaxApiError`. Not re-exported from `index.ts` — callers go through the hooks below. |
| `hooks/useSodaxAvailability.ts` | Feature gate (mainnet + `SODAX_SWAPS_API_URL` + non-empty live token list) and `availableAssets` (registry filtered to what's live). |
| `hooks/useSodaxQuote.ts` | SWR wrapper over `POST /api/sodax/quote`, `exact_input` only. |
| `hooks/useSodaxUsdPrice.ts` | USD price for a registry asset via a solver probe (the Soroswap price API has none). |
| `hooks/useSodaxSwap.tsx` | The execution state machine: allowance → approve (if needed) → create intent → sign → broadcast → submit to solver → poll for fill. |
| `hooks/useSodaxSwapIntegration.tsx` | Single attachment point to the swap controller: routing decision, debounced quote, trustline gate, execution — everything else in this feature is a dependency of this hook. |
| `hooks/useSodaxTrustline.tsx` | Destination classic-asset trustline check and creation (a registry asset, or USDC). |
| `components/SodaxSwapModal.tsx` | Progress modal for the state machine, mirrors `SwapModal`. |
| `components/SodaxTrustlineSection.tsx` | Trustline prompt shown in the swap card, mirrors the bridge's trustline section. |
| `components/SodaxQuoteDetails.tsx` | Collapsible quote breakdown, mirrors `SwapQuoteDetails`. |
| `types/sodax.ts` | Wire types for `/api/sodax/*` and `SodaxApiError`. |
| `index.ts` | Barrel: every component, hook (except `lib/api.ts`), `lib/pair.ts`, and `types/sodax.ts`. |

## Endpoints / Public surface

Every `/api/sodax/*` route is same-origin and starts with `sodaxOriginGuard` (see Gotchas). All but one call `getSodaxClient()`, a lazy `@sodax/swaps-api` `SwapsApi` singleton (`src/shared/lib/server/sodaxClient.ts:15-31`); `/api/sodax/send` talks to Soroban RPC directly instead.

| Method | Path | Handler | Upstream call |
|---|---|---|---|
| GET | `/api/sodax/tokens?chain=stellar` | `src/app/api/sodax/tokens/route.ts:26` | `client.getTokensByChain(chain)` or `client.getTokens()` (`:46-49`). 1 h server cache (`:15-16`); `chain` restricted to `"stellar"` (`:20,32-37`). |
| POST | `/api/sodax/quote` | `src/app/api/sodax/quote/route.ts:10` | `client.getQuote(body)` (`:16`). `quoteType` is always `"exact_input"` — see Gotchas. |
| GET | `/api/sodax/deadline?offsetSeconds=n` | `src/app/api/sodax/deadline/route.ts:13` | `client.getDeadline({ offsetSeconds })` (`:37-39`). `offsetSeconds` must be an integer in `[1, 86400]` (`:9-10,21-26`). |
| POST | `/api/sodax/allowance` | `src/app/api/sodax/allowance/route.ts:13` | `client.checkAllowance(body)` (`:19`). For a Stellar source this checks trustline balance sufficiency. |
| POST | `/api/sodax/approve` | `src/app/api/sodax/approve/route.ts:13` | `client.approve(body)` (`:19`). Returns an unsigned trustline (`changeTrust`) XDR for the source side. |
| POST | `/api/sodax/intents` | `src/app/api/sodax/intents/route.ts:10` | `client.createIntent(body)` (`:16`). Returns the unsigned intent tx, the `SodaxIntent` struct, and relay data. |
| POST | `/api/sodax/send` | `src/app/api/sodax/send/route.ts:37` | **Not** the SODAX SDK — submits directly to `rpc.Server(STELLAR.RPC_URL)` (`:60,83`). See Gotchas for why. |
| POST | `/api/sodax/submit` | `src/app/api/sodax/submit/route.ts:13` | `client.submitTx(body)` (`:19`). Hands the broadcast tx to the relay/solver. |
| GET | `/api/sodax/submit/status?txHash=&srcChainKey=` | `src/app/api/sodax/submit/status/route.ts:13` | `client.getSubmitTxStatus({ txHash, srcChainKey })` (`:32-35`). Polled by `useSodaxSwap`. |

Barrel `src/features/sodax/index.ts:1-12` exports every component, hook (except the internal `lib/api.ts` client), `lib/pair.ts`, and `types/sodax.ts`. The single integration point into the rest of the app is `useSodaxSwapIntegration`, consumed by `src/features/swap/hooks/useSwapController.tsx:128-135` (see swap.md).

## Key methods

- **The asset registry** (`constants/assets.ts:45-221`) is a hand-maintained `SEEDS` array of 25 assets — SODA, 8 tokenized stocks (`category: "stock"`), 5 ETFs (`"etf"`), 11 crypto majors (`"crypto"`) — generated from the live SODAX token list cross-checked against each contract's SAC `name()` (`:1-16`). Every entry shares `SODAX_STELLAR_ISSUER` and 7 decimals (`:37-41,229-234`). Re-verify the whole table against production with `node scripts/sodax-assets-check.mjs` (Testing) before editing it by hand.
- **`isSodaxPair(contractA, contractB)`** (`lib/pair.ts:13-26`) is false if either side is missing, equal, or neither side is a registry asset; true if both sides are registry assets; otherwise true only if the non-registry side is XLM or USDC (`SODAX_COUNTERPART_CONTRACTS`, `constants/sodax.ts:64-67`).
- **`useSodaxAvailability()`** (`hooks/useSodaxAvailability.ts:21`) is the feature's graceful-degradation gate: the SWR key is `null` (query disabled) unless `isProductionEnv` (`:23`), and `isSodaxEnabled` additionally requires no error and a non-empty live token list (`:34`). `availableAssets` (`:39-45`) is the registry filtered to contracts the live list actually has, so a delisted asset drops out of the token selector automatically instead of failing to quote after the user has already picked it.
- **`useSodaxSwapIntegration(...)`** (`hooks/useSodaxSwapIntegration.tsx:63`) forces sell-side driving: `inputAmount` is only computed when `independentField === "sell"` (`:96-100`), because SODAX quotes `exact_input` only. `destinationTrustlineAsset(buyContract)` (`:48-56`) returns `null` for XLM, the registry asset for a registry contract, `USDC_STELLAR` for USDC — the trustline gate only ever checks the **destination** (buy) side, since selling implies the source trustline already exists (`:156-158`).
- **`useSodaxSwap().executeSodaxSwap(params)`** (`hooks/useSodaxSwap.tsx:288`) is the execution state machine — see below.
- **`useSodaxUsdPrice(contract)`** (`hooks/useSodaxUsdPrice.ts:30`) probes the solver with a fixed 100 USDC → asset quote (`:39-49`) and derives `price = 100 / outputAmount` (`:53-56`). Inert (`price: null`, not loading) for any contract that isn't a registry asset (`:68-69`).
- **`useSodaxTrustline(asset)`** (`hooks/useSodaxTrustline.tsx:47`) tags every `checkTrustline()` call with a `requestIdRef` (`:70-73,86,108,117`) so a slow response for a stale (asset, account) pair can't overwrite fresher state; the triggering effect resets `trustlineStatus`/`hasCheckedOnce` synchronously on every asset/account change, before the fresh check starts (`:179-190`).

**Execution state machine.** `useSodaxSwap.executeSodaxSwap` (`hooks/useSodaxSwap.tsx:288-438`) drives `SodaxSwapStep` (`:26-37`) through, in order:

1. `PREPARING` — fetch a provisional deadline, `checkSodaxAllowance` (`:312-321`).
2. `APPROVING` (only if the allowance check failed) — `fetchSodaxApproveTx`, sign, broadcast via `/api/sodax/send`, then re-check allowance rather than assume it landed (`:325-341`).
3. `CREATING_INTENT` — fetch a *fresh* deadline and `createSodaxIntent`, timed to start as close to the signature as possible so the deadline window isn't burned by steps 1-2 (`:346-360`).
4. `WAITING_SIGNATURE` — the user signs the intent tx (`:362-373`).
5. `SENDING_TRANSACTION` — broadcast the signed intent tx via `/api/sodax/send` (`:375-389`).
6. `SUBMITTING_TO_SOLVER` — `submitSodaxTx` hands the broadcast tx to the relay (`:391-407`).
7. `WAITING_FOR_FILL` — poll `/api/sodax/submit/status` every `SODAX_STATUS_POLL_INTERVAL_MS` (3 s) until `"solved"`, `"failed"`, `intentCancelled`, `abandonedAt`, or `SODAX_STATUS_POLL_TIMEOUT_MS` (5 min) elapses (`:213-286,409-420`).
8. `SUCCESS` / `ERROR` — terminal.

Steps 2 and 5 both broadcast a signed Stellar transaction, and they deliberately use different endpoints than the rest of the app (`src/app/api/sodax/send/route.ts:13-24,29-32`):

- **`/api/sodax/send`** submits straight to Soroban RPC (`rpc.Server(STELLAR.RPC_URL).sendTransaction`, `:60,83`) because the generic `/api/send` proxies Soroswap's send API, which rejects Soroban transactions that don't touch a Soroswap contract — every SODAX intent invocation does. It allowlists exactly `invokeHostFunction`, `extendFootprintTtl`, `restoreFootprint`, `changeTrust` (`:19-24`) — the intent invocation, its TTL footprint helpers, and the source-side trustline approval leg — and 400s on anything else, so it can't become a general-purpose broadcast relay.
- **`/api/send`** (Soroswap's route) is used only by `useSodaxTrustline.createTrustline` (`hooks/useSodaxTrustline.tsx:151`) for the **destination** trustline the user adds manually — a plain classic `changeTrust` unrelated to the SODAX intents contract — and by the rest of the app's ordinary Soroswap flow.

**No-route (422) behavior.** The solver returns HTTP 422 `"No path was found"` for two distinct cases that `useSodaxSwapIntegration` cannot fully distinguish from the status code alone:

- **Dust-sized amounts.** `useSodaxUsdPrice` probes with 100 USDC instead of 1 because "a 1 USDC probe can return 422 ... on some pairs" (`hooks/useSodaxUsdPrice.ts:13-15`); `scripts/sodax-quote-check.mjs`'s smallest passing cases are 10 USDC (`:50,59`) — so treat anything much below roughly 10 USDC-equivalent as liable to 422 regardless of pair.
- **The sell-direction gap.** Selling any registry asset other than SODA (any of the 24 newly listed stocks/ETFs/crypto as the *source* token) currently 422s at every size — a SODAX-side solver gap under investigation, not a bug in this app (`scripts/sodax-quote-check.mjs:103-107`). `quoteErrorMessage` renders a generic `"No route found — try a larger amount"` on any 422 (`hooks/useSodaxSwapIntegration.tsx:128-142`); `sodaxQuoteErrorHint` additionally detects this specific case (422 **and** the sell token is a registry asset other than SODA) and renders `` `The SODAX solver couldn't find a route to sell ${code} right now — this direction may not be available yet.` `` (`:144-154`), shown in `src/app/page.tsx:240-244`.

## Dependencies

- **`@sodax/swaps-api`** pinned at **`2.1.0`** in `package.json:19` (exact pin, no `^`).
- Two env vars, both read in `src/shared/lib/environmentVars.ts:93-98`: **`SODAX_SWAPS_API_URL`** is required to enable the feature — without it `getSodaxClient()` throws on first use (`sodaxClient.ts:17-21`) and `useSodaxAvailability` never turns the feature on. **`SODAX_API_KEY`** is optional; production needs no key today, but when set it's passed as an `x-api-key` header (`sodaxClient.ts:22-28`; `.env.example:10-13`).
- `@stellar/stellar-sdk`: `Horizon.Server` for trustline reads (`hooks/useSodaxTrustline.tsx:83`), `rpc.Server`/`TransactionBuilder` for the direct-to-Soroban broadcast (`src/app/api/sodax/send/route.ts:3,60-61`).
- `useUserContext` for `signTransaction`, `address`, `kit` (`hooks/useSodaxSwap.tsx:141`, `hooks/useSodaxTrustline.tsx:50`).
- `isProductionEnv` and `STELLAR` from `src/shared/lib/environmentVars.ts` — the mainnet gate and RPC/Horizon URLs.
- Consumed by `src/features/swap/hooks/useSwapController.tsx` (the `sodax` object), `TokenSelectorModal.tsx`/`TokenSelector.tsx`/`SwapPanel.tsx` (`includeSodaxTokens`), and `PricePanel.tsx` (USD price fallback) — see swap.md.

## Gotchas & invariants

- **Graceful degradation is the whole feature's safety net.** `useSodaxAvailability`'s SWR key is `null` on testnet (`hooks/useSodaxAvailability.ts:23`), so on testnet — and on any `SODAX_SWAPS_API_URL` misconfiguration, or while the live token list is empty or erroring — `isSodaxEnabled` is `false`, no SODAX asset enters the token selector, and `isSodaxPair` can never see a registry contract in user input. Do not bypass this gate to "test SODAX on testnet"; the asset registry is mainnet identities only.
- **SODAX quotes `exact_input` only** (`types/sodax.ts:57`, hardcoded in `useSodaxQuote`, `hooks/useSodaxQuote.ts:50`). `useSodaxSwapIntegration` enforces this by only computing `inputAmount` when the Sell field is independent (`hooks/useSodaxSwapIntegration.tsx:96-100`); `useSwapController` backs this up by snapping `independentField` back to `"sell"` (and clearing the typed value) whenever a SODAX pair becomes active while the Buy field was driving (`src/features/swap/hooks/useSwapController.tsx:139-143`). `SwapPanel`'s Buy side is also rendered with `inputDisabled` when `sodax.isSodaxActive` (`src/app/page.tsx:222`), so the user can't type there either.
- **Selling anything but SODA currently has no route** (the sell-direction 422 gap above). This is a live product gap, not a display bug — do not "fix" it by hiding the sell option for those assets; the copy in `useSodaxSwapIntegration.tsx:147-154` is the intended UX until the solver accepts these assets as a source.
- **The origin guard is anchored to the parsed host, not a substring match.** `sodaxOriginGuard` (`src/shared/lib/server/sodaxClient.ts:67-79`) parses `Origin`/`Referer` with `new URL()` and compares the resulting `host` against `ALLOWED_ORIGINS` — exact match, or dot-suffix match for `.soroswap.finance`-style entries (`:40-61`). This is deliberately stricter than the substring check (`origin.includes(allowed)`) the older Soroswap/earn routes use inline (see api.md): the comment explains why — `/api/sodax/send` broadcasts straight to Soroban RPC, where a substring check would let `https://evil.com/?x=app.soroswap.finance` through (`:33-39`).
- **`/api/sodax/send` rejects a well-formed transaction that isn't SODAX's.** Its `ALLOWED_OPERATIONS` allowlist (`src/app/api/sodax/send/route.ts:19-24`) is intentionally narrow so this endpoint can't become a general broadcast relay; adding a new SODAX flow with a different operation type needs this list extended deliberately, not worked around.
- **`SodaxSwapModal`'s dismiss state is derived during render, not in an effect** (`components/SodaxSwapModal.tsx:120-130`), so it applies before the first paint of a new step and avoids `react-hooks/set-state-in-effect`. Dismissing only hides the modal locally; it never cancels an in-flight swap, which keeps running in the background (`:109-114,253-267`).
- **`useSodaxTrustline`'s `MIN_XLM_FOR_TRUSTLINE` is 1.5 XLM** (`hooks/useSodaxTrustline.tsx:24`), the same headroom the bridge feature uses for its own trustline reserve check — not derived from any SODAX-specific reserve requirement.
- **`getSodaxClient()` is a module-scope singleton, constructed once on first use.** If `SODAX_API_KEY` is added to a running server's environment after the client has already been built, that process keeps using the headers it started with (`src/shared/lib/server/sodaxClient.ts:13-31`).

## Testing

No automated tests exist in this repo. Two read-only scripts verify the integration against the live SODAX API without a wallet:

- **`node scripts/sodax-assets-check.mjs`** (needs `SODAX_SWAPS_API_URL`, e.g. via `--env-file=.env.local`) re-verifies every registry entry in `constants/assets.ts` against `GET /swaps/tokens/stellar` (symbol, decimals) and each contract's on-chain SAC `name()` (must equal `CODE:ISSUER`), and confirms the bundled icon file exists under `public/`. Run this before editing the registry table by hand.
- **`node scripts/sodax-quote-check.mjs`** (same env var) quotes a fixed set of real pairs — including the two buy-direction stock cases, `100 USDC -> NVDA` and `700 USDC -> SPY` — through the same `@sodax/swaps-api` client the server routes use, proving package + base URL + request shape end to end. It deliberately has no sell-direction cases yet (`:103-107`).
- Beyond that, exercise the flow manually with a real mainnet wallet: a SODA pair (has a route both ways) and a stock/ETF/crypto pair bought with USDC or XLM (buy-direction only, per the current solver gap), including the destination-trustline-missing path and the insufficient-XLM-reserve path.
