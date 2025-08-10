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

    console.log({
      vaultId,
      network,
      amount,
      caller,
      slippageBps,
    });

    if (!slippageBps) {
      return NextResponse.json(
        { error: "slippageBps header is required" },
        { status: 400 },
      );
    }

    if (!caller) {
      return NextResponse.json(
        { error: "caller header is required" },
        { status: 400 },
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: "amount header is required" },
        { status: 400 },
      );
    }

    if (!vaultId || !network) {
      return NextResponse.json(
        { error: "vaultId and network headers are required" },
        { status: 400 },
      );
    }

    const data = await defindexClient.depositToVault(
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
    console.error("Error fetching vault info:", error);
    return NextResponse.json(
      { error: "Failed to fetch vault info" },
      { status: 500 },
    );
  }
}
