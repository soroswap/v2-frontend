# Swap Module

> **Living document.** Read this before modifying the module. Update it in the same change whenever the module's behavior, endpoints, files, or dependencies change.

**Source:** `src/features/swap/` · **Last verified:** 2026-09-04

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

## Public surface

Barrel `src/features/swap/index.ts:1-6` re-exports `SwapPanel`, `TokenSelector`, `SwapQuoteDetails`, `SwapModal`, `SwapSettingsModal`. Hooks are imported by path, not through the barrel.

## Key methods

- **`useSwapController({ userAddress, onSuccess, onError, onStepChange })`** (`hooks/useSwapController.tsx:102`) is the single entry point for the swap page. It owns a `useReducer` form state (`:56`) with `TYPE_INPUT`, `SET_TOKEN`, and `SWITCH_TOKENS` actions.
- **quote request assembly** (`hooks/useSwapController.tsx:134-167`) builds the `QuoteRequest` and commits it through a 400 ms debounce timer so each keystroke does not create a new SWR key. `protocols`, `slippageBps`, and `maxHops` come from the persisted swap settings store; `parts` is hardcoded to 10 and `assetList` is hardcoded to `[SupportedAssetLists.SOROSWAP]` (`:150-154`).
- **`handleTokenSelect`** (`hooks/useSwapController.tsx:225`) dispatches `SWITCH_TOKENS` when the user picks the token already on the other side, rather than putting the same token on both sides.
- **`useSwap.buildXdr(quote, userAddress, retryCount)`** (`hooks/useSwap.ts:109`) posts to `/api/quote/build`. On `errorCode === 13` or `TokenError.InsufficientTrustlineBalance` it switches to `CREATE_TRUSTLINE`, signs and submits the trustline XDR the API returned, then calls itself again with `retryCount + 1`, bailing out above 2 (`:129-171`).
- **`useSwap.executeSwap(quote, userAddress)`** (`hooks/useSwap.ts:216`) runs build, sign, send in order and prefers the real `amountIn`/`amountOut` off the transaction result when `txData.result.type === "swap"`, falling back to the quote amounts (`:248-255`).
- **`useTokenPrices(addresses)`** (`hooks/useTokenPrice.ts:83`) filters out non-Stellar addresses with `isStellarAddress` before building the SWR key, then maps results back into the caller's original array order so index alignment is preserved (`:102-105`).

## Dependencies

- `@soroswap/sdk` types only on the client: `QuoteRequest`, `QuoteResponse`, `BuildQuoteResponse`, `TradeType`, `AssetInfo`, `SupportedProtocols`, `SupportedAssetLists`.
- API module routes `/api/quote`, `/api/quote/build`, `/api/send`, `/api/price`.
- `useUserContext` for `signTransaction` (`hooks/useSwap.ts:83`).
- `useSwapSettingsStore` for slippage, protocols, and max hops.
- `useTokensList` from the shared module for the token picker and the default sell token.
- Consumed by `src/app/page.tsx` (the swap page) and by the pools add-liquidity page, which reuses `SwapPanel`.

## Gotchas & invariants

- **Slippage units are ambiguous.** `slippageBps(value)` is `Number(value) * 100` (`src/shared/lib/utils/slippageBps.ts:2`) and the default `customSlippage` is the string `"1"` (`src/shared/lib/constants/swap.ts:6`), giving 100 bps = 1%. A TODO on that same line flags the mismatch with the UI wording. Do not "fix" one side without the other.
- Both `useTokenPrice` and `useTokenPrices` use `dedupingInterval: 3000000`, which is 50 minutes, not the 10 minutes used by `useBatchTokenPrices` (`hooks/useTokenPrice.ts:69`, `:95` vs `hooks/useBatchTokenPrices.ts:60`). Two different cache horizons hit the same `/api/price` route.
- `useBatchTokenPrices` swallows every error and returns an empty map (`hooks/useBatchTokenPrices.ts:39-43`), so downstream TVL silently reads as zero rather than erroring.
- The quote request pins `assetList` to the Soroswap list, so a user-added custom asset will not route. There is an explicit TODO at `hooks/useSwapController.tsx:153`.
- `useSwapController` auto-selects `tokensList[0]` as the sell token once the list loads and nothing is selected (`:263-267`). The token list route puts XLM first, so this is effectively "default to XLM".
- Quote and swap payloads are serialized with `bigIntReplacer` because `QuoteRequest` amounts are `bigint` and `JSON.stringify` throws on them (`hooks/useQuote.ts:14`).
- Several `useCallback` dependency arrays here are deliberately incomplete; the file disables `react-hooks/exhaustive-deps` at the top (`hooks/useSwapController.tsx:1`, `hooks/useSwap.ts:2`).

## Testing

No automated tests exist in this repo. Verify swaps manually on testnet, including the trustline recovery path, which is the branch most likely to regress.
