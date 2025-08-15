"use client";

import { useState } from "react";
import { useVaultInfo } from "@/features/earn/hooks";
import { parseUnits } from "@/shared/lib/utils";
import { useUserContext } from "@/contexts/UserContext";
import { ArrowRight } from "lucide-react";
import { TheButton } from "@/shared/components";
import { network } from "@/shared/lib/environmentVars";

export const DepositVault = ({ vaultAddress }: { vaultAddress: string }) => {
  const { vaultInfo } = useVaultInfo({ vaultId: vaultAddress });
  const { address } = useUserContext();
  const [amount, setAmount] = useState("0");

  const handleDeposit = async () => {
    await fetch("/api/earn/deposit", {
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

  return (
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
          <label className="text-secondary text-sm font-medium">To vault</label>
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
  );
};
