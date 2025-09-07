"use client";

import { useVaultInfo } from "@/features/earn/hooks";
import { Info } from "lucide-react";
import { CopyAndPasteButton, TokenIcon } from "@/shared/components";
import { useTokensList } from "@/shared/hooks";
import { Tooltip } from "react-tooltip";

const AboutVaultLoading = () => {
  return (
    <section className="w-full space-y-6">
      <header className="w-full space-y-4">
        <div className="h-7 w-40 animate-pulse rounded bg-gray-300" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Assets Card Skeleton */}
          <article className="bg-surface-alt border-surface-alt rounded-lg border p-4">
            <header className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-12 animate-pulse rounded bg-gray-300" />
                <div className="h-4 w-4 animate-pulse rounded bg-gray-300" />
              </div>
            </header>
            <div className="space-y-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-pulse rounded-full bg-gray-300" />
                  <div className="flex flex-col gap-1">
                    <div className="h-4 w-8 animate-pulse rounded bg-gray-300" />
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-300" />
                  </div>
                </div>
                <div className="ml-8 space-y-1">
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-300" />
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="h-3 w-12 animate-pulse rounded bg-gray-300" />
                      <div className="h-3 w-16 animate-pulse rounded bg-gray-300" />
                    </div>
                    <div className="h-5 w-12 animate-pulse rounded-full bg-gray-300" />
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Fee Structure Card Skeleton */}
          <article className="bg-surface-alt border-surface-alt rounded-lg border p-4">
            <header className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-300" />
                <div className="h-4 w-4 animate-pulse rounded bg-gray-300" />
              </div>
            </header>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-300" />
                  <div className="h-4 w-8 animate-pulse rounded bg-gray-300" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-12 animate-pulse rounded bg-gray-300" />
                  <div className="h-4 w-8 animate-pulse rounded bg-gray-300" />
                </div>
              </div>
            </div>
          </article>

          {/* Roles Card Skeleton */}
          <article className="bg-surface-alt border-surface-alt rounded-lg border p-4 md:col-span-2 lg:col-span-1">
            <header className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-10 animate-pulse rounded bg-gray-300" />
                <div className="h-4 w-4 animate-pulse rounded bg-gray-300" />
              </div>
            </header>
            <div className="space-y-2">
              <div className="space-y-2">
                <div className="flex flex-col space-y-1">
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-gray-300" />
                    <div className="h-4 w-4 animate-pulse rounded bg-gray-300" />
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="h-4 w-14 animate-pulse rounded bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-28 animate-pulse rounded bg-gray-300" />
                    <div className="h-4 w-4 animate-pulse rounded bg-gray-300" />
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </header>
    </section>
  );
};

export const AboutVault = ({ vaultAddress }: { vaultAddress: string }) => {
  const { tokenMap } = useTokensList();
  const {
    vaultInfo,
    isLoading: isVaultInfoLoading,
    isError,
  } = useVaultInfo({ vaultId: vaultAddress });

  if (isVaultInfoLoading) {
    return <AboutVaultLoading />;
  }

  if (!isVaultInfoLoading && (!vaultInfo || isError)) {
    return (
      <div className="text-secondary flex min-h-[110px] items-center justify-center text-center">
        Vault not found
      </div>
    );
  }

  return (
    <section className="w-full space-y-6">
      <header className="w-full space-y-4">
        <h2 className="text-primary text-lg font-semibold">
          Vault Information
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article className="bg-surface-alt border-surface-alt rounded-lg border p-4">
            <header className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-secondary text-sm font-medium">Assets</h3>
                <Info
                  size={14}
                  className="text-secondary"
                  data-tooltip-id="assets-tooltip"
                  aria-label="Asset information"
                />
                <Tooltip id="assets-tooltip">
                  <div className="flex max-w-[350px] flex-col gap-2 text-sm text-white">
                    <p>The assets that are deposited into the vault.</p>
                  </div>
                </Tooltip>
              </div>
            </header>
            <div className="space-y-2">
              {vaultInfo?.assets?.length && vaultInfo.assets.length > 0 ? (
                <ul className="space-y-2">
                  {vaultInfo.assets.map((asset, index) => (
                    <li key={index} className="space-y-2">
                      <div className="flex items-center gap-3 py-2">
                        <TokenIcon
                          src={tokenMap[asset.address]?.icon}
                          name={asset.symbol}
                          code={asset.symbol}
                          size={24}
                        />
                        <div className="flex flex-col">
                          <p className="text-primary text-sm font-medium">
                            {asset.symbol}
                          </p>
                          <p className="text-secondary truncate font-mono text-xs">
                            {asset.address.slice(0, 8)}...
                            {asset.address.slice(-6)}
                          </p>
                        </div>
                      </div>
                      {asset.strategies && asset.strategies.length > 0 && (
                        <div className="ml-8 space-y-1">
                          <p className="text-secondary text-xs font-medium">
                            Strategies:
                          </p>
                          <ul className="space-y-1">
                            {asset.strategies.map((strategy, strategyIndex) => (
                              <li
                                key={strategyIndex}
                                className="flex items-center justify-between"
                              >
                                <div className="flex flex-col">
                                  <p className="text-primary text-xs font-medium">
                                    {strategy.name}
                                  </p>
                                  <p className="text-secondary font-mono text-xs">
                                    {strategy.address.slice(0, 8)}...
                                    {strategy.address.slice(-6)}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                                    strategy.paused
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  }`}
                                  role="status"
                                  aria-label={`Strategy status: ${strategy.paused ? "Paused" : "Active"}`}
                                >
                                  {strategy.paused ? "Paused" : "Active"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-secondary text-sm">No assets available</p>
              )}
            </div>
          </article>

          <article className="bg-surface-alt border-surface-alt rounded-lg border p-4">
            <header className="space-y-3">
              <div className="flex items-center gap-3 py-2">
                <h3 className="text-secondary text-sm font-medium">
                  Fee Structure
                </h3>
                <Info
                  size={14}
                  className="text-secondary"
                  data-tooltip-id="fee-structure-tooltip"
                  aria-label="Fee structure information"
                />
                <Tooltip id="fee-structure-tooltip">
                  <div className="flex max-w-[350px] flex-col gap-2 text-sm text-white">
                    <p>The fee structure of the vault.</p>
                  </div>
                </Tooltip>
              </div>
            </header>
            <div className="space-y-2">
              {vaultInfo?.feesBps ? (
                <dl className="space-y-1">
                  {typeof vaultInfo?.feesBps === "object" ? (
                    Object.entries(vaultInfo.feesBps).map(
                      ([feeType, feeValue]) => (
                        <div
                          key={feeType}
                          className="flex items-center justify-between"
                        >
                          <dt className="text-secondary text-xs capitalize">
                            {feeType.replace(/([A-Z])/g, " $1").trim()}
                          </dt>
                          <dd className="text-primary text-sm font-medium">
                            {typeof feeValue === "number" ? feeValue : "N/A"}{" "}
                            <abbr title="basis points">bps</abbr>
                          </dd>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="flex items-center justify-between">
                      <dt className="text-secondary text-xs">Fee (BPS)</dt>
                      <dd className="text-primary text-sm font-medium">
                        {vaultInfo.feesBps}{" "}
                        <abbr title="basis points">bps</abbr>
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-secondary text-sm">
                  No fee information available
                </p>
              )}
            </div>
          </article>

          <article className="bg-surface-alt border-surface-alt rounded-lg border p-4 md:col-span-2 lg:col-span-1">
            <header className="space-y-3">
              <div className="flex items-center gap-3 py-2">
                <h3 className="text-secondary text-sm font-medium">Roles</h3>
                <Info
                  size={14}
                  className="text-secondary"
                  data-tooltip-id="roles-tooltip"
                  aria-label="Roles information"
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
            </header>
            <div className="space-y-2">
              {vaultInfo?.roles ? (
                <dl className="space-y-2">
                  {Object.entries(vaultInfo?.roles).map(([role, address]) => (
                    <div key={role} className="flex flex-col space-y-1">
                      <dt className="text-primary text-sm font-medium capitalize">
                        {role.replace(/([A-Z])/g, " $1").trim()}
                      </dt>
                      <dd className="flex items-center gap-2">
                        <address className="text-secondary font-mono text-xs break-all not-italic">
                          {typeof address === "string"
                            ? `${address.slice(0, 12)}...${address.slice(-8)}`
                            : "N/A"}
                        </address>
                        <CopyAndPasteButton
                          textToCopy={address}
                          className="text-secondary bg-transparent font-mono text-xs break-all"
                          aria-label={`Copy ${role} address`}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-secondary text-sm">
                  No roles information available
                </p>
              )}
            </div>
          </article>
        </div>
      </header>
    </section>
  );
};
