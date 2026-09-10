import { NextRequest } from "next/server";
import {
  SODAX_ASSETS_BY_CONTRACT,
  SODAX_STELLAR_CHAIN_KEY,
  USDC_STELLAR,
} from "@/features/sodax/constants/sodax";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";
import { formatUnits } from "@/shared/lib/utils/parseUnits";

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

/*
 * GET /api/sodax/price?contract=<C...> — USD price for a SODAX registry
 * asset, derived from the solver by quoting 100 USDC -> asset on Stellar.
 * `usdPrice` is null when the solver returns a zero-amount quote (no route).
 */
export async function GET(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const contract = searchParams.get("contract");
  const asset = contract ? SODAX_ASSETS_BY_CONTRACT.get(contract) : undefined;

  if (!contract || !asset) {
    return sodaxJson(
      {
        code: "SODAX_ERROR_PARAM",
        message: '"contract" must be a SODAX registry asset',
      },
      { status: 400 },
    );
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
              decimals: asset.decimals,
            }),
          );

    const data = { contract, usdPrice };
    priceCache.set(contract, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    return sodaxJson(data);
  } catch (error: unknown) {
    console.error("[API SODAX PRICE ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
