import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";

const WalletButton = () => {
  const { isConnected, connect, disconnect } = useWallet();

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
      
      className="font-mono"
    >
      {isConnected ? "[DISCONNECT]" : "[CONNECT WALLET]"}
    </Button>
  );
};

export default WalletButton;