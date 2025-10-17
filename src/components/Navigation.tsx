import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useWallet } from "@/hooks/useWallet";
import { Compass, TrendingUp, User, Wallet, Upload, Radio, ArrowLeftRight, HelpCircle } from "lucide-react";
import MusicBars from "./MusicBars";

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Navigation = ({ activeTab = "DISCOVER", onTabChange }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullAddress } = useWallet();
  const { isArtist } = useCurrentUserProfile();
  
  // Desktop tabs - show all (How It Works moved to header)
  const desktopTabs = [
    { name: "DISCOVER", path: "/", icon: Compass },
    { name: "GLTCH FEED", path: "/feed", icon: Radio },
    { name: "TRENDING", path: "/trending", icon: TrendingUp },
    ...(isArtist 
      ? [{ name: "MY PROFILE", path: `/artist/${fullAddress}`, icon: User }]
      : [{ name: "BECOME ARTIST", path: "/become-artist", icon: User }]
    ),
    { name: "WALLET", path: "/wallet", icon: Wallet },
    { name: "SWAP", path: "/swap", icon: ArrowLeftRight },
    { name: "UPLOAD", path: "/upload", icon: Upload },
  ];

  // Mobile tabs - essential only (no How It Works, no Upload, no Become Artist)
  const mobileTabs = [
    { name: "DISCOVER", path: "/", icon: Compass },
    { name: "GLTCH FEED", path: "/feed", icon: Radio },
    { name: "TRENDING", path: "/trending", icon: TrendingUp },
    { name: "SWAP", path: "/swap", icon: ArrowLeftRight },
    { name: "WALLET", path: "/wallet", icon: Wallet },
    // Always include a profile entry for listeners/artists
    ...(isArtist 
      ? [{ name: "MY PROFILE", path: `/artist/${fullAddress}`, icon: User }]
      : [{ name: "PROFILE", path: "/profile/edit", icon: User }]
    ),
  ];

  const handleTabClick = (tab: typeof desktopTabs[0]) => {
    if (tab.path !== "/" || location.pathname !== "/") {
      // Always navigate if going to a different path or if we're not on home page
      navigate(tab.path);
    } else {
      // Only use onTabChange if we're on home page and staying on home page
      onTabChange?.(tab.name);
    }
  };

  const isActive = (tab: typeof desktopTabs[0]) => {
    if (tab.path === "/feed") {
      return location.pathname === "/feed";
    }
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
    if (tab.path === "/swap") {
      return location.pathname === "/swap";
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
        <div className="flex items-center space-x-2 bg-black/10 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
          <MusicBars bars={4} className="mr-3 text-neon-green/80" />
          {desktopTabs.map((tab) => (
            <Button
              key={tab.name}
              variant="ghost"
              size="sm"
              className={`
                font-mono text-sm px-4 py-2 rounded-xl transition-all duration-300 backdrop-blur-sm
                ${isActive(tab) 
                  ? 'bg-white/10 text-neon-green border border-neon-green/30 shadow-lg shadow-neon-green/20' 
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5 border border-transparent'
                }
              `}
              onClick={() => handleTabClick(tab)}
            >
              [{tab.name}]
            </Button>
          ))}
          <MusicBars bars={4} className="ml-3 text-neon-green/80" />
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Essential tabs only (Upload from desktop/profile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 supports-[backdrop-filter]:bg-black/80" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
        <div className="flex justify-around items-center h-16 px-1">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.name}
                variant="ghost"
                size="icon"
                className={`
                  h-12 w-12 rounded-xl transition-all duration-300 backdrop-blur-sm
                  ${isActive(tab) 
                    ? 'bg-white/10 text-neon-green border border-neon-green/30 shadow-lg shadow-neon-green/20' 
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5 border border-transparent'
                  }
                `}
                onClick={() => handleTabClick(tab)}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;