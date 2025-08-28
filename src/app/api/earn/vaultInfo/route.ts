/* eslint-disable @typescript-eslint/no-explicit-any */

import { defindexClient } from "@/shared/lib/server/defindexClient";
import { SupportedNetworks } from "@defindex/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const vaultId = request.headers.get("vaultId");
    const network = request.headers.get("network");

    if (!vaultId || !network) {
      return NextResponse.json(
        { error: "vaultId and network headers are required" },
        { status: 400 },
      );
    }

    const vaultInfo = await defindexClient.getVaultInfo(
      vaultId,
      network as SupportedNetworks,
    );

    return NextResponse.json({ data: vaultInfo });
  } catch (error: any) {
    console.error("Error fetching vault info:", error);
    return NextResponse.json(error, { status: error.statusCode || 500 });
  }
}
