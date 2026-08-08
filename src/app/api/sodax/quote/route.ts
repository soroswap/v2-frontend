import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/* POST /api/sodax/quote — solver quote for a swap (exact_input only). */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const quote = await getSodaxClient().getQuote(body);

    return sodaxJson(quote);
  } catch (error: unknown) {
    console.error("[API SODAX QUOTE ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
