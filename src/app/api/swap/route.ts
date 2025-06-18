/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/axios";

// Test GET method to verify the route is working
export async function GET() {
  return NextResponse.json({
    message: "Swap API is working",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  // CORS handling
  const allowedOrigin = [
    ".soroswap.finance",
    "http://localhost:3000",
    "paltalabs.vercel.app",
  ];
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!allowedOrigin.some((allowed) => origin.includes(allowed))) {
    return NextResponse.json(
      {
        code: "SWAP_ERROR_CORS",
        message: "Forbidden",
      },
      { status: 403 },
    );
  }

  // Get network from search params
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");

  if (!network) {
    return NextResponse.json(
      {
        code: "SWAP_ERROR_PARAM",
        message: 'Missing "network" query parameter',
      },
      { status: 400 },
    );
  }

  try {
    // Get request body
    const body = await request.json();

    console.log(`[SWAP] Processing request for network: ${network}`);

    const swapResponse = await api.post(
      `/router/swap/split?network=${network.toLowerCase()}`,
      body,
    );

    console.log(`[SWAP] Request completed successfully`);

    return NextResponse.json({
      code: "SWAP_SUCCESS",
      data: swapResponse.data,
    });
  } catch (error: any) {
    console.error("[API ERROR]", error?.message || error);

    return NextResponse.json(
      {
        code: "SWAP_ERROR",
        message:
          error?.response?.data?.message || error?.message || "Server Error",
      },
      { status: error?.response?.status || 500 },
    );
  }
}
