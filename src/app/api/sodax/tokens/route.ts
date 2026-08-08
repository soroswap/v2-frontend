import { NextRequest } from "next/server";
import {
  getSodaxClient,
  sodaxErrorResponse,
  sodaxJson,
  sodaxOriginGuard,
} from "@/shared/lib/server";

/*
 * GET /api/sodax/tokens?chain=stellar — SODAX-supported swap tokens.
 * Without "chain", returns the full chainKey → tokens map.
 */
export async function GET(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const chain = searchParams.get("chain");

  try {
    const client = getSodaxClient();
    const result = chain
      ? await client.getTokensByChain(chain)
      : await client.getTokens();

    return sodaxJson(result);
  } catch (error: unknown) {
    console.error("[API SODAX TOKENS ERROR]", error);
    return sodaxErrorResponse(error);
  }
}
