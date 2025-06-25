import { cn } from "@/lib/utils/cn";
import { Moon, Sun } from "lucide-react";

interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch = ({ className }: ThemeSwitchProps) => {
  return (
    <div
      className={cn(
        "items-center justify-center rounded-full bg-[#10121a] p-2 transition-all duration-300 hover:bg-[#232136]",
        className,
      )}
    >
      <label className="swap swap-rotate">
        <input type="checkbox" />
        <Sun className="swap-on size-10 text-[#f88f6d]" />
        <Moon className="swap-off size-10 text-[#8866DD]" />
      </label>
    </div>
  );
};
