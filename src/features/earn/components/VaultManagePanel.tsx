"use client";

import { ReactNode, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CopyAndPasteButton, TheButton } from "@/shared/components";
import { Tab } from "@/features/earn/components/Tab";
import { useUserContext } from "@/contexts";
import { network } from "@/shared/lib/environmentVars";
import { useVaultInfo } from "../hooks";
import { parseUnits } from "@/shared/lib/utils";

type activeTab = "deposit" | "withdraw";

export const VaultManagePanel = ({
  vaultAddress,
}: {
  vaultAddress: string;
}) => {
  const [activeTab, setActiveTab] = useState<activeTab>("deposit");
  const [amount, setAmount] = useState("0");
  const { address } = useUserContext();
  const { vaultInfo } = useVaultInfo({
    vaultId: vaultAddress,
  });

  const handleDeposit = async () => {
    const response = await fetch("/api/earn/deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        amount: parseUnits({
          value: amount,
          decimals: 7,
        }).toString(),
        caller: address ?? "",
        slippageBps: "100",
        vaultId: vaultAddress,
        network: network,
      },
    });
  };

  const handleWithdraw = async () => {
    const response = await fetch("/api/earn/withdraw", {
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

  const renderTab: Record<activeTab, ReactNode> = {
    deposit: (
      <section className="w-full space-y-6">
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center">
          {/* From wallet */}
          <div className="flex flex-col gap-2 lg:flex-1">
            <label className="text-secondary text-sm font-medium">
              From wallet
            </label>
            <div className="bg-surface-alt border-surface-alt rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  S$
                </div>
                <span className="text-primary text-sm font-medium">
                  {vaultInfo?.assets[0].symbol}
                </span>
              </div>
            </div>
            <span className="text-secondary text-xs">
              You have - {vaultInfo?.assets[0].symbol}
            </span>
          </div>

          {/* Amount */}
          <div className="flex h-full w-full flex-col gap-2 lg:flex-1">
            <label className="text-secondary text-sm font-medium">Amount</label>
            <div className="flex w-full gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="bg-surface-alt border-surface-alt text-primary hide-number-spin focus:border-primary focus:ring-primary w-full rounded-lg border p-3 text-2xl font-bold outline-none focus:ring-1"
              />
            </div>
            <span className="text-secondary text-xs">
              ${parseFloat(amount) * 1 || "0.00"}
            </span>
          </div>

          {/* Arrow - Hidden on mobile */}
          <div className="hidden items-center justify-center lg:flex">
            <ArrowRight className="text-secondary size-6" />
          </div>

          {/* To vault */}
          <div className="flex flex-col gap-2 lg:flex-1">
            <label className="text-secondary text-sm font-medium">
              To vault
            </label>
            <div className="bg-surface-alt border-surface-alt rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-gray-500 text-xs font-bold text-white">
                  a
                </div>
                <span className="text-primary text-sm font-medium">
                  {vaultInfo?.assets[0].symbol}
                </span>
              </div>
            </div>
            <span className="text-secondary text-xs">-%</span>
          </div>
        </div>

        {/* Deposit Button */}
        <div className="pt-4">
          <TheButton
            onClick={handleDeposit}
            disabled={!address || !amount || parseFloat(amount) <= 0}
            className="w-full lg:w-auto lg:px-8"
          >
            {!address ? "Connect Wallet" : "Deposit"}
          </TheButton>
        </div>
      </section>
    ),
    withdraw: (
      <section className="w-full space-y-6">
        <div className="flex w-full flex-col gap-6 md:flex-row md:items-start">
          {/* Vault Address Field */}
          <div className="flex flex-col gap-2 md:flex-1">
            <label
              htmlFor="vault-address"
              className="text-secondary block text-sm font-medium"
            >
              Vault address
            </label>
            <div className="relative">
              <input
                id="vault-address"
                type="text"
                value={vaultAddress}
                disabled
                className="bg-surface-alt border-surface-alt text-primary w-full rounded-lg border p-3 pr-10 font-mono text-sm opacity-60"
                aria-label="Vault address (read-only)"
              />
              <CopyAndPasteButton
                textToCopy={vaultAddress}
                className="absolute top-1/2 right-3 -translate-y-1/2"
              />
            </div>
            <p className="text-secondary text-xs">
              Total value locked: $14,140.67
            </p>
          </div>

          {/* Amount to Withdraw */}
          <div className="flex flex-col gap-2 md:flex-1">
            <label
              htmlFor="withdraw-amount"
              className="text-secondary block text-sm font-medium"
            >
              Amount to withdraw
            </label>
            <div className="space-y-2">
              <input
                id="withdraw-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-surface-alt border-surface-alt text-primary hide-number-spin focus:border-primary focus:ring-primary w-full rounded-lg border p-4 text-2xl font-bold outline-none focus:ring-1"
                placeholder="0"
                min="0"
                step="any"
                aria-describedby="amount-value"
              />
              <p id="amount-value" className="text-secondary text-xs">
                ${parseFloat(amount) * 1 || "0.00"}
              </p>
            </div>
          </div>

          {/* Withdraw Button */}
          <div className="flex items-end md:w-auto">
            <TheButton
              onClick={handleWithdraw}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full px-8 md:w-auto"
              type="submit"
            >
              Withdraw
            </TheButton>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="bg-surface border-surface-alt mt-8 flex-1 rounded-2xl border p-4 shadow-lg md:p-8">
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
