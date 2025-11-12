/* eslint-disable @typescript-eslint/no-explicit-any */
import { network, SOROSWAP } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { NextRequest, NextResponse } from "next/server";

// Price cache implementation
interface PriceCacheEntry {
  data: any;
  timestamp: number;
}

const priceCache = new Map<string, PriceCacheEntry>();
const PRICE_CACHE_TTL = 3 * 60 * 1000; // 3 minutes in milliseconds

/**
 * Get cached price data if still valid
 */
function getCachedPrice(asset: string): any | null {
  const cached = priceCache.get(asset);
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    return cached.data;
  }
  // Remove stale cache entry
  if (cached) {
    priceCache.delete(asset);
  }
  return null;
}

/**
 * Store price data in cache with current timestamp
 */
function setCachedPrice(asset: string, data: any): void {
  priceCache.set(asset, {
    data,
    timestamp: Date.now(),
  });
}

/*This is the GET method for the price API. It is used to get the price of tokens. It's working for mainnet only.*/
export async function GET(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "PRICE_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  if (!network) {
    return NextResponse.json(
      {
        code: "PRICE_ERROR_PARAM",
        message: 'Missing "network" query parameter',
      },
      { status: 400 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const assets = searchParams.get("assets");
    const asset = request.headers.get("asset"); // Keep backward compatibility

    // Support both query parameter (batch) and header (single) for backward compatibility
    const assetList = assets
      ? assets.split(",").filter(Boolean)
      : asset
        ? [asset]
        : null;

    if (!assetList || assetList.length === 0) {
      return NextResponse.json(
        {
          code: "PRICE_ERROR_PARAM",
          message: 'Missing "assets" query parameter or "asset" header',
        },
        { status: 400 },
      );
    }

    // Helper function to delay between requests
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Helper function to fetch with retry logic and caching
    const fetchWithRetry = async (
      assetAddress: string,
      maxRetries = 3,
    ): Promise<{ asset: string; data: any; error?: boolean; cached?: boolean }> => {
      // Check cache first
      const cachedData = getCachedPrice(assetAddress);
      if (cachedData) {
        return { asset: assetAddress, data: cachedData, cached: true };
      }

      // Cache miss - fetch from API
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const priceResponse = await soroswapClient.getPrice(
            assetAddress,
            SOROSWAP.NETWORK,
          );
          const priceData = priceResponse[0];

          // Store in cache for future requests
          setCachedPrice(assetAddress, priceData);

          return { asset: assetAddress, data: priceData };
        } catch (error: any) {
          const isRateLimitError =
            error?.statusCode === 429 || error?.status === 429;
          const retryAfter = error?.retryAfter || 1;

          if (isRateLimitError && attempt < maxRetries - 1) {
            console.warn(
              `[API WARN] Rate limit hit for ${assetAddress}, retrying after ${retryAfter}s...`,
            );
            await delay(retryAfter * 1000);
            continue;
          }

          console.error(
            `[API ERROR] Failed to fetch price for ${assetAddress}:`,
            error,
          );
          return { asset: assetAddress, data: null, error: true };
        }
      }
      return { asset: assetAddress, data: null, error: true };
    };

    // If single asset, return single response for backward compatibility
    if (assetList.length === 1) {
      const result = await fetchWithRetry(assetList[0]);

      if (result.error) {
        return NextResponse.json(
          {
            code: "PRICE_ERROR",
            message: "Failed to fetch price",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        code: "PRICE_SUCCESS",
        data: result.data,
      });
    }

    // Batch request for multiple assets - process sequentially with delays to avoid rate limiting
    const CHUNK_SIZE = 3; // Process 3 assets at a time
    const DELAY_BETWEEN_CHUNKS = 500; // 500ms delay between chunks
    const DELAY_BETWEEN_REQUESTS = 200; // 200ms delay between individual requests

    const priceResults: Array<{
      asset: string;
      data: any;
      error?: boolean;
    }> = [];

    // Process assets in chunks
    for (let i = 0; i < assetList.length; i += CHUNK_SIZE) {
      const chunk = assetList.slice(i, i + CHUNK_SIZE);

      // Process each asset in the chunk with delay between requests
      for (const assetAddress of chunk) {
        const result = await fetchWithRetry(assetAddress);
        priceResults.push(result);

        // Add delay between requests (except for the last one)
        if (
          assetAddress !== chunk[chunk.length - 1] ||
          i + CHUNK_SIZE < assetList.length
        ) {
          await delay(DELAY_BETWEEN_REQUESTS);
        }
      }

      // Add delay between chunks (except after the last chunk)
      if (i + CHUNK_SIZE < assetList.length) {
        await delay(DELAY_BETWEEN_CHUNKS);
      }
    }

    // Create a map of asset addresses to their price data
    const priceMap = priceResults.reduce(
      (acc, result) => {
        if (!result.error && result.data) {
          acc[result.asset] = result.data;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    return NextResponse.json({
      code: "PRICE_SUCCESS",
      data: priceMap,
    });
  } catch (error: any) {
    console.error("[API ERROR]", error);

    return NextResponse.json(error, { status: 500 | error.statusCode });
  }
}
