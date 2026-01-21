import { SOROSWAP } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/balance - Fetch all token balances for a user address
 *
 * Headers:
 *  - address: The user's Stellar wallet address (required)
 *
 * Returns:
 *  - BalancesResponse with all token balances for the user
 */
export async function GET(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "BALANCE_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  const address = request.headers.get("address");

  if (!address) {
    return NextResponse.json(
      {
        code: "BALANCE_ERROR_PARAM",
        message: 'Missing "address" header',
      },
      { status: 400 },
    );
  }

  try {
    const balanceResponse = await soroswapClient.getBalances(
      address,
      SOROSWAP.NETWORK,
    );

    return NextResponse.json({
      code: "BALANCE_SUCCESS",
      data: balanceResponse,
    });
  } catch (error) {
    console.error("[API BALANCE ERROR]", error);

    return NextResponse.json(
      {
        code: "BALANCE_ERROR",
        message: "Failed to fetch balances",
      },
      { status: 500 },
    );
  }
}
