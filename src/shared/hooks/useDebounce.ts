import { useEffect, useState } from "react";

/**
 * Debounces a value with automatic cleanup
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Object with debounced value and debouncing state
 */
export function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false);

  useEffect(() => {
    // Mark as debouncing when value changes
    setIsDebouncing(true);

    // Set up the debounce timer
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    // Cleanup function automatically handles timeout clearing
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return { debouncedValue, isDebouncing };
}
