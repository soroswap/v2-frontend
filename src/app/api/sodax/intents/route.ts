import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/* POST /api/sodax/intents — build the unsigned create-intent transaction. */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const result = await getSodaxClient().createIntent(body);

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX CREATE INTENT ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
