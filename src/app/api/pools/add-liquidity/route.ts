/* eslint-disable @typescript-eslint/no-explicit-any */
import { network, SOROSWAP } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { AddLiquidityRequest } from "@soroswap/sdk";
import { NextRequest, NextResponse } from "next/server";

/*This is the POST method for the add-liquidity API. It is used to add liquidity to a pool. It's working for mainnet only.*/
export async function POST(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "ADD_LIQUIDITY_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  if (!network) {
    return NextResponse.json(
      {
        code: "ADD_LIQUIDITY_ERROR_PARAM",
        message: 'Missing "network" query parameter',
      },
      { status: 400 },
    );
  }

  try {
    const body: AddLiquidityRequest = await request.json();

    // Validate required fields
    if (
      !body.assetA ||
      !body.assetB ||
      !body.amountA ||
      !body.amountB ||
      !body.to
    ) {
      return NextResponse.json(
        {
          code: "ADD_LIQUIDITY_ERROR_PARAM",
          message:
            "Missing required fields: assetA, assetB, amountA, amountB, or to",
        },
        { status: 400 },
      );
    }

    const addLiquidityResponse = await soroswapClient.addLiquidity(
      body,
      SOROSWAP.NETWORK,
    );

    return NextResponse.json({
      code: "ADD_LIQUIDITY_SUCCESS",
      data: addLiquidityResponse,
    });
  } catch (error: any) {
    console.error("[API ERROR]", error?.message || error);

    return NextResponse.json(error, { status: error?.response?.status || 500 });
  }
}
