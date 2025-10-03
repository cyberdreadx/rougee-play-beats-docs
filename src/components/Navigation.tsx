import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useWallet } from "@/hooks/useWallet";
import { Compass, TrendingUp, User, Wallet, Upload } from "lucide-react";

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Navigation = ({ activeTab = "DISCOVER", onTabChange }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullAddress } = useWallet();
  const { isArtist } = useCurrentUserProfile();
  
  const tabs = [
    { name: "DISCOVER", path: "/", icon: Compass },
    { name: "TRENDING", path: "/trending", icon: TrendingUp },
    ...(isArtist 
      ? [{ name: "MY PROFILE", path: `/artist/${fullAddress}`, icon: User }]
      : [{ name: "BECOME ARTIST", path: "/become-artist", icon: User }]
    ),
    { name: "WALLET", path: "/wallet", icon: Wallet },
    { name: "UPLOAD", path: "/upload", icon: Upload },
  ];

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.path !== "/" || location.pathname !== "/") {
      // Always navigate if going to a different path or if we're not on home page
      navigate(tab.path);
    } else {
      // Only use onTabChange if we're on home page and staying on home page
      onTabChange?.(tab.name);
    }
  };

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.path === "/trending") {
      return location.pathname === "/trending";
    }
    if (tab.path === "/upload") {
      return location.pathname === "/upload";
    }
    if (tab.path === "/become-artist") {
      return location.pathname === "/become-artist";
    }
    if (tab.path === "/wallet") {
      return location.pathname === "/wallet";
    }
    if (tab.path?.startsWith("/artist/")) {
      return location.pathname === tab.path;
    }
    // For home page tabs, only show as active if we're actually on the home page
    if (location.pathname === "/") {
      return activeTab === tab.name;
    }
    // If we're not on home page, no home page tabs should be active
    return false;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block w-full px-6 py-4">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <Button
              key={tab.name}
              variant="tab"
              size="sm"
              className={`
                ${isActive(tab) ? 'text-neon-green border-neon-green' : ''}
                hover:text-neon-green hover:border-neon-green
              `}
              onClick={() => handleTabClick(tab)}
            >
              [{tab.name}]
            </Button>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-neon-green/20">
        <div className="flex justify-around items-center h-14">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.name}
                variant="ghost"
                size="sm"
                className={`
                  flex-1 h-full flex flex-col items-center justify-center gap-0.5
                  ${isActive(tab) ? 'text-neon-green' : 'text-muted-foreground'}
                `}
                onClick={() => handleTabClick(tab)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-mono uppercase">{tab.name.split(' ')[0]}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;