import { SwapsApi, SwapsApiError } from "@sodax/swaps-api";
import { NextRequest, NextResponse } from "next/server";
import { SODAX } from "@/shared/lib/environmentVars";
import { bigIntReplacer } from "@/shared/lib/utils/bigIntReplacer";
import { ALLOWED_ORIGINS } from "./constants";
import { getErrorMessage, getErrorStatusCode } from "./errorUtils";

/**
 * Lazily constructed singleton for the SODAX Swaps API v2.
 * Lazy so a missing env var fails the first request with a clear message
 * instead of crashing `next build`, which evaluates route modules.
 */
let client: SwapsApi | null = null;

export function getSodaxClient(): SwapsApi {
  if (!client) {
    if (!SODAX.SWAPS_API_URL) {
      throw new Error(
        "SODAX_SWAPS_API_URL is not set. Add it to your environment (see .env.example) — the SODAX swap endpoints cannot run without it.",
      );
    }
    client = new SwapsApi({
      baseUrl: SODAX.SWAPS_API_URL,
      timeout: 15_000,
      // Optional today — the SODAX API doesn't require a key yet, but pass
      // it through once configured rather than needing a second change here.
      ...(SODAX.API_KEY ? { headers: { "x-api-key": SODAX.API_KEY } } : {}),
    });
  }
  return client;
}

/**
 * True when the Origin/Referer value's HOST matches the allow-list.
 * Anchored (URL-parsed, exact host or dot-suffix match) rather than the
 * substring check the older routes use inline — the SODAX routes include a
 * direct-to-RPC broadcast endpoint, where `origin.includes(allowed)` would
 * pass e.g. "https://evil.com/?x=app.soroswap.finance".
 */
function isAllowedOrigin(value: string): boolean {
  let host: string;
  try {
    host = new URL(value).host;
  } catch {
    return false;
  }

  return ALLOWED_ORIGINS.some((allowed) => {
    if (allowed.startsWith(".")) {
      return host === allowed.slice(1) || host.endsWith(allowed);
    }
    if (allowed.includes("://")) {
      try {
        return new URL(allowed).host === host;
      } catch {
        return false;
      }
    }
    return host === allowed;
  });
}

/**
 * Origin allow-list check for the SODAX routes. Returns a 403 response when
 * the origin is not allowed, null otherwise.
 */
export function sodaxOriginGuard(request: NextRequest): NextResponse | null {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";

  if (!isAllowedOrigin(origin)) {
    return NextResponse.json(
      { code: "SODAX_ERROR_CORS", message: "Forbidden" },
      { status: 403 },
    );
  }

  return null;
}

/**
 * The Swaps API client deserializes unsigned transactions with `bigint` fields
 * (e.g. Stellar tx `value`), which `NextResponse.json` cannot serialize.
 * Re-stringify them for the wire; the browser-side wrapper types them as strings.
 */
export function sodaxJson<T>(
  data: T,
  init?: { status?: number },
): NextResponse {
  const body = JSON.stringify(data, bigIntReplacer);
  return new NextResponse(body, {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

const HTTP_STATUS_BY_CODE: Record<SwapsApiError["code"], number> = {
  NETWORK_ERROR: 502,
  TIMEOUT_ERROR: 504,
  HTTP_ERROR: 502,
  PARSE_ERROR: 502,
  VALIDATION_ERROR: 502,
};

/**
 * Map any failure from a SODAX handler to a JSON error response.
 * `SwapsApiError.code` is preserved verbatim so the client can map each of the
 * five failure modes to a distinct user-facing state.
 */
export function sodaxErrorResponse(error: unknown): NextResponse {
  if (error instanceof SwapsApiError) {
    const upstreamStatus = error.context.status;
    const status =
      error.code === "HTTP_ERROR" && upstreamStatus && upstreamStatus >= 400
        ? upstreamStatus
        : HTTP_STATUS_BY_CODE[error.code];

    return sodaxJson(
      {
        code: error.code,
        message: error.message,
        context: error.context,
      },
      { status },
    );
  }

  return sodaxJson(
    { code: "INTERNAL_ERROR", message: getErrorMessage(error) },
    { status: getErrorStatusCode(error) ?? 500 },
  );
}
