/* eslint-disable @typescript-eslint/no-explicit-any */
import { network, SOROSWAP } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { NextRequest, NextResponse } from "next/server";

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

    // If single asset, return single response for backward compatibility
    if (assetList.length === 1) {
      const priceResponse = await soroswapClient.getPrice(
        assetList[0],
        SOROSWAP.NETWORK,
      );

      return NextResponse.json({
        code: "PRICE_SUCCESS",
        data: priceResponse[0],
      });
    }

    // Batch request for multiple assets
    const pricePromises = assetList.map(async (assetAddress) => {
      try {
        const priceResponse = await soroswapClient.getPrice(
          assetAddress,
          SOROSWAP.NETWORK,
        );
        return { asset: assetAddress, data: priceResponse[0] };
      } catch (error) {
        console.error(
          `[API ERROR] Failed to fetch price for ${assetAddress}:`,
          error,
        );
        return { asset: assetAddress, data: null, error: true };
      }
    });

    const priceResults = await Promise.all(pricePromises);

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
    console.error("[API ERROR]", error?.message || error);

    return NextResponse.json(
      {
        code: "PRICE_ERROR",
        message:
          error?.response?.data?.message || error?.message || "Server Error",
      },
      { status: error?.response?.status || 500 },
    );
  }
}
