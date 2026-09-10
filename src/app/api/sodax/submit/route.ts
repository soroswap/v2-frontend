import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";
import {
  parseSodaxBody,
  sodaxSubmitSchema,
} from "@/shared/lib/server/sodaxSchemas";

/*
 * POST /api/sodax/submit — hand a broadcast swap transaction to the relay/solver.
 * Body: { txHash, srcChainKey, walletAddress, intent, relayData }.
 */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const parsed = await parseSodaxBody(request, sodaxSubmitSchema);
  if (parsed.error) return parsed.error;

  try {
    const client = getSodaxClient();
    // The SDK's SubmitTxRequestV2.intent is typed IntentRequestV2, whose
    // numeric fields are `bigint` in the SDK's in-memory representation.
    // This route only ever sees JSON from the browser, where they are
    // decimal strings (SodaxIntent, src/features/sodax/types/sodax.ts) —
    // and the SDK's own submitTx defensively passes any non-bigint field
    // through unchanged (serializeIntentRequest in @sodax/swaps-api), so a
    // decimal string is the correct wire shape; the DTO type just predates
    // a JSON-only caller like this one.
    const result = await client.submitTx(
      parsed.data as unknown as Parameters<typeof client.submitTx>[0],
    );

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX SUBMIT TX ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
