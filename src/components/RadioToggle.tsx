import { Radio } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface RadioToggleProps {
  isRadioMode: boolean;
  onToggle: () => void;
  className?: string;
}

export const RadioToggle = ({ isRadioMode, onToggle, className }: RadioToggleProps) => {
  return (
    <Button
      variant={isRadioMode ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className={cn("gap-2", className)}
    >
      <Radio className={cn("h-4 w-4", isRadioMode && "animate-pulse")} />
      {isRadioMode ? "Radio On" : "Radio Off"}
    </Button>
  );
};
