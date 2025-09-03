import { useCallback, useReducer, useState } from "react";
import { useUserContext } from "@/contexts/UserContext";
import { useVaultInfo, useVaultBalance } from "@/features/earn/hooks";
import {
  EarnVaultStep,
  EarnVaultError,
  EarnVaultResult,
  EarnVaultModalState,
  useEarnVault,
} from "@/features/earn/hooks/useEarnVault";

// -----------------------------------------------------------------------------
// Types & helper utilities
// -----------------------------------------------------------------------------
type OperationType = "deposit" | "withdraw";

interface EarnVaultState {
  vaultAddress: string;
  amount: string;
  operationType: OperationType;
}

const initialEarnVaultState: EarnVaultState = {
  vaultAddress: "",
  amount: "",
  operationType: "deposit",
};

/**
 * All possible actions for the reducer that manages the earn vault form state.
 */
type EarnVaultAction =
  | { type: "SET_VAULT_ADDRESS"; vaultAddress: string }
  | { type: "SET_AMOUNT"; amount: string }
  | { type: "SET_OPERATION_TYPE"; operationType: OperationType }
  | { type: "RESET" };

/**
 * Reducer function that manages the earn vault form state.
 */
function earnVaultReducer(
  state: EarnVaultState,
  action: EarnVaultAction,
): EarnVaultState {
  switch (action.type) {
    case "SET_VAULT_ADDRESS":
      return { ...state, vaultAddress: action.vaultAddress };
    case "SET_AMOUNT":
      return { ...state, amount: action.amount };
    case "SET_OPERATION_TYPE":
      return { ...state, operationType: action.operationType };
    case "RESET":
      return initialEarnVaultState;
    default:
      return state;
  }
}

// -----------------------------------------------------------------------------
// Main hook
// -----------------------------------------------------------------------------

interface UseEarnVaultControllerOptions {
  vaultAddress: string;
  onSuccess?: (result: EarnVaultResult) => void;
  onError?: (error: EarnVaultError) => void;
  onStepChange?: <T extends EarnVaultStep>(
    step: T,
    data?: EarnVaultModalState,
  ) => void;
}

export function useEarnVaultController({
  vaultAddress: initialVaultAddress,
  onSuccess,
  onError,
  onStepChange,
}: UseEarnVaultControllerOptions) {
  const { address: userAddress } = useUserContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize state with provided vault address
  const [state, dispatch] = useReducer(earnVaultReducer, {
    ...initialEarnVaultState,
    vaultAddress: initialVaultAddress,
  });

  const { vaultAddress, amount, operationType } = state;

  // ---------------------------------------------------------------------------
  // Hooks for vault data
  // ---------------------------------------------------------------------------
  const { vaultInfo, isLoading: isVaultInfoLoading } = useVaultInfo({
    vaultId: vaultAddress,
  });

  const {
    vaultBalance,
    isLoading: isVaultBalanceLoading,
    revalidate,
  } = useVaultBalance({
    vaultId: vaultAddress,
    userAddress,
  });

  // ---------------------------------------------------------------------------
  // Earn vault execution hook
  // ---------------------------------------------------------------------------
  const {
    currentStep,
    isLoading: isEarnVaultLoading,
    transactionHash,
    error,
    modalData,
    executeDeposit,
    executeWithdraw,
    reset: resetEarnVault,
  } = useEarnVault({
    onSuccess: (result) => {
      revalidate(); // Revalidate vault balance after successful operation
      onSuccess?.(result);
    },
    onError: (error) => {
      setIsModalOpen(false); // Close modal on error
      onError?.(error);
    },
    onStepChange,
  });

  // ---------------------------------------------------------------------------
  // Public handlers exposed to the UI layer.
  // ---------------------------------------------------------------------------

  /**
   * Update the amount the user typed.
   */
  const handleAmountChange = useCallback((newAmount: string) => {
    dispatch({ type: "SET_AMOUNT", amount: newAmount });
  }, []);

  /**
   * Update the operation type (deposit/withdraw).
   */
  const handleOperationTypeChange = useCallback(
    (newOperationType: OperationType) => {
      dispatch({ type: "SET_OPERATION_TYPE", operationType: newOperationType });
    },
    [],
  );

  /**
   * Execute the deposit operation.
   */
  const handleDeposit = useCallback(async () => {
    if (!userAddress || !vaultAddress || !amount || parseFloat(amount) <= 0)
      return;

    setIsModalOpen(true);
    try {
      await executeDeposit({
        vaultId: vaultAddress,
        amount,
        userAddress,
        slippageBps: 100, // Default slippage
      });
    } catch {
      // Error handling is done in useEarnVault hook via onError callback
    }
  }, [userAddress, vaultAddress, amount, executeDeposit]);

  /**
   * Execute the withdraw operation.
   */
  const handleWithdraw = useCallback(async () => {
    if (!userAddress || !vaultAddress || !amount || parseFloat(amount) <= 0)
      return;

    setIsModalOpen(true);
    try {
      await executeWithdraw({
        vaultId: vaultAddress,
        amount,
        userAddress,
        slippageBps: 100, // Default slippage
      });
    } catch {
      // Error handling is done in useEarnVault hook via onError callback
    }
  }, [userAddress, vaultAddress, amount, executeWithdraw]);

  /**
   * Execute the operation based on the current operation type.
   */
  const handleExecute = useCallback(async () => {
    if (operationType === "deposit") {
      await handleDeposit();
    } else {
      await handleWithdraw();
    }
  }, [operationType, handleDeposit, handleWithdraw]);

  /**
   * Close the modal and reset the earn vault state.
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    resetEarnVault();
  }, [resetEarnVault]);

  /**
   * Reset the form state.
   */
  const resetForm = useCallback(() => {
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_VAULT_ADDRESS", vaultAddress: initialVaultAddress });
  }, [initialVaultAddress]);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------
  const isFormValid = Boolean(
    userAddress &&
      vaultAddress &&
      amount &&
      parseFloat(amount) > 0 &&
      vaultInfo,
  );

  const isLoading =
    isVaultInfoLoading || isVaultBalanceLoading || isEarnVaultLoading;

  // ---------------------------------------------------------------------------
  // Return – the public API of this hook.
  // ---------------------------------------------------------------------------
  return {
    // vault data
    vaultInfo,
    vaultBalance,
    isVaultInfoLoading,
    isVaultBalanceLoading,

    // form state
    vaultAddress,
    amount,
    operationType,
    isFormValid,
    isLoading,

    // modal state
    isModalOpen,
    currentStep,
    transactionHash,
    error,
    modalData,

    // handlers
    handleAmountChange,
    handleOperationTypeChange,
    handleDeposit,
    handleWithdraw,
    handleExecute,
    handleCloseModal,
    resetForm,

    // utils
    revalidate,
  } as const;
}
