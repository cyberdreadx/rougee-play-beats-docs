import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Mail } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}

const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const { login } = usePrivy();

  const handleEmailLogin = () => {
    onOpenChange(false);
    login();
  };

  const handleWalletConnect = () => {
    onOpenChange(false);
    login();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">LOGIN</DialogTitle>
          <DialogDescription className="font-mono">
            Connect with email or your wallet
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="neon"
            size="lg"
            onClick={handleEmailLogin}
            className="w-full font-mono flex items-center justify-center gap-2"
          >
            <Mail className="h-5 w-5" />
            LOGIN WITH EMAIL
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleWalletConnect}
            className="w-full font-mono flex items-center justify-center gap-2"
          >
            <Wallet className="h-5 w-5" />
            CONNECT WALLET
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
