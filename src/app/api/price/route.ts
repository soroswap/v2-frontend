import { network, SOROSWAP } from "@/shared/lib/environmentVars";
import {
  ALLOWED_ORIGINS,
  getErrorMessage,
  getErrorStatusCode,
  soroswapClient,
} from "@/shared/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { SupportedNetworks } from "@soroswap/sdk";

// Configurable delay between retries (in ms)
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds timeout per request
const BATCH_SIZE = 2; // Reduced to avoid rate limits
const BATCH_DELAY_MS = 1500; // 1.5s delay between batches

/** Result of a price fetch operation */
interface PriceResult {
  asset: string;
  data: { price: number } | null;
  error?: boolean;
}

/**
 * Helper to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout<T>(
  fetchFn: () => Promise<T>,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Request timeout"));
    }, timeoutMs);

    fetchFn()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Fetch price with retry logic for rate limiting
 * Returns the raw price response from the SDK
 */
async function fetchPriceWithRetry(
  assetAddress: string,
  networkParam: SupportedNetworks,
): Promise<{ price: number }[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fetchWithTimeout(
        () => soroswapClient.getPrice(assetAddress, networkParam),
        REQUEST_TIMEOUT_MS,
      );
      return result as { price: number }[];
    } catch (error: unknown) {
      lastError = error;
      const errorMessage = getErrorMessage(error);
      const statusCode = getErrorStatusCode(error);
      const isRateLimit =
        errorMessage.includes("Rate limit") ||
        errorMessage.includes("429") ||
        statusCode === 429;
      const isTimeout = errorMessage === "Request timeout";

      if ((isRateLimit || isTimeout) && attempt < MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS * attempt; // Linear backoff: 2s, 4s, 6s
        console.warn(
          `[API WARN] ${isTimeout ? "Timeout" : "Rate limit"} for ${assetAddress.slice(0, 8)}..., retrying in ${waitTime}ms (attempt ${attempt}/${MAX_RETRIES})`,
        );
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

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

    

    // If single asset, return single response for backward compatibility
    if (assetList.length === 1) {
      const result = await fetchPriceWithRetry(assetList[0], SOROSWAP.NETWORK);

      if (!result || result.length === 0 || !result[0]?.price) {
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
        data: result[0],
      });
    }

    // Process assets in batches to balance speed and rate limiting
    const priceResults: PriceResult[] = [];
    for (let i = 0; i < assetList.length; i += BATCH_SIZE) {
      const batch = assetList.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (assetAddress): Promise<PriceResult> => {
          try {
            const priceResponse = await fetchPriceWithRetry(
              assetAddress,
              SOROSWAP.NETWORK,
            );
            if (
              priceResponse &&
              priceResponse.length > 0 &&
              priceResponse[0]
            ) {
              return { asset: assetAddress, data: priceResponse[0] };
            }
            return { asset: assetAddress, data: null, error: true };
          } catch (error: unknown) {
            console.error(
              `[API ERROR] Failed to fetch price for ${assetAddress}:`,
              getErrorMessage(error),
            );
            return { asset: assetAddress, data: null, error: true };
          }
        }),
      );
      priceResults.push(...batchResults);

      // Delay between batches (except for the last one)
      if (i + BATCH_SIZE < assetList.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    const priceMap = priceResults.reduce(
      (acc, result) => {
        if (!result.error && result.data) {
          acc[result.asset] = result.data;
        }
        return acc;
      },
      {} as Record<string, { price: number }>,
    );

    return NextResponse.json({
      code: "PRICE_SUCCESS",
      data: priceMap,
    });
  } catch (error: unknown) {
    console.error("[API ERROR]", getErrorMessage(error));

    return NextResponse.json(
      { code: "PRICE_ERROR", message: getErrorMessage(error) },
      { status: getErrorStatusCode(error) || 500 },
    );
  }
}
