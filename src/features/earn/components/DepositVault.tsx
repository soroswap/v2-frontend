"use client";

import { useState } from "react";
import { useVaultInfo } from "@/features/earn/hooks";
import { parseUnits } from "@/shared/lib/utils";
import { useUserContext } from "@/contexts/UserContext";
import { ArrowRight } from "lucide-react";
import { TheButton, TokenIcon } from "@/shared/components";
import { network, SOROSWAP } from "@/shared/lib/environmentVars";
import { useTokensList } from "@/shared/hooks";
import { TokenAmountInput } from "@/features/swap/TokenAmountInput";
import { defindexClient } from "@/shared/lib/server/defindexClient";

export const DepositVault = ({ vaultAddress }: { vaultAddress: string }) => {
  const { tokenMap } = useTokensList();
  const { vaultInfo } = useVaultInfo({ vaultId: vaultAddress });
  const { address, signTransaction } = useUserContext();
  const [amount, setAmount] = useState("0");

  const handleDeposit = async () => {
    const depositData = await fetch("/api/earn/deposit", {
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
    const depositDataJson = await depositData.json();
    console.log("depositData", depositDataJson);
    const xdr = depositDataJson.xdr;
    console.log("xdr", xdr);
    const txHash = await signTransaction(xdr, address ?? "");
    console.log("txHash", txHash);
    const sendTransactionResponse = await fetch("/api/earn/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(txHash),
    });
    const sendTransactionResponseJson = await sendTransactionResponse.json();
    console.log("sendTransactionResponse", sendTransactionResponseJson);
  };

  if (!vaultInfo) {
    return (
      <div className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center">
        <div className="text-secondary text-center">Vault not found</div>
      </div>
    );
  }

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
              <TokenIcon
                src={tokenMap[vaultInfo.assets[0].address]?.icon}
                name={vaultInfo.name}
                code={vaultInfo.assets[0].symbol}
                size={24}
              />
              <span className="text-primary text-sm font-medium">
                {vaultInfo.assets[0].symbol}
              </span>
            </div>
          </div>
          <span className="text-secondary text-xs">
            {/* TODO: Add balance from the user APi */}
            You have - {vaultInfo.assets[0].symbol}
          </span>
        </div>

        {/* Amount */}
        <div className="flex h-full w-full flex-col gap-2 lg:flex-1">
          <label className="text-secondary text-sm font-medium">Amount</label>
          <div className="flex w-full gap-2">
            <TokenAmountInput
              token={vaultInfo.assets[0]}
              amount={amount}
              setAmount={(v) => setAmount(v ?? "0")}
              isLoading={false}
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
              <TokenIcon
                src={tokenMap[vaultInfo.assets[0].address]?.icon}
                name={vaultInfo.name}
                code={vaultInfo.assets[0].symbol}
                size={24}
              />
              <span className="text-primary text-sm font-medium">
                {vaultInfo.assets[0].symbol}
              </span>
            </div>
          </div>
          <span className="text-secondary text-xs">
            APY {vaultInfo.apy.toFixed(2)}%
          </span>
        </div>

        {/* Deposit Button */}
        <div className="flex">
          <TheButton
            onClick={handleDeposit}
            disabled={!address || !amount || parseFloat(amount) <= 0}
            className="w-full text-white lg:w-auto lg:px-8"
          >
            {!address ? "Connect Wallet" : "Deposit"}
          </TheButton>
        </div>
      </div>
    </section>
  );
};
