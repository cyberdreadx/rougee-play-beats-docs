import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";

const Header = () => {
  const { isConnected, address, connect, disconnect, isConnecting } = useWallet();

  const handleWalletAction = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <header className="w-full p-6 console-bg">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold neon-text font-mono tracking-wider">
            ROUGEE.PLAY
          </h1>
          
          {/* User wallet info */}
          <div className="text-sm text-muted-foreground font-mono">
            USER: <span className="text-foreground">
              {isConnected ? address : "Not Connected"}
            </span>
          </div>
        </div>

        {/* Connect/Disconnect button */}
        <Button 
          variant={isConnected ? "disconnect" : "neon"} 
          size="sm"
          onClick={handleWalletAction}
          disabled={isConnecting}
          className="font-mono"
        >
          {isConnecting ? "[CONNECTING...]" : isConnected ? "[DISCONNECT]" : "[CONNECT]"}
        </Button>
      </div>
    </header>
  );
};

export default Header;