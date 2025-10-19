import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface AiBadgeProps {
  aiUsage: 'none' | 'partial' | 'full' | null;
  size?: 'sm' | 'md';
}

export const AiBadge = ({ aiUsage, size = 'sm' }: AiBadgeProps) => {
  if (!aiUsage || aiUsage === 'none') return null;

  const config = {
    partial: {
      label: 'Partial AI',
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    full: {
      label: 'AI Generated',
      className: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    }
  };

  const { label, className } = config[aiUsage as 'partial' | 'full'];
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <Badge 
      variant="outline" 
      className={`${className} ${textSize} font-mono font-bold flex items-center gap-1 px-1.5 py-0`}
    >
      <Sparkles className={iconSize} />
      {label}
    </Badge>
  );
};