import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server/sodaxClient";
import {
  parseSodaxBody,
  sodaxCreateIntentParamsSchema,
} from "@/shared/lib/server/sodaxSchemas";

/*
 * POST /api/sodax/approve — build an unsigned approval transaction.
 * For a Stellar source this returns a trustline (changeTrust) XDR.
 */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const parsed = await parseSodaxBody(request, sodaxCreateIntentParamsSchema);
  if (parsed.error) return parsed.error;

  try {
    const result = await getSodaxClient().approve(parsed.data);

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX APPROVE ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
