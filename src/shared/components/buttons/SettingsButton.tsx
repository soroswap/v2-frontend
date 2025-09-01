"use client";

import Image from "next/image";
import { ButtonHTMLAttributes, MouseEventHandler } from "react";

interface SettingsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export const SettingsButton = ({ onClick, ...props }: SettingsButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="hover:bg-brand/20 cursor-pointer rounded-full p-1"
      {...props}
    >
      <Image src="/settingsIcon.svg" alt="Settings" width={38} height={38} />
    </button>
  );
};
