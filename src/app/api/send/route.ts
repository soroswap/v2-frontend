/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ORIGINS, soroswapClient } from "@/lib/server";
import { network, SOROSWAP } from "@/lib/environmentVars";

export async function POST(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "SEND_TRANSACTION_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  if (!network) {
    return NextResponse.json(
      {
        code: "SEND_TRANSACTION_ERROR_PARAM",
        message: 'Missing "network" query parameter',
      },
      { status: 400 },
    );
  }

  try {
    const xdr: string = await request.json();

    const sendTransactionResponse = await soroswapClient.send(
      xdr,
      false,
      SOROSWAP.NETWORK,
    );

    return NextResponse.json({
      code: "SEND_TRANSACTION_SUCCESS",
      data: sendTransactionResponse,
    });
  } catch (error: any) {
    console.error("[API ERROR]", error?.message || error);

    return NextResponse.json(
      {
        code: "SEND_TRANSACTION_ERROR",
        message:
          error?.response?.data?.message || error?.message || "Server Error",
      },
      { status: error?.response?.status || 500 },
    );
  }
}
