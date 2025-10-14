import { useState, useEffect } from 'react';
import { getIPFSGatewayUrl, testGateway, getAllIPFSGateways } from '@/lib/ipfs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AudioDebugProps {
  audioCid?: string;
}

export default function AudioDebug({ audioCid }: AudioDebugProps) {
  const [gatewayStatus, setGatewayStatus] = useState<Record<string, boolean>>({});
  const [testUrl, setTestUrl] = useState<string>('');

  useEffect(() => {
    if (audioCid) {
      const url = getIPFSGatewayUrl(audioCid);
      setTestUrl(url);
      console.log('Generated audio URL:', url);
    }
  }, [audioCid]);

  const testAllGateways = async () => {
    const gateways = getAllIPFSGateways();
    const results: Record<string, boolean> = {};
    
    for (const gateway of gateways) {
      try {
        const isWorking = await testGateway(gateway);
        results[gateway] = isWorking;
        console.log(`Gateway ${gateway}: ${isWorking ? 'Working' : 'Failed'}`);
      } catch (error) {
        results[gateway] = false;
        console.error(`Gateway ${gateway} error:`, error);
      }
    }
    
    setGatewayStatus(results);
  };

  const testAudioUrl = () => {
    if (testUrl) {
      console.log('Testing audio URL:', testUrl);
      const audio = new Audio(testUrl);
      
      audio.addEventListener('loadstart', () => {
        console.log('Audio load started');
      });
      
      audio.addEventListener('canplay', () => {
        console.log('Audio can play');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
      });
      
      audio.load();
    }
  };

  if (!audioCid) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Audio Debug - No Audio CID</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No audio CID provided for testing.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Audio Debug</CardTitle>
        <p className="text-sm text-gray-600">
          Debug audio loading issues with IPFS gateways
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Audio CID: {audioCid}</h3>
          <p className="text-sm text-gray-600">Generated URL: {testUrl}</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={testAllGateways}>
            Test All Gateways
          </Button>
          <Button onClick={testAudioUrl} variant="outline">
            Test Audio URL
          </Button>
        </div>

        {Object.keys(gatewayStatus).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Gateway Status:</h3>
            {Object.entries(gatewayStatus).map(([gateway, isWorking]) => (
              <div key={gateway} className="flex items-center justify-between p-2 border rounded">
                <span className="font-mono text-sm">{gateway}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  isWorking 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isWorking ? 'Working' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800">Debug Steps:</h4>
          <ol className="text-sm text-blue-700 mt-2 space-y-1">
            <li>1. Check browser console for audio loading messages</li>
            <li>2. Test all gateways to see which ones work</li>
            <li>3. Verify the generated URL is accessible</li>
            <li>4. Check for CORS or network issues</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}


