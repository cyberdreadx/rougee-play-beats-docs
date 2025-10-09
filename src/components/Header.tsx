import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import WalletButton from "@/components/WalletButton";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { User, Shield } from "lucide-react";


const Header = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  const { profile } = useCurrentUserProfile();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isConnected && address) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("wallet_address", address)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isConnected, address]);

  return (
    <header className="w-full p-4 md:p-6 glass sticky top-0 z-40 border-b border-neon-green/10">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div 
          className="flex items-center gap-2 md:gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <h1 className="text-xs md:text-sm font-bold neon-text font-mono tracking-wider hover:opacity-80 transition-opacity">
            ROUGEE.PLAY
          </h1>
          
          {/* User wallet info - hidden on mobile */}
          <div className="hidden lg:block text-[10px] text-muted-foreground font-mono ml-4">
            USER: <span className="text-foreground">
              {isConnected ? address : "Not Connected"}
            </span>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeSwitcher />
          {isConnected && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin")}
              className="font-mono hidden md:flex border-neon-green/50 text-neon-green hover:bg-neon-green/10"
            >
              <Shield className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">ADMIN</span>
            </Button>
          )}
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