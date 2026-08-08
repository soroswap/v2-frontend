import { STELLAR } from "@/shared/lib/environmentVars";
import { sodaxJson, sodaxOriginGuard } from "@/shared/lib/server";
import { rpc, TransactionBuilder } from "@stellar/stellar-sdk";
import { NextRequest } from "next/server";

/** How long to wait for the transaction to land in a ledger. */
const CONFIRM_TIMEOUT_MS = 30_000;
const CONFIRM_POLL_MS = 2_500;

/*
 * POST /api/sodax/send — broadcast a signed SODAX intent transaction.
 *
 * The generic /api/send proxies Soroswap's send API, which rejects Soroban
 * transactions that do not touch Soroswap contracts ("Invalid contract
 * address, not a soroswap contract"). SODAX intent transactions invoke the
 * SODAX intents contract, so they are submitted directly to Soroban RPC here.
 * Response mirrors /api/send's { data: { txHash, success } } contract.
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

  try {
    const server = new rpc.Server(STELLAR.RPC_URL);
    const transaction = TransactionBuilder.fromXDR(
      signedXdr,
      STELLAR.NETWORK_PASSPHRASE,
    );

    const sent = await server.sendTransaction(transaction);

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

    // PENDING / DUPLICATE / TRY_AGAIN_LATER: poll until it lands.
    const deadline = Date.now() + CONFIRM_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const result = await server.getTransaction(sent.hash);

      if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return sodaxJson({ data: { txHash: sent.hash, success: true } });
      }
      if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
        return sodaxJson({ data: { txHash: sent.hash, success: false } });
      }

      await new Promise((resolve) => setTimeout(resolve, CONFIRM_POLL_MS));
    }

    // Accepted but not yet in a ledger — report the hash; the SODAX relay
    // verifies inclusion on-chain itself before processing.
    return sodaxJson({ data: { txHash: sent.hash, success: true } });
  } catch (error: unknown) {
    console.error("[API SODAX SEND ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit transaction";
    return sodaxJson(
      { code: "SODAX_ERROR_SUBMIT", message },
      { status: 500 },
    );
  }
}
