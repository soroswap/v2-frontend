import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";
import {
  parseSodaxQuery,
  sodaxSubmitStatusQuerySchema,
} from "@/shared/lib/server/sodaxSchemas";

/*
 * GET /api/sodax/submit/status?txHash=...&srcChainKey=... — poll a submitted swap.
 * Terminal statuses: solved, failed.
 */
export async function GET(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const parsed = parseSodaxQuery(
    {
      txHash: searchParams.get("txHash"),
      srcChainKey: searchParams.get("srcChainKey"),
    },
    sodaxSubmitStatusQuerySchema,
  );
  if (parsed.error) return parsed.error;

  try {
    const result = await getSodaxClient().getSubmitTxStatus(parsed.data);

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX SUBMIT STATUS ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
