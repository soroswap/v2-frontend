import { defindexClient } from "@/shared/lib/server/defindexClient";
import { SupportedNetworks } from "@defindex/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const vaultId = request.headers.get("vaultId");
    const network = request.headers.get("network");
    const userAddress = request.headers.get("userAddress");

    if (!vaultId || !network || !userAddress) {
      return NextResponse.json(
        { error: "vaultId, network, and userAddress headers are required" },
        { status: 400 },
      );
    }

    const vaultBalance = await defindexClient.getVaultBalance(
      vaultId,
      userAddress,
      network as SupportedNetworks,
    );

    return NextResponse.json({ data: vaultBalance });
  } catch (error) {
    console.error("Error fetching vault balance:", error);
    return NextResponse.json(error, { status: 500 });
  }
}
