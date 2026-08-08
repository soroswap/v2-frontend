"use client";

import { useUserContext } from "@/contexts/UserContext";
import { STELLAR } from "@/shared/lib/environmentVars";
import {
  Asset,
  Horizon,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useCallback, useEffect, useState } from "react";
import { SODA_STELLAR } from "../constants/sodax";

export interface SodaTrustlineStatus {
  exists: boolean;
  balance: string;
  checking: boolean;
}

export interface UseSodaTrustlineReturn {
  trustlineStatus: SodaTrustlineStatus;
  hasCheckedOnce: boolean;
  checkTrustline: () => Promise<void>;
  createTrustline: () => Promise<void>;
  isCreating: boolean;
  createTrustlineError: string | null;
}

/**
 * SODA trustline management, following the bridge's USDC trustline pattern.
 * A trustline is required before the SODAX solver can deliver SODA, so the
 * check gates swap execution (destination side), not just display.
 */
export function useSodaTrustline(): UseSodaTrustlineReturn {
  const { address, kit, signTransaction } = useUserContext();

  const [trustlineStatus, setTrustlineStatus] = useState<SodaTrustlineStatus>({
    exists: false,
    balance: "0",
    checking: false,
  });
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createTrustlineError, setCreateTrustlineError] = useState<
    string | null
  >(null);

  const checkTrustline = useCallback(async () => {
    if (!address) {
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
      return;
    }

    setTrustlineStatus((prev) => ({ ...prev, checking: true }));

    try {
      const server = new Horizon.Server(STELLAR.HORIZON_URL);
      const account = await server.accounts().accountId(address).call();

      const sodaBalance = account.balances.find(
        (balance) =>
          balance.asset_type !== "native" &&
          "asset_code" in balance &&
          "asset_issuer" in balance &&
          balance.asset_code === SODA_STELLAR.code &&
          balance.asset_issuer === SODA_STELLAR.issuer,
      );

      setTrustlineStatus({
        exists: !!sodaBalance,
        balance: sodaBalance?.balance ?? "0",
        checking: false,
      });
    } catch (error) {
      // A 404 means the account is unfunded — no trustline either way.
      if (!(error instanceof Error && error.message.includes("404"))) {
        console.error("Failed to check SODA trustline:", error);
      }
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
    } finally {
      setHasCheckedOnce(true);
    }
  }, [address]);

  const createTrustline = useCallback(async () => {
    if (!kit || !address) {
      console.error("Wallet not connected");
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
            asset: new Asset(SODA_STELLAR.code, SODA_STELLAR.issuer),
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
          : "Failed to create SODA trustline",
      );
    } finally {
      setIsCreating(false);
    }
  }, [kit, address, signTransaction, checkTrustline]);

  useEffect(() => {
    if (address) {
      checkTrustline();
    } else {
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
      setHasCheckedOnce(false);
    }
  }, [address, checkTrustline]);

  return {
    trustlineStatus,
    hasCheckedOnce,
    checkTrustline,
    createTrustline,
    isCreating,
    createTrustlineError,
  };
}
