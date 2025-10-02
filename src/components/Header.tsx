import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import WalletButton from "@/components/WalletButton";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  const { profile } = useCurrentUserProfile();

  return (
    <header className="w-full p-6 console-bg">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div 
          className="flex items-center space-x-8 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <h1 className="text-2xl font-bold neon-text font-mono tracking-wider hover:opacity-80 transition-opacity">
            ROUGEE.PLAY
          </h1>
          
          {/* User wallet info */}
          <div className="text-sm text-muted-foreground font-mono">
            USER: <span className="text-foreground">
              {isConnected ? address : "Not Connected"}
            </span>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-3">
          {isConnected && profile && profile.artist_name && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/profile/edit")}
              className="font-mono"
            >
              <User className="h-4 w-4 mr-2" />
              MY PROFILE
            </Button>
          )}
          <WalletButton />
        </div>
      </div>
    </header>
  );
};

export default Header;