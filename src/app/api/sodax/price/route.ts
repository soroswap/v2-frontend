import { NextRequest } from "next/server";
import {
  SODAX_ASSETS_BY_CONTRACT,
  SODAX_STELLAR_CHAIN_KEY,
  SODAX_STELLAR_DECIMALS,
  USDC_STELLAR,
  XLM_STELLAR_CONTRACT,
} from "@/features/sodax/constants/sodax";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server/sodaxClient";
import { formatUnits } from "@/shared/lib/utils/parseUnits";
import { SwapsApiError } from "@sodax/swaps-api";

/**
 * USDC probed per quote, in whole USDC. The solver rejects dust-sized
 * quotes (a 1 USDC probe can return 422 "No path was found" on some pairs),
 * so probe with 100 and divide — mirrors the client-side probe this route
 * replaces (useSodaxUsdPrice.ts).
 */
const PROBE_USDC = 100;
const PROBE_AMOUNT = (
  BigInt(PROBE_USDC) *
  BigInt(10) ** BigInt(USDC_STELLAR.decimals)
).toString();

/**
 * Server-side in-memory cache, mirroring /api/sodax/tokens. The probe quote
 * is identical for every visitor of a given asset — every caller quotes the
 * same 100 USDC -> asset amount — so without a cache, N concurrent visitors
 * is N live solver quotes per refresh interval (finding 8).
 */
const CACHE_TTL_MS = 120 * 1000;
const priceCache = new Map<
  string,
  { data: { contract: string; usdPrice: number | null }; expiresAt: number }
>();

/**
 * Contracts this route will price: every registry asset plus the two
 * counterpart tokens, so the client can value the sell side of any SODAX
 * pair from one consistent source. USDC is 1 by definition and never quoted.
 */
function priceableDecimals(contract: string): number | undefined {
  if (contract === XLM_STELLAR_CONTRACT || contract === USDC_STELLAR.contract) {
    return SODAX_STELLAR_DECIMALS;
  }
  return SODAX_ASSETS_BY_CONTRACT.get(contract)?.decimals;
}

/*
 * GET /api/sodax/price?contract=<C...> — USD price for a SODAX registry
 * asset (or XLM/USDC), derived from the solver by quoting 100 USDC -> asset
 * on Stellar.
 * `usdPrice` is null when the solver has no route for the probe (a 422 "No
 * path" or a zero-amount quote); that answer is cached like a price, so the
 * assets most likely to fail do not turn into a live quote per visitor.
 */
export async function GET(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const contract = searchParams.get("contract");
  const decimals = contract ? priceableDecimals(contract) : undefined;

  if (!contract || decimals === undefined) {
    return sodaxJson(
      {
        code: "SODAX_ERROR_PARAM",
        message: '"contract" must be a SODAX registry asset, XLM or USDC',
      },
      { status: 400 },
    );
  }

  if (contract === USDC_STELLAR.contract) {
    return sodaxJson({ contract, usdPrice: 1 });
  }

  const cached = priceCache.get(contract);
  if (cached && cached.expiresAt > Date.now()) {
    return sodaxJson(cached.data);
  }

  try {
    const quote = await getSodaxClient().getQuote({
      tokenSrc: USDC_STELLAR.contract,
      tokenSrcChainKey: SODAX_STELLAR_CHAIN_KEY,
      tokenDst: contract,
      tokenDstChainKey: SODAX_STELLAR_CHAIN_KEY,
      amount: PROBE_AMOUNT,
      quoteType: "exact_input",
    });

    const usdPrice =
      BigInt(quote.quotedAmount) === BigInt(0)
        ? null
        : PROBE_USDC /
          Number(
            formatUnits({
              value: quote.quotedAmount,
              decimals,
            }),
          );

    const data = { contract, usdPrice };
    priceCache.set(contract, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    return sodaxJson(data);
  } catch (error: unknown) {
    if (
      error instanceof SwapsApiError &&
      error.code === "HTTP_ERROR" &&
      error.context.status === 422
    ) {
      const data = { contract, usdPrice: null };
      priceCache.set(contract, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return sodaxJson(data);
    }
    console.error("[API SODAX PRICE ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
