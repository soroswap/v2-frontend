import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/* GET /api/sodax/deadline?offsetSeconds=300 — intent expiry timestamp. */
export async function GET(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const offsetParam = searchParams.get("offsetSeconds");
  const offsetSeconds = offsetParam ? Number(offsetParam) : undefined;

  if (offsetSeconds !== undefined && (!Number.isFinite(offsetSeconds) || offsetSeconds < 1)) {
    return sodaxJson(
      {
        code: "SODAX_ERROR_PARAM",
        message: '"offsetSeconds" must be a number >= 1',
      },
      { status: 400 },
    );
  }

  try {
    const result = await getSodaxClient().getDeadline(
      offsetSeconds !== undefined ? { offsetSeconds } : undefined,
    );

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX DEADLINE ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
