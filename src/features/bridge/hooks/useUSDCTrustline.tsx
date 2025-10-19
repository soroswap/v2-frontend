"use client";

import { useUserContext } from "@/contexts/UserContext";
import { envVars, STELLAR } from "@/shared/lib/environmentVars";
import {
  Asset,
  Horizon,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useCallback, useEffect, useState } from "react";
import { USDC_ASSET_MAINNET, USDC_ASSET_TESTNET } from "../constants/bridge";
import {
  AccountStatus,
  TrustlineStatus,
  UseUSDCTrustlineReturn,
} from "../types/bridge";
import {
  fetchAccountAndTrustlineData,
  fetchUSDCBalance,
} from "../utils/bridge";
import { WalletNetwork } from "@creit.tech/stellar-wallets-kit";

/**
 * Hook for managing USDC trustline operations
 * @param autoCheck - Whether to automatically check account/trustline when wallet connects (default: true)
 */
export function useUSDCTrustline(
  autoCheck: boolean = true,
): UseUSDCTrustlineReturn {
  const {
    address: stellarAddress,
    kit,
    signTransaction: signTransactionFromContext,
  } = useUserContext();

  const [trustlineStatus, setTrustlineStatus] = useState<TrustlineStatus>({
    exists: false,
    balance: "0",
    checking: false,
  });

  const [accountStatus, setAccountStatus] = useState<AccountStatus>({
    exists: false,
    xlmBalance: "0",
    checking: false,
  });

  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

  const [isCreating, setIsCreating] = useState(false);

  // Check both account status and USDC trustline in one request
  const checkAccountAndTrustline = useCallback(async () => {
    if (!stellarAddress) {
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
      setAccountStatus({ exists: false, xlmBalance: "0", checking: false });
      return;
    }

    setTrustlineStatus((prev) => ({ ...prev, checking: true }));
    setAccountStatus((prev) => ({ ...prev, checking: true }));

    try {
      const result = await fetchAccountAndTrustlineData(stellarAddress);

      setTrustlineStatus({
        exists: result.usdcTrustlineExists,
        balance: result.usdcBalance,
        checking: false,
      });

      setAccountStatus({
        exists: result.accountExists,
        xlmBalance: result.xlmBalance,
        checking: false,
      });

      setHasCheckedOnce(true);
    } catch (error) {
      console.error("Failed to check account and trustline:", error);
      setTrustlineStatus({
        exists: false,
        balance: "0",
        checking: false,
      });
      setAccountStatus({
        exists: false,
        xlmBalance: "0",
        checking: false,
      });
      setHasCheckedOnce(true);
    }
  }, [stellarAddress]);

  // Refresh only the USDC balance without checking account status
  const refreshBalance = useCallback(async () => {
    if (!stellarAddress) return;

    try {
      const balance = await fetchUSDCBalance(stellarAddress);
      setTrustlineStatus((prev) => ({
        ...prev,
        balance,
      }));
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  }, [stellarAddress]);

  // Send transaction helper
  const sendTransaction = useCallback(async (signedXdr: string) => {
    const response = await fetch("/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signedXdr),
    });

    if (!response.ok) {
      throw new Error(`Failed to send transaction: ${response.status}`);
    }

    return await response.json();
  }, []);

  // Create USDC trustline
  const createTrustline = useCallback(async (): Promise<void> => {
    if (!kit || !stellarAddress) {
      console.error("Wallet not connected");
      return;
    }

    setIsCreating(true);

    try {
      const server = new Horizon.Server("https://horizon.stellar.org");

      const usdcAsset =
        STELLAR.WALLET_NETWORK === WalletNetwork.PUBLIC
          ? USDC_ASSET_MAINNET
          : USDC_ASSET_TESTNET;

      // Refresh account info to get latest sequence number
      const freshAccount = await server.loadAccount(stellarAddress);

      const baseFee = await server.fetchBaseFee();

      // Build transaction with fresh account data
      const transactionBuilder = new TransactionBuilder(freshAccount, {
        fee: String(baseFee),
        networkPassphrase: envVars.STELLAR.WALLET_NETWORK,
      })
        .addOperation(
          Operation.changeTrust({
            asset: new Asset(usdcAsset.code, usdcAsset.issuer),
          }),
        )
        .setTimeout(300)
        .build();

      const xdr = transactionBuilder.toXDR();

      // Sign transaction using the wallet kit
      const signedXdr = await signTransactionFromContext(xdr, stellarAddress);

      // Send transaction
      const result = await sendTransaction(signedXdr);
      console.log("result = ", result);

      if (result.data?.status === "success" || result.data?.successful) {
        // Refresh account and trustline status after successful creation
        await checkAccountAndTrustline();
      } else {
        throw new Error("Transaction failed");
      }
    } catch {
      throw new Error("Failed to create trustline");
    } finally {
      setIsCreating(false);
    }
  }, [kit, stellarAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-check account and trustline when wallet connects (only if autoCheck is enabled)
  useEffect(() => {
    if (stellarAddress && autoCheck) {
      checkAccountAndTrustline();
    } else if (!stellarAddress) {
      // Reset status when disconnected - show disconnected state, not loading
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
      setAccountStatus({ exists: false, xlmBalance: "0", checking: false });
      setHasCheckedOnce(false);
    }
  }, [stellarAddress, autoCheck]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    trustlineStatus,
    accountStatus,
    hasCheckedOnce,
    checkAccountAndTrustline,
    refreshBalance,
    createTrustline,
    isCreating,
  };
}
