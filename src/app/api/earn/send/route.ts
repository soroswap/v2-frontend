import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ORIGINS } from "@/shared/lib/server";
import { defindexClient } from "@/shared/lib/server/defindexClient";
import { network, DEFINDEX } from "@/shared/lib/environmentVars";
import { SupportedNetworks } from "@defindex/sdk";
import type {
  SendTransactionResponse,
  LaunchTubeResponse,
} from "@defindex/sdk";

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

    const sendTransactionResponse:
      | SendTransactionResponse
      | LaunchTubeResponse = await defindexClient.sendTransaction(
      xdr,
      DEFINDEX.NETWORK as SupportedNetworks,
      false,
    );

    return NextResponse.json(sendTransactionResponse);
  } catch (error) {
    console.error("[API ERROR]", error);

    return NextResponse.json(error);
  }
}
