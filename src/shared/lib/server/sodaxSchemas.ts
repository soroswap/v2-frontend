import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  SODAX_ASSETS_BY_CONTRACT,
  SODAX_COUNTERPART_CONTRACTS,
  SODAX_STELLAR_CHAIN_KEY,
} from "@/features/sodax/constants/sodax";
import { sodaxJson } from "./sodaxClient";

/**
 * Zod schemas for every JSON-body /api/sodax/* route (CLAUDE.md mandates Zod
 * for external data). These do two jobs at once:
 *
 * 1. Turn a malformed body into a 400 instead of a 500 with a raw internal
 *    error string (finding 5 — e.g. `submitTx` crashing on
 *    `Object.entries(undefined)` for `POST /api/sodax/submit` with `{}`).
 * 2. Pin the upstream request to exactly what this app ever sends, so a
 *    caller cannot make the server proxy an arbitrary upstream request —
 *    a different destination chain, another user's address, a self-serving
 *    `partnerFee` (finding 6). Every route builds its upstream body from
 *    the PARSED result only, never the raw JSON: Zod's default object mode
 *    strips unknown keys, so `partnerFee`, `hook`, `solver`, `data`, or
 *    anything else riding along on the request never reaches `@sodax/swaps-api`.
 */

/** Stellar contract id (C..., 56-char strkey). */
const stellarContract = z
  .string()
  .regex(/^C[A-Z2-7]{55}$/, "Invalid Stellar contract id");

/** Stellar account id (G..., 56-char strkey). */
const stellarAccount = z
  .string()
  .regex(/^G[A-Z2-7]{55}$/, "Invalid Stellar account id");

/** Base-unit integer amount, as the decimal string every SODAX DTO expects. */
const baseUnitAmount = z
  .string()
  .regex(/^[0-9]{1,30}$/, "Must be a base-unit integer string");

/** Unix timestamp (seconds), as the decimal string SODAX intent DTOs expect. */
const deadline = z
  .string()
  .regex(/^[0-9]{1,20}$/, "Must be a decimal timestamp string");

/** Lowercase or uppercase hex-encoded transaction hash (32 bytes). */
const txHash = z.string().regex(/^[0-9a-f]{64}$/i, "Invalid transaction hash");

/**
 * The only chain this app ever talks to. Every *ChainKey field is pinned to
 * this literal rather than accepted as free text — the app never issues a
 * cross-chain request (e.g. `dstChainKey: "solana"`), so nothing server-side
 * should either.
 */
const chainKey = z.literal(SODAX_STELLAR_CHAIN_KEY);

/**
 * True when `contract` is a token this app actually trades: a SODAX registry
 * asset, or one of the Soroswap-native counterpart tokens (XLM, USDC) the
 * solver also accepts as the other leg. Anything else is rejected before it
 * reaches the upstream SODAX API.
 */
function isKnownSodaxToken(contract: string): boolean {
  return (
    SODAX_ASSETS_BY_CONTRACT.has(contract) ||
    SODAX_COUNTERPART_CONTRACTS.includes(contract)
  );
}

const sodaxToken = stellarContract.refine(isKnownSodaxToken, {
  message: "Token is not a SODAX-supported asset",
});

/** POST /api/sodax/quote */
export const sodaxQuoteSchema = z.object({
  tokenSrc: sodaxToken,
  tokenSrcChainKey: chainKey,
  tokenDst: sodaxToken,
  tokenDstChainKey: chainKey,
  amount: baseUnitAmount,
  quoteType: z.literal("exact_input"),
});

/**
 * Shared body for POST /api/sodax/allowance, /approve and /intents — the
 * SodaxCreateIntentParams shape the client sends today (see
 * src/features/sodax/types/sodax.ts). `srcAddress` and `dstAddress` are
 * required equal: this app never builds a cross-address swap, every call
 * site sets both to the connected wallet's own address.
 */
export const sodaxCreateIntentParamsSchema = z
  .object({
    srcChainKey: chainKey,
    dstChainKey: chainKey,
    inputToken: sodaxToken,
    outputToken: sodaxToken,
    inputAmount: baseUnitAmount,
    minOutputAmount: baseUnitAmount,
    deadline,
    allowPartialFill: z.literal(false),
    srcAddress: stellarAccount,
    dstAddress: stellarAccount,
  })
  .refine((body) => body.srcAddress === body.dstAddress, {
    message: "srcAddress and dstAddress must match",
    path: ["dstAddress"],
  });

/**
 * The intent struct as returned by /api/sodax/intents and round-tripped back
 * through /api/sodax/submit's `intent` field (SodaxIntent in
 * src/features/sodax/types/sodax.ts). Every field the client can see is a
 * decimal string except `allowPartialFill`; validating the known keys as
 * such (rather than passing the raw object through) keeps a caller from
 * grafting extra keys onto the struct submitTx forwards upstream.
 */
const sodaxIntentSchema = z.object({
  intentId: z.string(),
  creator: z.string(),
  inputToken: z.string(),
  outputToken: z.string(),
  inputAmount: z.string(),
  minOutputAmount: z.string(),
  deadline: z.string(),
  allowPartialFill: z.boolean(),
  srcChain: z.string(),
  dstChain: z.string(),
  srcAddress: z.string(),
  dstAddress: z.string(),
  solver: z.string(),
  data: z.string(),
});

/** POST /api/sodax/submit */
export const sodaxSubmitSchema = z.object({
  txHash,
  srcChainKey: chainKey,
  walletAddress: stellarAccount,
  intent: sodaxIntentSchema,
  relayData: z.string().min(1, "relayData must not be empty"),
});

/** GET /api/sodax/submit/status query params. */
export const sodaxSubmitStatusQuerySchema = z.object({
  txHash,
  srcChainKey: chainKey,
});

/**
 * 400 SODAX_ERROR_PARAM for the first Zod issue found, e.g. `"tokenSrc:
 * Token is not a SODAX-supported asset"`. Shared by every validated route so
 * a bad body and a bad query string fail the same way.
 */
function sodaxValidationErrorResponse(error: z.ZodError) {
  const issue = error.issues[0];
  const path = issue.path.join(".");
  return sodaxJson(
    {
      code: "SODAX_ERROR_PARAM",
      message: path ? `${path}: ${issue.message}` : issue.message,
    },
    { status: 400 },
  );
}

/**
 * Parse a request body as JSON and validate it against `schema`. Returns the
 * parsed, narrowed data on success; on failure — including a body that isn't
 * valid JSON at all — a ready-to-return 400 SODAX_ERROR_PARAM response, so
 * every caller gets the same shape instead of a bare 500 with an internal
 * parser or upstream-SDK error string (finding 5).
 */
export async function parseSodaxBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
): Promise<
  { data: T; error?: undefined } | { data?: undefined; error: NextResponse }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      error: sodaxJson(
        {
          code: "SODAX_ERROR_PARAM",
          message: "Request body must be valid JSON",
        },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { error: sodaxValidationErrorResponse(parsed.error) };
  }

  return { data: parsed.data };
}

/**
 * Validate a plain object of query-string values (already `searchParams.get`'d
 * by the caller) against `schema`. Same 400 shape as `parseSodaxBody`, for
 * the one SODAX route (`submit/status`) whose input is a query string.
 */
export function parseSodaxQuery<T>(
  query: Record<string, string | null>,
  schema: z.ZodType<T>,
): { data: T; error?: undefined } | { data?: undefined; error: NextResponse } {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    return { error: sodaxValidationErrorResponse(parsed.error) };
  }

  return { data: parsed.data };
}
