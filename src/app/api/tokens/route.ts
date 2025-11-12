/* eslint-disable @typescript-eslint/no-explicit-any */
import { network } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { AssetInfo, AssetList, SupportedAssetLists } from "@soroswap/sdk";
import { NextRequest, NextResponse } from "next/server";
import { xlmTokenList } from "@/shared/lib/constants/tokenList";
import { soroswapTokenList } from "@/shared/hooks/hardcodedTokenList";

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
    let assetList: AssetList;

    // Try to get token list from SDK first (priority)
    try {
      const assetListData = await soroswapClient.getAssetList(
        SupportedAssetLists.SOROSWAP,
      );

      // Handle the response which can be AssetList or AssetListInfo[]
      if (Array.isArray(assetListData)) {
        throw new Error("SDK returned AssetListInfo[] instead of AssetList");
      }

      assetList = assetListData;
      console.log("[API INFO] Using token list from SDK");
    } catch (sdkError: any) {
      // Fallback to hardcoded list if SDK fails
      console.warn(
        "[API WARN] SDK getAssetList failed, using hardcoded fallback:",
        sdkError.message,
      );

      assetList = soroswapTokenList as AssetList;
    }

    // Extract assets from the asset list
    const assets: AssetInfo[] = [...assetList.assets];

    // Add XLM token at the beginning if available for the current network
    const xlmToken = xlmTokenList.find((set) => set.network === network)?.assets;
    if (xlmToken && xlmToken[0]) {
      assets.unshift(xlmToken[0]);
    }

    return NextResponse.json({
      code: "TOKENS_SUCCESS",
      data: assets,
      metadata: {
        name: assetList.name,
        provider: assetList.provider,
        version: assetList.version,
        network: assetList.network || network,
      },
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
