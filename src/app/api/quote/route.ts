/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { network } from "@/shared/lib/environmentVars";

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
    const quoteRequest = await soroswapClient.quote(body);

    return NextResponse.json(quoteRequest);
  } catch (error: any) {
    console.error("[API QUOTE ERROR]", error);

    return NextResponse.json(error);
  }
}
