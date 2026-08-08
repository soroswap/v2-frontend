import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/* POST /api/sodax/intents/cancel — build the unsigned cancel-intent transaction. */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const result = await getSodaxClient().cancelIntent(body);

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX CANCEL INTENT ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
