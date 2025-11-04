"use client";

import { useUserContext } from "@/contexts";
import {
  createRozoWagmiConfig,
  getDefaultConfig,
  RozoPayProvider,
  RozoWagmiProvider,
} from "@rozoai/intent-pay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { BridgeLoader } from "../components/BridgeLoader";

export const wagmiConfig = createRozoWagmiConfig(
  getDefaultConfig({
    appName: "Soroswap",
    appIcon: "https://app.soroswap.finance/SoroswapPurpleBlack.svg",
    appUrl: "https://app.soroswap.finance/",
  }),
);

const queryClient = new QueryClient();

export function RozoProvider({ children }: { children: ReactNode }) {
  const { kit } = useUserContext();
  const { resolvedTheme } = useTheme();

  // Avoid rendering provider while mounting to prevent setState during render in nested components
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [stableMode, setStableMode] = useState<"dark" | "light">("light");

  useEffect(() => {
    setMounted(true);
    // Delay rendering RozoPayProvider until after the current render cycle
    // This prevents setState calls during render in nested components
    const timer = setTimeout(() => {
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Update mode only after mount to avoid triggering re-renders during initial render
  useEffect(() => {
    if (mounted && resolvedTheme) {
      setStableMode(resolvedTheme === "dark" ? "dark" : "light");
    }
  }, [mounted, resolvedTheme]);

  // Wait until mounted, ready, and kit available
  if (!mounted || !ready || !kit) return <BridgeLoader />;

  return (
    <RozoWagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RozoPayProvider
          stellarKit={kit}
          stellarWalletPersistence={false}
          mode={stableMode}
        >
          {children}
        </RozoPayProvider>
      </QueryClientProvider>
    </RozoWagmiProvider>
  );
}
