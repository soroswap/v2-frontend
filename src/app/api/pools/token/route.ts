/* eslint-disable @typescript-eslint/no-explicit-any */
import { network, SOROSWAP } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { SupportedProtocols } from "@soroswap/sdk";
import { NextRequest, NextResponse } from "next/server";

/*This is the GET method for the pools API. It is used to get the pools of a token. It's working for mainnet only.*/
export async function GET(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "GET_POOLS_BY_TOKENS_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  if (!network) {
    return NextResponse.json(
      {
        code: "GET_POOLS_BY_TOKENS_ERROR_PARAM",
        message: 'Missing "network" query parameter',
      },
      { status: 400 },
    );
  }

  try {
    const headers = request.headers;
    const tokenA = headers.get("tokenA");
    const tokenB = headers.get("tokenB");

    if (!tokenA || !tokenB) {
      return NextResponse.json(
        {
          code: "GET_POOLS_BY_TOKENS_ERROR_PARAM",
          message: 'Missing "tokenA" or "tokenB" query parameter',
        },
        { status: 400 },
      );
    }

    const poolByTokens = await soroswapClient.getPoolByTokens(
      tokenA,
      tokenB,
      SOROSWAP.NETWORK,
      [SupportedProtocols.SOROSWAP],
    );

    return NextResponse.json({
      code: "GET_POOLS_BY_TOKENS_SUCCESS",
      data: poolByTokens,
    });
  } catch (error: any) {
    console.error("[API ERROR]", error);

    return NextResponse.json(error, { status: error?.response?.status || 500 });
  }
}
