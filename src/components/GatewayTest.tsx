import { useState, useEffect } from 'react';
import { getIPFSGatewayUrl, getAllIPFSGateways, testGateway, getRandomIPFSGateway } from '@/lib/ipfs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GatewayTest() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [randomGateway, setRandomGateway] = useState<string>('');

  const gateways = getAllIPFSGateways();

  const testAllGateways = async () => {
    setIsTesting(true);
    const results: Record<string, boolean> = {};
    
    for (const gateway of gateways) {
      try {
        const isWorking = await testGateway(gateway);
        results[gateway] = isWorking;
      } catch (error) {
        results[gateway] = false;
      }
    }
    
    setTestResults(results);
    setIsTesting(false);
  };

  const getRandomGateway = () => {
    const gateway = getRandomIPFSGateway();
    setRandomGateway(gateway);
  };

  useEffect(() => {
    getRandomGateway();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>IPFS Gateway Test</CardTitle>
        <p className="text-sm text-gray-600">
          Test the availability of different IPFS gateways to avoid security blocks
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testAllGateways} disabled={isTesting}>
            {isTesting ? 'Testing...' : 'Test All Gateways'}
          </Button>
          <Button onClick={getRandomGateway} variant="outline">
            Get Random Gateway
          </Button>
        </div>

        {randomGateway && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <strong>Random Working Gateway:</strong> {randomGateway}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold">Gateway Status:</h3>
          {gateways.map((gateway) => (
            <div key={gateway} className="flex items-center justify-between p-2 border rounded">
              <span className="font-mono text-sm">{gateway}</span>
              <div className="flex items-center gap-2">
                {testResults[gateway] !== undefined && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    testResults[gateway] 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {testResults[gateway] ? 'Working' : 'Failed'}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {getIPFSGatewayUrl('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', gateway)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-800">Benefits of Multiple Gateways:</h4>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• Reduces dependency on single gateway (Lighthouse)</li>
            <li>• Avoids malware detection and browser security blocks</li>
            <li>• Automatic fallback if one gateway fails</li>
            <li>• Better reliability and performance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}


