/**
 * Wire-format proof for the SODAX Swaps API v2 integration.
 *
 * Quotes real pairs against the live API using the same @sodax/swaps-api client
 * the server routes use, so a passing run proves package + base URL + request
 * shape end to end. Read-only: quotes and fee/deadline lookups, no intents.
 *
 * Usage:
 *   SODAX_SWAPS_API_URL="https://api.sodax.com/v1" node scripts/sodax-quote-check.mjs
 *   # or, with the var in .env.local:
 *   node --env-file=.env.local scripts/sodax-quote-check.mjs
 */
import { SwapsApi, SwapsApiError } from "@sodax/swaps-api";

const baseUrl = process.env.SODAX_SWAPS_API_URL;
if (!baseUrl) {
  console.error(
    "SODAX_SWAPS_API_URL is not set. Set it in the environment or pass --env-file=.env.local",
  );
  process.exit(1);
}

const api = new SwapsApi({ baseUrl, timeout: 20_000 });

// Live Stellar assets (7 decimals each) and Base USDC (6 decimals).
const STELLAR = {
  XLM: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
  USDC: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
  SODA: "CAH5LKJC2ZB4RVUVEVL2QWJWNJLHQE2UF767ILLQ5EQ4O3OURR2XIUGM",
};
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

function toBaseUnits(amount, decimals) {
  const [whole, frac = ""] = String(amount).split(".");
  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(frac.padEnd(decimals, "0").slice(0, decimals))
  ).toString();
}

function fromBaseUnits(units, decimals) {
  const value = BigInt(units);
  const divisor = 10n ** BigInt(decimals);
  const frac = (value % divisor).toString().padStart(decimals, "0");
  return `${value / divisor}.${frac}`;
}

const CASES = [
  {
    label: "10 USDC (stellar) -> USDC (base)",
    tokenSrc: STELLAR.USDC,
    tokenSrcChainKey: "stellar",
    tokenDst: BASE_USDC,
    tokenDstChainKey: "0x2105.base",
    amount: toBaseUnits(10, 7),
    dstDecimals: 6,
  },
  {
    label: "10 USDC (stellar) -> SODA (stellar)",
    tokenSrc: STELLAR.USDC,
    tokenSrcChainKey: "stellar",
    tokenDst: STELLAR.SODA,
    tokenDstChainKey: "stellar",
    amount: toBaseUnits(10, 7),
    dstDecimals: 7,
  },
  {
    label: "100 XLM (stellar) -> SODA (stellar)",
    tokenSrc: STELLAR.XLM,
    tokenSrcChainKey: "stellar",
    tokenDst: STELLAR.SODA,
    tokenDstChainKey: "stellar",
    amount: toBaseUnits(100, 7),
    dstDecimals: 7,
  },
  {
    label: "100 SODA (stellar) -> USDC (stellar)",
    tokenSrc: STELLAR.SODA,
    tokenSrcChainKey: "stellar",
    tokenDst: STELLAR.USDC,
    tokenDstChainKey: "stellar",
    amount: toBaseUnits(100, 7),
    dstDecimals: 7,
  },
  {
    label: "100 USDC (stellar) -> NVDA (stellar)",
    tokenSrc: STELLAR.USDC,
    tokenSrcChainKey: "stellar",
    tokenDst: "CCQFCT4FHJURUQ4RQA4NHYW5GQRHCBDXF33ADXZRTDTDVGKOJO3ZPEMY",
    tokenDstChainKey: "stellar",
    amount: toBaseUnits(100, 7),
    dstDecimals: 7,
  },
  {
    label: "700 USDC (stellar) -> SPY (stellar)",
    tokenSrc: STELLAR.USDC,
    tokenSrcChainKey: "stellar",
    tokenDst: "CD3ZMWOS4PZS2RQITEHBOTS27DTDP4QKOK7IEO5IB64GQKHRJYTVL3SW",
    tokenDstChainKey: "stellar",
    amount: toBaseUnits(700, 7),
    dstDecimals: 7,
  },
  // Sell-direction cases (registry asset -> USDC/XLM) are deliberately
  // absent: selling any registry asset other than SODA currently returns
  // 422 "No path was found" at every size (a solver-side gap under
  // investigation). Add them back once the solver accepts these assets as
  // a source.
];

console.log(`SODAX Swaps API v2 wire check against ${baseUrl}\n`);

let failures = 0;

const stellarTokens = await api.getTokensByChain("stellar");
console.log(
  `GET /swaps/tokens/stellar -> ${stellarTokens.length} tokens:`,
  stellarTokens.map((t) => `${t.symbol}(${t.decimals})`).join(", "),
  "\n",
);

for (const { label, dstDecimals, ...body } of CASES) {
  try {
    const { quotedAmount } = await api.getQuote({
      ...body,
      quoteType: "exact_input",
    });
    console.log(
      `OK   ${label}: quotedAmount=${quotedAmount} (${fromBaseUnits(quotedAmount, dstDecimals)})`,
    );
  } catch (error) {
    failures += 1;
    if (error instanceof SwapsApiError) {
      console.error(
        `FAIL ${label}: ${error.code} ${error.message}`,
        JSON.stringify(error.context),
      );
    } else {
      console.error(`FAIL ${label}:`, error);
    }
  }
}

const { deadline } = await api.getDeadline();
console.log(
  `\nGET /swaps/deadline -> ${deadline} (${new Date(Number(deadline) * 1000).toISOString()})`,
);

if (failures > 0) {
  console.error(`\n${failures} case(s) failed`);
  process.exit(1);
}
console.log("\nAll wire checks passed.");
