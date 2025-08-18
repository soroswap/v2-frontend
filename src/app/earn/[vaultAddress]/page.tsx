"use client";

import { useParams } from "next/navigation";
import { VaultCardDetails, VaultManagePanel } from "@/features/earn/components";

export default function VaultPageDetails() {
  const params = useParams();
  const vaultAddress = params.vaultAddress as string;

  return (
    <div className="mt-[100px] flex min-h-[calc(100vh-100px)] flex-col px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
        <VaultCardDetails vaultAddress={vaultAddress} />
        <VaultManagePanel vaultAddress={vaultAddress} />
        {/* TODO: Create a about showing the FeebPG, Assets and roles */}
      </div>
    </div>
  );
}
