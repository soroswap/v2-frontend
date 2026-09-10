import { NextRequest } from "next/server";
import { SODAX_STELLAR_CHAIN_KEY } from "@/features/sodax/constants/sodax";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/**
 * Server-side in-memory cache, following the /api/price pattern. Token
 * listings change rarely; without this every page load hits the SODAX
 * upstream (the client SWR cache does not survive reloads).
 */
const CACHE_TTL_MS = 60 * 60 * 1000;
const tokensCache = new Map<string, { data: unknown; expiresAt: number }>();

/** Only chain this app ever requests tokens for — reject anything else
 * before it reaches the upstream SODAX API or grows the cache. */
const SUPPORTED_CHAINS = new Set([SODAX_STELLAR_CHAIN_KEY]);

/*
 * GET /api/sodax/tokens?chain=stellar — SODAX-supported swap tokens.
 * Without "chain", returns the full chainKey → tokens map.
 */
export async function GET(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const chain = searchParams.get("chain");
  if (chain && !SUPPORTED_CHAINS.has(chain)) {
    return sodaxJson(
      { code: "SODAX_ERROR_PARAM", message: 'Unsupported "chain" value' },
      { status: 400 },
    );
  }
  const cacheKey = chain ?? "__all__";

  const cached = tokensCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return sodaxJson(cached.data);
  }

  try {
    const client = getSodaxClient();
    const result = chain
      ? await client.getTokensByChain(chain)
      : await client.getTokens();

    tokensCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX TOKENS ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
