import { STELLAR } from "@/shared/lib/environmentVars";
import { sodaxJson, sodaxOriginGuard } from "@/shared/lib/server";
import { rpc, TransactionBuilder } from "@stellar/stellar-sdk";
import { NextRequest } from "next/server";

/** Broadcast + confirmation polling can take a while on a busy ledger. */
export const maxDuration = 60;

/** How long to wait for the transaction to land in a ledger. */
const CONFIRM_TIMEOUT_MS = 30_000;
const CONFIRM_POLL_MS = 2_500;

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

  let sent: Awaited<ReturnType<rpc.Server["sendTransaction"]>>;
  try {
    const server = new rpc.Server(STELLAR.RPC_URL);
    const transaction = TransactionBuilder.fromXDR(
      signedXdr,
      STELLAR.NETWORK_PASSPHRASE,
    );

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

    sent = await server.sendTransaction(transaction);

    if (sent.status === "ERROR") {
      console.error(
        "[API SODAX SEND ERROR]",
        sent.errorResult?.toXDR("base64"),
      );
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
  } catch (error: unknown) {
    console.error("[API SODAX SEND ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit transaction";
    return sodaxJson({ code: "SODAX_ERROR_SUBMIT", message }, { status: 500 });
  }

  // The transaction is submitted from here on — never report failure for a
  // tx that may land, or a retry would double-spend. Confirmation-poll
  // errors are transient by definition.
  const server = new rpc.Server(STELLAR.RPC_URL);
  const deadline = Date.now() + CONFIRM_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const result = await server.getTransaction(sent.hash);

      if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return sodaxJson({
          data: { txHash: sent.hash, success: true, confirmed: true },
        });
      }
      if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
        return sodaxJson({
          data: { txHash: sent.hash, success: false, confirmed: true },
        });
      }
    } catch (pollError) {
      console.warn("[API SODAX SEND] confirmation poll failed", pollError);
    }

    await new Promise((resolve) => setTimeout(resolve, CONFIRM_POLL_MS));
  }

  // Accepted but not confirmed within the window — report the hash; the
  // SODAX relay verifies inclusion on-chain before processing.
  return sodaxJson({
    data: { txHash: sent.hash, success: true, confirmed: false },
  });
}
