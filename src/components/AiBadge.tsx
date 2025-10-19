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
      label: 'AI+',
      className: 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
    },
    full: {
      label: 'AI',
      className: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
    }
  };

  const { label, className } = config[aiUsage as 'partial' | 'full'];
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <Badge 
      variant="outline" 
      className={`${className} ${textSize} font-mono font-semibold uppercase tracking-wider flex items-center gap-0.5 px-1.5 py-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all duration-300`}
    >
      <Sparkles className={`${iconSize} opacity-80`} />
      {label}
    </Badge>
  );
};