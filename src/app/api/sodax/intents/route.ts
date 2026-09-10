import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";
import {
  parseSodaxBody,
  sodaxCreateIntentParamsSchema,
} from "@/shared/lib/server/sodaxSchemas";

/* POST /api/sodax/intents — build the unsigned create-intent transaction. */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const parsed = await parseSodaxBody(request, sodaxCreateIntentParamsSchema);
  if (parsed.error) return parsed.error;

  try {
    const result = await getSodaxClient().createIntent(parsed.data);

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX CREATE INTENT ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
