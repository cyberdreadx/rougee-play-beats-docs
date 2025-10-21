import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Playlists = () => {
  const navigate = useNavigate();
  
  // Coming Soon - Feature temporarily disabled
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <Card className="p-8 md:p-12 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,255,159,0.1)]">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center border-2 border-yellow-500/30">
              <Music className="w-10 h-10 text-yellow-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-mono mb-4 text-neon-green">
              PLAYLISTS
            </h1>
            <div className="inline-block px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-mono text-sm mb-6">
              COMING SOON
            </div>
            <p className="text-lg text-muted-foreground font-mono mb-2">
              We're working on something special
            </p>
            <p className="text-sm text-muted-foreground/70 font-mono">
              Playlist functionality will be available soon. Stay tuned!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="neon"
              onClick={() => navigate('/')}
              className="font-mono"
            >
              Browse Trending
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/discover')}
              className="font-mono border-neon-green/50"
            >
              Discover Music
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Playlists;
