import { STELLAR } from "@/shared/lib/environmentVars";
import { sodaxJson, sodaxOriginGuard } from "@/shared/lib/server/sodaxClient";
import { rpc, TransactionBuilder } from "@stellar/stellar-sdk";
import { NextRequest } from "next/server";

/** Broadcast + confirmation polling can take a while on a busy ledger. */
export const maxDuration = 60;

/** How long to wait for the transaction to land in a ledger. */
const CONFIRM_TIMEOUT_MS = 30_000;
const CONFIRM_POLL_MS = 2_500;
/**
 * When the submit call itself fails we cannot tell whether stellar-core took
 * the transaction. Look for it by hash for a few seconds before answering.
 */
const UNKNOWN_STATE_PROBE_MS = 6_000;
/**
 * Per-RPC-call ceiling so a hung node cannot pin the function to maxDuration.
 * Enforced with `withTimeout` below: `rpc.Server` accepts a `timeout` option
 * in its types but ignores it at runtime.
 */
const RPC_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Soroban RPC call timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Operation types a SODAX swap legitimately needs: the intent invocation
 * (Soroban), its TTL footprint helpers, and the trustline approval leg.
 * Rejecting everything else keeps this from being a general-purpose
 * broadcast relay (payments, account creation, offers, ...).
 */
const ALLOWED_OPERATIONS = new Set([
  "invokeHostFunction",
  "extendFootprintTtl",
  "restoreFootprint",
  "changeTrust",
]);

type Outcome = "SUCCESS" | "FAILED" | "UNKNOWN";

/** Poll getTransaction until it is in a ledger or the budget runs out. */
async function probeTransaction(
  server: rpc.Server,
  hash: string,
  budgetMs: number,
): Promise<Outcome> {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    try {
      // Never let one call outlive the budget it is serving.
      const callBudget = Math.max(
        1_000,
        Math.min(RPC_TIMEOUT_MS, deadline - Date.now()),
      );
      const result = await withTimeout(server.getTransaction(hash), callBudget);
      if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return "SUCCESS";
      }
      if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
        return "FAILED";
      }
    } catch (pollError) {
      // Transient by definition — the transaction is already out of our hands.
      console.warn("[API SODAX SEND] confirmation poll failed", pollError);
    }
    await new Promise((resolve) => setTimeout(resolve, CONFIRM_POLL_MS));
  }
  return "UNKNOWN";
}

/*
 * POST /api/sodax/send — broadcast a signed SODAX transaction.
 *
 * The generic /api/send proxies Soroswap's send API, which rejects Soroban
 * transactions that do not touch Soroswap contracts ("Invalid contract
 * address, not a soroswap contract"). SODAX intent transactions invoke the
 * SODAX intents contract, so they are submitted directly to Soroban RPC here.
 * Response mirrors /api/send's { data: { txHash, success } } contract, plus
 * a `confirmed` flag (false when the tx was accepted but not yet in a
 * ledger — the SODAX relay verifies inclusion on-chain itself).
 *
 * Error contract, which the client relies on to decide whether a retry is
 * safe: 400/503 SODAX_ERROR_SUBMIT means the network definitively did NOT
 * take the transaction; 502 SODAX_ERROR_BROADCAST_UNKNOWN means it may have,
 * and carries the hash in `context.txHash`.
 */
export async function POST(request: NextRequest) {
  const forbidden = sodaxOriginGuard(request);
  if (forbidden) return forbidden;

  let signedXdr: unknown;
  try {
    signedXdr = await request.json();
  } catch {
    signedXdr = null;
  }

  if (typeof signedXdr !== "string" || !signedXdr) {
    return sodaxJson(
      {
        code: "SODAX_ERROR_PARAM",
        message: "Request body must be a signed transaction XDR string",
      },
      { status: 400 },
    );
  }

  // 1. Parse and vet the envelope. Nothing has reached the network yet, so
  //    every rejection here is safe to retry.
  let transaction: ReturnType<typeof TransactionBuilder.fromXDR>;
  try {
    transaction = TransactionBuilder.fromXDR(
      signedXdr,
      STELLAR.NETWORK_PASSPHRASE,
    );
  } catch {
    return sodaxJson(
      {
        code: "SODAX_ERROR_PARAM",
        message: "Request body is not a valid transaction XDR for this network",
      },
      { status: 400 },
    );
  }

  const inner =
    "innerTransaction" in transaction
      ? transaction.innerTransaction
      : transaction;
  const disallowed = inner.operations.find(
    (op) => !ALLOWED_OPERATIONS.has(op.type),
  );
  if (disallowed) {
    return sodaxJson(
      {
        code: "SODAX_ERROR_PARAM",
        message: `Operation type "${disallowed.type}" is not allowed on this endpoint`,
      },
      { status: 400 },
    );
  }

  // The hash is a pure function of the signed envelope, so it is known before
  // submission — that is what lets an ambiguous RPC failure be resolved.
  const hash = transaction.hash().toString("hex");
  const server = new rpc.Server(STELLAR.RPC_URL);

  // 2. Submit.
  let sent: Awaited<ReturnType<rpc.Server["sendTransaction"]>>;
  try {
    sent = await withTimeout(
      server.sendTransaction(transaction),
      RPC_TIMEOUT_MS,
    );
  } catch (error: unknown) {
    console.error("[API SODAX SEND ERROR] sendTransaction failed", error, hash);
    // The request may have reached stellar-core before the failure surfaced
    // (proxy error on the response, socket reset). Never tell the client to
    // retry unless the ledger shows the transaction did not land.
    const probed = await probeTransaction(server, hash, UNKNOWN_STATE_PROBE_MS);
    if (probed === "SUCCESS") {
      return sodaxJson({
        data: { txHash: hash, success: true, confirmed: true },
      });
    }
    if (probed === "FAILED") {
      return sodaxJson({
        data: { txHash: hash, success: false, confirmed: true },
      });
    }
    return sodaxJson(
      {
        code: "SODAX_ERROR_BROADCAST_UNKNOWN",
        message:
          "Could not confirm whether the Stellar network received the transaction.",
        context: { txHash: hash },
      },
      { status: 502 },
    );
  }

  if (sent.status === "ERROR") {
    console.error("[API SODAX SEND ERROR]", sent.errorResult?.toXDR("base64"));
    return sodaxJson(
      {
        code: "SODAX_ERROR_SUBMIT",
        message:
          "The Stellar network rejected the transaction. It may have expired — please retry the swap.",
      },
      { status: 400 },
    );
  }

  if (sent.status === "TRY_AGAIN_LATER") {
    console.error("[API SODAX SEND ERROR] TRY_AGAIN_LATER", sent.hash);
    return sodaxJson(
      {
        code: "SODAX_ERROR_SUBMIT",
        message:
          "The Stellar network is congested and did not accept the transaction. Please retry the swap.",
      },
      { status: 503 },
    );
  }

  // 3. Accepted (PENDING or DUPLICATE). The transaction is out of our hands
  //    from here on — never report failure for a tx that may land, or a
  //    retry would double-spend.
  const outcome = await probeTransaction(server, sent.hash, CONFIRM_TIMEOUT_MS);
  if (outcome === "SUCCESS") {
    return sodaxJson({
      data: { txHash: sent.hash, success: true, confirmed: true },
    });
  }
  if (outcome === "FAILED") {
    return sodaxJson({
      data: { txHash: sent.hash, success: false, confirmed: true },
    });
  }

  // Accepted but not confirmed within the window — report the hash; the
  // SODAX relay verifies inclusion on-chain before processing.
  return sodaxJson({
    data: { txHash: sent.hash, success: true, confirmed: false },
  });
}
