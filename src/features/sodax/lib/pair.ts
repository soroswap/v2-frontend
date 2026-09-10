import {
  SODAX_COUNTERPART_CONTRACTS,
  isSodaxAsset,
} from "@/features/sodax/constants/sodax";
import { DEFAULT_SWAP_SETTINGS } from "@/shared/lib/constants/swap";

/**
 * True when the pair should be quoted and executed through the SODAX solver
 * instead of the Soroswap AMM: both sides are SODAX registry assets, or one
 * side is a registry asset and the other is an enabled counterpart (XLM or
 * USDC).
 */
export function isSodaxPair(
  contractA: string | undefined,
  contractB: string | undefined,
): boolean {
  if (!contractA || !contractB || contractA === contractB) return false;

  const aIsSodax = isSodaxAsset(contractA);
  const bIsSodax = isSodaxAsset(contractB);
  if (!aIsSodax && !bIsSodax) return false;
  if (aIsSodax && bIsSodax) return true;

  const counterpart = aIsSodax ? contractB : contractA;
  return SODAX_COUNTERPART_CONTRACTS.includes(counterpart);
}

/**
 * Apply slippage tolerance to a quoted amount, in base units.
 * `slippagePercent` is the human-readable value from swap settings (e.g. "0.5").
 */
export function applySlippageToQuote(
  quotedAmount: string,
  slippagePercent: string | number,
): string {
  const scale = BigInt(10000);
  const parsed = Number(slippagePercent);
  // Number("abc") is NaN, which would make Math.round(...) NaN and
  // BigInt(NaN) throw — but Number("") is 0, not NaN, and slips past a
  // finite-only check. 0% slippage sets minOutputAmount === quotedAmount
  // exactly, removing all protection against a worse fill. Reject anything
  // that isn't a finite, strictly-positive percentage and fall back to the
  // app's default slippage instead.
  const safePercent =
    Number.isFinite(parsed) && parsed > 0
      ? parsed
      : Number(DEFAULT_SWAP_SETTINGS.customSlippage);
  const bps = BigInt(Math.round(safePercent * 100));
  const clamped = bps < BigInt(0) ? BigInt(0) : bps > scale ? scale : bps;
  return ((BigInt(quotedAmount) * (scale - clamped)) / scale).toString();
}
