import { SwapSettings } from "@/features/swap/types";
import { DEFAULT_SWAP_SETTINGS } from "@/shared/lib/constants/swap";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SwapSettingsStore {
  swapSettings: SwapSettings;
  setSwapSettings: (partial: Partial<SwapSettings>) => void;
}

export const useSwapSettingsStore = create<SwapSettingsStore>()(
  persist(
    (set) => ({
      swapSettings: DEFAULT_SWAP_SETTINGS,
      setSwapSettings: (partial) =>
        set((state) => ({
          swapSettings: { ...state.swapSettings, ...partial },
        })),
    }),
    {
      name: 'swap-settings-storage',
    }
  )
);
