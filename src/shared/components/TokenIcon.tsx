import Image from "next/image";
import { useState } from "react";

interface TokenIconProps {
  src?: string | undefined;
  alt: string;
  size?: number; // sets both width & height; defaults to 24
  className?: string;
}

// Displays a token icon with automatic fallback to /globe.svg when the remote image fails to load.
// Avoids showing the alt text overlay when an icon URL is broken or missing.
export const TokenIcon = ({
  src,
  alt,
  size = 24,
  className = "",
}: TokenIconProps) => {
  const [hasError, setHasError] = useState(false);
  const fallbackSrc = "/globe.svg";

  return (
    <Image
      src={hasError || !src ? fallbackSrc : src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
