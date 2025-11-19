import { ConnectButton, useWallet } from "@suiet/wallet-kit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, Copy, LogOut, CheckCircle2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { suiClient } from "@/lib/suiContract";

interface WalletConnectProps {
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  className?: string;
  showIcon?: boolean;
}

export const WalletConnect = ({
  size = "default",
  variant = "default",
  className = "",
  showIcon = true
}: WalletConnectProps) => {
  const wallet = useWallet();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch balance when wallet is connected
  useEffect(() => {
    if (wallet.connected && wallet.address) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [wallet.connected, wallet.address]);

  const fetchBalance = async () => {
    if (!wallet.address) return;

    setLoadingBalance(true);
    try {
      const balanceData = await suiClient.getBalance({
        owner: wallet.address,
      });

      // Convert MIST to SUI (1 SUI = 1,000,000,000 MIST)
      const suiBalance = Number(balanceData.totalBalance) / 1_000_000_000;
      setBalance(suiBalance.toFixed(4));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0.0000");
    } finally {
      setLoadingBalance(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (wallet.address) {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    await wallet.disconnect();
    toast.success("Wallet disconnected");
  };

  if (!wallet.connected) {
    return (
      <ConnectButton
        style={{
          all: 'unset',
          display: 'inline-block',
        }}
      >
        <Button size={size} variant={variant} className={`gap-2 font-medium ${className}`}>
          {showIcon && <Wallet className="w-4 h-4" />}
          Connect Wallet
        </Button>
      </ConnectButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} className={`gap-2 font-medium ${className}`}>
          {showIcon && <Wallet className="w-4 h-4" />}
          {formatAddress(wallet.address || "")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium">Connected Wallet</span>
            <span className="text-xs text-muted-foreground font-normal">
              {wallet.account?.chains?.[0] || "SUI Testnet"}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Balance</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={fetchBalance}
              disabled={loadingBalance}
            >
              <RefreshCw className={`h-3 w-3 ${loadingBalance ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="text-lg font-bold">
            {balance !== null ? `${balance} SUI` : "Loading..."}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          {copied ? (
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          <span>{copied ? "Copied!" : "Copy Address"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
