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
        "group flex cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-200",
        "bg-surface-page hover:bg-surface-alt active:scale-95",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      aria-label={isCopied ? "Copied!" : "Copy to clipboard"}
    >
      {isCopied ? (
        <Check className="size-4 text-green-500" />
      ) : (
        <Copy className="group-hover:text-primary text-secondary size-4 transition-colors" />
      )}
    </button>
  );
};
