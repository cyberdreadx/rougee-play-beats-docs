import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, themes, type ThemeColor } from "@/contexts/ThemeContext";
import { Palette } from "lucide-react";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const themeColors: Record<ThemeColor, string> = {
    green: 'bg-[#00ff00]',
    white: 'bg-white',
    purple: 'bg-[#a855f7]',
    blue: 'bg-[#00bfff]',
    red: 'bg-[#ff0000]',
    gold: 'bg-[#ffd700]',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="font-mono gap-2"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden md:inline">THEME</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card w-48">
        {(Object.keys(themes) as ThemeColor[]).map((themeKey) => (
          <DropdownMenuItem
            key={themeKey}
            onClick={() => setTheme(themeKey)}
            className={`font-mono cursor-pointer flex items-center gap-3 ${
              theme === themeKey ? 'bg-neon-green/10' : ''
            }`}
          >
            <div className={`w-4 h-4 rounded-full border border-border ${themeColors[themeKey]}`} />
            {themes[themeKey].name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;
