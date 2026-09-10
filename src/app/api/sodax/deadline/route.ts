import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/** Upper bound on how far out an intent deadline can be pushed (24h). */
const MAX_OFFSET_SECONDS = 24 * 60 * 60;

/* GET /api/sodax/deadline?offsetSeconds=300 — intent expiry timestamp. */
export async function GET(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const offsetParam = searchParams.get("offsetSeconds");
  const offsetSeconds = offsetParam ? Number(offsetParam) : undefined;

  if (
    offsetSeconds !== undefined &&
    (!Number.isInteger(offsetSeconds) ||
      offsetSeconds < 1 ||
      offsetSeconds > MAX_OFFSET_SECONDS)
  ) {
    return sodaxJson(
      {
        code: "SODAX_ERROR_PARAM",
        message: `"offsetSeconds" must be an integer between 1 and ${MAX_OFFSET_SECONDS}`,
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
