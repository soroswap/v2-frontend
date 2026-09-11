/**
 * Client-side wire types for the SODAX Swaps API v2, as served by our
 * /api/sodax/* route handlers. All bigint-derived fields are decimal strings —
 * the server re-stringifies them across the JSON boundary.
 */

/** Unsigned Stellar transaction returned by SODAX. `data` is the transaction XDR. */
export interface SodaxRawTx {
  from: string;
  to: string;
  /** Decimal string (bigint on the server side). */
  value: string;
  /** Unsigned transaction envelope XDR. */
  data: string;
}

/** Intent struct (hub representation) as returned by intent-building endpoints. */
export interface SodaxIntent {
  intentId: string;
  creator: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  minOutputAmount: string;
  deadline: string;
  allowPartialFill: boolean;
  srcChain: string;
  dstChain: string;
  srcAddress: string;
  dstAddress: string;
  solver: string;
  data: string;
}

export interface SodaxRelayData {
  address: string;
  payload: string;
}

export interface SodaxToken {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  chainKey: string;
  hubAsset: string;
  vault: string;
}

export interface SodaxQuoteRequest {
  tokenSrc: string;
  tokenSrcChainKey: string;
  tokenDst: string;
  tokenDstChainKey: string;
  /** Input amount in smallest unit of the source token. */
  amount: string;
  quoteType: "exact_input";
}

export interface SodaxQuoteResponse {
  /** Quoted output in smallest unit of the destination token. */
  quotedAmount: string;
}

/** Shared body for allowance check, approve, and intent creation. */
export interface SodaxCreateIntentParams {
  srcChainKey: string;
  dstChainKey: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  minOutputAmount: string;
  /** Unix timestamp (seconds), from /api/sodax/deadline. */
  deadline: string;
  allowPartialFill: boolean;
  srcAddress: string;
  dstAddress: string;
}

export interface SodaxAllowanceResponse {
  valid: boolean;
}

export interface SodaxApproveResponse {
  tx: SodaxRawTx;
}

export interface SodaxCreateIntentResponse {
  tx: SodaxRawTx;
  intent: SodaxIntent;
  relayData: SodaxRelayData;
}

export interface SodaxSubmitTxRequest {
  /** Hash of the broadcast intent transaction on the source chain. */
  txHash: string;
  srcChainKey: string;
  walletAddress: string;
  intent: SodaxIntent;
  /** `relayData.payload` from the create-intent response. */
  relayData: string;
}

export interface SodaxSubmitTxResponse {
  success: boolean;
  data: {
    status: "inserted" | "duplicate";
    message: string;
  };
}

export type SodaxSubmitStatus =
  | "pending"
  | "relaying"
  | "relayed"
  | "posting_execution"
  | "posted_execution"
  | "solved"
  | "failed";

export interface SodaxSubmitStatusResponse {
  success: boolean;
  data: {
    txHash: string;
    srcChainKey: string;
    status: SodaxSubmitStatus;
    failedAtStep?: SodaxSubmitStatus;
    failureReason?: string;
    processingAttempts: number;
    abandonedAt?: string;
    result?: {
      dstIntentTxHash: string;
      intent_hash?: string;
    };
    /** Human-readable message the backend intends for end users. */
    userMessage?: string;
    intentCancelled?: boolean;
  };
}

export interface SodaxDeadlineResponse {
  deadline: string;
}

/**
 * Response of GET /api/sodax/price?contract=<C...>. The server probes the
 * solver with a fixed 100 USDC -> asset quote and caches the result for
 * 120s; usdPrice is null when the probe itself returns no usable quote.
 */
export interface SodaxUsdPriceResponse {
  contract: string;
  usdPrice: number | null;
}

/**
 * Error codes surfaced by /api/sodax/* routes: the five SwapsApiError codes
 * (preserved verbatim by the server) plus our own route-level codes.
 */
export type SodaxApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "HTTP_ERROR"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "SODAX_ERROR_CORS"
  | "SODAX_ERROR_PARAM"
  | "SODAX_ERROR_SUBMIT"
  /**
   * /api/sodax/send could not tell whether the network received the
   * transaction (RPC failure mid-submit). `context.txHash` carries the hash
   * so the caller can keep tracking it instead of signing again.
   */
  | "SODAX_ERROR_BROADCAST_UNKNOWN";

/** Typed error thrown by the client wrapper in lib/api.ts. */
export class SodaxApiError extends Error {
  readonly code: SodaxApiErrorCode;
  readonly status: number;
  readonly context?: unknown;

  constructor(
    code: SodaxApiErrorCode,
    message: string,
    status: number,
    context?: unknown,
  ) {
    super(message);
    this.name = "SodaxApiError";
    this.code = code;
    this.status = status;
    this.context = context;
  }
}
