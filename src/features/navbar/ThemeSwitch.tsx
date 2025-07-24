"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";
import { useTheme } from "next-themes";

interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch = ({ className }: ThemeSwitchProps) => {
  const { setTheme, theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "bg-surface-subtle hover:bg-surface-alt relative flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors duration-300",
        className,
      )}
    >
      {/* Sun icon */}
      <Sun
        className={cn(
          "text-accent-warning absolute size-10 transition-transform duration-300",
          isDark ? "scale-0 rotate-90" : "scale-100 rotate-0",
        )}
      />

      {/* Moon icon */}
      <Moon
        className={cn(
          "text-brand size-10 transition-transform duration-300",
          isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90",
        )}
      />
    </button>
  );
};
