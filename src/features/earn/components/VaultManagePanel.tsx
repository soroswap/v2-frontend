"use client";

import { ReactNode, useState } from "react";
import { ArrowRight } from "lucide-react";
import { TheButton } from "@/shared/components";
import { Tab } from "@/features/earn/components/Tab";
import { useUserContext } from "@/contexts";
import { network } from "@/shared/lib/environmentVars";

type activeTab = "deposit" | "withdraw";

export const VaultManagePanel = ({
  vaultAddress,
}: {
  vaultAddress: string;
}) => {
  const [activeTab, setActiveTab] = useState<activeTab>("deposit");
  const [amount, setAmount] = useState("0");
  const { address } = useUserContext();

  const handleDeposit = async () => {
    const response = await fetch("/api/earn/deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        amount: amount,
        caller: address ?? "",
        slippageBps: "100",
        vaultId: vaultAddress,
        network: network,
      },
    });
  };

  const handleMaxAmount = () => {
    setAmount("1000");
  };

  const renderTab: Record<activeTab, ReactNode> = {
    deposit: (
      <>
        <div className="flex w-full items-center gap-6">
          {/* From wallet */}
          <div className="flex flex-col gap-2">
            <label className="text-secondary text-sm font-medium">
              From wallet
            </label>
            <div className="bg-surface-alt border-surface-alt rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  S$
                </div>
                <span className="text-primary text-sm font-medium">USDS</span>
              </div>
            </div>
            <span className="text-secondary text-xs">You have 0.00 USDS</span>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <label className="text-secondary text-sm font-medium">Amount</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-surface-alt border-surface-alt text-primary hide-number-spin flex-1 rounded-lg border p-3 text-2xl font-bold outline-none"
                placeholder="0"
              />
            </div>
            <span className="text-secondary text-xs">
              ${parseFloat(amount) * 1 || "0.00"}
            </span>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="text-secondary size-6" />
          </div>

          {/* To vault */}
          <div className="flex flex-col gap-2">
            <label className="text-secondary text-sm font-medium">
              To vault
            </label>
            <div className="bg-surface-alt border-surface-alt rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-gray-500 text-xs font-bold text-white">
                  a
                </div>
                <span className="text-primary text-sm font-medium">ysUSDS</span>
              </div>
            </div>
            <span className="text-secondary text-xs">6.40%</span>
          </div>
          {/* Deposit Button */}
          <div className="flex w-full justify-end">
            <TheButton
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-auto px-8"
            >
              Deposit
            </TheButton>
          </div>
        </div>
      </>
    ),
    withdraw: (
      <div className="text-secondary py-8 text-center">
        Withdraw functionality coming soon
      </div>
    ),
  };

  return (
    <div className="bg-surface border-surface-alt mt-8 flex-1 rounded-2xl border p-8 shadow-lg">
      <div className="mb-6 flex items-center gap-1">
        <Tab
          tabs={["deposit", "withdraw"]}
          onTabChange={(tab) => setActiveTab(tab as activeTab)}
          activeTab={activeTab}
        />
      </div>

      <div className="border-surface-alt border-t pt-6">
        {renderTab[activeTab]}
      </div>
    </div>
  );
};
