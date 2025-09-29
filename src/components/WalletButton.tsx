import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";

const WalletButton = () => {
  const { isConnected, address, connect, disconnect, isConnecting } = useWallet();

  const handleWalletAction = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <Button 
      variant={isConnected ? "disconnect" : "neon"} 
      size="sm"
      onClick={handleWalletAction}
      disabled={isConnecting}
      className="font-mono"
    >
      {isConnecting ? "[CONNECTING...]" : isConnected ? "[DISCONNECT]" : "[CONNECT WALLET]"}
    </Button>
  );
};

export default WalletButton;