import { NextRequest, NextResponse } from "next/server";
import { SendTransactionResponse } from "@soroswap/sdk";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { network, SOROSWAP } from "@/shared/lib/environmentVars";

// Re-export the SDK type for use in other parts of the frontend
export type { SendTransactionResponse };

export interface SendTransactionResponseData {
  code: string;
  data: SendTransactionResponse;
}

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

    const sendTransactionResponse: SendTransactionResponse =
      await soroswapClient.send(xdr, false, SOROSWAP.NETWORK);

    return NextResponse.json({
      code: "SEND_TRANSACTION_SUCCESS",
      data: sendTransactionResponse,
    });
  } catch (error: unknown) {
    console.error("[API ERROR]", error);

    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? (error.statusCode as number)
        : 500;

    return NextResponse.json(error, { status: statusCode });
  }
}
