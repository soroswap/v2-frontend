"use client";

import { useUserContext } from "@/contexts/UserContext";
import { StellarClassicAsset } from "@/features/sodax/constants/sodax";
import { STELLAR } from "@/shared/lib/environmentVars";
import {
  Asset,
  Horizon,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useCallback, useEffect, useRef, useState } from "react";

export interface SodaxTrustlineStatus {
  exists: boolean;
  balance: string;
  checking: boolean;
}

/** Stellar's per-trustline base reserve, in XLM (`changeTrust` locks this). */
export const TRUSTLINE_RESERVE_XLM = 0.5;
/** Headroom above the reserve so the transaction fee doesn't push the account under it. */
export const FEE_HEADROOM_XLM = 0.1;

export interface UseSodaxTrustlineReturn {
  trustlineStatus: SodaxTrustlineStatus;
  /** Native XLM balance of the account, "0" while unknown. */
  xlmBalance: string;
  /**
   * `xlmBalance` minus the account's base reserve (1 XLM) and its existing
   * subentry reserves (0.5 XLM each — trustlines, offers, ...), i.e. what a
   * new `changeTrust` operation actually has to work with. "0" while unknown.
   */
  spendableXlm: string;
  /** True when the account lacks the XLM reserve to add a trustline. */
  hasInsufficientReserve: boolean;
  hasCheckedOnce: boolean;
  /**
   * Set when the last check failed for a reason other than "account not
   * found" (Horizon rate-limit, network blip, ...). Distinct from "no
   * trustline": the account state is unknown, not confirmed zero. Cleared
   * whenever a new check starts or one succeeds.
   */
  checkError: string | null;
  checkTrustline: () => Promise<void>;
  createTrustline: () => Promise<void>;
  isCreating: boolean;
  createTrustlineError: string | null;
}

/**
 * Trustline management for a destination classic asset (a SODAX asset or
 * USDC), following the bridge's USDC trustline pattern. A trustline is
 * required before the SODAX solver can deliver the asset, so the check gates
 * swap execution. Pass `null` to disable entirely — no Horizon traffic
 * happens until a SODAX pair with a trustline-requiring destination is
 * selected.
 */
/**
 * Horizon's SDK throws `NotFoundError` with the message "Not Found" for an
 * account that does not exist yet (unfunded wallet) — the string never
 * contains "404", so classify on the error's identity and response status.
 */
function isHorizonNotFound(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "NotFoundError") return true;
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 404;
}

export function useSodaxTrustline(
  asset: StellarClassicAsset | null,
): UseSodaxTrustlineReturn {
  const { address, kit, signTransaction } = useUserContext();

  const [trustlineStatus, setTrustlineStatus] = useState<SodaxTrustlineStatus>({
    exists: false,
    balance: "0",
    checking: false,
  });
  const [xlmBalance, setXlmBalance] = useState("0");
  const [spendableXlm, setSpendableXlm] = useState("0");
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createTrustlineError, setCreateTrustlineError] = useState<
    string | null
  >(null);

  const assetCode = asset?.code ?? null;
  const assetIssuer = asset?.issuer ?? null;

  // Guards against a freshness bug: without it, a slow response for a
  // previous asset/account can land after a newer check has started and
  // overwrite trustlineStatus/hasCheckedOnce with stale data.
  const requestIdRef = useRef(0);

  const checkTrustline = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!address || !assetCode || !assetIssuer) {
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
      return;
    }

    setTrustlineStatus((prev) => ({ ...prev, checking: true }));
    setCheckError(null);

    try {
      const server = new Horizon.Server(STELLAR.HORIZON_URL);
      const account = await server.accounts().accountId(address).call();

      if (requestId !== requestIdRef.current) return; // superseded

      const assetBalance = account.balances.find(
        (balance) =>
          balance.asset_type !== "native" &&
          "asset_code" in balance &&
          "asset_issuer" in balance &&
          balance.asset_code === assetCode &&
          balance.asset_issuer === assetIssuer,
      );

      const nativeBalance = account.balances.find(
        (balance) => balance.asset_type === "native",
      );

      // Stellar's reserve formula: 1 XLM base reserve plus 0.5 XLM per
      // existing subentry (trustlines, offers, ...) is locked and cannot be
      // spent on a new operation, including the changeTrust below.
      const totalXlm = parseFloat(nativeBalance?.balance ?? "0");
      // Stellar's minimum balance: (2 + subentries + sponsoring - sponsored)
      // base reserves of 0.5 XLM. Counting sponsorship keeps a sponsored
      // account from being told it lacks XLM it never had to lock.
      const reservedXlm =
        (2 +
          account.subentry_count +
          account.num_sponsoring -
          account.num_sponsored) *
        0.5;
      const spendable = totalXlm - reservedXlm;

      setXlmBalance(nativeBalance?.balance ?? "0");
      setSpendableXlm(spendable.toString());
      setTrustlineStatus({
        exists: !!assetBalance,
        balance: assetBalance?.balance ?? "0",
        checking: false,
      });
      setCheckError(null);
      setHasCheckedOnce(true);
    } catch (error) {
      if (requestId !== requestIdRef.current) return; // superseded

      // A 404 means the account is unfunded — no trustline either way. Any
      // other failure (Horizon rate-limit, network blip, ...) tells us
      // nothing about the account, so it must not be read as "no trustline,
      // 0 XLM": leave trustlineStatus/xlmBalance/hasCheckedOnce untouched
      // and surface a retryable error instead.
      const notFound = isHorizonNotFound(error);
      if (!notFound) {
        console.error(`Failed to check ${assetCode} trustline:`, error);
        setTrustlineStatus((prev) => ({ ...prev, checking: false }));
        setCheckError("Couldn't read your account from Horizon. Please retry.");
        return; // hasCheckedOnce stays false -> isTrustlineCheckPending
      }
      setXlmBalance("0");
      setSpendableXlm("0");
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
      setHasCheckedOnce(true);
    }
  }, [address, assetCode, assetIssuer]);

  const createTrustline = useCallback(async () => {
    if (!kit || !address || !assetCode || !assetIssuer) {
      console.error("Wallet not connected or no asset selected");
      return;
    }

    setIsCreating(true);
    setCreateTrustlineError(null);

    try {
      const server = new Horizon.Server(STELLAR.HORIZON_URL);
      const account = await server.loadAccount(address);
      const baseFee = await server.fetchBaseFee();

      const transaction = new TransactionBuilder(account, {
        fee: String(baseFee),
        networkPassphrase: STELLAR.WALLET_NETWORK,
      })
        .addOperation(
          Operation.changeTrust({
            asset: new Asset(assetCode, assetIssuer),
          }),
        )
        .setTimeout(300)
        .build();

      const signedXdr = await signTransaction(transaction.toXDR(), address);

      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signedXdr),
      });

      if (!response.ok) {
        throw new Error(`Failed to send transaction: ${response.status}`);
      }

      // SendTransactionResponse (@soroswap/sdk >= 0.4.0): { txHash, success, ... }
      const result = await response.json();
      if (result.data?.success) {
        await checkTrustline();
      } else {
        throw new Error("Trustline transaction failed on the network");
      }
    } catch (error) {
      setCreateTrustlineError(
        error instanceof Error && error.message
          ? error.message
          : `Failed to create ${assetCode} trustline`,
      );
    } finally {
      setIsCreating(false);
    }
  }, [kit, address, assetCode, assetIssuer, signTransaction, checkTrustline]);

  useEffect(() => {
    // The asset or account changed: any previous trustlineStatus/
    // hasCheckedOnce is for a different (asset, account) pair and must not
    // be read as current while the fresh check below is in flight.
    setTrustlineStatus({ exists: false, balance: "0", checking: false });
    setXlmBalance("0");
    setSpendableXlm("0");
    setHasCheckedOnce(false);
    setCheckError(null);

    if (address && assetCode && assetIssuer) {
      checkTrustline();
    }
  }, [address, assetCode, assetIssuer, checkTrustline]);

  const hasInsufficientReserve =
    hasCheckedOnce &&
    !trustlineStatus.exists &&
    parseFloat(spendableXlm) < TRUSTLINE_RESERVE_XLM + FEE_HEADROOM_XLM;

  return {
    trustlineStatus,
    xlmBalance,
    spendableXlm,
    hasInsufficientReserve,
    hasCheckedOnce,
    checkError,
    checkTrustline,
    createTrustline,
    isCreating,
    createTrustlineError,
  };
}
