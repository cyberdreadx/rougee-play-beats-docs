import { useState, useEffect, useCallback } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { useWalletClient } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';

export const useXMTPV3 = () => {
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { data: walletClient } = useWalletClient();
  const { authenticated } = usePrivy();

  // Step 1: Create an EOA signer following XMTP docs exactly
  const createEOASigner = useCallback(() => {
    if (!walletClient) return null;

    return {
      type: 'EOA' as const,
      getIdentifier: () => ({
        identifier: walletClient.account.address.toLowerCase(),
        identifierKind: 'Ethereum' as const
      }),
      signMessage: async (message: string): Promise<Uint8Array> => {
        console.log('🔐 Signing message for XMTP...');
        
        // Sign the message using the wallet client
        const signature = await walletClient.signMessage({ 
          message: message,
          account: walletClient.account 
        });
        
        console.log('✅ Message signed');
        
        // Convert hex signature to Uint8Array (bytes)
        const hex = signature.startsWith('0x') ? signature.slice(2) : signature;
        const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        
        return bytes;
      },
    };
  }, [walletClient]);

  // Step 2: Create XMTP client with appVersion (Phase I)
  const initXMTP = useCallback(async () => {
    if (!walletClient || !authenticated) return;
    if (isInitializing || xmtpClient) return; // Guard inside instead of deps

    try {
      setIsInitializing(true);
      console.log('🔄 Initializing XMTP V3 following official docs...');

      const signer = createEOASigner();
      if (!signer) throw new Error('Could not create signer');

      console.log('📍 Wallet address:', walletClient.account.address);

      // Create XMTP client with proper configuration and longer timeout
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          console.error('⏱️  XMTP taking too long (60+ seconds)');
          reject(new Error('XMTP initialization timeout after 60 seconds - check browser storage'));
        }, 60000);
        return () => clearTimeout(timeoutId);
      });

      console.log('🔧 Creating XMTP V3 client with signer...');
      console.log('⏳ This may take 10-30 seconds on first setup...');
      console.log('📝 You may be asked to sign a message in your wallet - please approve it');
      
      let clientCreated = false;
      const clientPromise = Client.create(signer, {
        env: 'production', // Production network - matches your friend's setup
        appVersion: 'rougee-play-beats/1.0.0', // Required by docs
        disableAutoRegister: false, // Allow automatic registration
        loggingLevel: 'debug', // Better diagnostics
      }).then(client => {
        clientCreated = true;
        console.log('✨ XMTP client created, finalizing...');
        return client;
      });
      
      const xmtp = await Promise.race([
        clientPromise,
        timeoutPromise
      ]);

      setXmtpClient(xmtp);
      console.log('✅ XMTP V3 client created successfully');
      
      // Force identity sync to ensure registration on network
      try {
        console.log('🔄 Syncing identity with network...');
        await xmtp.conversations.syncAll(['allowed']);
        console.log('✅ Identity synced with network');
      } catch (syncError) {
        console.warn('⚠️ Sync error (non-critical):', syncError);
      }
    } catch (error: any) {
      console.error('❌ XMTP initialization failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Check for storage errors
      if (error.message?.includes('NoModificationAllowedError') || 
          error.message?.includes('storage') ||
          error.message?.includes('IndexedDB') ||
          error.message?.includes('vfs error')) {
        console.error('💾 STORAGE ERROR DETECTED:');
        console.error('XMTP needs IndexedDB to work. Try these fixes:');
        console.error('');
        console.error('1️⃣  Check if you\'re in private/incognito mode → Switch to normal mode');
        console.error('2️⃣  Clear browser storage:');
        console.error('   - Press F12 to open DevTools');
        console.error('   - Go to "Application" tab');
        console.error('   - Click "Storage" → "Clear site data"');
        console.error('   - Refresh the page');
        console.error('3️⃣  Try a different browser or fresh profile');
        console.error('');
        console.error('If none work, messaging won\'t work in this browser session.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [walletClient, authenticated, createEOASigner]);

  // Auto-initialize on wallet connection
  useEffect(() => {
    if (authenticated && walletClient && !xmtpClient && !isInitializing) {
      console.log('🚀 Starting XMTP initialization...');
      initXMTP();
    }
  }, [authenticated, walletClient, xmtpClient, isInitializing]);

  // Step 3: Check if identity is reachable (simplified - just assume reachable)
  const isIdentityReachable = useCallback(async (address: string) => {
    // For now, assume all addresses are reachable
    // The actual check happens when we try to create the DM
    console.log('🔍 Checking if reachable:', address);
    console.log('✅ Assuming address is reachable (will verify on DM creation)');
    return true;
  }, []);

  // Step 4: Create DM conversation (Phase I)
  const createDMConversation = useCallback(async (peerAddress: string) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    console.log('🔍 Creating DM conversation with:', peerAddress);
    
    try {
      // Create DM directly with address - XMTP handles the inbox ID lookup
      const conversation = await xmtpClient.conversations.newDm(peerAddress.toLowerCase());
      
      // Add peerAddress to conversation for UI display
      (conversation as any).peerAddress = peerAddress;
      
      console.log('✅ DM conversation created:', { peerAddress, conversationId: (conversation as any).id });
      return conversation;
    } catch (error: any) {
      console.error('❌ Failed to create DM:', error?.message);
      throw new Error(`Cannot message this address: ${error?.message || 'Unknown error'}`);
    }
  }, [xmtpClient]);

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

  // Revoke all other installations to free up space
  const revokeOtherInstallations = useCallback(async () => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🗑️ Revoking other installations...');
      await xmtpClient.revokeAllOtherInstallations();
      console.log('✅ Other installations revoked successfully');
    } catch (error) {
      console.error('❌ Error revoking installations:', error);
      throw error;
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
    revokeOtherInstallations,
  };
};
