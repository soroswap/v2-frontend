/* eslint-disable @typescript-eslint/no-explicit-any */
import { network, SOROSWAP } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { RemoveLiquidityRequest } from "@soroswap/sdk";
import { NextRequest, NextResponse } from "next/server";

/*This is the POST method for the remove-liquidity API. It is used to remove liquidity from a pool. It's working for mainnet only.*/
export async function POST(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "REMOVE_LIQUIDITY_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  if (!network) {
    return NextResponse.json(
      {
        code: "REMOVE_LIQUIDITY_ERROR_PARAM",
        message: 'Missing "network" query parameter',
      },
      { status: 400 },
    );
  }

  try {
    const body: RemoveLiquidityRequest = await request.json();

    // Validate required fields
    if (
      !body.assetA ||
      !body.assetB ||
      !body.liquidity ||
      !body.amountA ||
      !body.amountB ||
      !body.to
    ) {
      return NextResponse.json(
        {
          code: "REMOVE_LIQUIDITY_ERROR_PARAM",
          message:
            "Missing required fields: assetA, assetB, liquidity, amountA, amountB, or to",
        },
        { status: 400 },
      );
    }

    const removeLiquidityResponse = await soroswapClient.removeLiquidity(
      body,
      SOROSWAP.NETWORK,
    );

    return NextResponse.json({
      code: "REMOVE_LIQUIDITY_SUCCESS",
      data: removeLiquidityResponse,
    });
  } catch (error: any) {
    console.error("[API ERROR]", error?.message || error);

    return NextResponse.json(
      {
        code: "REMOVE_LIQUIDITY_ERROR",
        message:
          error?.response?.data?.message || error?.message || "Server Error",
      },
      { status: error?.response?.status || 500 },
    );
  }
}
