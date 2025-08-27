"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";
import { useTheme } from "next-themes";

interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch = ({ className }: ThemeSwitchProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const handleThemeToggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={handleThemeToggle}
      className={cn(
        "bg-surface-subtle hover:bg-surface-alt relative flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors duration-300",
        className,
      )}
    >
      <Sun
        className={cn(
          "text-accent-warning absolute size-10 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:rotate-90",
        )}
      />
      <Moon
        className={cn(
          "text-brand size-10 scale-0 -rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0",
        )}
      />
    </button>
  );
};
