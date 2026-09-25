import { SwapSettings } from "@/features/swap/types";
import { DEFAULT_SWAP_SETTINGS } from "@/shared/lib/constants/swap";
import { migrateSettings } from "@/shared/lib/utils/migrateSettings";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SwapSettingsStore {
  swapSettings: SwapSettings;
  setSwapSettings: (partial: Partial<SwapSettings>) => void;
}

/** Bump whenever `SwapSettings` changes shape, and teach `migrate` about the old shape. */
const SWAP_SETTINGS_VERSION = 1;

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
      name: "swap-settings-storage",
      version: SWAP_SETTINGS_VERSION,
      partialize: (state) => ({ swapSettings: state.swapSettings }),
      // v0 -> v1: `maxHops` was dropped and the venue list changed (Phoenix out, Sushi in).
      migrate: (persisted) => ({
        swapSettings: migrateSettings(
          (persisted as { swapSettings?: unknown } | undefined)?.swapSettings,
          DEFAULT_SWAP_SETTINGS,
        ),
      }),
    },
  ),
);
