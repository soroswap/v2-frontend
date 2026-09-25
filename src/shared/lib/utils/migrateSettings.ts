import { SwapSettings } from "@/features/swap/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Brings a settings object persisted by an older build up to the current `SwapSettings` shape.
 *
 * The slippage choice survives. Protocols are reset to `defaults` because the venue list is
 * decided server-side and changed between versions (Phoenix left, Sushi arrived), so an old
 * selection cannot be mapped onto the new venues. Fields the shape no longer has, such as the
 * former `maxHops`, are dropped by construction. Anything unreadable resets to `defaults`.
 */
export function migrateSettings(
  persisted: unknown,
  defaults: SwapSettings,
): SwapSettings {
  const previous = isRecord(persisted) ? persisted : {};

  return {
    slippageMode:
      previous.slippageMode === "custom" ? "custom" : defaults.slippageMode,
    customSlippage:
      typeof previous.customSlippage === "string"
        ? previous.customSlippage
        : defaults.customSlippage,
    protocols: [...defaults.protocols],
  };
}
