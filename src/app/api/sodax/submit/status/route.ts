import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/*
 * GET /api/sodax/submit/status?txHash=...&srcChainKey=... — poll a submitted swap.
 * Terminal statuses: solved, failed.
 */
export async function GET(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const txHash = searchParams.get("txHash");
  const srcChainKey = searchParams.get("srcChainKey");

  if (!txHash || !srcChainKey) {
    return sodaxJson(
      {
        code: "SODAX_ERROR_PARAM",
        message: 'Missing "txHash" or "srcChainKey" query parameter',
      },
      { status: 400 },
    );
  }

  try {
    const result = await getSodaxClient().getSubmitTxStatus({
      txHash,
      srcChainKey,
    });

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX SUBMIT STATUS ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
