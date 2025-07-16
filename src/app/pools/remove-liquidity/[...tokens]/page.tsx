/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Image from "next/image";
import { useState, useCallback, MouseEvent, useEffect } from "react";
import { TheButton, ConnectWallet } from "@/shared/components/buttons";
import { useUserContext } from "@/contexts";
import { PoolsSettingsModal } from "@/features/pools/components/PoolsSettingsModal";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { useUserPoolPositions } from "@/features/pools/hooks/useUserPoolPositions";
import { TokenIcon } from "@/shared/components";

export default function RemoveLiquidityPage() {
  const { address: userAddress } = useUserContext();
  const params = useParams();
  const router = useRouter();
  const { tokenMap } = useTokensList();

  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  const [liquidityPercentage, setLiquidityPercentage] = useState<number>(28);

  // Extract token addresses from URL parameters
  const tokenAddresses = params?.tokens as string[] | undefined;
  const tokenAAddress = tokenAddresses?.[0];
  const tokenBAddress = tokenAddresses?.[1];

  // Get user positions to find the specific pool
  const { positions: userPositions, isLoading: positionsLoading } =
    useUserPoolPositions(userAddress);

  // Find the specific pool position for these tokens
  const poolPosition = userPositions?.find(
    (position) =>
      position.poolInfo.tokenA === tokenAAddress &&
      position.poolInfo.tokenB === tokenBAddress,
  );

  // Get token info
  const tokenA = tokenMap[tokenAAddress || ""];
  const tokenB = tokenMap[tokenBAddress || ""];

  // Calculate amounts based on percentage
  const calculateAmounts = useCallback(() => {
    if (!poolPosition) return { amountA: "0", amountB: "0" };

    const percentage = liquidityPercentage / 100;
    const userPosition =
      typeof poolPosition.userPosition === "bigint"
        ? Number(poolPosition.userPosition)
        : parseFloat(String(poolPosition.userPosition || "0"));
    const totalPosition = userPosition * percentage;

    // For demo purposes, using fixed ratios - in real implementation this would come from pool data
    const ratio = 2.6082806; // 1 XLM = 2.6082806 EURC (from the image)

    const amountA = (totalPosition / (1 + ratio)).toFixed(7);
    const amountB = (totalPosition - parseFloat(amountA)).toFixed(7);

    return { amountA, amountB };
  }, [poolPosition, liquidityPercentage]);

  const { amountA, amountB } = calculateAmounts();

  const handlePercentageChange = (percentage: number) => {
    setLiquidityPercentage(percentage);
  };

  const handleRemoveLiquidity = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      // TODO: Implement remove liquidity logic
      console.log("Remove liquidity:", {
        liquidityPercentage,
        amountA,
        amountB,
      });
    },
    [liquidityPercentage, amountA, amountB],
  );

  // Update URL when tokens change
  useEffect(() => {
    if (tokenAAddress && tokenBAddress) {
      const newUrl = `/pools/remove-liquidity/${tokenAAddress}/${tokenBAddress}`;
      router.replace(newUrl);
    }
  }, [tokenAAddress, tokenBAddress, router]);

  if (!userAddress) {
    return (
      <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
        <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
          <ConnectWallet className="flex w-full justify-center" />
        </div>
      </main>
    );
  }

  if (positionsLoading) {
    return (
      <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
        <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
          <div className="skeleton h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!poolPosition) {
    return (
      <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
        <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
          <div className="text-center text-white">
            <p>No liquidity position found for this pool.</p>
            <Link href="/pools" className="text-[#8866DD] hover:underline">
              Back to Pools
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Link href="/pools">
            <ArrowLeft />
          </Link>
          <p className="text-xl text-white sm:text-2xl">Remove Liquidity</p>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="cursor-pointer rounded-full p-1 hover:bg-[#8866DD]/20"
          >
            <Image
              src="/settingsIcon.svg"
              alt="Settings"
              width={38}
              height={38}
            />
          </button>
        </div>

        {/* Liquidity Percentage Slider */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-semibold text-white">
              Liquidity Percentage
            </span>
            <span className="text-lg font-semibold text-white">
              {liquidityPercentage}%
            </span>
          </div>

          {/* Slider */}
          <div className="relative mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={liquidityPercentage}
              onChange={(e) => setLiquidityPercentage(Number(e.target.value))}
              className="slider h-2 w-full appearance-none rounded-lg bg-[#23243A] outline-none"
              style={{
                background: `linear-gradient(to right, #8866DD 0%, #8866DD ${liquidityPercentage}%, #23243A ${liquidityPercentage}%, #23243A 100%)`,
              }}
            />
          </div>

          {/* Quick select buttons */}
          <div className="flex justify-between">
            {[25, 50, 75, 100].map((percentage) => (
              <button
                key={percentage}
                onClick={() => handlePercentageChange(percentage)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  liquidityPercentage === percentage
                    ? "bg-[#8866DD] text-white"
                    : "bg-[#23243A] text-[#A0A3C4] hover:bg-[#8866DD]/20"
                }`}
              >
                {percentage}%
              </button>
            ))}
          </div>
        </div>

        {/* Receive Section */}
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Receive</h3>
          <div className="rounded-lg border border-[#23243A] bg-[#10121A]/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenIcon
                  src={tokenA?.icon}
                  alt={tokenA?.code || "Token A"}
                  className="h-8 w-8 rounded-full"
                />
                <span className="font-medium text-white">
                  {tokenA?.code || "XLM"} {amountA}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenIcon
                  src={tokenB?.icon}
                  alt={tokenB?.code || "Token B"}
                  className="h-8 w-8 rounded-full"
                />
                <span className="font-medium text-white">
                  {tokenB?.code || "EURC"} {amountB}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Slippage Tolerance */}
        <div className="mb-6">
          <span className="text-sm text-[#A0A3C4]">Slippage Tolerance 1%</span>
        </div>

        {/* Remove Button */}
        <div className="flex flex-col gap-2">
          <TheButton
            disabled={liquidityPercentage === 0}
            onClick={handleRemoveLiquidity}
            className="btn relative h-14 w-full rounded-2xl bg-[#8866DD] p-4 text-[20px] font-bold hover:bg-[#8866DD]/80"
          >
            Remove
          </TheButton>
        </div>

        {isSettingsModalOpen && (
          <PoolsSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
