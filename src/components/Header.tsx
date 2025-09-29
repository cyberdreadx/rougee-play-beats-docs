import { useWallet } from "@/hooks/useWallet";
import WalletButton from "@/components/WalletButton";

const Header = () => {
  const { isConnected, address } = useWallet();

  return (
    <header className="w-full p-6 console-bg">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold neon-text font-mono tracking-wider">
            ROUGEE.PLAY
          </h1>
          
          {/* User wallet info */}
          <div className="text-sm text-muted-foreground font-mono">
            USER: <span className="text-foreground">
              {isConnected ? address : "Not Connected"}
            </span>
          </div>
        </div>

        {/* Wallet button */}
        <WalletButton />
      </div>
    </header>
  );
};

export default Header;