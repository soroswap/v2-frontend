"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, MouseEvent, useEffect } from "react";
import { TheButton, ConnectWallet } from "@/shared/components/buttons";
import { useUserContext } from "@/contexts";
import { PoolsSettingsModal } from "@/features/pools/components/PoolsSettingsModal";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { useUserPoolPositions } from "@/features/pools/hooks/useUserPoolPositions";
import { TokenIcon } from "@/shared/components";
import { usePoolsController } from "@/features/pools/hooks/usePoolsController";
import { PoolError, PoolStep } from "@/features/pools/hooks/usePool";

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

  // Use the pools controller for remove liquidity functionality
  const { handleRemoveLiquidity, isSwapLoading } = usePoolsController({
    initialTokenAAddress: tokenAAddress,
    initialTokenBAddress: tokenBAddress,
    onSuccess: () => {
      console.log("Remove liquidity success");
      setIsSettingsModalOpen(true);
    },
    onError: (error: PoolError) => {
      console.error("Remove liquidity failed:", error);
    },
    onStepChange: (step: PoolStep) => {
      if (step === PoolStep.WAITING_SIGNATURE) {
        setIsSettingsModalOpen(true);
      }
    },
  });

  const calculateAmounts = useCallback(() => {
    if (!poolPosition) return { amountA: "0", amountB: "0" };

    const percent = liquidityPercentage;

    if (isNaN(percent)) {
      return { amountA: "0", amountB: "0" };
    }

    const getNewCurrencyValue = (tokenAddress: string) => {
      // Get user's liquidity balance em formato decimal
      const userBalance =
        typeof poolPosition.userPosition === "bigint"
          ? Number(poolPosition.userPosition) / 10000000 // Converter de stroops para unidade
          : parseFloat(String(poolPosition.userPosition || "0")) / 10000000;

      if (userBalance === 0) {
        return "0";
      }

      // Get pool info
      const poolInfo = poolPosition.poolInfo;

      // Get total reserves in decimal format
      const reserveA =
        typeof poolInfo.reserveA === "bigint"
          ? Number(poolInfo.reserveA) / 10000000
          : parseFloat(String(poolInfo.reserveA || "0")) / 10000000;

      const reserveB =
        typeof poolInfo.reserveB === "bigint"
          ? Number(poolInfo.reserveB) / 10000000
          : parseFloat(String(poolInfo.reserveB || "0")) / 10000000;

      // Total LP Supply hardcoded for now
      const totalSupply = 4650140128520; // TODO REMOVE HARDCODED
      const totalLP = totalSupply / 10000000; // Convert to decimal = 465014.012852

      // Calculate how much the user can receive of each token based on their participation
      // Share = userBalance / totalLP
      // UserTokenAmount = (userBalance / totalLP) * reserveTotal
      const userMaxTokenA = (userBalance / totalLP) * reserveA; // ≈ 1.8218855 XLM
      const userMaxTokenB = (userBalance / totalLP) * reserveB; // ≈ 0.7260629 EURC

      // Apply the selected percentage
      const userTokenAmount =
        tokenAddress === poolInfo.tokenA
          ? userMaxTokenA * (percent / 100)
          : userMaxTokenB * (percent / 100);

      return userTokenAmount.toFixed(7);
    };

    const amountA = getNewCurrencyValue(tokenAAddress || "");
    const amountB = getNewCurrencyValue(tokenBAddress || "");

    return { amountA, amountB };
  }, [poolPosition, liquidityPercentage, tokenAAddress, tokenBAddress]);

  const { amountA, amountB } = calculateAmounts();

  const handlePercentageChange = (percentage: number) => {
    setLiquidityPercentage(percentage);
  };

  const handleRemoveLiquidityClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      if (!poolPosition || liquidityPercentage === 0) return;

      // Calculate liquidity to burn
      const userBalance = Number(poolPosition.userPosition);
      const liquidityToBurn = Math.floor(
        (userBalance * liquidityPercentage) / 100,
      );

      // Convert amounts to stroops (multiply by 10^7)
      const amountAStroops = Math.floor(parseFloat(amountA) * 10000000);
      const amountBStroops = Math.floor(parseFloat(amountB) * 10000000);

      await handleRemoveLiquidity({
        liquidity: BigInt(liquidityToBurn),
        amountA: BigInt(amountAStroops),
        amountB: BigInt(amountBStroops),
      });
    },
    [
      liquidityPercentage,
      amountA,
      amountB,
      poolPosition,
      handleRemoveLiquidity,
    ],
  );

  // Update URL when tokens change
  useEffect(() => {
    if (tokenAAddress && tokenBAddress) {
      const newUrl = `/pools/remove-liquidity/${tokenAAddress}/${tokenBAddress}`;
      router.replace(newUrl);
    }
  }, [tokenAAddress, tokenBAddress, router]);

  if (positionsLoading) {
    return (
      <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
        <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
          <div className="skeleton h-64 w-full" />
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
            <p className="text-lg font-semibold text-white">
              Liquidity Percentage
            </p>
            <p className="text-lg font-semibold text-white">
              {liquidityPercentage}%
            </p>
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
                className={`cursor-pointer rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
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
                  className="size-8 rounded-full"
                />
                <span className="font-medium text-white">
                  {tokenA?.code || ""} {amountA}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenIcon
                  src={tokenB?.icon}
                  alt={tokenB?.code || "Token B"}
                  className="size-8 rounded-full"
                />
                <span className="font-medium text-white">
                  {tokenB?.code || ""} {amountB}
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
          {userAddress && poolPosition ? (
            <TheButton
              disabled={liquidityPercentage === 0 || isSwapLoading}
              onClick={handleRemoveLiquidityClick}
              className="btn relative h-14 w-full rounded-2xl bg-[#8866DD] p-4 text-[20px] font-bold hover:bg-[#8866DD]/80"
            >
              {isSwapLoading ? "Removing..." : "Remove"}
            </TheButton>
          ) : (
            <ConnectWallet className="flex w-full justify-center" />
          )}
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
