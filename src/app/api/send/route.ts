/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { api, ALLOWED_ORIGINS } from "@/lib/server";
import { network } from "@/lib/environmentVars";

// interface StellarTransactionResponse {
//   status: "SUCCESS" | "FAILED" | "PENDING";
//   hash: string;
//   feeCharged: number;
//   envelopeXdr: string;
//   resultXdr: string;
//   resultMetaXdr: string;
//   returnValue: string;
//   diagnosticEventsXdr: string[];
//   txHash: string;
//   latestLedger: number;
//   latestLedgerCloseTime: string;
//   oldestLedger: number;
//   oldestLedgerCloseTime: string;
//   ledger: number;
//   createdAt: string;
//   applicationOrder: number;
//   feeBump: boolean;
// }

interface SendTransactionResponse {
  xdr: string;
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
    const body = await request.json();

    const sendTransactionResponse = await api.post<SendTransactionResponse>(
      "/send",
      body,
      {
        params: { network },
      },
    );

    return NextResponse.json({
      code: "SEND_TRANSACTION_SUCCESS",
      data: sendTransactionResponse.data,
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
