import { AssetInfo } from "@soroswap/sdk";
import {
  SODAX_STELLAR_ASSETS,
  SODAX_STELLAR_ISSUER,
} from "@/features/sodax/constants/assets";
import type {
  SodaxAssetCategory,
  SodaxStellarAsset,
  StellarClassicAsset,
} from "@/features/sodax/constants/assets";

// The registry (constants/assets.ts) is the single source of truth for every
// SODAX-routed asset on Stellar. Re-export its types and the table itself so
// the rest of this feature only ever imports from "constants/sodax".
export type { SodaxAssetCategory, SodaxStellarAsset, StellarClassicAsset };
export { SODAX_STELLAR_ASSETS, SODAX_STELLAR_ISSUER };

/** SODAX SpokeChainKey for Stellar. */
export const SODAX_STELLAR_CHAIN_KEY = "stellar";

/** Poll interval while waiting for the solver to fill an intent. */
export const SODAX_STATUS_POLL_INTERVAL_MS = 3_000;

/** Give up polling after this long even if the intent deadline allows more. */
export const SODAX_STATUS_POLL_TIMEOUT_MS = 5 * 60_000;

/**
 * Client-side ceiling for POST /api/sodax/send. It must exceed that route's
 * worst case (a 15s RPC submit, then a 30s confirmation window with one poll
 * interval of overshoot, inside a 60s maxDuration): a shorter ceiling makes
 * the browser give up on a transaction that has already been broadcast, and
 * the route's "accepted but not yet confirmed" answer could never arrive.
 * Every other SODAX request keeps the default 20s in lib/api.ts.
 */
export const SODAX_BROADCAST_TIMEOUT_MS = 55_000;

/**
 * SODA must always be present in the registry — several routing/display
 * assumptions (e.g. the sell-direction gap notes in useSodaxSwapIntegration)
 * are stated in terms of "SODA vs every other registry asset". Checked at
 * module load — not first use — so a broken table fails the build loudly
 * instead of failing some unrelated request later at runtime.
 */
if (!SODAX_STELLAR_ASSETS.some((asset) => asset.code === "SODA")) {
  throw new Error(
    "SODAX_STELLAR_ASSETS is missing the SODA entry — check constants/assets.ts",
  );
}

/**
 * Circle USDC on Stellar (same identity the bridge feature uses).
 * Needed as a full classic asset: receiving USDC requires a trustline too.
 */
export const USDC_STELLAR: StellarClassicAsset = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  contract: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
  decimals: 7,
};

/** Native XLM Stellar Asset Contract (same id Soroswap's token list uses). */
export const XLM_STELLAR_CONTRACT =
  "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";

/** Kept for callers that only need the contract id. */
export const USDC_STELLAR_CONTRACT = USDC_STELLAR.contract;

/**
 * Soroswap-native tokens the solver also accepts on Stellar, alongside the
 * SODAX registry assets themselves (see `isSodaxPair` in lib/pair.ts).
 * Deliberately narrow: XLM and USDC, not a general cross-chain matrix.
 */
export const SODAX_COUNTERPART_CONTRACTS: readonly string[] = [
  XLM_STELLAR_CONTRACT,
  USDC_STELLAR_CONTRACT,
];

/** Registry assets indexed by contract id, for O(1) membership checks. */
export const SODAX_ASSETS_BY_CONTRACT: ReadonlyMap<string, SodaxStellarAsset> =
  new Map(SODAX_STELLAR_ASSETS.map((asset) => [asset.contract, asset]));

/** The registry entry for a contract id, or undefined if it isn't one. */
export function getSodaxAsset(
  contract: string | null | undefined,
): SodaxStellarAsset | undefined {
  return contract ? SODAX_ASSETS_BY_CONTRACT.get(contract) : undefined;
}

/** True when `contract` is one of the SODAX registry assets. */
export function isSodaxAsset(contract: string | null | undefined): boolean {
  return !!getSodaxAsset(contract);
}

/**
 * A registry asset as a Soroswap token-list entry, for injecting into the
 * token selector. Icons are bundled in /public (same approach as
 * /xlmlogo.png) so they never depend on an external image host.
 */
export function toSodaxAssetInfo(asset: SodaxStellarAsset): AssetInfo {
  return {
    code: asset.code,
    issuer: asset.issuer,
    contract: asset.contract,
    name: asset.name,
    org: "SODAX",
    domain: "sodax.com",
    icon: asset.icon,
    decimals: asset.decimals,
  };
}
