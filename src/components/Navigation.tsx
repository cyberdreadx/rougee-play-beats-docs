import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useWallet } from "@/hooks/useWallet";
import { Compass, TrendingUp, User, Wallet, Upload, Radio, ArrowLeftRight, HelpCircle, Music, MessageSquare, Search } from "lucide-react";
import MusicBars from "./MusicBars";
import { useState, useEffect } from "react";

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Navigation = ({ activeTab = "DISCOVER", onTabChange }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullAddress } = useWallet();
  const { isArtist } = useCurrentUserProfile();
  
  // Mobile navigation scroll behavior
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only apply scroll behavior on mobile
      if (window.innerWidth >= 768) return;
      
      // Show nav when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY) {
        setIsMobileNavVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsMobileNavVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  // Desktop tabs - show all (How It Works moved to header)
  const desktopTabs = [
    { name: "TRENDING", path: "/", icon: TrendingUp },
    { name: "GLTCH FEED", path: "/feed", icon: Radio },
    { name: "DISCOVER", path: "/discover", icon: Compass },
    ...(isArtist 
      ? [{ name: "MY PROFILE", path: `/artist/${fullAddress}`, icon: User }]
      : [{ name: "BECOME ARTIST", path: "/become-artist", icon: User }]
    ),
    { name: "PLAYLISTS", path: "/playlists", icon: Music },
    { name: "MESSAGES", path: "/messages", icon: MessageSquare },
    { name: "WALLET", path: "/wallet", icon: Wallet },
    { name: "SWAP", path: "/swap", icon: ArrowLeftRight },
    { name: "UPLOAD", path: "/upload", icon: Upload },
  ];

  // Mobile tabs - SoundCloud/Spotify style with labels
  const mobileTabs = [
    { name: "Trending", path: "/", icon: TrendingUp },
    { name: "Feed", path: "/feed", icon: Radio },
    { name: "Discover", path: "/discover", icon: Compass },
    { name: "Wallet", path: "/wallet", icon: Wallet },
    { name: "Profile", path: isArtist ? `/artist/${fullAddress}` : "/profile/edit", icon: User },
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
    if (tab.path === "/discover") {
      return location.pathname === "/discover";
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
    if (tab.path === "/playlists") {
      return location.pathname === "/playlists";
    }
    if (tab.path === "/messages") {
      return location.pathname === "/messages";
    }
    if (tab.path?.startsWith("/artist/")) {
      return location.pathname === tab.path;
    }
    // For home page (trending), show as active if we're on root
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
        <div className="flex items-center space-x-2 bg-black/10 backdrop-blur-xl border border-neon-green/30 rounded-2xl p-2 shadow-2xl">
          <MusicBars bars={4} className="mr-3 text-neon-green/80" />
          {desktopTabs.map((tab) => (
            <Button
              key={tab.name}
              variant="ghost"
              size="sm"
              className={`
                font-mono text-sm px-4 py-2 rounded-xl transition-all duration-300 backdrop-blur-sm
                ${isActive(tab) 
                  ? 'bg-neon-green/20 text-neon-green border border-neon-green/50 shadow-lg shadow-neon-green/40 font-bold' 
                  : 'text-white/70 hover:text-neon-green hover:bg-neon-green/5 hover:border-neon-green/20 border border-transparent'
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

      {/* Mobile Bottom Navigation - Futuristic Cyber Style */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isMobileNavVisible ? 'translate-y-0' : 'translate-y-full'
      }`} style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
        {/* Glowing top border */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-50" />
        
        {/* Main nav container */}
        <div className="relative bg-gradient-to-b from-black/80 to-black/95 backdrop-blur-2xl">
          {/* Glow effect background */}
          <div className="absolute inset-0 bg-gradient-to-t from-neon-green/5 via-transparent to-transparent" />
          
          <div className="relative flex justify-around items-center px-3 py-2">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab);
              return (
                <button
                  key={tab.name}
                  className={`
                    relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl transition-all duration-300 min-w-[64px] group
                    ${active 
                      ? 'text-neon-green scale-105' 
                      : 'text-white/50 hover:text-white/80 active:scale-95'
                    }
                  `}
                  onClick={() => handleTabClick(tab)}
                >
                  {/* Active indicator glow */}
                  {active && (
                    <>
                      <div className="absolute inset-0 bg-neon-green/10 rounded-2xl blur-md animate-pulse" />
                      <div className="absolute inset-0 bg-gradient-to-b from-neon-green/20 to-transparent rounded-2xl border border-neon-green/30" />
                    </>
                  )}
                  
                  {/* Hover glow effect */}
                  {!active && (
                    <div className="absolute inset-0 bg-neon-green/0 group-hover:bg-neon-green/5 rounded-2xl transition-all duration-300" />
                  )}
                  
                  {/* Icon with glow */}
                  <div className="relative">
                    <Icon className={`h-6 w-6 transition-all duration-300 ${
                      active 
                        ? 'drop-shadow-[0_0_12px_rgba(0,255,159,0.8)] animate-pulse' 
                        : 'group-hover:drop-shadow-[0_0_6px_rgba(0,255,159,0.3)]'
                    }`} />
                    {active && (
                      <div className="absolute inset-0 bg-neon-green/20 blur-xl rounded-full" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`relative text-[9px] font-mono tracking-wider uppercase ${
                    active 
                      ? 'font-bold drop-shadow-[0_0_8px_rgba(0,255,159,0.6)]' 
                      : 'font-medium group-hover:text-neon-green/80'
                  }`}>
                    {tab.name}
                  </span>
                  
                  {/* Active dot indicator */}
                  {active && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-neon-green rounded-full shadow-[0_0_8px_rgba(0,255,159,1)] animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;