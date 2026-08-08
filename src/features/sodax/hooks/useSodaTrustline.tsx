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
import { useCallback, useEffect, useState } from "react";

export interface SodaTrustlineStatus {
  exists: boolean;
  balance: string;
  checking: boolean;
}

/**
 * Same threshold the bridge uses: enough XLM to cover the +0.5 XLM trustline
 * reserve plus fees with headroom.
 */
export const MIN_XLM_FOR_TRUSTLINE = 1.5;

export interface UseSodaTrustlineReturn {
  trustlineStatus: SodaTrustlineStatus;
  /** Native XLM balance of the account, "0" while unknown. */
  xlmBalance: string;
  /** True when the account lacks the XLM reserve to add a trustline. */
  hasInsufficientReserve: boolean;
  hasCheckedOnce: boolean;
  checkTrustline: () => Promise<void>;
  createTrustline: () => Promise<void>;
  isCreating: boolean;
  createTrustlineError: string | null;
}

/**
 * Trustline management for a destination classic asset (SODA or USDC),
 * following the bridge's USDC trustline pattern. A trustline is required
 * before the SODAX solver can deliver the asset, so the check gates swap
 * execution. Pass `null` to disable entirely — no Horizon traffic happens
 * until a SODA pair with a trustline-requiring destination is selected.
 */
export function useSodaTrustline(
  asset: StellarClassicAsset | null,
): UseSodaTrustlineReturn {
  const { address, kit, signTransaction } = useUserContext();

  const [trustlineStatus, setTrustlineStatus] = useState<SodaTrustlineStatus>({
    exists: false,
    balance: "0",
    checking: false,
  });
  const [xlmBalance, setXlmBalance] = useState("0");
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createTrustlineError, setCreateTrustlineError] = useState<
    string | null
  >(null);

  const assetCode = asset?.code ?? null;
  const assetIssuer = asset?.issuer ?? null;

  const checkTrustline = useCallback(async () => {
    if (!address || !assetCode || !assetIssuer) {
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
      return;
    }

    setTrustlineStatus((prev) => ({ ...prev, checking: true }));

    try {
      const server = new Horizon.Server(STELLAR.HORIZON_URL);
      const account = await server.accounts().accountId(address).call();

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

      setXlmBalance(nativeBalance?.balance ?? "0");
      setTrustlineStatus({
        exists: !!assetBalance,
        balance: assetBalance?.balance ?? "0",
        checking: false,
      });
    } catch (error) {
      // A 404 means the account is unfunded — no trustline either way.
      if (!(error instanceof Error && error.message.includes("404"))) {
        console.error(`Failed to check ${assetCode} trustline:`, error);
      }
      setXlmBalance("0");
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
    } finally {
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
    if (address && assetCode && assetIssuer) {
      checkTrustline();
    } else {
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
      setXlmBalance("0");
      setHasCheckedOnce(false);
    }
  }, [address, assetCode, assetIssuer, checkTrustline]);

  const hasInsufficientReserve =
    hasCheckedOnce &&
    !trustlineStatus.exists &&
    parseFloat(xlmBalance) < MIN_XLM_FOR_TRUSTLINE;

  return {
    trustlineStatus,
    xlmBalance,
    hasInsufficientReserve,
    hasCheckedOnce,
    checkTrustline,
    createTrustline,
    isCreating,
    createTrustlineError,
  };
}
