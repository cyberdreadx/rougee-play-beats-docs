import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import LoginModal from "@/components/LoginModal";

const WalletButton = () => {
  const { isConnected, connect, disconnect } = useWallet();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleConnect = () => {
    setShowLoginModal(false);
    connect();
  };

  return (
    <>
      <Button 
        variant={isConnected ? "disconnect" : "neon"} 
        size="sm"
        onClick={isConnected ? disconnect : handleLogin}
        className="font-mono"
      >
        {isConnected ? "[DISCONNECT]" : "[LOGIN]"}
      </Button>

      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onLogin={handleConnect}
      />
    </>
  );
};

export default WalletButton;