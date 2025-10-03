import { Button } from "@/components/ui/button";

interface LiveStreamUser {
  id: string;
  name: string;
  badge: string;
  isLive: boolean;
}

const LiveStream = () => {
  // Empty state - no mock data as requested
  const liveUsers: LiveStreamUser[] = [];

  return (
    <section className="w-full px-2 md:px-6 py-4">
      {liveUsers.length > 0 ? (
        <div className="space-y-2">
          {liveUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-4 p-3 console-bg tech-border rounded">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-mono">{user.name[0]}</span>
              </div>
              <span className="font-mono text-sm">{user.name}</span>
              <Button variant="tech" size="sm" className="text-xs">
                {user.badge}
              </Button>
              {user.isLive && (
                <Button variant="live" size="sm">
                  LIVE
                </Button>
              )}
              {/* Animated waveform would go here */}
              <div className="flex-1 h-1 bg-neon-green opacity-50 rounded live-pulse"></div>
            </div>
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-6 md:py-8">
          <div className="text-muted-foreground font-mono text-sm">
            No live streams active
          </div>
        </div>
      )}
    </section>
  );
};

export default LiveStream;