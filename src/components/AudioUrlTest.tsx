import { useState, useEffect } from 'react';
import { getIPFSGatewayUrl, getIPFSGatewayUrls } from '@/lib/ipfs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AudioUrlTestProps {
  audioCid?: string;
}

export default function AudioUrlTest({ audioCid }: AudioUrlTestProps) {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [primaryUrl, setPrimaryUrl] = useState<string>('');
  const [fallbackUrls, setFallbackUrls] = useState<string[]>([]);

  useEffect(() => {
    if (audioCid) {
      const primary = getIPFSGatewayUrl(audioCid);
      const fallbacks = getIPFSGatewayUrls(audioCid, 4);
      
      setPrimaryUrl(primary);
      setFallbackUrls(fallbacks);
      
      console.log('Primary URL:', primary);
      console.log('Fallback URLs:', fallbacks);
    }
  }, [audioCid]);

  const testUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error(`URL ${url} failed:`, error);
      return false;
    }
  };

  const testAllUrls = async () => {
    if (!audioCid) return;
    
    setIsTesting(true);
    setTestResults({});
    
    const urlsToTest = [primaryUrl, ...fallbackUrls];
    const results: Record<string, boolean> = {};
    
    for (const url of urlsToTest) {
      console.log(`Testing URL: ${url}`);
      const isWorking = await testUrl(url);
      results[url] = isWorking;
      console.log(`URL ${url}: ${isWorking ? 'Working' : 'Failed'}`);
    }
    
    setTestResults(results);
    setIsTesting(false);
  };

  const testAudioPlayback = () => {
    if (primaryUrl) {
      console.log('Testing audio playback with:', primaryUrl);
      const audio = new Audio(primaryUrl);
      
      audio.addEventListener('loadstart', () => {
        console.log('Audio load started');
      });
      
      audio.addEventListener('canplay', () => {
        console.log('Audio can play - SUCCESS!');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
      });
      
      audio.load();
    }
  };

  if (!audioCid) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Audio URL Test - No Audio CID</CardTitle>
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
        <CardTitle>Audio URL Test</CardTitle>
        <p className="text-sm text-gray-600">
          Test audio URLs with Lighthouse as primary source
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Audio CID: {audioCid}</h3>
          <div className="text-sm">
            <strong>Primary URL:</strong> {primaryUrl}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={testAllUrls} disabled={isTesting}>
            {isTesting ? 'Testing...' : 'Test All URLs'}
          </Button>
          <Button onClick={testAudioPlayback} variant="outline">
            Test Audio Playback
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">URL Status:</h3>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="font-mono text-sm truncate">{primaryUrl}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                testResults[primaryUrl] 
                  ? 'bg-green-100 text-green-800' 
                  : testResults[primaryUrl] === false
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {testResults[primaryUrl] === undefined ? 'Not tested' : 
                 testResults[primaryUrl] ? 'Working' : 'Failed'}
              </span>
            </div>
            
            {fallbackUrls.map((url, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="font-mono text-sm truncate">{url}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  testResults[url] 
                    ? 'bg-green-100 text-green-800' 
                    : testResults[url] === false
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {testResults[url] === undefined ? 'Not tested' : 
                   testResults[url] ? 'Working' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800">Strategy:</h4>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>1. Try Lighthouse first (was working before)</li>
            <li>2. Fallback to Cloudflare, IPFS.io, Pinata</li>
            <li>3. Use proxy as final fallback</li>
            <li>4. Test all URLs to verify accessibility</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}


