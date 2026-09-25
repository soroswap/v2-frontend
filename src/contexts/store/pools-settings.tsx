import { SwapSettings } from "@/features/swap/types";
import { DEFAULT_POOLS_SETTINGS } from "@/shared/lib/constants/pools";
import { migrateSettings } from "@/shared/lib/utils/migrateSettings";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PoolsSettingsStore {
  poolsSettings: SwapSettings;
  setPoolsSettings: (partial: Partial<SwapSettings>) => void;
}

/** Bump whenever `SwapSettings` changes shape, and teach `migrate` about the old shape. */
const POOLS_SETTINGS_VERSION = 1;

export const usePoolsSettingsStore = create<PoolsSettingsStore>()(
  persist(
    (set) => ({
      poolsSettings: DEFAULT_POOLS_SETTINGS,
      setPoolsSettings: (partial) =>
        set((state) => ({
          poolsSettings: { ...state.poolsSettings, ...partial },
        })),
    }),
    {
      name: "pools-settings-storage",
      version: POOLS_SETTINGS_VERSION,
      partialize: (state) => ({ poolsSettings: state.poolsSettings }),
      // v0 -> v1: `maxHops` was dropped and the venue list changed (Phoenix out, Sushi in).
      migrate: (persisted) => ({
        poolsSettings: migrateSettings(
          (persisted as { poolsSettings?: unknown } | undefined)?.poolsSettings,
          DEFAULT_POOLS_SETTINGS,
        ),
      }),
    },
  ),
);
