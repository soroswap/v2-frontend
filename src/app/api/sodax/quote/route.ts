import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server/sodaxClient";
import {
  parseSodaxBody,
  sodaxQuoteSchema,
} from "@/shared/lib/server/sodaxSchemas";

/* POST /api/sodax/quote — solver quote for a swap (exact_input only). */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const parsed = await parseSodaxBody(request, sodaxQuoteSchema);
  if (parsed.error) return parsed.error;

  try {
    const quote = await getSodaxClient().getQuote(parsed.data);

    return sodaxJson(quote);
  } catch (error: unknown) {
    console.error("[API SODAX QUOTE ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
