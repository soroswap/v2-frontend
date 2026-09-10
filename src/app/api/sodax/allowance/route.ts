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
 * POST /api/sodax/allowance — check whether the source allowance is sufficient.
 * For a Stellar source this checks trustline balance sufficiency.
 */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const parsed = await parseSodaxBody(request, sodaxCreateIntentParamsSchema);
  if (parsed.error) return parsed.error;

  try {
    const result = await getSodaxClient().checkAllowance(parsed.data);

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX ALLOWANCE ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
