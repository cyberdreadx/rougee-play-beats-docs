import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Navigation = ({ activeTab = "DISCOVER", onTabChange }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const tabs = [
    { name: "DISCOVER", path: "/" },
    { name: "TRENDING", path: "/" },
    { name: "BECOME ARTIST", path: "/become-artist" },
    { name: "UPLOAD", path: "/upload" },
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
    if (tab.path === "/upload") {
      return location.pathname === "/upload";
    }
    if (tab.path === "/become-artist") {
      return location.pathname === "/become-artist";
    }
    // For home page tabs, only show as active if we're actually on the home page
    if (location.pathname === "/") {
      return activeTab === tab.name;
    }
    // If we're not on home page, no home page tabs should be active
    return false;
  };

  return (
    <nav className="w-full px-6 py-4">
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
  );
};

export default Navigation;