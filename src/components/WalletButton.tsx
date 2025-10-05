import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import LoginModal from "@/components/LoginModal";

const WalletButton = () => {
  const { isConnected, connectExternalWallet, connectEmailWallet, disconnect } = useWallet();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleExternalWallet = () => {
    setShowLoginModal(false);
    connectExternalWallet();
  };

  const handleEmailLogin = () => {
    setShowLoginModal(false);
    connectEmailWallet();
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
        onExternalWallet={handleExternalWallet}
        onEmailLogin={handleEmailLogin}
      />
    </>
  );
};

export default WalletButton;