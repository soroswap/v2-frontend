"use client";

import { useUserContext } from "@/contexts/UserContext";
import { envVars, STELLAR } from "@/shared/lib/environmentVars";
import {
  Asset,
  Horizon,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
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

// Disconnected state, derived from `stellarAddress` at the return below so we
// don't reset the status state in an effect when the wallet disconnects.
const DISCONNECTED_TRUSTLINE: TrustlineStatus = {
  exists: false,
  balance: "0",
  checking: false,
};
const DISCONNECTED_ACCOUNT: AccountStatus = {
  exists: false,
  xlmBalance: "0",
  checking: false,
};

// Checking state shown for a newly connected wallet until its own account and
// trustline have been verified — prevents exposing a previous wallet's results.
const CHECKING_TRUSTLINE: TrustlineStatus = {
  exists: false,
  balance: "0",
  checking: true,
};
const CHECKING_ACCOUNT: AccountStatus = {
  exists: false,
  xlmBalance: "0",
  checking: true,
};

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
  const [createTrustlineError, setCreateTrustlineError] = useState<
    string | null
  >(null);

  // Tracks which address the current status state belongs to, so results from a
  // previous wallet aren't exposed when a different address connects.
  const checkedAddressRef = useRef<string | null>(null);
  // Tracks the address of an in-flight check so the concurrency guard is
  // address-aware: a switch to a new wallet starts a fresh lookup even if a
  // previous address's request is still running.
  const checkingAddressRef = useRef<string | null>(null);

  // Check both account status and USDC trustline in one request
  const checkAccountAndTrustline = useCallback(async () => {
    if (!stellarAddress) {
      setTrustlineStatus({ exists: false, balance: "0", checking: false });
      setAccountStatus({ exists: false, xlmBalance: "0", checking: false });
      checkedAddressRef.current = null;
      return;
    }

    // Avoid concurrent checks for the SAME address (prevents flicker). A switch
    // to a different address must always be allowed to start its own lookup.
    if (checkingAddressRef.current === stellarAddress) {
      return;
    }

    checkingAddressRef.current = stellarAddress;
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
      // Only record the result if this is still the active check for this
      // address — a newer check for a different address may have started.
      if (checkingAddressRef.current === stellarAddress) {
        checkedAddressRef.current = stellarAddress;
      }
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
    } finally {
      if (checkingAddressRef.current === stellarAddress) {
        checkingAddressRef.current = null;
      }
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
    setCreateTrustlineError(null);

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

      if (result.data?.status === "success" || result.data?.successful) {
        // Refresh account and trustline status after successful creation
        await checkAccountAndTrustline();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Failed to create trustline";
      setCreateTrustlineError(message);
    } finally {
      setIsCreating(false);
    }
  }, [kit, stellarAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-check account and trustline when wallet connects (only if autoCheck is enabled).
  // The await lives in the effect body so state updates happen in an async
  // callback — a legitimate data load, not a prop-driven state reset.
  useEffect(() => {
    if (!(stellarAddress && autoCheck)) return;
    (async () => {
      await checkAccountAndTrustline();
    })().catch((error) => {
      console.error("Failed to auto-check account and trustline:", error);
    });
  }, [stellarAddress, autoCheck]); // eslint-disable-line react-hooks/exhaustive-deps

  // The status state is only valid for the address it was last checked against.
  // When disconnected, expose the disconnected state (derived, not reset).
  // When connected but the status belongs to a different address, expose a
  // checking state until the current address has been verified.
  const statusBelongsToCurrentAddress =
    stellarAddress !== null && checkedAddressRef.current === stellarAddress;
  const effectiveTrustlineStatus = !stellarAddress
    ? DISCONNECTED_TRUSTLINE
    : statusBelongsToCurrentAddress
      ? trustlineStatus
      : CHECKING_TRUSTLINE;
  const effectiveAccountStatus = !stellarAddress
    ? DISCONNECTED_ACCOUNT
    : statusBelongsToCurrentAddress
      ? accountStatus
      : CHECKING_ACCOUNT;
  const effectiveHasCheckedOnce = !stellarAddress
    ? false
    : statusBelongsToCurrentAddress
      ? hasCheckedOnce
      : false;

  return {
    trustlineStatus: effectiveTrustlineStatus,
    accountStatus: effectiveAccountStatus,
    hasCheckedOnce: effectiveHasCheckedOnce,
    checkAccountAndTrustline,
    refreshBalance,
    createTrustline,
    isCreating,
    createTrustlineError,
  };
}
