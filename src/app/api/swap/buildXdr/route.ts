/* eslint-disable @typescript-eslint/no-explicit-any */
import { network } from "@/lib/environmentVars";
import { ALLOWED_ORIGINS, api } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { SwapResponse } from "@/app/api/swap/route";

export interface BuildXDR {
  from: string;
  to: string;
  tradeData: SwapResponse;
}

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
    const body = await request.json();

    const buildXdrResponse = await api.post<BuildXDR>(
      `/build?network=${network}`,
      body,
    );

    return NextResponse.json({
      code: "BUILD_XDR_SUCCESS",
      data: buildXdrResponse.data,
    });
  } catch (error: any) {
    console.error("[API ERROR]", error?.message || error);

    return NextResponse.json(
      {
        code: "BUILD_XDR_ERROR",
        message:
          error?.response?.data?.message || error?.message || "Server Error",
      },
      { status: error?.response?.status || 500 },
    );
  }
}
