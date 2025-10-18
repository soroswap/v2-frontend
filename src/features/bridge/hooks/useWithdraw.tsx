import { useUserContext } from "@/contexts/UserContext";
import { useState, useCallback } from "react";
import { BASE_CONFIG } from "../constants";
import { Horizon } from "@stellar/stellar-sdk";
import { StellarPay } from "../utils/stellar-pay";
import { SendTransactionResponse } from "@/app/api/send/route";

// Types
export interface WithdrawParams {
  amount: string;
  address: string;
}

export interface WithdrawResult {
  success: boolean;
  txHash?: string;
  hash?: string;
  paymentId?: string;
}

export interface WithdrawState {
  isLoading: boolean;
  step:
    | "idle"
    | "creating-payment"
    | "signing-transaction"
    | "submitting-transaction"
    | "success"
    | "error";
  error: string | null;
  result: WithdrawResult | null;
}

type RozoPaymentResponse = {
  code: string;
  data: {
    id: string;
    metadata: {
      receivingAddress: string;
      memo: string;
    };
  };
};

export function useWithdraw() {
  const { address, signTransaction } = useUserContext();
  const server = new Horizon.Server("https://horizon.stellar.org");

  const [state, setState] = useState<WithdrawState>({
    isLoading: false,
    step: "idle",
    error: null,
    result: null,
  });

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      step: "idle",
      error: null,
      result: null,
    });
  }, []);

  const withdraw = useCallback(
    async (params: WithdrawParams): Promise<WithdrawResult> => {
      if (!address) {
        const error = "Wallet not connected. Please connect your wallet first.";
        setState((prev) => ({ ...prev, error, step: "error" }));
        throw new Error(error);
      }

      if (!params.amount || !params.address) {
        const error = "Amount and destination address are required.";
        setState((prev) => ({ ...prev, error, step: "error" }));
        throw new Error(error);
      }

      // Reset state and start loading
      setState({
        isLoading: true,
        step: "creating-payment",
        error: null,
        result: null,
      });

      try {
        // Step 1: Create Rozo payment
        const paymentPayload = {
          appId: "rozoSoroswapWithdraw",
          display: {
            intent: "Withdraw",
            paymentValue: params.amount,
            currency: "USD",
          },
          destination: {
            destinationAddress: params.address,
            chainId: BASE_CONFIG.chainId,
            amountUnits: params.amount,
            tokenSymbol: BASE_CONFIG.tokenSymbol,
            tokenAddress: BASE_CONFIG.tokenAddress,
          },
          metadata: {
            intent: "Withdraw",
            items: [
              {
                name: "Withdraw",
                description: `Transfer ${params.amount} ${BASE_CONFIG.tokenSymbol} from Stellar to Base`,
              },
            ],
          },
          preferredChain: "1500", // Stellar Rozo Chain ID
          preferredToken: "USDC",
        };

        const paymentResponse = await fetch("/api/rozo-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentPayload),
        });

        if (!paymentResponse.ok) {
          throw new Error(
            `Failed to create payment: ${paymentResponse.status} ${paymentResponse.statusText}`,
          );
        }

        const paymentData =
          (await paymentResponse.json()) as RozoPaymentResponse;
        const paymentId = paymentData.data.id;
        const receivingAddress = paymentData.data.metadata.receivingAddress;
        const memo = paymentData.data.metadata.memo;

        // Step 2: Sign transaction
        setState((prev) => ({ ...prev, step: "signing-transaction" }));

        const xdr = await StellarPay({
          server,
          publicKey: address,
          order: {
            address: receivingAddress,
            amount: Number(params.amount),
            salt: memo,
          },
        });

        const signedXdr = await signTransaction(xdr, address);

        // Step 3: Submit transaction
        setState((prev) => ({ ...prev, step: "submitting-transaction" }));

        const submitResponse = await fetch("/api/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(signedXdr),
        });

        if (!submitResponse.ok) {
          throw new Error(
            `Failed to submit transaction: ${submitResponse.status} ${submitResponse.statusText}`,
          );
        }

        const submitData = (await submitResponse.json()) as {
          code: string;
          data: SendTransactionResponse;
        };

        // Success
        const result: WithdrawResult = {
          success: true,
          txHash: submitData.data.txHash,
          hash: submitData.data.hash,
          paymentId,
        };

        setState({
          isLoading: false,
          step: "success",
          error: null,
          result,
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";

        setState({
          isLoading: false,
          step: "error",
          error: errorMessage,
          result: null,
        });

        throw error;
      }
    },
    [address, signTransaction, server],
  );

  return {
    // State
    isLoading: state.isLoading,
    step: state.step,
    error: state.error,
    result: state.result,

    // Actions
    withdraw,
    reset: resetState,
  };
}
