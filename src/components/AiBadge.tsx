import { Sparkles } from "lucide-react";
import { useState } from "react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AiBadgeProps {
  aiUsage: 'none' | 'partial' | 'full' | null;
  size?: 'sm' | 'md';
}

export const AiBadge = ({ aiUsage, size = 'sm' }: AiBadgeProps) => {
  const [open, setOpen] = useState(false);

  if (!aiUsage || aiUsage === 'none') return null;

  const config = {
    partial: {
      label: 'AI-Assisted',
      description: 'Created with AI tools',
      color: 'text-cyan-400/60 hover:text-cyan-400'
    },
    full: {
      label: 'AI-Generated',
      description: 'Fully AI-generated',
      color: 'text-purple-400/60 hover:text-purple-400'
    }
  };

  const { label, description, color } = config[aiUsage as 'partial' | 'full'];
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span 
            className="cursor-help inline-flex"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <Sparkles 
              className={`${iconSize} ${color} transition-colors duration-200`} 
              aria-label={label}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">{label}</p>
          <p className="text-muted-foreground text-[10px]">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};