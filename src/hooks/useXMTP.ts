import { useState, useEffect, useCallback } from 'react';
import { Client } from '@xmtp/browser-sdk';
import type { Conversation } from '@xmtp/browser-sdk';
import { useWalletClient } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';

export const useXMTP = () => {
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { data: walletClient } = useWalletClient();
  const { authenticated } = usePrivy();

  // Initialize XMTP client
  const initXMTP = useCallback(async () => {
    if (!walletClient || !authenticated || isInitializing) return;

    try {
      setIsInitializing(true);
      console.log('🔄 Initializing XMTP V3...');
      console.log('📍 Wallet address:', walletClient.account.address);

      // Create a signer adapter for XMTP V3
      const signer = {
        type: 'EOA',
        getIdentifier: () => {
          console.log('📍 getIdentifier called');
          return {
            identifier: walletClient.account.address.toLowerCase(),
            identifierKind: 'Ethereum'
          };
        },
        getAddress: async () => {
          console.log('📍 getAddress called');
          return walletClient.account.address;
        },
        signMessage: async (message: string | Uint8Array) => {
          console.log('✍️ signMessage called');
          try {
            let signature: string;
            
            if (typeof message === 'string') {
              console.log('📝 Signing string message');
              signature = await walletClient.signMessage({ 
                message: message,
                account: walletClient.account 
              });
            } else {
              console.log('📝 Signing Uint8Array message');
              signature = await walletClient.signMessage({ 
                message: { raw: message },
                account: walletClient.account 
              });
            }
            
            console.log('✅ Signature obtained');
            
            // Convert hex signature to Uint8Array (bytes)
            const signatureBytes = signature.startsWith('0x') 
              ? new Uint8Array(signature.slice(2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
              : new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
            
            return signatureBytes;
          } catch (signError) {
            console.error('❌ Signature error:', signError);
            throw signError;
          }
        },
      };

      console.log('🔧 Creating XMTP V3 client...');
      
      // Create XMTP V3 client with proper signer
      const xmtp = await Client.create(signer as any, {
        env: 'production',
      });

      setXmtpClient(xmtp);
      console.log('✅ XMTP V3 initialized for:', await signer.getAddress());
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
  }, [walletClient, authenticated, isInitializing]);

  // Auto-initialize on wallet connection
  useEffect(() => {
    if (authenticated && walletClient && !xmtpClient) {
      initXMTP();
    }
  }, [authenticated, walletClient, xmtpClient, initXMTP]);

  // Get all conversations
  const getConversations = useCallback(async () => {
    if (!xmtpClient) return [];
    const conversations = await xmtpClient.conversations.list();
    return conversations;
  }, [xmtpClient]);

  // Start a new conversation
  const startConversation = useCallback(async (peerAddress: string) => {
    if (!xmtpClient) throw new Error('XMTP not initialized');
    
    console.log('🔍 Starting conversation with:', peerAddress);
    
    // Convert address to lowercase
    const addressLower = peerAddress.toLowerCase();
    
    // Check if peer can receive messages
    console.log('📬 Checking if peer can receive messages...');
    const canMsg = await xmtpClient.canMessage([addressLower]);
    console.log('📬 Can message result:', canMsg);
    
    if (!canMsg[addressLower]) {
      throw new Error('This user has not enabled XMTP messaging');
    }

    console.log('🔑 Creating Identifier struct...');
    
    // Create the Identifier struct as expected by XMTP V3
    const recipientIdentifier = {
      identifier: addressLower,
      identifierKind: "Ethereum"
    };
    
    console.log('📬 Recipient identifier:', recipientIdentifier);
    console.log('💬 Creating DM conversation...');
    
    // Use newDmWithIdentifier for V3
    const conversation = await xmtpClient.conversations.newDmWithIdentifier(recipientIdentifier);
    
    console.log('✅ Conversation created:', conversation);
    return conversation;
  }, [xmtpClient]);

  // Send a message
  const sendMessage = useCallback(async (
    conversation: Conversation,
    content: string
  ) => {
    if (!xmtpClient) throw new Error('XMTP not initialized');
    await conversation.send(content);
  }, [xmtpClient]);

  // Stream messages (real-time)
  const streamMessages = useCallback(async (
    conversation: Conversation,
    onMessage: (message: any) => void
  ) => {
    if (!xmtpClient) throw new Error('XMTP not initialized');
    
    const stream = await conversation.streamMessages();
    for await (const message of stream) {
      onMessage(message);
    }
  }, [xmtpClient]);

  // Check if address can receive messages
  const canMessage = useCallback(async (address: string) => {
    if (!xmtpClient) return false;
    const result = await xmtpClient.canMessage([address]);
    return result[address] || false;
  }, [xmtpClient]);

  return {
    xmtpClient,
    isInitializing,
    isReady: !!xmtpClient,
    initXMTP,
    getConversations,
    startConversation,
    sendMessage,
    streamMessages,
    canMessage,
  };
};
