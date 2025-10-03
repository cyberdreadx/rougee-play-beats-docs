import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import WalletButton from "@/components/WalletButton";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  const { profile } = useCurrentUserProfile();

  return (
    <header className="w-full p-4 md:p-6 glass sticky top-0 z-40 border-b border-neon-green/10">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div 
          className="flex items-center space-x-2 md:space-x-8 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <h1 className="text-lg md:text-2xl font-bold neon-text font-mono tracking-wider hover:opacity-80 transition-opacity">
            ROUGEE.PLAY
          </h1>
          
          {/* User wallet info - hidden on mobile */}
          <div className="hidden md:block text-sm text-muted-foreground font-mono">
            USER: <span className="text-foreground">
              {isConnected ? address : "Not Connected"}
            </span>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeSwitcher />
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/profile/edit")}
              className="font-mono hidden md:flex"
            >
              <User className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">MY PROFILE</span>
            </Button>
          )}
          <WalletButton />
        </div>
      </div>
    </header>
  );
};

export default Header;