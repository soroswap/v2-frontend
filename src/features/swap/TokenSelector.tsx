"use client";

import { cn } from "@/shared/lib/utils/cn";
import { useEffect, useState } from "react";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { TokenType } from "@/features/swap/types/token";
import { ChevronDown, XIcon } from "lucide-react";
import Image from "next/image";

export const TokenSelector = ({
  currentToken,
  oppositeToken,
  placeholder = "Select token",
  onSelect,
}: {
  currentToken: TokenType | null;
  oppositeToken: TokenType | null;
  placeholder?: string;
  onSelect?: (token: TokenType | null) => void;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { tokensList } = useTokensList();
  const [searchValue, setSearchValue] = useState<string>("");

  const current = currentToken;
  const opposite = oppositeToken;

  const handleSelectToken = (token: TokenType | null) => {
    if (!token || token.contract === current?.contract) {
      return; // no-op when clicking the already selected token
    }
    onSelect?.(token);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchValue("");
    }
  }, [searchValue, isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex h-[43.5px] min-w-fit cursor-pointer items-center gap-2 rounded-full border border-[#35374a] bg-[#23243a] px-1.5 py-1.5 text-xs font-bold whitespace-nowrap text-white hover:bg-[#23243a]/80 focus:outline-none sm:text-sm",
          current ? "sm:px-1.5" : "sm:px-4",
        )}
      >
        {current ? (
          <>
            <Image
              src={current?.icon ?? ""}
              alt={`${current?.name} logo`}
              width={29.5}
              height={29.5}
              className="rounded-full bg-white"
            />
            <span className="text-sm font-bold text-white">{current.code}</span>
          </>
        ) : (
          <span className="text-sm font-bold text-white">{placeholder}</span>
        )}
        <ChevronDown className="size-4" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Sheet */}
          <div className="relative z-50 flex h-[70vh] w-full max-w-sm flex-col gap-2 rounded-2xl border border-[#35374a] bg-[#181A25] p-4 sm:max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-white">
                Select a token
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="cursor-pointer rounded-full p-2 leading-none text-white/70 hover:bg-[#23243a]/80 hover:text-white"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="flex items-center space-y-2">
              <input
                type="text"
                placeholder="Search name"
                className="w-full rounded-lg border border-[#35374a] bg-[#23243a] px-3 py-2 text-sm text-white placeholder:text-white/70 focus:outline-none"
                onChange={(e) => {
                  setSearchValue(e.target.value);
                }}
              />
            </div>

            <div className="space-y-2 overflow-y-auto overscroll-contain pr-1">
              {tokensList
                .filter(
                  (token) =>
                    token.code
                      .toLowerCase()
                      .includes(searchValue.toLowerCase()) ||
                    token.contract
                      .toLowerCase()
                      .includes(searchValue.toLowerCase()),
                )
                .map((token: TokenType) => {
                  const isDisabled = token.contract === current?.contract;
                  const isOtherSelected = token.contract === opposite?.contract;
                  return (
                    <button
                      key={token.contract}
                      onClick={() => handleSelectToken(token)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition",
                        isDisabled
                          ? "cursor-not-allowed bg-[#23243a]/80 text-white/40"
                          : isOtherSelected
                            ? "cursor-pointer border border-[#8866DD]/20 bg-[#23243a]/40 text-white"
                            : "cursor-pointer text-white hover:bg-[#23243a]",
                      )}
                      disabled={isDisabled}
                    >
                      <Image
                        src={token?.icon ?? ""}
                        alt={token?.name ?? ""}
                        width={28}
                        height={28}
                        className="rounded-full bg-white"
                      />
                      <p className="flex w-full justify-between font-medium">
                        {token.code}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
