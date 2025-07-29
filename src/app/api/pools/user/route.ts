/* eslint-disable @typescript-eslint/no-explicit-any */
import { network, SOROSWAP } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { NextRequest, NextResponse } from "next/server";

/*This is the GET method for the pools API. It is used to get the pools of a token. It's working for mainnet only.*/
export async function GET(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "USER_POOLS_POSITIONS_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  if (!network) {
    return NextResponse.json(
      {
        code: "USER_POOLS_POSITIONS_ERROR_PARAM",
        message: 'Missing "network" query parameter',
      },
      { status: 400 },
    );
  }

  try {
    const headers = request.headers;
    const address = headers.get("address");

    if (!address) {
      return NextResponse.json(
        {
          code: "USER_POOLS_POSITIONS_ERROR_PARAM",
          message: 'Missing "address" query parameter',
        },
        { status: 400 },
      );
    }

    if (network === "testnet") {
      return NextResponse.json(
        {
          code: "USER_POOLS_POSITIONS_WRONG_NETWORK",
          message: "User pools positions is not available for testnet",
        },
        { status: 400 },
      );
    }

    const userPoolsPositions = await soroswapClient.getUserPositions(
      address,
      SOROSWAP.NETWORK,
    );

    console.log("userPoolsPositions", userPoolsPositions);

    return NextResponse.json({
      code: "USER_POOLS_POSITIONS_SUCCESS",
      data: userPoolsPositions,
    });
  } catch (error: any) {
    console.error("[API ERROR]", error?.message || error);

    return NextResponse.json(
      {
        code: "USER_POOLS_POSITIONS_ERROR",
        message:
          error?.response?.data?.message || error?.message || "Server Error",
      },
      { status: error?.response?.status || 500 },
    );
  }
}
