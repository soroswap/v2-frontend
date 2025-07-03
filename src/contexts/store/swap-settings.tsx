import { SwapSettings } from "@/components/shared/types";
import { DEFAULT_SWAP_SETTINGS } from "@/lib/constants/swap";
import { create } from "zustand";

interface SwapSettingsStore {
  swapSettings: SwapSettings;
  setSwapSettings: (partial: Partial<SwapSettings>) => void;
}

export const useSwapSettingsStore = create<SwapSettingsStore>((set) => ({
  swapSettings: DEFAULT_SWAP_SETTINGS,
  setSwapSettings: (partial) =>
    set((state) => ({
      swapSettings: { ...state.swapSettings, ...partial },
    })),
}));
