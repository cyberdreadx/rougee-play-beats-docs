import { Button } from "@/components/ui/button";

const TopSongs = () => {
  return (
    <section className="w-full px-6 py-6">
      <h2 className="text-xl font-bold font-mono mb-4 neon-text">
        TOP 10 SONGS
      </h2>
      
      <div className="console-bg tech-border rounded p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-neon-green font-mono font-bold text-lg">
              #1
            </span>
            <span className="font-mono text-foreground">
              No songs launched yet...
            </span>
          </div>
          <Button variant="neon" size="sm">
            [LAUNCH]
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TopSongs;