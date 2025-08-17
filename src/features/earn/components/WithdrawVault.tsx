"use client";

import { useState } from "react";
import { useUserContext } from "@/contexts/UserContext";
import { CopyAndPasteButton, TheButton } from "@/shared/components";
import { network } from "@/shared/lib/environmentVars";
import { TokenAmountInput } from "@/features/swap/TokenAmountInput";
import { useVaultInfo } from "@/features/earn/hooks/useVaultInfo";

export const WithdrawVault = ({ vaultAddress }: { vaultAddress: string }) => {
  const [amount, setAmount] = useState("0");
  const { address } = useUserContext();
  const { vaultInfo } = useVaultInfo({ vaultId: vaultAddress });

  const handleWithdraw = async () => {
    await fetch("/api/earn/withdraw", {
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

  return (
    <section className="w-full space-y-6">
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center">
        {/* Vault Address Field */}
        <div className="flex flex-col gap-2 lg:flex-1">
          <label className="text-secondary text-sm font-medium">
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
              className="absolute top-1/2 right-3 -translate-y-1/2 bg-transparent"
            />
          </div>
          <p className="text-secondary text-xs">
            Total value locked: $14,140.67
          </p>
        </div>

        {/* Amount to Withdraw */}
        <div className="flex flex-col gap-2 lg:flex-1">
          <label className="text-secondary text-sm font-medium">
            Amount to withdraw
          </label>
          <TokenAmountInput
            token={vaultInfo?.assets[0]}
            amount={amount}
            setAmount={(v) => setAmount(v ?? "0")}
            isLoading={false}
            className="bg-surface-alt border-surface-alt text-primary hide-number-spin focus:border-primary focus:ring-primary w-full rounded-lg border p-3 text-2xl font-bold outline-none focus:ring-1"
          />

          <p id="amount-value" className="text-secondary text-xs">
            ${parseFloat(amount) * 1 || "0.00"}
          </p>
        </div>

        {/* Withdraw Button */}
        <div className="flex">
          <TheButton
            onClick={handleWithdraw}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full text-white lg:w-auto lg:px-8"
            type="submit"
          >
            Withdraw
          </TheButton>
        </div>
      </div>
    </section>
  );
};
