import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/*
 * POST /api/sodax/submit — hand a broadcast swap transaction to the relay/solver.
 * Body: { txHash, srcChainKey, walletAddress, intent, relayData }.
 */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const result = await getSodaxClient().submitTx(body);

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX SUBMIT TX ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
