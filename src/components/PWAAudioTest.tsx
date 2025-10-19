import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWAAudio } from '@/hooks/usePWAAudio';
import { useToast } from '@/hooks/use-toast';

export default function PWAAudioTest() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('https://gateway.lighthouse.storage/ipfs/QmYourTestAudioCID');
  const { toast } = useToast();
  const { isPWA, audioSupported, handlePWAAudioPlay } = usePWAAudio();

  const testAudio = () => {
    const audio = new Audio(audioUrl);
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      toast({
        title: '⏸️ Audio paused',
        description: 'Test audio playback stopped'
      });
    } else {
      const playPromise = isPWA ? handlePWAAudioPlay(audio) : audio.play();
      
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.then(() => {
          setIsPlaying(true);
          toast({
            title: '▶️ Audio playing',
            description: 'Test audio playback started'
          });
        }).catch((error) => {
          console.error('PWA audio test failed:', error);
          toast({
            title: '❌ Audio test failed',
            description: `Error: ${error.message}`,
            variant: 'destructive'
          });
        });
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>PWA Audio Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-2">
          <p><strong>PWA Mode:</strong> {isPWA ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Audio Supported:</strong> {audioSupported ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Display Mode:</strong> {window.matchMedia('(display-mode: standalone)').matches ? 'Standalone' : 'Browser'}</p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Audio URL:</label>
          <input
            type="text"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter audio URL to test"
          />
        </div>
        
        <Button 
          onClick={testAudio}
          className="w-full"
          variant={isPlaying ? "destructive" : "default"}
        >
          {isPlaying ? '⏸️ Stop Test Audio' : '▶️ Test Audio Playback'}
        </Button>
        
        <div className="text-xs text-gray-500">
          <p>This test helps verify if audio playback works in PWA mode.</p>
          <p>Use a valid audio URL (MP3, OGG, etc.) to test.</p>
        </div>
      </CardContent>
    </Card>
  );
}
