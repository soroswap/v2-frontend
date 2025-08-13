"use client";

import { useParams } from "next/navigation";

import { VaultCardDetails } from "@/features/earn/components/VaultCardDetails";
import { VaultManagePanel } from "@/features/earn/components/VaultManagePanel";

export default function VaultPageDetails() {
  const params = useParams();
  const vaultAddress = params.vaultAddress as string;

  return (
    <div className="mt-[100px] flex min-h-[calc(100vh-100px)] flex-col px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <VaultCardDetails vaultAddress={vaultAddress} />
        <VaultManagePanel vaultAddress={vaultAddress} />
        {/* TODO: Create a about showing the FeebPG, Assets and roles */}
      </div>
    </div>
  );
}
