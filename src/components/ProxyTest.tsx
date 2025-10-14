import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProxyTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testProxy = async () => {
    setIsLoading(true);
    setTestResult('Testing proxy...');
    
    try {
      // Test with a known IPFS CID
      const testCid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const proxyUrl = `https://phybdsfwycygroebrsdx.supabase.co/functions/v1/ipfs-proxy/${testCid}`;
      
      console.log('Testing proxy URL:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'HEAD',
        headers: {
          'Accept': '*/*',
        },
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const gateway = response.headers.get('x-ipfs-gateway');
        
        setTestResult(`✅ Proxy working! Content-Type: ${contentType}, Gateway: ${gateway}`);
        console.log('Proxy test successful:', { contentType, gateway });
      } else {
        setTestResult(`❌ Proxy failed with status: ${response.status}`);
        console.error('Proxy test failed:', response.status);
      }
    } catch (error) {
      setTestResult(`❌ Proxy error: ${error}`);
      console.error('Proxy test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>IPFS Proxy Test</CardTitle>
        <p className="text-sm text-gray-600">
          Test the IPFS proxy to bypass CORS restrictions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testProxy} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test IPFS Proxy'}
        </Button>
        
        {testResult && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>What this tests:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Proxy server connectivity</li>
            <li>CORS bypass functionality</li>
            <li>Gateway fallback system</li>
            <li>Response headers and content type</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}


