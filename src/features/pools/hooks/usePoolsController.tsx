/* eslint-disable react-hooks/exhaustive-deps */

import { useUserContext } from "@/contexts";
import { usePoolsSettingsStore } from "@/contexts/store/pools-settings";
import { PoolStep } from "@/features/pools/hooks/usePool";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { parseUnits } from "@/shared/lib/utils/parseUnits";
import {
  AddLiquidityRequest,
  AssetInfo,
  RemoveLiquidityRequest,
} from "@soroswap/sdk";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useGetPoolByTokens } from "./useGetPoolByTokens";
import type { PoolError, PoolResult } from "./usePool";
import { usePool } from "./usePool";
import { slippageBps } from "@/shared/lib/utils/slippageBps";

// -----------------------------------------------------------------------------
// Types & helper utilities
// -----------------------------------------------------------------------------
type IndependentField = "TOKEN_A" | "TOKEN_B";

interface PoolState {
  typedValue: string;
  independentField: IndependentField;
  TOKEN_A: AssetInfo | null;
  TOKEN_B: AssetInfo | null;
  tokenAAmount: string;
  tokenBAmount: string;
}

const initialPoolState: PoolState = {
  typedValue: "",
  independentField: "TOKEN_A",
  TOKEN_A: null,
  TOKEN_B: null,
  tokenAAmount: "",
  tokenBAmount: "",
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
        tokenAAmount:
          action.field === "TOKEN_A" ? action.typedValue : state.tokenAAmount,
        tokenBAmount:
          action.field === "TOKEN_B" ? action.typedValue : state.tokenBAmount,
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
  /**
   * Initial token addresses to pre-select tokens from URL parameters
   */
  initialTokenAAddress?: string;
  initialTokenBAddress?: string;
}

export function usePoolsController({
  onSuccess,
  onError,
  onStepChange,
  initialTokenAAddress,
  initialTokenBAddress,
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
  const {
    typedValue,
    independentField,
    TOKEN_A,
    TOKEN_B,
    tokenAAmount,
    tokenBAmount,
  } = poolState;

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
    executeRemoveLiquidity,
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
    if (poolRatio == null || independentField === "TOKEN_A" || !typedValue) {
      // If no pool ratio or user is typing in TOKEN_A, preserve existing TOKEN_A amount
      return tokenAAmount || undefined;
    }

    const amountB = parseFloat(typedValue);
    if (isNaN(amountB) || poolRatio === 0) return tokenAAmount || undefined;

    const amountA = amountB / poolRatio;
    return amountA.toFixed(7); // We need to fix the decimals to , because a lot of assets in Stellar have 7 decimals.
  }, [poolRatio, independentField, typedValue, tokenAAmount]);

  const derived_TOKEN_B_Amount = useMemo(() => {
    // User types TOKEN_A, we derive TOKEN_B
    if (poolRatio == null || independentField === "TOKEN_B" || !typedValue) {
      // If no pool ratio or user is typing in TOKEN_B, preserve existing TOKEN_B amount
      return tokenBAmount || undefined;
    }

    const amountA = parseFloat(typedValue);
    if (isNaN(amountA)) return tokenBAmount || undefined;

    const amountB = amountA * poolRatio;
    return amountB.toFixed(7); // We need to fix the decimals to 7, because a lot of assets in Stellar have 7 decimals.
  }, [poolRatio, independentField, typedValue, tokenBAmount]);

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

    // Determine amounts based on pool ratio availability
    let amountAInput: string | undefined;
    let amountBInput: string | undefined;

    if (poolRatio == null || poolRatio === undefined) {
      // No pool ratio: use independent amounts for both fields
      amountAInput = tokenAAmount;
      amountBInput = tokenBAmount;

      // Both fields need to have values when there's no pool ratio
      if (!amountAInput || !amountBInput) return;
    } else {
      // Pool ratio exists: use derivation logic
      amountAInput =
        independentField === "TOKEN_A" ? typedValue : derived_TOKEN_A_Amount;
      amountBInput =
        independentField === "TOKEN_B" ? typedValue : derived_TOKEN_B_Amount;

      // With pool ratio, we can derive one from the other
      if (!amountAInput || !amountBInput) return;
    }

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
        slippageBps: slippageBps(poolsSettings.customSlippage).toString(),
      };
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

  /**
   * Executes the remove liquidity transaction via the Soroswap SDK API.
   */
  const handleRemoveLiquidity = useCallback(
    async (
      params: Pick<RemoveLiquidityRequest, "liquidity" | "amountA" | "amountB">,
    ) => {
      if (
        !TOKEN_A ||
        !TOKEN_B ||
        !userAddress ||
        !TOKEN_A.contract ||
        !TOKEN_B.contract
      )
        return;

      try {
        const removeLiquidityRequest: RemoveLiquidityRequest = {
          assetA: TOKEN_A.contract,
          assetB: TOKEN_B.contract,
          liquidity: BigInt(params.liquidity),
          amountA: BigInt(params.amountA),
          amountB: BigInt(params.amountB),
          to: userAddress,
          slippageBps: slippageBps(poolsSettings.customSlippage).toString(),
        };
        await executeRemoveLiquidity(removeLiquidityRequest);
      } catch (err) {
        console.error(err);
      }
    },
    [
      TOKEN_A,
      TOKEN_B,
      userAddress,
      executeRemoveLiquidity,
      poolsSettings.customSlippage,
    ],
  );
  // ---------------------------------------------------------------------------
  // Effects: initialise default values once token list is fetched.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isTokensLoading && tokensList.length > 0) {
      // If URL parameters provided, find and select those tokens
      if (initialTokenAAddress && !TOKEN_A) {
        const tokenA = tokensList.find(
          (token) => token.contract === initialTokenAAddress,
        );
        if (tokenA) {
          handleTokenSelect("TOKEN_A")(tokenA);
        }
      }

      if (initialTokenBAddress && !TOKEN_B) {
        const tokenB = tokensList.find(
          (token) => token.contract === initialTokenBAddress,
        );
        if (tokenB) {
          handleTokenSelect("TOKEN_B")(tokenB);
        }
      }

      // Default behavior: if no URL parameters and no TOKEN_A selected, select first token
      if (!initialTokenAAddress && !TOKEN_A) {
        handleTokenSelect("TOKEN_A")(tokensList[0]);
      }
    }
  }, [
    isTokensLoading,
    tokensList,
    initialTokenAAddress,
    initialTokenBAddress,
    TOKEN_A,
    TOKEN_B,
  ]);

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
    tokenAAmount,
    tokenBAmount,

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
    handleRemoveLiquidity,

    // misc
    resetSwap,
  } as const;
}
