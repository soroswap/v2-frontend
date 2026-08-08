import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/*
 * POST /api/sodax/allowance — check whether the source allowance is sufficient.
 * For a Stellar source this checks trustline balance sufficiency.
 */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const result = await getSodaxClient().checkAllowance(body);

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX ALLOWANCE ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
