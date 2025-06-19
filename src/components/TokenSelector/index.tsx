/* eslint-disable @next/next/no-img-element */
"use client";

import { cn } from "@/lib/utils/cn";
import { useState } from "react";
import { useTokensList } from "@/hooks/useTokensList";
import { TokenList } from "@/components/TokenSelector/types/token";

export default function TokenSelector({
  token,
  placeholder,
  onSelect,
}: {
  token?: TokenList | null;
  placeholder?: string;
  onSelect?: (token: TokenList | null) => void;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { tokensList } = useTokensList();

  const handleSelectToken = (token: TokenList | null) => {
    onSelect?.(token);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex h-[43.5px] min-w-fit items-center gap-2 rounded-full border border-[#35374a] bg-[#23243a] px-1.5 py-1.5 text-xs font-bold whitespace-nowrap text-white hover:bg-[#23243a]/80 focus:outline-none sm:text-sm",
          token ? "sm:px-1.5" : "sm:px-4",
        )}
      >
        {token ? (
          <>
            <img
              src={token.icon}
              alt={`${token.name} logo`}
              width={29.5}
              height={29.5}
              className="rounded-full bg-white"
            />
            <span className="text-sm font-bold text-white">{token.code}</span>
          </>
        ) : (
          <span className="text-sm font-bold text-white">
            {placeholder ?? "Select token"}
          </span>
        )}
        {/* down‑chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="ml-1"
        >
          <polyline
            points="6 9 12 15 18 9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Sheet */}
          <div className="relative z-50 flex max-h-[70vh] w-full max-w-sm flex-col rounded-2xl border border-[#35374a] bg-[#181A25] p-4 sm:max-w-sm">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-medium text-white">
                Select a token
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-2xl leading-none text-white/70 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto overscroll-contain pr-1">
              {tokensList.map((token: TokenList) => (
                <button
                  key={token.contract}
                  onClick={() => handleSelectToken(token)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-[#23243a]"
                >
                  <img
                    src={token.icon}
                    alt={token.name}
                    width={28}
                    height={28}
                    className="rounded-full bg-white"
                  />
                  <span className="font-medium text-white">{token.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
