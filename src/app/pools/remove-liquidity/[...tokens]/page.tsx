"use client";

import Link from "next/link";
import { useState, useCallback, MouseEvent, useEffect } from "react";
import {
  TheButton,
  ConnectWallet,
  SettingsButton,
} from "@/shared/components/buttons";
import { useUserContext } from "@/contexts";
import { PoolsSettingsModal } from "@/features/pools/components/PoolsSettingsModal";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { useUserPoolPositions } from "@/features/pools/hooks/useUserPoolPositions";
import { TokenIcon } from "@/shared/components";
import { usePoolsController } from "@/features/pools/hooks/usePoolsController";
import {
  PoolError,
  PoolResult,
  PoolStep,
} from "@/features/pools/hooks/usePool";
import { PoolModal } from "@/features/pools/components/PoolModal";

// TODO: When the token data is [ ] u can type wathever u want
// TODO: Flickering
// TODO: http://localhost:3000/pools/add-liquidity --> Replace to http://localhost:3000/pools/add-liquidity/[tokenA]
export default function RemoveLiquidityPage() {
  const { address: userAddress } = useUserContext();
  const params = useParams();
  const router = useRouter();
  const { tokenMap } = useTokensList();

  const [isPoolModalOpen, setIsPoolModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  const [liquidityPercentage, setLiquidityPercentage] = useState<number>(28);
  const [removeLiquidityResult, setRemoveLiquidityResult] =
    useState<PoolResult | null>(null);
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
  const { handleRemoveLiquidity, isSwapLoading, currentStep, resetSwap } =
    usePoolsController({
      initialTokenAAddress: tokenAAddress,
      initialTokenBAddress: tokenBAddress,
      onSuccess: (result: PoolResult) => {
        console.log("Remove liquidity success", result);
        setRemoveLiquidityResult(result);
        setIsPoolModalOpen(true);
      },
      onError: (error: PoolError) => {
        console.error("Remove liquidity failed:", error);
      },
      onStepChange: (step: PoolStep) => {
        if (step === PoolStep.WAITING_SIGNATURE) {
          setIsPoolModalOpen(true);
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
        <div className="border-brand bg-surface w-full max-w-[480px] rounded-2xl border p-4 shadow-xl sm:p-8">
          {/* Header Skeleton */}
          <div className="mb-4 flex items-center justify-between">
            <div className="skeleton size-6 rounded-full" />
            <div className="skeleton h-8 w-40 rounded-lg" />
            <div className="skeleton size-6 rounded-full" />
          </div>

          {/* Liquidity Percentage Slider Skeleton */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="skeleton h-6 w-32 rounded-lg" />
              <div className="skeleton h-6 w-12 rounded-lg" />
            </div>

            {/* Slider Skeleton */}
            <div className="relative mb-4">
              <div className="skeleton h-2 w-full rounded-lg" />
            </div>

            {/* Quick select buttons Skeleton */}
            <div className="flex justify-between">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-8 w-12 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Receive Section Skeleton */}
          <div className="mb-6">
            <div className="skeleton mb-3 h-6 w-16 rounded-lg" />
            <div className="bg-surface-subtle border-surface-alt rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="skeleton size-8 rounded-full" />
                  <div className="skeleton h-5 w-24 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="skeleton size-8 rounded-full" />
                  <div className="skeleton h-5 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Slippage Tolerance Skeleton */}
          <div className="mb-6">
            <div className="skeleton h-4 w-32 rounded-lg" />
          </div>

          {/* Button Skeleton */}
          <div className="flex flex-col gap-2">
            <div className="skeleton h-14 w-full rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
      <div className="border-brand bg-surface w-full max-w-[480px] rounded-2xl border p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Link href="/pools">
            <ArrowLeft className="text-primary" />
          </Link>
          <p className="text-primary text-xl sm:text-2xl">Remove Liquidity</p>
          <SettingsButton onClick={() => setIsSettingsModalOpen(true)} />
        </div>

        {/* Liquidity Percentage Slider */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-primary text-lg font-semibold">
              Liquidity Percentage
            </p>
            <p className="text-primary text-lg font-semibold">
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
              className="slider bg-surface-alt h-2 w-full appearance-none rounded-lg outline-none"
              style={{
                background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${liquidityPercentage}%, var(--color-surface-alt) ${liquidityPercentage}%, var(--color-surface-alt) 100%)`,
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
                    ? "bg-brand text-primary"
                    : "bg-surface-alt text-secondary hover:bg-brand/20"
                }`}
              >
                {percentage}%
              </button>
            ))}
          </div>
        </div>

        {/* Receive Section */}
        <div className="mb-6">
          <h3 className="text-primary mb-3 text-lg font-semibold">Receive</h3>
          <div className="bg-surface-subtle border-surface-alt rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenIcon
                  src={tokenA?.icon}
                  alt={tokenA?.code || "Token A"}
                  className="size-8 rounded-full"
                />
                <span className="text-primary font-medium">
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
                <span className="text-primary font-medium">
                  {tokenB?.code || ""} {amountB}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Slippage Tolerance */}
        <div className="mb-6">
          <span className="text-secondary text-sm">Slippage Tolerance 1%</span>
        </div>

        {/* Remove Button */}
        <div className="flex flex-col gap-2">
          {userAddress && poolPosition ? (
            <TheButton
              disabled={liquidityPercentage === 0 || isSwapLoading}
              onClick={handleRemoveLiquidityClick}
              className="bg-brand hover:bg-brand/80 text-primary disabled:bg-surface-alt relative flex h-14 w-full items-center justify-center rounded-2xl p-4 text-[20px] font-bold disabled:cursor-default disabled:text-[#6d7179] dark:disabled:bg-[#2e303b]"
            >
              {isSwapLoading ? "Removing..." : "Remove"}
            </TheButton>
          ) : (
            <ConnectWallet className="flex w-full justify-center" />
          )}
        </div>

        {isPoolModalOpen && (
          <PoolModal
            currentStep={currentStep}
            onClose={() => {
              setIsPoolModalOpen(false);
              setRemoveLiquidityResult(null);
              resetSwap();
            }}
            transactionHash={removeLiquidityResult?.txHash}
            operationType="remove"
          />
        )}

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
