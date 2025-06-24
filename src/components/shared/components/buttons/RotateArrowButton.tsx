import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes } from "react";
import { ArrowDown } from "lucide-react";

export const RotateArrowButton = ({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={cn(
        "group absolute -bottom-6 left-1/2 z-20 -translate-x-1/2 cursor-pointer",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-center rounded-full border-4 border-[#181A25] bg-[#CFFFD9] p-2 transition-all duration-300 group-hover:bg-[#CFFFD9]/80">
        <ArrowDown className="size-6 text-[#232136]" />
      </div>
    </button>
  );
};
