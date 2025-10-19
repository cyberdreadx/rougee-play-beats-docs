import { useState, useEffect, useCallback } from 'react';
import { Client, ConsentState, type Signer } from '@xmtp/browser-sdk';
import { useWalletClient } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';

export const useXMTPV3 = () => {
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { data: walletClient } = useWalletClient();
  const { authenticated } = usePrivy();

  // Create an EOA signer following XMTP docs
  const createEOASigner = useCallback((): Signer | null => {
    if (!walletClient) return null;

    return {
      type: 'EOA' as const,
      getIdentifier: () => ({
        identifier: walletClient.account.address.toLowerCase(),
        identifierKind: 'Ethereum' as const
      }),
      signMessage: async (message: string): Promise<Uint8Array> => {
        console.log('🔐 Signing message for XMTP...');
        
        const signature = await walletClient.signMessage({ 
          message: message,
          account: walletClient.account 
        });
        
        console.log('✅ Message signed');
        
        // Convert hex signature to Uint8Array
        const hex = signature.startsWith('0x') ? signature.slice(2) : signature;
        const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        
        return bytes;
      },
    };
  }, [walletClient]);

  // Initialize XMTP client
  const initXMTP = useCallback(async () => {
    if (!walletClient || !authenticated) return;
    if (isInitializing || xmtpClient) return;

    try {
      setIsInitializing(true);
      console.log('🔄 Initializing XMTP V3...');

      const signer = createEOASigner();
      if (!signer) throw new Error('Could not create signer');

      console.log('📍 Wallet address:', walletClient.account.address);

      if (!window.indexedDB) {
        throw new Error('IndexedDB is not available. Please use a modern browser.');
      }

      console.log('🔧 Creating XMTP V3 client...');
      console.log('⏳ This may take 10-30 seconds on first setup...');
      
      const client = await Client.create(signer, {
        env: 'production',
        dbEncryptionKey: undefined,
      });

      setXmtpClient(client);
      console.log('✅ XMTP V3 client created successfully');
      
      // Sync conversations
      try {
        console.log('🔄 Syncing conversations...');
        await client.conversations.sync();
        console.log('✅ Conversations synced');
      } catch (syncError) {
        console.warn('⚠️ Could not sync conversations:', syncError);
      }

    } catch (error: any) {
      console.error('❌ XMTP initialization failed:', error);
      setXmtpClient(null);
    } finally {
      setIsInitializing(false);
    }
  }, [walletClient, authenticated, isInitializing, xmtpClient, createEOASigner]);

  // Auto-initialize on wallet connection
  useEffect(() => {
    if (authenticated && walletClient && !xmtpClient && !isInitializing) {
      initXMTP();
    }
  }, [authenticated, walletClient, xmtpClient, isInitializing, initXMTP]);

  // Check if address is reachable
  const isIdentityReachable = useCallback(async (address: string) => {
    if (!xmtpClient) return false;
    
    try {
      const canMsg = await xmtpClient.canMessage([{
        identifier: address.toLowerCase(),
        identifierKind: 'Ethereum'
      }]);
      return canMsg[address.toLowerCase()] || false;
    } catch (error) {
      console.error('Error checking if identity is reachable:', error);
      return false;
    }
  }, [xmtpClient]);

  // Create DM conversation
  const createDMConversation = useCallback(async (peerAddress: string) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    console.log('🔍 Creating DM conversation with:', peerAddress);
    
    try {
      // Create DM conversation directly with address
      const conversation = await xmtpClient.conversations.newDm(peerAddress.toLowerCase());
      
      // Add peerAddress to conversation for UI display
      (conversation as any).peerAddress = peerAddress;
      
      console.log('✅ DM conversation created');
      return conversation;
    } catch (error: any) {
      console.error('❌ Failed to create DM:', error);
      throw new Error(`Cannot message this address: ${error?.message || 'Unknown error'}`);
    }
  }, [xmtpClient]);

  // Send message
  const sendMessage = useCallback(async (conversation: any, content: string) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    console.log('📤 Sending message:', content);
    
    try {
      await conversation.send(content);
      console.log('✅ Message sent');
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      throw new Error(`Failed to send message: ${error?.message || 'Unknown error'}`);
    }
  }, [xmtpClient]);

  // Get all conversations
  const getConversations = useCallback(async () => {
    if (!xmtpClient) return [];
    
    try {
      console.log('🔄 Fetching conversations...');
      
      const conversations = await xmtpClient.conversations.list({
        consentStates: [ConsentState.Allowed, ConsentState.Unknown]
      });
      
      console.log('📬 Found conversations:', conversations.length);
      
      // Process conversations to extract participant data
      const processedConversations = [];
      
      for (const convo of conversations) {
        try {
          const conversationData: any = {
            id: convo.id,
            createdAt: convo.createdAt,
            consentState: convo.consentState,
            _conversationObject: convo,
          };
          
          // Get members if available
          if (convo.members && typeof convo.members === 'function') {
            const members = await convo.members();
            conversationData.members = members;
            
            // Extract wallet addresses from members
            const addresses = [];
            for (const member of members) {
              const memberInboxId = member.inboxId;
              
              if (memberInboxId) {
                try {
                  const inboxStates = await Client.inboxStateFromInboxIds([memberInboxId]);
                  if (inboxStates && inboxStates.length > 0) {
                    const ethereumIdentity = inboxStates[0].identifiers?.find(
                      (identity: any) => identity.kind === 'ETHEREUM' || identity.identifierKind === 'Ethereum'
                    );
                    if (ethereumIdentity && ethereumIdentity.identifier) {
                      addresses.push(ethereumIdentity.identifier);
                    } else {
                      addresses.push(memberInboxId);
                    }
                  } else {
                    addresses.push(memberInboxId);
                  }
                } catch (resolveError) {
                  console.warn('⚠️ Could not resolve inbox ID:', memberInboxId);
                  addresses.push(memberInboxId);
                }
              }
            }
            
            conversationData.participants = addresses;
            console.log('✅ Found member addresses:', addresses);
          }
          
          processedConversations.push(conversationData);
        } catch (processError) {
          console.warn('⚠️ Error processing conversation:', convo.id, processError);
          processedConversations.push({
            id: convo.id,
            _conversationObject: convo,
          });
        }
      }
      
      return processedConversations;
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      return [];
    }
  }, [xmtpClient]);

  // Get DMs specifically
  const getDMs = useCallback(async () => {
    if (!xmtpClient) return [];
    
    try {
      const dms = await xmtpClient.conversations.listDms({
        consentStates: [ConsentState.Allowed]
      });
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
      const groups = await xmtpClient.conversations.listGroups({
        consentStates: [ConsentState.Allowed]
      });
      return groups;
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      return [];
    }
  }, [xmtpClient]);

  // Stream conversations
  const streamConversations = useCallback(async (onConversation: (conversation: any) => void) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Setting up conversation streaming...');
      
      const stream = await xmtpClient.conversations.stream({
        onValue: (conversation: any) => {
          console.log('📬 New conversation received via stream');
          onConversation(conversation);
        },
        onError: (error: any) => {
          console.error('Stream error:', error);
        },
      });
      
      return stream;
    } catch (error) {
      console.error('Error streaming conversations:', error);
    }
  }, [xmtpClient]);

  // Stream messages
  const streamMessages = useCallback(async (conversation: any, onMessage: (message: any) => void) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Setting up message streaming...');
      
      const stream = await xmtpClient.conversations.streamAllMessages({
        consentStates: [ConsentState.Allowed],
        retryAttempts: 6,
        retryDelay: 10000,
        retryOnFail: true,
        onValue: (message: any) => {
          if (message.conversationId === conversation.id) {
            console.log('📬 New message received via stream');
            onMessage(message);
          }
        },
        onError: (error: any) => {
          console.error('Stream error:', error);
        },
      });
      
      return stream;
    } catch (error) {
      console.error('Error streaming messages:', error);
    }
  }, [xmtpClient]);

  // Sync conversation
  const syncConversation = useCallback(async (conversation: any) => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Syncing conversation:', conversation.id);
      await conversation.sync();
      console.log('✅ Conversation synced');
    } catch (error) {
      console.error('❌ Error syncing conversation:', error);
      throw error;
    }
  }, [xmtpClient]);

  // Sync all conversations
  const syncConversations = useCallback(async () => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Syncing all conversations...');
      await xmtpClient.conversations.sync();
      console.log('✅ All conversations synced');
    } catch (error) {
      console.error('❌ Error syncing conversations:', error);
      throw error;
    }
  }, [xmtpClient]);

  // Sync all data
  const syncAll = useCallback(async () => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Syncing all data...');
      await xmtpClient.conversations.sync();
      console.log('✅ All data synced');
    } catch (error) {
      console.error('❌ Error syncing all data:', error);
      throw error;
    }
  }, [xmtpClient]);

  // Trigger history sync
  const triggerHistorySync = useCallback(async () => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Triggering history sync...');
      
      await xmtpClient.conversations.sync();
      
      const conversations = await xmtpClient.conversations.list({
        consentStates: [ConsentState.Allowed]
      });
      console.log('📬 Found conversations after sync:', conversations.length);
      
      // Process conversations
      const processedConversations = [];
      
      for (const conversation of conversations) {
        try {
          await conversation.sync();
          
          const conversationData: any = {
            id: conversation.id,
            createdAt: conversation.createdAt,
            consentState: conversation.consentState,
            _conversationObject: conversation,
          };
          
          if (conversation.members && typeof conversation.members === 'function') {
            const members = await conversation.members();
            conversationData.members = members;
            
            const addresses = [];
            for (const member of members) {
              const memberInboxId = member.inboxId;
              
              if (memberInboxId) {
                try {
                  const inboxStates = await Client.inboxStateFromInboxIds([memberInboxId]);
                  if (inboxStates && inboxStates.length > 0) {
                    const ethereumIdentity = inboxStates[0].identifiers?.find(
                      (identity: any) => identity.kind === 'ETHEREUM' || identity.identifierKind === 'Ethereum'
                    );
                    if (ethereumIdentity && ethereumIdentity.identifier) {
                      addresses.push(ethereumIdentity.identifier);
                    } else {
                      addresses.push(memberInboxId);
                    }
                  } else {
                    addresses.push(memberInboxId);
                  }
                } catch (resolveError) {
                  console.warn('⚠️ Could not resolve inbox ID:', memberInboxId);
                  addresses.push(memberInboxId);
                }
              }
            }
            
            conversationData.participants = addresses;
          }
          
          processedConversations.push(conversationData);
        } catch (msgError) {
          console.warn('⚠️ Could not sync conversation:', conversation.id, msgError);
        }
      }
      
      console.log('✅ History sync completed');
      return processedConversations;
    } catch (error) {
      console.error('❌ Error during history sync:', error);
      throw error;
    }
  }, [xmtpClient]);

  // Clear XMTP storage
  const clearXMTPStorage = useCallback(async () => {
    try {
      console.log('🗑️ Clearing XMTP storage...');
      
      if (window.indexedDB) {
        const deleteRequest = indexedDB.deleteDatabase('xmtp');
        deleteRequest.onsuccess = () => {
          console.log('✅ XMTP IndexedDB cleared');
        };
        deleteRequest.onerror = () => {
          console.warn('⚠️ Could not clear XMTP IndexedDB');
        };
      }
      
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

  // Revoke other installations
  const revokeOtherInstallations = useCallback(async () => {
    if (!xmtpClient) throw new Error('XMTP client not initialized');
    
    try {
      console.log('🔄 Revoking other installations...');
      await xmtpClient.revokeInstallations([]);
      console.log('✅ Other installations revoked');
      return true;
    } catch (error) {
      console.error('❌ Error revoking installations:', error);
      return false;
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
