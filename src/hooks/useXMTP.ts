import { useState, useEffect, useCallback } from 'react';
import { Client, Conversation } from '@xmtp/xmtp-js';
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
      console.log('🔄 Initializing XMTP...');

      // Create XMTP client with Privy wallet
      const xmtp = await Client.create(walletClient, {
        env: 'production',
      });

      setXmtpClient(xmtp);
      console.log('✅ XMTP initialized for:', xmtp.address);
    } catch (error) {
      console.error('❌ XMTP initialization failed:', error);
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
    
    // Check if peer can receive messages
    const canMessage = await xmtpClient.canMessage(peerAddress);
    if (!canMessage) {
      throw new Error('This user has not enabled XMTP messaging');
    }

    const conversation = await xmtpClient.conversations.newConversation(peerAddress);
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
    
    for await (const message of await conversation.streamMessages()) {
      onMessage(message);
    }
  }, [xmtpClient]);

  // Check if address can receive messages
  const canMessage = useCallback(async (address: string) => {
    if (!xmtpClient) return false;
    return await xmtpClient.canMessage(address);
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
