import { Button } from "@/components/ui/button";

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Navigation = ({ activeTab = "DISCOVER", onTabChange }: NavigationProps) => {
  const tabs = [
    "DISCOVER",
    "TRENDING", 
    "PLAYLISTS",
    "CREATOR_COINS",
    "WALLET"
  ];

  return (
    <nav className="w-full px-6 py-4">
      <div className="flex space-x-2">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant="tab"
            size="sm"
            className={`
              ${activeTab === tab ? 'text-neon-green border-neon-green' : ''}
              hover:text-neon-green hover:border-neon-green
            `}
            onClick={() => onTabChange?.(tab)}
          >
            [{tab}]
          </Button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;