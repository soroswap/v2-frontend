import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/*
 * POST /api/sodax/approve — build an unsigned approval transaction.
 * For a Stellar source this returns a trustline (changeTrust) XDR.
 */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const result = await getSodaxClient().approve(body);

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX APPROVE ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
