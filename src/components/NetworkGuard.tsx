import { useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface NetworkGuardProps {
  children: React.ReactNode;
  showWarning?: boolean;
}

export const NetworkGuard = ({ children, showWarning = true }: NetworkGuardProps) => {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return <>{children}</>;

  const isWrongNetwork = chainId !== base.id;

  if (isWrongNetwork && showWarning) {
    const networkName = chainId === 1 ? 'Ethereum Mainnet' : 
                       chainId === 137 ? 'Polygon' :
                       chainId === 56 ? 'BSC' :
                       `Chain ID ${chainId}`;

    return (
      <div className="flex flex-col items-center justify-center p-6 md:p-8 space-y-4 console-bg tech-border rounded-lg">
        <AlertTriangle className="h-12 w-12 text-yellow-500 animate-pulse" />
        <h3 className="text-lg md:text-xl font-mono font-bold text-center">Wrong Network Detected</h3>
        <p className="text-xs md:text-sm text-muted-foreground text-center max-w-md">
          You're currently on <span className="text-yellow-500 font-semibold">{networkName}</span>.<br />
          This app only works on <span className="text-neon-green font-semibold">Base Network</span>.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            onClick={() => switchChain({ chainId: base.id })}
            disabled={isPending}
            variant="neon"
            className="font-mono w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                SWITCHING...
              </>
            ) : (
              'SWITCH TO BASE NETWORK'
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Chain ID: {base.id}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

