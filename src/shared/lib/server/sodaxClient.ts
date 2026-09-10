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
 * True when the Origin/Referer value's HOST matches the allow-list, OR
 * matches the request's own host (`requestHost`).
 *
 * The same-origin check exists because the allow-list can never enumerate
 * every legitimate deployment: a Vercel preview host is
 * `<project>-git-<branch>-<team>.vercel.app` (or `<project>-<hash>-<team>.vercel.app`),
 * a fresh string per branch/PR, and is never equal to (nor a suffix match
 * for) any fixed allow-list entry. Comparing the parsed Origin/Referer host
 * against the host the request itself arrived on is correct on production,
 * on every preview deployment, and on any future domain, without widening
 * the list — and it is exactly the rule a browser's own same-origin policy
 * already enforces, so it grants nothing a same-origin `fetch` couldn't do
 * anyway. Anchored (URL-parsed, exact host match) rather than the substring
 * check the older routes use inline — the SODAX routes include a
 * direct-to-RPC broadcast endpoint, where `origin.includes(allowed)` would
 * pass e.g. "https://evil.com/?x=app.soroswap.finance".
 */
function isAllowedOrigin(value: string, requestHost: string | null): boolean {
  let host: string;
  try {
    host = new URL(value).host;
  } catch {
    return false;
  }

  if (requestHost && host === requestHost) {
    return true;
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
 *
 * Fail-closed: a missing or unparseable Origin/Referer never falls back to
 * "allowed" — `isAllowedOrigin` returns false and this returns 403. The
 * request's own host is read from `x-forwarded-host` first (the header
 * Vercel's edge sets to the original client-facing host, since `host` on
 * the origin request can be an internal one) and falls back to `host`.
 */
export function sodaxOriginGuard(request: NextRequest): NextResponse | null {
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "";
  const requestHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (!isAllowedOrigin(origin, requestHost)) {
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
