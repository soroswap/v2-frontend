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

export function RozoProvider({ children }: { children: ReactNode }) {
  const { kit } = useUserContext();
  const { resolvedTheme } = useTheme();

  // Defer config construction to client render — module-scope createConfig
  // runs during SSR and some wallet connectors touch window/localStorage.
  const [config] = useState(() =>
    createRozoWagmiConfig(
      getDefaultConfig({
        appName: "Soroswap",
        appIcon: "https://app.soroswap.finance/SoroswapPurpleBlack.svg",
        appUrl: "https://app.soroswap.finance/",
        ssr: true,
      }),
    ),
  );
  const [queryClient] = useState(() => new QueryClient());

  // Defer rendering RozoPayProvider until after the current render cycle to
  // avoid setState calls during render in nested components.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const mode = resolvedTheme === "dark" ? "dark" : "light";

  // Wait until ready and kit available
  if (!ready || !kit) return <BridgeLoader />;

  return (
    <RozoWagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RozoPayProvider
          stellarKit={kit}
          stellarWalletPersistence={false}
          mode={mode}
          debugMode
        >
          {children}
        </RozoPayProvider>
      </QueryClientProvider>
    </RozoWagmiProvider>
  );
}
