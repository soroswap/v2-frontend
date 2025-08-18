import { defindexClient } from "@/shared/lib/server/defindexClient";
import { SupportedNetworks } from "@defindex/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const vaultId = request.headers.get("vaultId");
    const network = request.headers.get("network");
    const amount = request.headers.get("amount");
    const caller = request.headers.get("caller");
    const slippageBps = request.headers.get("slippageBps");

    if (!slippageBps) {
      return NextResponse.json(
        { error: "slippageBps is required" },
        { status: 400 },
      );
    }

    if (!caller) {
      return NextResponse.json(
        { error: "caller is required" },
        { status: 400 },
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: "amount is required" },
        { status: 400 },
      );
    }

    if (!vaultId || !network) {
      return NextResponse.json(
        { error: "vaultId and network are required" },
        { status: 400 },
      );
    }

    const data = await defindexClient.withdrawFromVault(
      vaultId,
      {
        amounts: [Number(amount)],
        caller: caller,
        slippageBps: Number(slippageBps),
      },
      network as SupportedNetworks,
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error withdrawing from vault:", error);
    return NextResponse.json(error);
  }
}
