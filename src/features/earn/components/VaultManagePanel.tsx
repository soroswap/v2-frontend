"use client";

import { ReactNode, useState } from "react";
import { DepositVault, Tab, WithdrawVault } from "@/features/earn/components";

type activeTab = "deposit" | "withdraw";

export const VaultManagePanel = ({
  vaultAddress,
}: {
  vaultAddress: string;
}) => {
  const [activeTab, setActiveTab] = useState<activeTab>("deposit");

  const renderTab: Record<activeTab, ReactNode> = {
    deposit: <DepositVault vaultAddress={vaultAddress} />,
    withdraw: <WithdrawVault vaultAddress={vaultAddress} />,
  };

  return (
    <div className="bg-surface border-surface-alt flex flex-1 flex-col gap-4 rounded-2xl border p-4 shadow-lg md:p-8">
      <div className="flex items-center gap-1">
        <Tab
          tabs={["deposit", "withdraw"]}
          onTabChange={(tab) => setActiveTab(tab as activeTab)}
          activeTab={activeTab}
        />
      </div>

      <div className="border-surface-alt border-t">{renderTab[activeTab]}</div>
    </div>
  );
};
