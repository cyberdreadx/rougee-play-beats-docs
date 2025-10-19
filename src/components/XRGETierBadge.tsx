import { Badge } from "@/components/ui/badge";
import { useXRGETier } from "@/hooks/useXRGETier";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface XRGETierBadgeProps {
  walletAddress: string | null;
  showBalance?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const XRGETierBadge = ({ 
  walletAddress, 
  showBalance = false, 
  size = "md",
  className = "" 
}: XRGETierBadgeProps) => {
  const { tier, xrgeBalance, isLoading } = useXRGETier(walletAddress);

  if (isLoading) {
    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Loading...</span>
      </Badge>
    );
  }

  if (!tier) {
    return null; // No badge for < 1K XRGE
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };

  // Add special effects for whale tiers
  const isWhale = tier.name.includes("Whale");
  const isGoldWhale = tier.name === "Gold Whale";
  const animationClasses = isGoldWhale 
    ? "animate-pulse bg-gradient-to-r from-yellow-400/30 via-amber-500/30 to-yellow-400/30 bg-[length:200%_100%]" 
    : isWhale 
      ? "animate-pulse" 
      : "";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`
              ${tier.color} ${tier.bgColor} ${tier.borderColor}
              font-bold font-mono gap-1.5 cursor-help
              ${sizeClasses[size]}
              ${animationClasses}
              transition-all duration-300 hover:scale-105
              ${className}
            `}
          >
            <span className={isGoldWhale ? "text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "text-base"}>
              {tier.icon}
            </span>
            <span className={isGoldWhale ? "font-extrabold tracking-wide" : ""}>{tier.name}</span>
            {showBalance && (
              <span className="text-xs opacity-75">
                ({(xrgeBalance / 1000000).toFixed(1)}M)
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-bold text-sm flex items-center gap-2">
              <span className="text-lg">{tier.icon}</span>
              {tier.name}
            </div>
            <div className="text-xs opacity-75">
              Balance: {xrgeBalance.toLocaleString()} XRGE
            </div>
            <div className="text-xs">
              <div className="font-semibold mb-1">Benefits:</div>
              <ul className="space-y-0.5">
                {tier.benefits.map((benefit, i) => (
                  <li key={i}>✓ {benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

