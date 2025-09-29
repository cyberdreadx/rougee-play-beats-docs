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
    { name: "PLAYLISTS", path: "/" },
    { name: "UPLOAD", path: "/upload" },
    { name: "WALLET", path: "/" }
  ];

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.path !== "/") {
      navigate(tab.path);
    } else {
      onTabChange?.(tab.name);
    }
  };

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.path === "/upload") {
      return location.pathname === "/upload";
    }
    return activeTab === tab.name;
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