"use client";

import { useState } from "react";
import {
  BridgeToggle,
  BridgeFooter,
  DepositBridge,
  WithdrawBridge,
} from "@/features/bridge";
import { BridgeMode } from "@/features/bridge/types";

export default function BridgePage() {
  const [bridgeMode, setBridgeMode] = useState<BridgeMode>("deposit");

  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] flex-col items-center justify-center px-4 py-10">
      {/* Main Bridge Card */}
      <div className="bg-surface border-brand flex w-full max-w-xl flex-col gap-6 rounded-2xl border p-6 shadow-xl">
        {/* Toggle Group */}
        <BridgeToggle bridgeMode={bridgeMode} onModeChange={setBridgeMode} />

        {/* Content Section */}
        {bridgeMode === "deposit" ? <DepositBridge /> : <WithdrawBridge />}
      </div>

      {/* Footer */}
      <BridgeFooter />
    </main>
  );
}
