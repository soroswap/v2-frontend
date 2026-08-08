import {
  SODA_COUNTERPART_CONTRACTS,
  SODA_STELLAR,
} from "../constants/sodax";

/**
 * True when the pair should be quoted and executed through the SODAX solver
 * instead of the Soroswap AMM: exactly one side is SODA and the other is an
 * enabled counterpart (XLM or USDC).
 */
export function isSodaxPair(
  contractA: string | undefined,
  contractB: string | undefined,
): boolean {
  if (!contractA || !contractB) return false;

  const aIsSoda = contractA === SODA_STELLAR.contract;
  const bIsSoda = contractB === SODA_STELLAR.contract;
  if (aIsSoda === bIsSoda) return false;

  const counterpart = aIsSoda ? contractB : contractA;
  return SODA_COUNTERPART_CONTRACTS.includes(counterpart);
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
  const bps = BigInt(Math.round(Number(slippagePercent) * 100));
  const clamped = bps < BigInt(0) ? BigInt(0) : bps > scale ? scale : bps;
  return ((BigInt(quotedAmount) * (scale - clamped)) / scale).toString();
}
