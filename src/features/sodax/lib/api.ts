import {
  SodaxAllowanceResponse,
  SodaxApiError,
  SodaxApiErrorCode,
  SodaxApproveResponse,
  SodaxCreateIntentParams,
  SodaxCreateIntentResponse,
  SodaxDeadlineResponse,
  SodaxQuoteRequest,
  SodaxQuoteResponse,
  SodaxSubmitStatusResponse,
  SodaxSubmitTxRequest,
  SodaxSubmitTxResponse,
  SodaxToken,
} from "@/features/sodax/types/sodax";

const KNOWN_CODES: readonly SodaxApiErrorCode[] = [
  "NETWORK_ERROR",
  "TIMEOUT_ERROR",
  "HTTP_ERROR",
  "PARSE_ERROR",
  "VALIDATION_ERROR",
  "INTERNAL_ERROR",
  "SODAX_ERROR_CORS",
  "SODAX_ERROR_PARAM",
  "SODAX_ERROR_SUBMIT",
  "SODAX_ERROR_BROADCAST_UNKNOWN",
];

function toApiError(status: number, body: unknown): SodaxApiError {
  if (typeof body === "object" && body !== null) {
    const err = body as Record<string, unknown>;
    const code = KNOWN_CODES.includes(err.code as SodaxApiErrorCode)
      ? (err.code as SodaxApiErrorCode)
      : "INTERNAL_ERROR";
    const message =
      typeof err.message === "string" ? err.message : "SODAX request failed";
    return new SodaxApiError(code, message, status, err.context);
  }
  return new SodaxApiError("INTERNAL_ERROR", "SODAX request failed", status);
}

/** No SODAX request should hang the caller forever behind a dead upstream. */
const DEFAULT_TIMEOUT_MS = 20_000;

export interface SodaxRequestOptions {
  /**
   * Per-call ceiling in ms. Only the broadcast route needs more than the
   * default, because it waits for on-chain confirmation before answering.
   */
  timeoutMs?: number;
}

async function request<T>(
  url: string,
  init?: RequestInit,
  options?: SodaxRequestOptions,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
    });
  } catch (cause) {
    const timedOut =
      cause instanceof DOMException && cause.name === "AbortError";
    throw new SodaxApiError(
      timedOut ? "TIMEOUT_ERROR" : "NETWORK_ERROR",
      cause instanceof Error ? cause.message : "Network request failed",
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new SodaxApiError(
      "PARSE_ERROR",
      "SODAX response was not valid JSON",
      response.status,
    );
  }

  if (!response.ok) {
    throw toApiError(response.status, body);
  }

  return body as T;
}

export function post<T>(
  url: string,
  payload: unknown,
  options?: SodaxRequestOptions,
): Promise<T> {
  return request<T>(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    options,
  );
}

export function fetchSodaxStellarTokens(): Promise<SodaxToken[]> {
  return request<SodaxToken[]>("/api/sodax/tokens?chain=stellar");
}

export function fetchSodaxQuote(
  quoteRequest: SodaxQuoteRequest,
): Promise<SodaxQuoteResponse> {
  return post<SodaxQuoteResponse>("/api/sodax/quote", quoteRequest);
}

export function fetchSodaxDeadline(): Promise<SodaxDeadlineResponse> {
  return request<SodaxDeadlineResponse>("/api/sodax/deadline");
}

export function checkSodaxAllowance(
  params: SodaxCreateIntentParams,
): Promise<SodaxAllowanceResponse> {
  return post<SodaxAllowanceResponse>("/api/sodax/allowance", params);
}

export function fetchSodaxApproveTx(
  params: SodaxCreateIntentParams,
): Promise<SodaxApproveResponse> {
  return post<SodaxApproveResponse>("/api/sodax/approve", params);
}

export function createSodaxIntent(
  params: SodaxCreateIntentParams,
): Promise<SodaxCreateIntentResponse> {
  return post<SodaxCreateIntentResponse>("/api/sodax/intents", params);
}

export function submitSodaxTx(
  body: SodaxSubmitTxRequest,
): Promise<SodaxSubmitTxResponse> {
  return post<SodaxSubmitTxResponse>("/api/sodax/submit", body);
}

export function fetchSodaxSubmitStatus(
  txHash: string,
  srcChainKey: string,
): Promise<SodaxSubmitStatusResponse> {
  const params = new URLSearchParams({ txHash, srcChainKey });
  return request<SodaxSubmitStatusResponse>(
    `/api/sodax/submit/status?${params}`,
  );
}
