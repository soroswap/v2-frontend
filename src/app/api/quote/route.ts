/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { api, ALLOWED_ORIGINS } from "@/lib/server";
import { network } from "@/lib/environmentVars";
import { QuoteResponse } from "@/components/shared/types/swap";

/*This is the GET method for the quote API. It is used to verify the route is working.*/
export async function GET() {
  return NextResponse.json({
    message: "Quote API is working",
    timestamp: new Date().toISOString(),
  });
}

/*This is the POST method for the quote API. It is used to get the quote for a swap.*/
export async function POST(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "QUOTE_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  if (!network) {
    return NextResponse.json(
      {
        code: "QUOTE_ERROR_PARAM",
        message: 'Missing "network" query parameter',
      },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();

    const swapResponse = await api.post<QuoteResponse>(
      `/quote?network=${network}`,
      body,
    );

    return NextResponse.json({
      code: "QUOTE_SUCCESS",
      data: swapResponse.data,
    });
  } catch (error: any) {
    console.error("[API ERROR]", error?.message || error);

    return NextResponse.json(
      {
        code: "QUOTE_ERROR",
        message:
          error?.response?.data?.message || error?.message || "Server Error",
      },
      { status: error?.response?.status || 500 },
    );
  }
}
