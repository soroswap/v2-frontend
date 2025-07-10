/* eslint-disable react-hooks/exhaustive-deps */

import { useUserContext } from "@/contexts";
import { usePoolsSettingsStore } from "@/contexts/store/pools-settings";
import { PoolStep } from "@/features/pools/hooks/usePool";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { parseUnits } from "@/shared/lib/utils/parseUnits";
import { AddLiquidityRequest, AssetInfo } from "@soroswap/sdk";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useGetPoolByTokens } from "./useGetPoolByTokens";
import type { PoolError, PoolResult } from "./usePool";
import { usePool } from "./usePool";

// -----------------------------------------------------------------------------
// Types & helper utilities
// -----------------------------------------------------------------------------
type IndependentField = "TOKEN_A" | "TOKEN_B";

interface PoolState {
  typedValue: string;
  independentField: IndependentField;
  TOKEN_A: AssetInfo | null;
  TOKEN_B: AssetInfo | null;
}

const initialPoolState: PoolState = {
  typedValue: "",
  independentField: "TOKEN_A",
  TOKEN_A: null,
  TOKEN_B: null,
};

/**
 * All possible actions for the reducer that manages the pool form state.
 */
type PoolAction =
  | { type: "TYPE_INPUT"; field: IndependentField; typedValue: string }
  | { type: "SET_TOKEN"; field: IndependentField; token: AssetInfo | null };

function poolReducer(state: PoolState, action: PoolAction): PoolState {
  switch (action.type) {
    case "TYPE_INPUT":
      return {
        ...state,
        typedValue: action.typedValue,
        independentField: action.field,
      };

    case "SET_TOKEN":
      return {
        ...state,
        [action.field === "TOKEN_A" ? "TOKEN_A" : "TOKEN_B"]: action.token,
      };

    default:
      return state;
  }
}

// -----------------------------------------------------------------------------
// Hook definition
// -----------------------------------------------------------------------------
export interface UsePoolsControllerProps {
  /**
   * Callbacks forwarded to the internal `useSwap` hook.
   */
  onSuccess?: (result: PoolResult) => void;
  onError?: (error: PoolError) => void;
  onStepChange?: (step: PoolStep) => void;
}

export function usePoolsController({
  onSuccess,
  onError,
  onStepChange,
}: UsePoolsControllerProps) {
  // ---------------------------------------------------------------------------
  // External (global) state / data.
  // ---------------------------------------------------------------------------
  const { tokensList, isLoading: isTokensLoading } = useTokensList();
  const { poolsSettings } = usePoolsSettingsStore();

  // ---------------------------------------------------------------------------
  // Local component state.
  // ---------------------------------------------------------------------------
  const [poolState, dispatchPool] = useReducer(poolReducer, initialPoolState);
  const { typedValue, independentField, TOKEN_A, TOKEN_B } = poolState;

  // ---------------------------------------------------------------------------
  // Pool ratio logic – useGetPoolByTokens provides the matched pool & ratio.
  // ---------------------------------------------------------------------------
  const { ratio: poolRatio, isLoading: isRatioLoading } = useGetPoolByTokens({
    tokenAContract: TOKEN_A?.contract ?? null,
    tokenBContract: TOKEN_B?.contract ?? null,
  });

  // ---------------------------------------------------------------------------
  // Liquidity transaction logic – uses usePool hook.
  // ---------------------------------------------------------------------------
  const {
    executeAddLiquidity,
    currentStep,
    isLoading: isSwapLoading,
    reset: resetSwap,
  } = usePool({
    onSuccess,
    onError,
    onStepChange: (step) => onStepChange?.(step),
  });

  // ---------------------------------------------------------------------------
  // Derived amounts based on pool ratio.
  // ---------------------------------------------------------------------------
  const derived_TOKEN_A_Amount = useMemo(() => {
    // User types TOKEN_B, we derive TOKEN_A
    if (poolRatio == null || independentField === "TOKEN_A" || !typedValue)
      return undefined;

    const amountB = parseFloat(typedValue);
    if (isNaN(amountB) || poolRatio === 0) return undefined;

    const amountA = amountB / poolRatio;
    return amountA.toString();
  }, [poolRatio, independentField, typedValue]);

  const derived_TOKEN_B_Amount = useMemo(() => {
    // User types TOKEN_A, we derive TOKEN_B
    if (poolRatio == null || independentField === "TOKEN_B" || !typedValue)
      return undefined;

    const amountA = parseFloat(typedValue);
    if (isNaN(amountA)) return undefined;

    const amountB = amountA * poolRatio;
    return amountB.toString();
  }, [poolRatio, independentField, typedValue]);

  const { address: userAddress } = useUserContext();

  // ---------------------------------------------------------------------------
  // Public handlers exposed to the UI layer.
  // ---------------------------------------------------------------------------

  /**
   * Update amount the user typed in either the "sell" or "buy" input.
   */
  const handleAmountChange = useCallback(
    (field: IndependentField) => (amount: string | undefined) => {
      dispatchPool({ type: "TYPE_INPUT", field, typedValue: amount ?? "" });
    },
    [],
  );

  /**
   * Called when the user selects a token from the picker.
   */
  const handleTokenSelect = useCallback(
    (field: IndependentField) => (token: AssetInfo | null) => {
      dispatchPool({ type: "SET_TOKEN", field, token });
    },
    [],
  );

  /**
   * Executes the swap transaction via the Soroswap SDK API.
   */
  const handleAddLiquidity = useCallback(async () => {
    if (
      !TOKEN_A ||
      !TOKEN_B ||
      !userAddress ||
      !TOKEN_A.contract ||
      !TOKEN_B.contract
    )
      return;

    // Determine amounts based on which field the user typed.
    const amountAInput =
      independentField === "TOKEN_A" ? typedValue : derived_TOKEN_A_Amount;
    const amountBInput =
      independentField === "TOKEN_B" ? typedValue : derived_TOKEN_B_Amount;

    if (!amountAInput || !amountBInput) return;

    // Convert to smallest units.
    const amountA = parseUnits({
      value: amountAInput,
      decimals: TOKEN_A.decimals ?? 7,
    }).toString();

    const amountB = parseUnits({
      value: amountBInput,
      decimals: TOKEN_B.decimals ?? 7,
    }).toString();

    try {
      const addLiquidityRequest: AddLiquidityRequest = {
        assetA: TOKEN_A.contract,
        assetB: TOKEN_B.contract,
        amountA: BigInt(amountA),
        amountB: BigInt(amountB),
        to: userAddress,
        slippageBps: poolsSettings.customSlippage.toString(),
      };
      console.log("addLiquidityRequest", addLiquidityRequest);
      await executeAddLiquidity(addLiquidityRequest);
    } catch (err) {
      console.error(err);
    }
  }, [
    TOKEN_A,
    TOKEN_B,
    userAddress,
    independentField,
    typedValue,
    derived_TOKEN_A_Amount,
    derived_TOKEN_B_Amount,
    executeAddLiquidity,
  ]);

  // ---------------------------------------------------------------------------
  // Effects: initialise default values once token list is fetched.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isTokensLoading && tokensList.length > 0 && !TOKEN_A) {
      handleTokenSelect("TOKEN_A")(tokensList[0]);
    }
  }, [isTokensLoading, tokensList]);

  // ---------------------------------------------------------------------------
  // Return – the public API of this hook.
  // ---------------------------------------------------------------------------
  return {
    // raw data / state
    tokensList,
    isTokensLoading,
    typedValue,
    independentField,
    TOKEN_A,
    TOKEN_B,

    // ratio info
    isQuoteLoading: isRatioLoading,
    derived_TOKEN_A_Amount,
    derived_TOKEN_B_Amount,

    // swap info
    currentStep,
    isSwapLoading,

    // handlers
    handleAmountChange,
    handleTokenSelect,
    handleAddLiquidity,

    // misc
    resetSwap,
  } as const;
}
