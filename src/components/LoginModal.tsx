import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Mail } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExternalWallet: () => void;
  onEmailLogin: () => void;
}

const LoginModal = ({ open, onOpenChange, onExternalWallet, onEmailLogin }: LoginModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">LOGIN</DialogTitle>
          <DialogDescription className="font-mono">
            Choose your login method
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 mt-4">
          <Button
            variant="neon"
            size="lg"
            onClick={onExternalWallet}
            className="w-full font-mono flex items-center justify-center gap-2"
          >
            <Wallet className="h-5 w-5" />
            EXTERNAL WALLET
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-mono">Or</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="lg"
            onClick={onEmailLogin}
            className="w-full font-mono flex items-center justify-center gap-2"
          >
            <Mail className="h-5 w-5" />
            LOGIN WITH EMAIL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
