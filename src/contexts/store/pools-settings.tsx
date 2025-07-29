import { SwapSettings } from "@/features/swap/types";
import { DEFAULT_POOLS_SETTINGS } from "@/shared/lib/constants/pools";
import { create } from "zustand";

interface PoolsSettingsStore {
  poolsSettings: SwapSettings;
  setPoolsSettings: (partial: Partial<SwapSettings>) => void;
}

export const usePoolsSettingsStore = create<PoolsSettingsStore>((set) => ({
  poolsSettings: DEFAULT_POOLS_SETTINGS,
  setPoolsSettings: (partial) =>
    set((state) => ({
      poolsSettings: { ...state.poolsSettings, ...partial },
    })),
}));
