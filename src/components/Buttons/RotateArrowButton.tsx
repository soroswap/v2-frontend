import { ButtonHTMLAttributes } from "react";

interface RotateArrowButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const RotateArrowButton = ({
  className,
  ...props
}: RotateArrowButtonProps) => {
  return (
    <button
      className={`group absolute -bottom-6 left-1/2 z-20 -translate-x-1/2 ${className} cursor-pointer`}
      {...props}
    >
      <div className="flex items-center justify-center rounded-full border-4 border-[#181A25] bg-[#CFFFD9] p-2 transition-all duration-300 group-hover:bg-[#CFFFD9]/80">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#232136"
          className="h-6 w-6"
        >
          <line
            x1="12"
            y1="5"
            x2="12"
            y2="19"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <polyline
            points="19 12 12 19 5 12"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
};
