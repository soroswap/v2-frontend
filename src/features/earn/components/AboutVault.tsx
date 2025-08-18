"use client";

import { useState } from "react";
import { useVaultInfo } from "@/features/earn/hooks";
import { parseUnits } from "@/shared/lib/utils";
import { useUserContext } from "@/contexts/UserContext";
import { ArrowRight, Info } from "lucide-react";
import { CopyAndPasteButton, TheButton, TokenIcon } from "@/shared/components";
import { network } from "@/shared/lib/environmentVars";
import { useTokensList } from "@/shared/hooks";
import { TokenAmountInput } from "@/features/swap/TokenAmountInput";
import { Tooltip } from "react-tooltip";

export const AboutVault = ({ vaultAddress }: { vaultAddress: string }) => {
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
      <div className="w-full space-y-4">
        <h3 className="text-primary text-lg font-semibold">
          Vault Information
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-surface-alt border-surface-alt rounded-lg border p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-secondary text-sm font-medium">Assets</h4>
                <Info
                  size={14}
                  className="text-secondary"
                  data-tooltip-id="assets-tooltip"
                />
                <Tooltip id="assets-tooltip">
                  <div className="flex max-w-[350px] flex-col gap-2 text-sm text-white">
                    <p>The assets that are deposited into the vault.</p>
                  </div>
                </Tooltip>
              </div>
              <div className="space-y-2">
                {vaultInfo.assets?.map((asset, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <TokenIcon
                      src={tokenMap[asset.address]?.icon}
                      name={asset.symbol}
                      code={asset.symbol}
                      size={20}
                    />
                    <div className="flex flex-col">
                      <span className="text-primary text-sm font-medium">
                        {asset.symbol}
                      </span>
                      <span className="text-secondary truncate text-xs">
                        {asset.address.slice(0, 8)}...{asset.address.slice(-6)}
                      </span>
                    </div>
                  </div>
                )) || (
                  <div className="text-secondary text-sm">
                    No assets available
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface-alt border-surface-alt rounded-lg border p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-secondary text-sm font-medium">
                  Fee Structure
                </h4>
                <Info
                  size={14}
                  className="text-secondary"
                  data-tooltip-id="fee-structure-tooltip"
                />
                <Tooltip id="fee-structure-tooltip">
                  <div className="flex max-w-[350px] flex-col gap-2 text-sm text-white">
                    <p>The fee structure of the vault.</p>
                  </div>
                </Tooltip>
              </div>
              <div className="space-y-2">
                {vaultInfo.feesBps ? (
                  <div className="flex flex-col space-y-1">
                    {typeof vaultInfo.feesBps === "object" ? (
                      Object.entries(vaultInfo.feesBps).map(
                        ([feeType, feeValue]) => (
                          <div
                            key={feeType}
                            className="flex items-center justify-between"
                          >
                            <span className="text-secondary text-xs capitalize">
                              {feeType.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <span className="text-primary text-sm font-medium">
                              {typeof feeValue === "number" ? feeValue : "N/A"}{" "}
                              bps
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-secondary text-xs">
                          Fee (BPS)
                        </span>
                        <span className="text-primary text-sm font-medium">
                          {vaultInfo.feesBps} bps
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-secondary text-sm">
                    No fee information available
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface-alt border-surface-alt rounded-lg border p-4 md:col-span-2 lg:col-span-1">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-secondary text-sm font-medium">Roles</h4>
                <Info
                  size={14}
                  className="text-secondary"
                  data-tooltip-id="roles-tooltip"
                />
                <Tooltip id="roles-tooltip">
                  <div className="flex max-w-[350px] flex-col gap-2 text-sm text-white">
                    <p>
                      The roles of the vault are the roles that are assigned to
                      the vault.
                    </p>
                  </div>
                </Tooltip>
              </div>
              <div className="space-y-2">
                {vaultInfo.roles ? (
                  Object.entries(vaultInfo.roles).map(([role, address]) => (
                    <div key={role} className="flex flex-col space-y-1">
                      <span className="text-primary text-sm font-medium capitalize">
                        {role.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-secondary font-mono text-xs break-all">
                          {typeof address === "string"
                            ? `${address.slice(0, 12)}...${address.slice(-8)}`
                            : "N/A"}
                        </span>
                        <CopyAndPasteButton
                          textToCopy={address}
                          className="text-secondary bg-transparent font-mono text-xs break-all"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-secondary text-sm">
                    No roles information available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Vault Details */}
        <div className="bg-surface-alt border-surface-alt rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="flex flex-col space-y-1">
              <span className="text-secondary text-xs">Vault Name</span>
              <span className="text-primary text-sm font-medium">
                {vaultInfo.name}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-secondary text-xs">Symbol</span>
              <span className="text-primary text-sm font-medium">
                {vaultInfo.symbol}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-secondary text-xs">APY</span>
              <span className="text-primary text-sm font-medium">
                {vaultInfo.apy.toFixed(2)}%
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-secondary text-xs">Vault Address</span>
              <span className="text-primary font-mono text-xs">
                {vaultAddress.slice(0, 8)}...{vaultAddress.slice(-6)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
