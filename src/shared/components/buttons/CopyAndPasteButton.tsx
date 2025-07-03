"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  disabled?: boolean;
}

export const CopyAndPasteButton = ({
  textToCopy,
  className,
  disabled = false,
}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    if (!textToCopy || disabled) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={disabled || !textToCopy}
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-200",
        "bg-[#23243a] hover:bg-[#2a2b42] active:scale-95",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      aria-label={isCopied ? "Copied!" : "Copy to clipboard"}
    >
      {isCopied ? (
        <Check className="size-4 text-green-500" />
      ) : (
        <Copy className="size-4 text-gray-400 transition-colors hover:text-white" />
      )}
    </button>
  );
};
