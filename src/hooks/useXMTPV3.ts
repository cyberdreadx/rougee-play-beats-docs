import { useState, useEffect, useCallback } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { useWalletClient } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';

export const useXMTPV3 = () => {
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { data: walletClient } = useWalletClient();
  const { authenticated } = usePrivy();

  // Step 1: Create an EOA signer (Phase I)
  const createEOASigner = useCallback(() => {
    if (!walletClient) return null;

    return {
      type: 'EOA',
      getAddress: async () => walletClient.account.address,
      getIdentifier: () => ({
        identifier: walletClient.account.address.toLowerCase(),
        identifierKind: 'Ethereum'
      }),
      signMessage: async (message: string | Uint8Array) => {
        let messageToSign: string;
        
        if (typeof message === 'string') {
          messageToSign = message;
        } else {
          // Convert Uint8Array to hex string
          messageToSign = Array.from(message)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          messageToSign = '0x' + messageToSign;
        }
        
        const signature = await walletClient.signMessage({ 
          message: messageToSign,
          account: walletClient.account 
        });
        
        // Convert hex signature to Uint8Array
        const signatureBytes = signature.startsWith('0x') 
          ? new Uint8Array(signature.slice(2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
          : new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        
        return signatureBytes;
      },
    };
  }, [walletClient]);

  // Step 2: Create XMTP client with appVersion (Phase I)
  const initXMTP = useCallback(async () => {
    if (!walletClient || !authenticated || isInitializing) return;

    try {
      setIsInitializing(true);
      console.log('🔄 Initializing XMTP V3 following official docs...');

      const signer = createEOASigner();
      if (!signer) throw new Error('Could not create signer');

      console.log('📍 Wallet address:', walletClient.account.address);

      // Create XMTP client with proper configuration
      const xmtp = await Client.create(signer, {
        env: 'production',
        appVersion: 'rougee-play-beats/1.0.0', // Required by docs
      });

      setXmtpClient(xmtp);
      console.log('✅ XMTP V3 client created successfully');
    } catch (error: any) {
      console.error('❌ XMTP initialization failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } finally {
      setIsInitializing(false);
    }
  }, [walletClient, authenticated, isInitializing, createEOASigner]);

  // Auto-initialize on wallet connection
  useEffect(() => {
    if (authenticated && walletClient && !xmtpClient) {
      initXMTP();
    }
  }, [authenticated, walletClient, xmtpClient, initXMTP]);

  // Step 3: Check if identity is reachable (Phase I)
  const isIdentityReachable = useCallback(async (address: string) => {
    try {
      // Create Identifier array as per XMTP docs
      const identifiers = [{
        identifier: address.toLowerCase(),
        identifierKind: 'Ethereum'
      }];
      
      // Use static Client.canMessage method as per docs
      const canMessage = await Client.canMessage(identifiers);
      // The response is a Map of string (identifier) => boolean (is reachable)
      return canMessage.get(address.toLowerCase()) || false;
    } catch (error) {
      console.error('Error checking if identity is reachable:', error);
      return false;
    }
  }, []);

  // Step 4: Create DM conversation (Phase I)
  const createDMConversation = useCallback(async (peerAddress: string) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    console.log('🔍 Creating DM conversation with:', peerAddress);
    
    // Check if peer is reachable first
    const isReachable = await isIdentityReachable(peerAddress);
    if (!isReachable) {
      throw new Error('This user is not reachable on XMTP');
    }

    // Get the peer's inbox ID first, then create DM
    const peerInboxId = await xmtpClient.getInboxIdByAddress(peerAddress.toLowerCase());
    const conversation = await xmtpClient.conversations.newDm(peerInboxId);
    
    console.log('✅ DM conversation created:', conversation);
    return conversation;
  }, [xmtpClient, isIdentityReachable]);

  // Step 5: Send messages (Phase I)
  const sendMessage = useCallback(async (conversation: any, content: string) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    console.log('📤 Sending message:', content);
    await conversation.send(content);
    console.log('✅ Message sent successfully');
  }, [xmtpClient]);

  // Get all conversations
  const getConversations = useCallback(async () => {
    if (!xmtpClient) return [];
    
    try {
      const conversations = await xmtpClient.conversations.list();
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }, [xmtpClient]);

  // Stream messages
  const streamMessages = useCallback(async (conversation: any, onMessage: (message: any) => void) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      const stream = await conversation.streamMessages();
      for await (const message of stream) {
        onMessage(message);
      }
    } catch (error) {
      console.error('Error streaming messages:', error);
    }
  }, [xmtpClient]);

  return {
    xmtpClient,
    isInitializing,
    isReady: !!xmtpClient,
    initXMTP,
    isIdentityReachable,
    createDMConversation,
    sendMessage,
    getConversations,
    streamMessages,
  };
};
