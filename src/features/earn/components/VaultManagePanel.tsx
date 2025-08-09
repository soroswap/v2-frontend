"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { ArrowRight } from "lucide-react";
import { TheButton } from "@/shared/components";

type activeTab = "deposit" | "withdraw";

export const VaultManagePanel = ({
  vaultAddress,
}: {
  vaultAddress: string;
}) => {
  const [activeTab, setActiveTab] = useState<activeTab>("deposit");
  const [amount, setAmount] = useState("0");

  const handleDeposit = () => {
    console.log("Depositing", amount, "to vault", vaultAddress);
  };

  const handleMaxAmount = () => {
    setAmount("1000");
  };

  return (
    <div className="bg-surface border-surface-alt mt-8 flex-1 rounded-2xl border p-8 shadow-lg">
      {/* Navigation Tabs */}
      <div className="mb-6 flex items-center gap-1">
        <button
          onClick={() => setActiveTab("deposit")}
          className={cn(
            "text-primary rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "deposit"
              ? "bg-surface-alt text-primary"
              : "text-secondary hover:text-primary",
          )}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className={cn(
            "text-primary rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "withdraw"
              ? "bg-surface-alt text-primary"
              : "text-secondary hover:text-primary",
          )}
        >
          Withdraw
        </button>
      </div>

      <div className="border-surface-alt border-t pt-6">
        {activeTab === "deposit" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
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
              <label className="text-secondary text-sm font-medium">
                Amount
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-surface-alt border-surface-alt text-primary hide-number-spin flex-1 rounded-lg border p-3 text-2xl font-bold outline-none"
                  placeholder="0"
                />
                <button
                  onClick={handleMaxAmount}
                  className="rounded-lg border border-green-500 bg-transparent px-4 py-2 text-sm font-medium text-green-500 transition-colors hover:bg-green-500/10"
                >
                  Max
                </button>
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
                  <span className="text-primary text-sm font-medium">
                    ysUSDS
                  </span>
                </div>
              </div>
              <span className="text-secondary text-xs">6.40%</span>
            </div>
          </div>
        )}

        {activeTab === "deposit" && (
          <>
            {/* You will receive */}
            <div className="mt-6 flex flex-col gap-2">
              <label className="text-secondary text-sm font-medium">
                You will receive
              </label>
              <div className="bg-surface-alt border-surface-alt rounded-lg border p-3">
                <input
                  type="text"
                  value={amount}
                  readOnly
                  className="text-primary hide-number-spin w-full bg-transparent text-2xl font-bold outline-none"
                  placeholder="0"
                />
              </div>
              <span className="text-secondary text-xs">
                ${parseFloat(amount) * 1 || "0.00"}
              </span>
            </div>

            {/* Deposit Button */}
            <div className="mt-8 flex justify-end">
              <TheButton
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-auto px-8"
              >
                Deposit
              </TheButton>
            </div>
          </>
        )}

        {activeTab === "withdraw" && (
          <div className="text-secondary py-8 text-center">
            Withdraw functionality coming soon
          </div>
        )}
      </div>
    </div>
  );
};
