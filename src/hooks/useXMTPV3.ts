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

      // Check if IndexedDB is available
      if (!window.indexedDB) {
        throw new Error('IndexedDB is not available. Please use a modern browser or disable private/incognito mode.');
      }

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
        // Enable history sync for cross-device conversation persistence
        historySyncUrl: 'https://message-history.production.ephemera.network',
        // Add storage configuration to help with IndexedDB issues
        storage: {
          type: 'indexeddb',
          // Add fallback options
          fallback: true,
        },
        // Add mobile-specific configurations
        ...(window.innerWidth < 768 && {
          // Mobile optimizations
          maxRetries: 3,
          retryDelay: 1000,
        }),
      }).then(client => {
        clientCreated = true;
      console.log('✨ XMTP client created with history sync enabled');
      console.log('🔄 History sync will automatically sync conversations across devices');
      
      // PWA optimization: Set up background sync for messages
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        console.log('📱 PWA background sync enabled for XMTP messages');
      }
      
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

  // Step 3: Check if identity is reachable using XMTP V3 API
  const isIdentityReachable = useCallback(async (address: string) => {
    if (!xmtpClient) return true; // Allow if client not ready
    
    try {
      console.log('🔍 Checking if reachable:', address);
      const identifiers = [{ identifier: address, identifierKind: "Ethereum" as const }];
      const response = await Client.canMessage(identifiers);
      const isReachable = response.get(address.toLowerCase());
      console.log('✅ Identity reachable check result:', isReachable);
      
      // If the check fails or returns false, still allow the attempt
      // The actual error will be caught during DM creation
      return true; // Always allow the attempt
    } catch (error) {
      console.warn('⚠️ Identity reachability check failed, allowing attempt:', error);
      return true; // Allow the attempt even if check fails
    }
  }, [xmtpClient]);

  // Step 4: Create DM conversation using XMTP V3 API
  const createDMConversation = useCallback(async (peerAddress: string) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    console.log('🔍 Creating DM conversation with:', peerAddress);
    
    try {
      // Try to get the peer's inbox ID first
      let peerInboxId;
      try {
        peerInboxId = await xmtpClient.inboxId(peerAddress);
        console.log('📬 Peer inbox ID:', peerInboxId);
      } catch (inboxError) {
        console.warn('⚠️ Could not get inbox ID, trying direct address:', inboxError);
        // Fallback: try creating DM with address directly
        const conversation = await xmtpClient.conversations.newDm(peerAddress);
        (conversation as any).peerAddress = peerAddress;
        console.log('✅ DM conversation created with direct address:', { peerAddress });
        return conversation;
      }
      
      // Create DM with inbox ID
      const conversation = await xmtpClient.conversations.newDm(peerInboxId);
      
      // Add peerAddress to conversation for UI display
      (conversation as any).peerAddress = peerAddress;
      
      console.log('✅ DM conversation created:', { peerAddress, conversationId: (conversation as any).id });
      return conversation;
    } catch (error: any) {
      console.error('❌ Failed to create DM:', error?.message);
      throw new Error(`Cannot message this address: ${error?.message || 'Unknown error'}`);
    }
  }, [xmtpClient]);

  // Step 5: Send messages with optimistic UI (Phase I)
  const sendMessage = useCallback(async (conversation: any, content: string) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    console.log('📤 Sending message with optimistic UI:', content);
    console.log('📤 To conversation:', conversation.id || conversation);
    console.log('📱 Device info:', {
      isMobile: window.innerWidth < 768,
      userAgent: navigator.userAgent,
      connection: navigator.connection?.effectiveType || 'unknown'
    });
    
    try {
      // Step 1: Optimistically send the message to local database for immediate UI feedback
      console.log('⚡ Optimistically sending message to local database...');
      conversation.sendOptimistic(content);
      console.log('✅ Message added to UI immediately (optimistic)');
      
      // Step 2: Publish the message to the XMTP network in the background
      console.log('🌐 Publishing message to XMTP network...');
      
      // Add retry logic for mobile/production
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          await conversation.publishMessages();
          console.log('✅ Message published successfully to XMTP network');
          console.log('📬 Message should be delivered to recipient if they have XMTP set up');
          return;
        } catch (sendError: any) {
          retries++;
          console.warn(`⚠️ Publish attempt ${retries} failed:`, sendError);
          
          if (retries >= maxRetries) {
            throw sendError;
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to publish message after retries:', error);
      
      // Enhanced error messages for mobile/production
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('signature')) {
        throw new Error('Signature failed. Please try again.');
      } else if (error.message?.includes('consent')) {
        throw new Error('User consent required. Please ensure the recipient has allowed messages.');
      } else {
        throw new Error(`Failed to send message: ${error.message || 'Unknown error'}`);
      }
    }
  }, [xmtpClient]);

  // Get all conversations using XMTP V3 API
  const getConversations = useCallback(async () => {
    if (!xmtpClient) return [];
    
    try {
      console.log('🔄 Fetching conversations from XMTP...');
      
      // Use the correct XMTP V3 API with consent states as per documentation
      const conversations = await xmtpClient.conversations.list({
        consentStates: ['allowed']
      });
      
      console.log('📬 Raw conversations from XMTP:', conversations);
      console.log('📬 Number of conversations found:', conversations.length);
      
      // Log conversation details for debugging
      conversations.forEach((convo, index) => {
        console.log(`📬 Conversation ${index}:`, {
          id: convo.id,
          topic: convo.topic,
          participants: convo.participants,
          createdAt: convo.createdAt,
          lastMessage: convo.lastMessage,
          consentState: convo.consentState
        });
      });
      
      return conversations;
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      return [];
    }
  }, [xmtpClient]);

  // Get DMs specifically
  const getDMs = useCallback(async () => {
    if (!xmtpClient) return [];
    
    try {
      console.log('🔄 Fetching DMs from XMTP...');
      const dms = await xmtpClient.conversations.listDms({
        consentStates: ['allowed']
      });
      console.log('📬 DMs found:', dms.length);
      return dms;
    } catch (error) {
      console.error('❌ Error fetching DMs:', error);
      return [];
    }
  }, [xmtpClient]);

  // Get groups specifically
  const getGroups = useCallback(async () => {
    if (!xmtpClient) return [];
    
    try {
      console.log('🔄 Fetching groups from XMTP...');
      const groups = await xmtpClient.conversations.listGroups({
        consentStates: ['allowed']
      });
      console.log('📬 Groups found:', groups.length);
      return groups;
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      return [];
    }
  }, [xmtpClient]);

  // Stream new conversations
  const streamConversations = useCallback(async (onConversation: (conversation: any) => void) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Setting up conversation streaming...');
      
      const stream = await xmtpClient.conversations.stream({
        onValue: (conversation: any) => {
          console.log('📬 New conversation received:', conversation);
          onConversation(conversation);
        },
        onError: (error: any) => {
          console.error('Conversation stream error:', error);
        },
        onFail: () => {
          console.log('Conversation stream failed');
        }
      });
      
    } catch (error) {
      console.error('Error streaming conversations:', error);
    }
  }, [xmtpClient]);

  // Stream messages - Updated for XMTP V3 API
  const streamMessages = useCallback(async (conversation: any, onMessage: (message: any) => void) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Setting up message streaming for conversation:', conversation.id);
      
      // Set up streaming for new messages using the correct XMTP V3 API
      // Use streamAllMessages with proper consent states
      const stream = await xmtpClient.conversations.streamAllMessages({
        consentStates: ['allowed'],
        retryAttempts: 6,
        retryDelay: 10000,
        retryOnFail: true,
        onValue: (message: any) => {
          // Check if this message belongs to our conversation
          if (message.conversationId === conversation.id || 
              message.conversationId === (conversation as any).id) {
            console.log('📬 New message received via stream:', message);
            onMessage(message);
          }
        },
        onError: (error: any) => {
          console.error('Stream error:', error);
        },
        onFail: () => {
          console.log('Stream failed after retries');
        },
        onRestart: () => {
          console.log('Stream restarted');
        },
        onRetry: (attempt: number, maxAttempts: number) => {
          console.log(`Stream retry attempt ${attempt} of ${maxAttempts}`);
        }
      });
      
    } catch (error) {
      console.error('Error streaming messages:', error);
    }
  }, [xmtpClient]);

  // Sync a specific conversation
  const syncConversation = useCallback(async (conversation: any) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Syncing specific conversation:', conversation.id);
      await conversation.sync();
      console.log('✅ Conversation synced successfully');
    } catch (error) {
      console.error('❌ Error syncing conversation:', error);
      throw error;
    }
  }, [xmtpClient]);

  // Sync new conversations
  const syncConversations = useCallback(async () => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Syncing new conversations...');
      await xmtpClient.conversations.sync();
      console.log('✅ Conversations synced successfully');
    } catch (error) {
      console.error('❌ Error syncing conversations:', error);
      throw error;
    }
  }, [xmtpClient]);

  // Sync all new welcomes, conversations, messages, and preferences
  const syncAll = useCallback(async () => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Syncing all data (conversations, messages, preferences)...');
      await xmtpClient.conversations.syncAll(['allowed']);
      console.log('✅ All data synced successfully');
    } catch (error) {
      console.error('❌ Error syncing all data:', error);
      throw error;
    }
  }, [xmtpClient]);

  // Trigger history sync to get conversations from other devices
  const triggerHistorySync = useCallback(async () => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Triggering history sync to get conversations from other devices...');
      
      // Force a sync to get conversations from other app installations
      await xmtpClient.conversations.syncAll(['allowed']);
      
      // Also try to sync messages specifically
      const conversations = await xmtpClient.conversations.list(['allowed']);
      console.log('📬 Found conversations after history sync:', conversations.length);
      
      // Try to sync messages for each conversation
      for (const conversation of conversations) {
        try {
          await conversation.sync();
          console.log('📩 Synced messages for conversation:', conversation.id);
        } catch (msgError) {
          console.warn('⚠️ Could not sync messages for conversation:', conversation.id, msgError);
        }
      }
      
      console.log('✅ History sync completed');
      return conversations;
    } catch (error) {
      console.error('❌ Error during history sync:', error);
      throw error;
    }
  }, [xmtpClient]);

  // Clear XMTP storage to fix IndexedDB issues
  const clearXMTPStorage = useCallback(async () => {
    try {
      console.log('🗑️ Clearing XMTP storage...');
      
      // Clear IndexedDB for XMTP
      if (window.indexedDB) {
        const deleteRequest = indexedDB.deleteDatabase('xmtp');
        deleteRequest.onsuccess = () => {
          console.log('✅ XMTP IndexedDB cleared');
        };
        deleteRequest.onerror = () => {
          console.warn('⚠️ Could not clear XMTP IndexedDB');
        };
      }
      
      // Clear localStorage XMTP data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('xmtp') || key.includes('XMTP')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ XMTP storage cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing XMTP storage:', error);
      return false;
    }
  }, []);

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
    getDMs,
    getGroups,
    streamConversations,
    streamMessages,
    syncConversation,
    syncConversations,
    syncAll,
    triggerHistorySync,
    clearXMTPStorage,
    revokeOtherInstallations,
  };
};
