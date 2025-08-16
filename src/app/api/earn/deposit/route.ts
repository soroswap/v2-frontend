import { defindexClient } from "@/shared/lib/server/defindexClient";
import { SupportedNetworks } from "@defindex/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vaultId, network, amount, caller, slippageBps } = body;

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

    const data = await defindexClient.depositToVault(
      vaultId,
      {
        amounts: [Number(amount)],
        caller: caller,
        slippageBps: Number(slippageBps),
        invest: true,
      },
      network as SupportedNetworks,
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching vault info:", error);
    return NextResponse.json(
      { error: "Failed to fetch vault info" },
      { status: 500 },
    );
  }
}
