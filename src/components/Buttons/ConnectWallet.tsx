import React from "react";

interface ConnectWalletProps {
  className?: string;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ className }) => {
  
  return (
    <button className={`btn h-14 bg-[#8866DD] rounded-[16px] text-[20px] p-[16px] font-bold ${className}`}>
      Connect Wallet
    </button>
  );
};

export default ConnectWallet;
