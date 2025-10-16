"use client";

import { BridgeContainer, BridgeFooter } from "@/features/bridge";

export default function BridgePage() {
  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] flex-col items-center justify-center px-4 py-10">
      {/* Main Bridge Card */}
      <div className="bg-surface border-brand flex w-full max-w-xl flex-col gap-6 rounded-2xl border p-4 shadow-xl sm:p-8">
        {/* Bridge Container with Toggle and Content */}
        <BridgeContainer />
      </div>

      {/* Footer */}
      <BridgeFooter />
    </main>
  );
}
