"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  const handleClick = () => {
    open();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className="rounded-full h-auto px-3 py-1 text-[11px] flex items-center gap-1.5"
    >
      <Wallet className="w-3 h-3" />
      {isConnected && address ? (
        <span>{formatAddress(address)}</span>
      ) : (
        <span>Connect Wallet</span>
      )}
    </Button>
  );
}
