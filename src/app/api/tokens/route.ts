/* eslint-disable @typescript-eslint/no-explicit-any */
import { network, SOROSWAP } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import {
  AssetInfo,
  AssetList,
  SupportedAssetLists,
  SupportedNetworks,
} from "@soroswap/sdk";
import { NextRequest, NextResponse } from "next/server";
import { xlmTokenList } from "@/shared/lib/constants/tokenList";

// Configurable delay between retries (in ms)
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

interface PublicTokenListResponse {
  network: "mainnet" | "testnet";
  assets: AssetInfo[];
}

/**
 * Helper to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch testnet asset list directly from public API (no auth required)
 */
async function fetchTestnetAssetList(): Promise<AssetInfo[]> {
  const apiUrl = `${SOROSWAP.BASE_URL}/api/tokens`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`Public API error: ${response.status}`);
  }

  const data: PublicTokenListResponse[] = await response.json();
  const testnetData = data.find((item) => item.network === "testnet");

  if (!testnetData || !testnetData.assets) {
    throw new Error("Testnet assets not found in API response");
  }

  console.log(
    `[API INFO] Using testnet token list from API (${testnetData.assets.length} assets)`,
  );
  return testnetData.assets;
}

/**
 * Fetch mainnet asset list from SDK with retry logic for rate limiting
 */
async function fetchMainnetAssetListWithRetry(): Promise<AssetList> {
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const assetListData = await soroswapClient.getAssetList(
        SupportedAssetLists.SOROSWAP,
      );

      if (Array.isArray(assetListData)) {
        throw new Error("SDK returned AssetListInfo[] instead of AssetList");
      }

      console.log("[API INFO] Using mainnet token list from SDK");
      return assetListData;
    } catch (error: any) {
      lastError = error;
      const isRateLimit =
        error.message?.includes("Rate limit") ||
        error.message?.includes("429") ||
        error.status === 429;

      if (isRateLimit && attempt < MAX_RETRIES) {
        console.warn(
          `[API WARN] Rate limit hit, retrying in ${RETRY_DELAY_MS}ms (attempt ${attempt}/${MAX_RETRIES})`,
        );
        await delay(RETRY_DELAY_MS);
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * GET /api/tokens - Get the token list from Soroswap SDK
 * Returns the curated list of tokens for the current network
 * Prioritizes SDK, falls back to hardcoded list if SDK fails
 */
export async function GET(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "TOKENS_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  if (!network) {
    return NextResponse.json(
      {
        code: "TOKENS_ERROR_PARAM",
        message: 'Missing "network" configuration',
      },
      { status: 400 },
    );
  }

  try {
    const isTestnet = SOROSWAP.NETWORK === SupportedNetworks.TESTNET;
    let assets: AssetInfo[];
    let metadata: { name: string; provider: string; version?: string; network: string };

    if (isTestnet) {
      // For testnet, fetch directly from public API
      assets = await fetchTestnetAssetList();
      metadata = {
        name: "Soroswap Testnet Tokens",
        provider: "Soroswap Protocol",
        network: "testnet",
      };
    } else {
      // For mainnet, use SDK with retry logic
      const assetList = await fetchMainnetAssetListWithRetry();
      assets = [...assetList.assets];
      metadata = {
        name: assetList.name,
        provider: assetList.provider || "Soroswap Protocol",
        ...(assetList.version && { version: assetList.version }),
        network: assetList.network || "mainnet",
      };
    }

    // Add XLM token at the beginning if available for the current network and not already present
    const xlmToken = xlmTokenList.find((set) => set.network === network)?.assets;
    if (xlmToken && xlmToken[0]) {
      const xlmAlreadyExists = assets.some(
        (asset) => asset.contract === xlmToken[0].contract,
      );
      if (!xlmAlreadyExists) {
        assets.unshift(xlmToken[0]);
      }
    }

    return NextResponse.json({
      code: "TOKENS_SUCCESS",
      data: assets,
      metadata,
    });
  } catch (error: any) {
    console.error("[API ERROR] Failed to fetch token list:", error);
    return NextResponse.json(
      {
        code: "TOKENS_ERROR",
        message: error.message || "Failed to fetch token list",
      },
      { status: error.status || 500 },
    );
  }
}
