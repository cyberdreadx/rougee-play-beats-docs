import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}

const LoginModal = ({ open, onOpenChange, onLogin }: LoginModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">LOGIN</DialogTitle>
          <DialogDescription className="font-mono">
            Login with email to create your smart wallet
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 mt-4">
          <Button
            variant="neon"
            size="lg"
            onClick={onLogin}
            className="w-full font-mono flex items-center justify-center gap-2"
          >
            <Wallet className="h-5 w-5" />
            LOGIN WITH EMAIL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
