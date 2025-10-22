"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

export const BridgeFooter = () => {
  const { resolvedTheme } = useTheme();

  const rozoLogo = useMemo(() => {
    return resolvedTheme === "dark"
      ? "https://bridge.rozo.ai/rozo-white-transparent.png"
      : "https://bridge.rozo.ai/rozo-transparent.png";
  }, [resolvedTheme]);

  return (
    <div className="container mx-auto mt-auto w-full">
      <div className="flex flex-col items-center gap-4 py-6 md:flex-row md:justify-between">
        <div className="flex flex-row items-center gap-4">
          <div className="flex">
            <a
              href="https://x.com/i/broadcasts/1djGXWBqdVdKZ"
              target="_blank"
              rel="noopener noreferrer"
              title="Stellar Community Fund"
              className="group relative"
            >
              <Image
                src="https://bridge.rozo.ai/scf.svg"
                alt="Stellar"
                width={20}
                height={20}
                className="h-[20px] w-auto transition-opacity group-hover:opacity-80"
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Stellar Community Fund
              </div>
            </a>
          </div>
          <div className="flex">
            <a
              href="https://www.coinbase.com/developer-platform/discover/launches/summer-builder-grants"
              target="_blank"
              rel="noopener noreferrer"
              title="Base - Coinbase's L2 Network"
              className="group relative"
            >
              <Image
                src="https://bridge.rozo.ai/base.svg"
                alt="Base"
                width={20}
                height={20}
                className="h-[20px] w-auto transition-opacity group-hover:opacity-80"
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Base - Coinbase&apos;s L2 Network
              </div>
            </a>
          </div>
          <div className="flex">
            <a
              href="https://x.com/draper_u/status/1940908242412183926"
              target="_blank"
              rel="noopener noreferrer"
              title="Draper University - Entrepreneurship Program"
              className="group relative"
            >
              <Image
                src="https://bridge.rozo.ai/draper.webp"
                alt="Draper University"
                width={20}
                height={20}
                className="h-[20px] w-auto transition-opacity group-hover:opacity-80"
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Draper University - Entrepreneurship Program
              </div>
            </a>
          </div>
          <div className="flex">
            <a
              href="https://partners.circle.com/partner/rozo"
              target="_blank"
              rel="noopener noreferrer"
              title="Circle - USDC Issuer & Partner"
              className="group relative"
            >
              <Image
                src="https://bridge.rozo.ai/circle.svg"
                alt="Circle"
                width={20}
                height={20}
                className="h-[20px] w-auto transition-opacity group-hover:opacity-80"
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Circle - USDC Issuer & Partner
              </div>
            </a>
          </div>

          <Link
            href="https://bridge.rozo.ai/faq"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary/80 text-xs transition-colors sm:text-base"
          >
            FAQs
          </Link>
          <a
            href="https://discord.com/invite/EfWejgTbuU"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary/80 transition-colors"
          >
            <svg
              className="h-[20px] w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
            </svg>
          </a>
          <a
            href="https://x.com/rozoai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary/80 transition-colors"
          >
            <svg
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
              ></path>
            </svg>
          </a>
          <Link
            href="https://bridge.rozo.ai/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary/80 text-xs transition-colors sm:text-base"
          >
            Terms of Service
          </Link>
        </div>

        <div className="bg-surface-subtle text-primary flex items-center gap-1 rounded px-2 py-1 text-xs font-medium">
          <span>Powered by</span>
          <div className="flex">
            <a
              href="https://rozo.ai"
              target="_blank"
              rel="noopener noreferrer"
              title="Rozo"
              className="flex items-center"
            >
              <Image
                src={rozoLogo}
                alt="Rozo"
                width={20}
                height={20}
                className="h-[20px] w-auto transition-opacity group-hover:opacity-80"
              />
              <span className="text-base font-bold">ROZO</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
