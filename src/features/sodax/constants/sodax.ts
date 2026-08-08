import { AssetInfo } from "@soroswap/sdk";

/** SODAX SpokeChainKey for Stellar. */
export const SODAX_STELLAR_CHAIN_KEY = "stellar";

/** Poll interval while waiting for the solver to fill an intent. */
export const SODAX_STATUS_POLL_INTERVAL_MS = 3_000;

/** Give up polling after this long even if the intent deadline allows more. */
export const SODAX_STATUS_POLL_TIMEOUT_MS = 5 * 60_000;

/** A classic Stellar asset wrapped as a Soroban Asset Contract. */
export interface StellarClassicAsset {
  code: string;
  issuer: string;
  contract: string;
  decimals: number;
}

/**
 * SODA on Stellar. `code`/`issuer` drive the trustline, `contract` drives
 * SODAX requests.
 */
export const SODA_STELLAR: StellarClassicAsset = {
  code: "SODA",
  issuer: "GDYUTHY75A7WUZJQDPOP66FB32BOYGZRXHWTWO4Q6LQTANT5X3V5HNFA",
  contract: "CAH5LKJC2ZB4RVUVEVL2QWJWNJLHQE2UF767ILLQ5EQ4O3OURR2XIUGM",
  decimals: 7,
};

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
 * Counterpart assets SODA can be swapped with. Deliberately narrow:
 * the product decision is "buy and sell SODA with XLM or USDC", not a
 * general cross-chain matrix.
 */
export const SODA_COUNTERPART_CONTRACTS: readonly string[] = [
  XLM_STELLAR_CONTRACT,
  USDC_STELLAR_CONTRACT,
];

/**
 * SODA as a Soroswap token-list entry, for injecting into the token selector.
 * The icon is bundled in /public (same approach as /xlmlogo.png) so it never
 * depends on an external image host.
 */
export const SODA_ASSET_INFO: AssetInfo = {
  code: SODA_STELLAR.code,
  issuer: SODA_STELLAR.issuer,
  contract: SODA_STELLAR.contract,
  name: "SODAX",
  org: "SODAX",
  domain: "sodax.com",
  icon: "/sodalogo.png",
  decimals: SODA_STELLAR.decimals,
};
