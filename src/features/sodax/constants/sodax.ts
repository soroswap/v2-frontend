import { AssetInfo } from "@soroswap/sdk";

/** SODAX SpokeChainKey for Stellar. */
export const SODAX_STELLAR_CHAIN_KEY = "stellar";

/** Poll interval while waiting for the solver to fill an intent. */
export const SODAX_STATUS_POLL_INTERVAL_MS = 3_000;

/** Give up polling after this long even if the intent deadline allows more. */
export const SODAX_STATUS_POLL_TIMEOUT_MS = 5 * 60_000;

/**
 * SODA on Stellar. Classic asset wrapped as a Soroban Asset Contract —
 * `code`/`issuer` drive the trustline, `contract` drives SODAX requests.
 */
export const SODA_STELLAR = {
  code: "SODA",
  issuer: "GDYUTHY75A7WUZJQDPOP66FB32BOYGZRXHWTWO4Q6LQTANT5X3V5HNFA",
  contract: "CAH5LKJC2ZB4RVUVEVL2QWJWNJLHQE2UF767ILLQ5EQ4O3OURR2XIUGM",
  decimals: 7,
} as const;

/** Native XLM Stellar Asset Contract (same id Soroswap's token list uses). */
export const XLM_STELLAR_CONTRACT =
  "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";

/** Circle USDC Stellar Asset Contract (same id the bridge feature uses). */
export const USDC_STELLAR_CONTRACT =
  "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";

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
