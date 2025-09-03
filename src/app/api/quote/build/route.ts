/* eslint-disable @typescript-eslint/no-explicit-any */
import { network, SOROSWAP } from "@/shared/lib/environmentVars";
import { ALLOWED_ORIGINS, soroswapClient } from "@/shared/lib/server";
import { BuildQuoteRequest } from "@soroswap/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "BUILD_XDR_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  if (!network) {
    return NextResponse.json(
      {
        code: "BUILD_XDR_ERROR_PARAM",
        message: 'Missing "network" query parameter',
      },
      { status: 400 },
    );
  }

  try {
    const body: BuildQuoteRequest = await request.json();
    const buildXdrResponse = await soroswapClient.build(body, SOROSWAP.NETWORK);
    return NextResponse.json(buildXdrResponse);
  } catch (error: any) {
    console.error("[API ERROR]", error);
    return NextResponse.json(error, {
      status: error?.status || error?.statusCode || 500,
    });
  }
}
