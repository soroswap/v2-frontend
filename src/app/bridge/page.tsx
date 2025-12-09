"use client";

import { BridgeFooter } from "@/features/bridge/components/BridgeFooter";
import { BridgeLayout } from "@/features/bridge/components/BridgeLayout";
import { RozoProvider } from "@/features/bridge/providers/RozoProvider";

export default function BridgePage() {
  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] flex-col items-center justify-center px-4 py-10">
      <div className="mx-auto mb-4 flex w-fit max-w-xl items-center justify-center gap-2 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-[var(--color-info-text)]">
        <div className="text-center text-sm sm:text-base">
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-info-text)" }}
          >
            This bridge is currently in <b>Beta Phase</b>. Start with a small
            amount first to verify everything works as expected. Please contact
            our team if you encounter issues.
          </p>
        </div>
      </div>

      <div className="bg-surface border-brand mx-auto flex w-full max-w-xl flex-col gap-6 rounded-2xl border p-4 shadow-xl sm:p-8">
        <RozoProvider>
          <BridgeLayout />
        </RozoProvider>
      </div>

      <BridgeFooter />
    </main>
  );
}
