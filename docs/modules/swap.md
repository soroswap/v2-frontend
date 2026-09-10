# Swap Module

> **Living document.** Read this before modifying the module. Update it in the same change whenever the module's behavior, endpoints, files, or dependencies change.

**Source:** `src/features/swap/` · **Last verified:** 2026-09-10

## Purpose

Owns the token swap experience: token selection, amount entry, quote fetching, and the four step build/sign/send transaction flow. It also owns the token price hooks that pools reuses for TVL, so a change to `useBatchTokenPrices` ripples into the pools table.

## Structure

| File | Purpose |
|---|---|
| `hooks/useSwapController.tsx` | Form reducer, debounced quote request assembly, derived amounts. The hook the swap page binds to. |
| `hooks/useSwap.ts` | Transaction state machine: build XDR, sign, send, plus trustline recovery. |
| `hooks/useQuote.ts` | SWR wrapper over `POST /api/quote`. |
| `hooks/useTokenPrice.ts` | `useTokenPrice` (single) and `useTokenPrices` (batch) over `/api/price`. |
| `hooks/useBatchTokenPrices.ts` | Batch price map keyed by contract, used by pools for TVL. |
| `SwapPanel.tsx`, `TokenAmountInput.tsx`, `TokenSelector*.tsx` | Input surface and token picker, including the custom-asset modal. |
| `SwapModal.tsx`, `SwapQuoteDetails.tsx`, `PricePanel.tsx`, `SwapSettingsModal.tsx` | Progress modal, quote breakdown, and slippage/protocol settings. |
| `types/swap.ts` | `SwapSettings` shape shared with the pools settings store. |

`src/features/sodax/` is attached at `useSwapController` (below) but is its own module with its own doc — see sodax.md — and is not otherwise duplicated here.

## Public surface

Barrel `src/features/swap/index.ts:1-6` re-exports `SwapPanel`, `TokenSelector`, `SwapQuoteDetails`, `SwapModal`, `SwapSettingsModal`. Hooks are imported by path, not through the barrel.

## Key methods

- **`useSwapController({ userAddress, onSuccess, onError, onStepChange })`** (`hooks/useSwapController.tsx:103`) is the single entry point for the swap page. It owns a `useReducer` form state (`:118`) with `TYPE_INPUT`, `SET_TOKEN`, and `SWITCH_TOKENS` actions, and returns a `sodax` object (`useSodaxSwapIntegration(...)`, `:128-135`) alongside the Soroswap `quote`/`handleSwap` — see sodax.md for everything inside it. `handleSwap` (`:292-310`) branches to `sodax.handleSodaxSwap()` when `sodax.isSodaxActive`, otherwise calls `executeSwap(quote, userAddress)`; `isQuoteLoading` in the returned object is `sodax.isSodaxQuoteLoading` in the same case (`:335-337`).
- **quote request assembly** (`hooks/useSwapController.tsx:159-205`) builds the `QuoteRequest` and commits it through a 400 ms debounce timer so each keystroke does not create a new SWR key. `protocols`, `slippageBps`, and `maxHops` come from the persisted swap settings store; `parts` is hardcoded to 10 and `assetList` is hardcoded to `[SupportedAssetLists.SOROSWAP]` (`:175-186`). The effect's first branch skips all of this — `setQuoteRequest(null); return;` — whenever `sodax.isSodaxActive`, since a SODAX pair is quoted by `useSodaxSwapIntegration`, not this effect (`:159-164`).
- **`handleTokenSelect`** (`hooks/useSwapController.tsx:265`) dispatches `SWITCH_TOKENS` when the user picks the token already on the other side, rather than putting the same token on both sides.
- **`useSwap.buildXdr(quote, userAddress, retryCount)`** (`hooks/useSwap.ts:109`) posts to `/api/quote/build`. On `errorCode === 13` or `TokenError.InsufficientTrustlineBalance` it switches to `CREATE_TRUSTLINE`, signs and submits the trustline XDR the API returned, then calls itself again with `retryCount + 1`, bailing out above 2 (`:129-171`).
- **`useSwap.executeSwap(quote, userAddress)`** (`hooks/useSwap.ts:216`) runs build, sign, send in order and prefers the real `amountIn`/`amountOut` off the transaction result when `txData.result.type === "swap"`, falling back to the quote amounts (`:248-255`).
- **`useTokenPrices(addresses)`** (`hooks/useTokenPrice.ts:83`) filters out non-Stellar addresses with `isStellarAddress` before building the SWR key, then maps results back into the caller's original array order so index alignment is preserved (`:102-105`).
- **`includeSodaxTokens`** is a prop threaded from `SwapPanel` (`SwapPanel.tsx:30,51`) through `TokenSelector` (`TokenSelector.tsx:17,25,71`) into `TokenSelectorModal`, which appends every live SODAX registry asset not already in the list, in registry order, when it's set (`TokenSelectorModal.tsx:1,79-89`). It also gates the availability fetch itself — `TokenSelectorModal` calls `useSodaxAvailability({ enabled: includeSodaxTokens })` (`:36-38`), so a picker with `includeSodaxTokens={false}` never issues `GET /api/sodax/tokens` — see sodax.md. It defaults to `false` everywhere; `src/app/page.tsx:196,223` is the only caller that sets it `true`, on both the Sell and Buy `SwapPanel`s.
- **`inputDisabled`** on `SwapPanel` (`SwapPanel.tsx:27-28,50,143`) passes straight through to `TokenAmountInput`'s `disabled` prop, and also renders a `<p className="text-secondary text-xs">Amount is set by the Sell side for SODAX swaps</p>` note under the amount while disabled (`:155-159`). `src/app/page.tsx:222` is its only caller, setting it on the **Buy** panel exactly when `sodax.isSodaxActive` — SODAX only quotes `exact_input`, so the Buy amount can't be typed while a SODAX pair is selected, and the note says why.
- **`PricePanel`** (`PricePanel.tsx:8`) falls back from `useTokenPrice` (Soroswap) to `useSodaxUsdPrice` (`:17,26-27`) — `price = soroswapPrice ?? sodaxPrice` — because the Soroswap price API has no prices for SODAX registry assets. `useSodaxUsdPrice` is inert (`null`, not loading) for any other token, so the fallback is a no-op outside SODAX pairs. The settled-with-no-price state (`price === null`, not fetching) only renders "—" when the token is a SODAX registry asset (`getSodaxAsset(token?.contract)`, `:38-39`); every other token — including `buyToken === null` on first load of `/`, and any priceless pool token on `/pools/add-liquidity` — keeps the pre-SODAX skeleton-forever behavior, so PricePanel is byte-for-byte unchanged outside SODAX pairs.

## Dependencies

- `@soroswap/sdk` types only on the client: `QuoteRequest`, `QuoteResponse`, `BuildQuoteResponse`, `TradeType`, `AssetInfo`, `SupportedProtocols`, `SupportedAssetLists`.
- API module routes `/api/quote`, `/api/quote/build`, `/api/send`, `/api/price`.
- `useUserContext` for `signTransaction` (`hooks/useSwap.ts:83`).
- `useSwapSettingsStore` for slippage, protocols, and max hops.
- `useTokensList` from the shared module for the token picker and the default sell token.
- `src/features/sodax` (`useSodaxSwapIntegration`, `useSodaxAvailability`, `toSodaxAssetInfo`) — the SODAX solver integration attached at `useSwapController` and threaded into `TokenSelectorModal`/`PricePanel`. See sodax.md.
- Consumed by `src/app/page.tsx` (the swap page) and by the pools add-liquidity page, which reuses `SwapPanel` (without SODAX wired up — see Gotchas).

## Gotchas & invariants

- **Slippage units are ambiguous.** `slippageBps(value)` is `Number(value) * 100` (`src/shared/lib/utils/slippageBps.ts:2`) and the default `customSlippage` is the string `"1"` (`src/shared/lib/constants/swap.ts:6`), giving 100 bps = 1%. A TODO on that same line flags the mismatch with the UI wording. Do not "fix" one side without the other.
- Both `useTokenPrice` and `useTokenPrices` use `dedupingInterval: 3000000`, which is 50 minutes, not the 10 minutes used by `useBatchTokenPrices` (`hooks/useTokenPrice.ts:69`, `:95` vs `hooks/useBatchTokenPrices.ts:60`). Two different cache horizons hit the same `/api/price` route.
- `useBatchTokenPrices` swallows every error and returns an empty map (`hooks/useBatchTokenPrices.ts:39-43`), so downstream TVL silently reads as zero rather than erroring.
- The quote request pins `assetList` to the Soroswap list, so a user-added custom asset will not route. There is an explicit TODO at `hooks/useSwapController.tsx:184`.
- `useSwapController` auto-selects `tokensList[0]` as the sell token once the list loads and nothing is selected (`:315-319`). The token list route puts XLM first, so this is effectively "default to XLM".
- Quote and swap payloads are serialized with `bigIntReplacer` because `QuoteRequest` amounts are `bigint` and `JSON.stringify` throws on them (`hooks/useQuote.ts:14`).
- Several `useCallback` dependency arrays here are deliberately incomplete; the file disables `react-hooks/exhaustive-deps` at the top (`hooks/useSwapController.tsx:1`, `hooks/useSwap.ts:2`).
- **A selected SODAX pair forces the Sell field to drive, but keeps the typed amount.** If a SODAX pair becomes active while the Buy field was independent, an effect dispatches `TYPE_INPUT` back to `"sell"`, carrying the current `typedValue` across rather than clearing it (`hooks/useSwapController.tsx:137-146`) — SODAX only quotes `exact_input`. Rotating a SODAX pair (which moves the typed number to Buy via `SWITCH_TOKENS`) lands it back on Sell instead of wiping it.
- **`includeSodaxTokens` and `inputDisabled` default to `false`/`false`,** so the pools add-liquidity page, which reuses `SwapPanel` (`src/app/pools/add-liquidity/[...tokens]/page.tsx:194,217`), does not offer SODAX registry assets, never fetches `/api/sodax/tokens`, and never disables the Buy input — only `src/app/page.tsx` opts in. Do not assume every `SwapPanel` consumer has SODAX wired up.
- `useSwapController`'s `derivedBuyAmount` reads `sodax.derivedBuyAmount` when `sodax.isSodaxActive` (`:220-230`) instead of deriving from the Soroswap `quote`, since the quote-request effect above never builds one for a SODAX pair — the two amount sources are mutually exclusive, never merged.

## Testing

No automated tests exist in this repo. Verify swaps manually on testnet, including the trustline recovery path, which is the branch most likely to regress.
