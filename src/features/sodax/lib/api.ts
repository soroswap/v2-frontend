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
} from "../types/sodax";

const KNOWN_CODES: readonly SodaxApiErrorCode[] = [
  "NETWORK_ERROR",
  "TIMEOUT_ERROR",
  "HTTP_ERROR",
  "PARSE_ERROR",
  "VALIDATION_ERROR",
  "INTERNAL_ERROR",
  "SODAX_ERROR_CORS",
  "SODAX_ERROR_PARAM",
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

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    throw new SodaxApiError(
      "NETWORK_ERROR",
      cause instanceof Error ? cause.message : "Network request failed",
      0,
    );
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

function post<T>(url: string, payload: unknown): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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
