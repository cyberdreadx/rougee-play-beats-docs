import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXMTPV3 } from '@/hooks/useXMTPV3';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getIPFSGatewayUrl } from '@/lib/ipfs';
import { toast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';

interface ProfileData {
  artist_name: string | null;
  avatar_cid: string | null;
  wallet_address: string;
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const { fullAddress } = useWallet();
  const { 
    xmtpClient,
    isInitializing,
    isReady,
    isIdentityReachable,
    createDMConversation,
    sendMessage,
    getConversations,
    streamConversations,
    streamMessages,
    syncConversations,
    syncAll,
    triggerHistorySync,
    clearXMTPStorage,
    revokeOtherInstallations
  } = useXMTPV3();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newChatAddress, setNewChatAddress] = useState('');
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('xmtp-conversations');
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        setConversations(parsed);
        console.log('📬 Loaded saved conversations from localStorage:', parsed.length);
      } catch (error) {
        console.error('Error loading saved conversations:', error);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('xmtp-conversations', JSON.stringify(conversations));
      console.log('💾 Saved conversations to localStorage:', conversations.length);
    }
  }, [conversations]);

  // Load conversations on mount and when XMTP client changes
  useEffect(() => {
    if (isReady && xmtpClient) {
      console.log('📬 XMTP ready, loading existing conversations...');
      loadConversations();
    } else if (!xmtpClient) {
      console.log('⏳ Waiting for XMTP client...');
    }
  }, [isReady, xmtpClient]);

  // Handle ?to= query parameter
  useEffect(() => {
    const toAddress = searchParams.get('to');
    if (toAddress && isReady) {
      const existingConvo = conversations.find(
        c => c.peerAddress.toLowerCase() === toAddress.toLowerCase()
      );
      if (existingConvo) {
        setSelectedConvo(existingConvo);
      } else {
        // Just populate the field, don't auto-start
        setNewChatAddress(toAddress);
      }
    }
  }, [searchParams, isReady, conversations]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConvo) {
      loadMessages(selectedConvo);
    }
  }, [selectedConvo]);

  // Helper function to resolve inbox ID to wallet address
  // Using the official XMTP API: client.preferences.inboxStateFromInboxIds()
  // Reference: https://docs.xmtp.org/chat-apps/core-messaging/manage-inboxes
  const resolveInboxIdToAddress = async (inboxId: string): Promise<string> => {
    if (!xmtpClient) {
      console.warn('⚠️ XMTP client not available for resolution');
      return inboxId;
    }
    
    // Check if it's already a wallet address
    if (inboxId.match(/^0x[a-fA-F0-9]{40}$/)) {
      console.log('✅ Already a wallet address:', inboxId);
      return inboxId;
    }
    
    // Resolve inbox ID to wallet address using official XMTP API
    try {
      console.log('🔍 Resolving inbox ID to wallet address:', inboxId);
      
      // Fetch the state of the inbox using the official XMTP method
      if (xmtpClient.preferences && typeof xmtpClient.preferences.inboxStateFromInboxIds === 'function') {
        console.log('🔍 Calling client.preferences.inboxStateFromInboxIds()...');
        
        const inboxStates = await xmtpClient.preferences.inboxStateFromInboxIds([inboxId], true);
        console.log('📊 Inbox states received:', inboxStates);
        
        if (inboxStates && inboxStates.length > 0) {
          const inboxState = inboxStates[0];
          console.log('📊 Inbox state:', inboxState);
          
          // Extract the Ethereum wallet address from the identifiers
          if (inboxState.identifiers && Array.isArray(inboxState.identifiers)) {
            const ethereumIdentity = inboxState.identifiers.find(
              (identity: any) => identity.kind === 'ETHEREUM' || identity.identifierKind === 'Ethereum'
            );
            
            if (ethereumIdentity && ethereumIdentity.identifier) {
              const walletAddress = ethereumIdentity.identifier;
              console.log('✅ Successfully resolved inbox ID to wallet address:', walletAddress);
              return walletAddress;
            } else {
              console.warn('⚠️ No Ethereum identity found in inbox state');
            }
          } else {
            console.warn('⚠️ No identifiers array in inbox state');
          }
        } else {
          console.warn('⚠️ No inbox states returned');
        }
      } else {
        console.warn('⚠️ client.preferences.inboxStateFromInboxIds method not available');
        console.log('📊 Available client properties:', Object.keys(xmtpClient));
        if (xmtpClient.preferences) {
          console.log('📊 Available preferences methods:', Object.keys(xmtpClient.preferences));
        }
      }
    } catch (error: any) {
      console.error('❌ Error resolving inbox ID:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
    }
    
    console.log('⚠️ Resolution failed, returning original inbox ID');
    return inboxId; // Return original if resolution fails
  };

  const loadConversations = async () => {
    try {
      console.log('🔄 Loading conversations from XMTP...');
      
      // First sync to get latest conversations
      try {
        console.log('🔄 Syncing conversations first...');
        await syncConversations();
        console.log('✅ Conversations synced');
      } catch (syncError) {
        console.warn('⚠️ Sync failed, continuing with existing data:', syncError);
      }
      
      // Then load conversations from XMTP
      const xmtpConvos = await getConversations();
      console.log('📬 Found XMTP conversations:', xmtpConvos.length);
      console.log('📬 Raw XMTP conversations data:', xmtpConvos);
      
      // Merge with saved conversations to ensure persistence
      const savedConvos = JSON.parse(localStorage.getItem('xmtp-conversations') || '[]');
      console.log('📬 Found saved conversations:', savedConvos.length);
      
      // If XMTP returned empty but we have saved conversations, use those
      let convos = xmtpConvos;
      if (xmtpConvos.length === 0 && savedConvos.length > 0) {
        console.log('📬 Using saved conversations since XMTP returned empty');
        convos = savedConvos;
      } else if (xmtpConvos.length > 0 && savedConvos.length > 0) {
        // Combine and deduplicate conversations
        const allConversations = [...xmtpConvos, ...savedConvos];
        const uniqueConversations = allConversations.filter((convo, index, self) => 
          index === self.findIndex(c => c.id === convo.id || c.peerAddress === convo.peerAddress)
        );
        convos = uniqueConversations;
        console.log('📬 Combined XMTP and saved conversations:', convos.length);
      }
      
      console.log('📬 Final conversations to process:', convos.length);
      
      // Add peerAddress to each conversation for UI display
      const conversationsWithPeerAddress = await Promise.all(convos.map(async (convo: any) => {
        console.log('🔍 Processing conversation:', convo);
        console.log('🔍 Conversation type:', convo.isDm ? 'DM' : convo.isGroup ? 'Group' : 'Unknown');
        
        // Try multiple ways to extract peer address
        let peerAddress = convo.peerAddress;
        
        // First, check if the existing peerAddress is valid or needs resolution
        if (peerAddress && peerAddress !== 'Unknown' && peerAddress !== 'unknown') {
          // Check if it's a valid wallet address (42 chars with 0x)
          if (peerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            console.log('✅ Found valid wallet address:', peerAddress);
          }
          // Check if it's an inbox ID (64 chars, no 0x prefix)
          else if (peerAddress.length === 64 && peerAddress.match(/^[a-f0-9]{64}$/)) {
            console.log('🔍 Found inbox ID in peerAddress, resolving:', peerAddress);
            peerAddress = await resolveInboxIdToAddress(peerAddress);
            console.log('✅ Resolved peerAddress to wallet address:', peerAddress);
          } else {
            console.log('⚠️ peerAddress has unexpected format:', peerAddress);
          }
        }
        // If peerAddress is unknown but we have participants array, try to resolve from there
        if ((peerAddress === 'Unknown' || peerAddress === 'unknown' || !peerAddress) && 
            convo.participants && Array.isArray(convo.participants) && convo.participants.length > 0) {
          console.log('🔍 Checking participants array:', convo.participants);
          const otherParticipant = convo.participants.find((p: string) => 
            p && p.toLowerCase() !== fullAddress?.toLowerCase()
          );
          if (otherParticipant) {
            // Check if it's a wallet address (42 chars with 0x)
            if (otherParticipant.match(/^0x[a-fA-F0-9]{40}$/)) {
              peerAddress = otherParticipant;
              console.log('✅ Found wallet address from participants:', peerAddress);
            }
            // Check if it's an inbox ID (64 chars, no 0x prefix)
            else if (otherParticipant.length === 64 && otherParticipant.match(/^[a-f0-9]{64}$/)) {
              console.log('🔍 Found inbox ID in participants, resolving:', otherParticipant);
              peerAddress = await resolveInboxIdToAddress(otherParticipant);
              console.log('✅ Resolved participant to wallet address:', peerAddress);
            } else {
              peerAddress = otherParticipant;
              console.log('✅ Found peerAddress from participants:', peerAddress);
            }
          } else {
            console.log('⚠️ No other participant found in participants array');
            console.log('🔍 Your address:', fullAddress);
            console.log('🔍 All participants:', convo.participants);
          }
        }
        // Method 3: If this is a group conversation, use the first participant that's not us
        else if (convo.isGroup && convo.members && Array.isArray(convo.members) && convo.members.length > 0) {
          console.log('🔍 This is a group, checking members:', convo.members);
          const otherMember = convo.members.find((m: any) => {
            const memberAddress = m.address || m.inboxId;
            return memberAddress && memberAddress.toLowerCase() !== fullAddress?.toLowerCase();
          });
          if (otherMember) {
            const memberIdentifier = otherMember.address || otherMember.inboxId;
            if (memberIdentifier.match(/^0x[a-fA-F0-9]{40}$/)) {
              peerAddress = memberIdentifier;
            } else {
              peerAddress = await resolveInboxIdToAddress(memberIdentifier);
            }
            console.log('✅ Found peerAddress from group members:', peerAddress);
          }
        }
        
        // If still no peer address found, mark as unknown
        if (!peerAddress || peerAddress === 'Unknown' || peerAddress === 'unknown') {
          console.log('⚠️ Could not determine peer address for conversation:', convo.id);
          peerAddress = 'Unknown';
        }
        
        const result = {
          ...convo,
          peerAddress: peerAddress,
          id: convo.id || convo.conversationId || `convo-${Math.random()}`,
          // Keep the original conversation object for methods
          _conversationObject: convo._conversationObject || convo,
        };
        
        console.log('📝 Final conversation:', {
          id: result.id,
          peerAddress: result.peerAddress,
          isGroup: result.isGroup,
          isDm: result.isDm,
          hasConversationObject: !!result._conversationObject
        });
        return result;
      }));
      
      setConversations(conversationsWithPeerAddress);
      console.log('✅ Conversations loaded:', conversationsWithPeerAddress.length);
      
      // Load profiles for all conversation participants
      const addresses = conversationsWithPeerAddress
        .map((c: any) => c.peerAddress)
        .filter(addr => addr && addr !== 'Unknown');
      
      console.log('👥 Loading profiles for addresses:', addresses);
      if (addresses.length > 0) {
        loadProfiles(addresses);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversation: any) => {
    try {
      console.log('📩 Loading messages from conversation:', conversation.id);
      
      // Get the actual conversation object
      const actualConvo = conversation._conversationObject || conversation;
      console.log('📩 Using conversation object:', {
        id: actualConvo.id,
        hasMessages: typeof actualConvo.messages === 'function',
        isGroup: actualConvo.isGroup,
        isDm: actualConvo.isDm
      });
      
      // Clear current messages for this convo
      setMessages([]);

      // Load existing messages first using XMTP V3 API
      try {
        // Try different methods to get messages from conversation
        let messages = [];
        
        // Method 1: Try conversation.messages() if it exists
        if (typeof actualConvo.messages === 'function') {
          console.log('🔍 Getting messages via messages()...');
          messages = await actualConvo.messages();
        }
        // Method 2: Try conversation.getMessages() if it exists
        else if (typeof actualConvo.getMessages === 'function') {
          console.log('🔍 Getting messages via getMessages()...');
          messages = await actualConvo.getMessages();
        }
        // Method 3: Try accessing messages property directly
        else if (actualConvo.messages && Array.isArray(actualConvo.messages)) {
          console.log('🔍 Getting messages from messages property...');
          messages = actualConvo.messages;
        }
        // Method 4: Try using messages() method
        else if (typeof actualConvo.messages === 'function') {
          try {
            console.log('🔍 Getting messages via messages() method...');
            messages = await actualConvo.messages();
          } catch (clientError) {
            console.warn('⚠️ Could not load messages via messages():', clientError);
          }
        }
        
        // Method 5: If all else fails, just show empty messages for now
        if (!messages || messages.length === 0) {
          console.log('📭 No messages found or could not load messages');
          messages = [];
        }
        
        console.log('📨 Loaded existing messages:', messages.length);
        
        // Process existing messages
        const formattedMessages = messages.map((msg: any) => {
          console.log('🔍 Raw message from XMTP:', msg);
          
          // Try to extract sender address from various possible fields
          let senderAddress = msg.senderAddress || msg.sender || msg.from || '';
          
          // If no sender address found, try to get it from the message object
          if (!senderAddress) {
            // Check if there's a sender property
            if (msg.sender) {
              senderAddress = msg.sender;
            }
            // Check if there's a from property
            else if (msg.from) {
              senderAddress = msg.from;
            }
            // Check if there's a senderAddress property
            else if (msg.senderAddress) {
              senderAddress = msg.senderAddress;
            }
            // If still no sender, it might be from the current user
            else {
              console.log('⚠️ No sender address found for message, assuming current user');
              senderAddress = fullAddress || '';
            }
          }
          
          // Better content extraction
          let content = '';
          if (typeof msg.content === 'string') {
            content = msg.content;
          } else if (msg.content?.text) {
            content = msg.content.text;
          } else if (msg.content && typeof msg.content === 'object') {
            // Skip metadata messages (group updates, etc.)
            if (msg.content.initiatedByInboxId || msg.content.addedInboxes || msg.content.removedInboxes) {
              console.log('⚠️ Skipping metadata message:', msg.content);
              return null; // Skip this message
            }
            content = JSON.stringify(msg.content);
          } else {
            content = 'Unknown message type';
          }
          
          console.log('📍 Processed message:', {
            original: msg.senderAddress || msg.sender || msg.from,
            processed: senderAddress,
            content: content,
            myAddress: fullAddress,
            isMyMessage: senderAddress.toLowerCase() === fullAddress?.toLowerCase()
          });
          
          return {
            id: msg.id || `msg-${Math.random()}`,
            content: content,
            senderAddress: senderAddress,
            sent: msg.sent || msg.timestamp || new Date(),
          };
        }).filter(Boolean); // Remove null messages
        
        // Remove duplicate messages based on content and timestamp
        const uniqueMessages = formattedMessages.filter((msg, index, self) => 
          index === self.findIndex(m => 
            m.content === msg.content && 
            Math.abs(new Date(m.sent).getTime() - new Date(msg.sent).getTime()) < 1000
          )
        );
        
        setMessages(uniqueMessages);
        console.log('✅ Messages loaded and displayed:', uniqueMessages.length);
        console.log('🗑️ Removed duplicates:', formattedMessages.length - uniqueMessages.length);
        
      } catch (messageError) {
        console.error('❌ Error loading existing messages:', messageError);
        // Set empty messages array if loading fails
        setMessages([]);
      }

      // Set up streaming for new messages (optional - can be done separately)
      try {
        await streamMessages(actualConvo, (msg: any) => {
          console.log('📬 New message received via stream:', msg);
          const formattedMsg = {
            id: msg.id || `msg-${Math.random()}`,
            content: typeof msg.content === 'string' ? msg.content : msg.content?.text || JSON.stringify(msg.content),
            senderAddress: msg.senderAddress || msg.sender || '',
            sent: msg.sent || msg.timestamp || new Date(),
          };
          setMessages((prev) => [...prev, formattedMsg]);
        });
      } catch (streamError) {
        console.warn('⚠️ Stream error (non-critical):', streamError);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  };

  const loadProfiles = async (addresses: string[]) => {
    try {
      const cleaned = Array.from(
        new Set(
          (addresses || [])
            .filter(Boolean)
            .map((a) => a.toLowerCase())
        )
      );

      if (cleaned.length === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_address, artist_name, avatar_cid')
        .in('wallet_address', cleaned);

      if (error) throw error;

      const profileMap: Record<string, ProfileData> = {};
      (data || []).forEach((p) => {
        if (p.wallet_address) {
          profileMap[p.wallet_address.toLowerCase()] = p as ProfileData;
        }
      });

      setProfiles((prev) => ({ ...prev, ...profileMap }));
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  // Search for users by name or wallet address
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching for users:', query);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_address, artist_name, avatar_cid')
        .or(`artist_name.ilike.%${query}%,wallet_address.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      console.log('📋 Search results:', data?.length || 0);
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      searchUsers(value);
    } else {
      setSearchResults([]);
    }
  };

  // Handle user selection from search results
  const handleUserSelect = (profile: ProfileData) => {
    setNewChatAddress(profile.wallet_address);
    setSearchQuery(profile.artist_name || formatAddress(profile.wallet_address));
    setSearchResults([]);
  };

  const handleStartChat = async (address?: string) => {
    const targetAddress = address || newChatAddress;
    if (!targetAddress) return;

    // Validate address format first
    if (!targetAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: 'Invalid address',
        description: 'Please enter a valid Ethereum wallet address (0x...)',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if identity is reachable (Step 3 from docs)
      const isReachable = await isIdentityReachable(targetAddress);
      if (!isReachable) {
        toast({
          title: 'Cannot message user',
          description: 'This user is not receiving messages yet',
          variant: 'destructive',
        });
        return;
      }

      // Create DM conversation (Step 4 from docs)
      const conversation = await createDMConversation(targetAddress);
      
      // Ensure conversation has peerAddress for UI without losing prototype methods
      (conversation as any).peerAddress = targetAddress.toLowerCase();
      
      setSelectedConvo(conversation);
      setNewChatAddress('');
      setSearchQuery('');
      setSearchResults([]);
      
      // Add the new conversation to the list
      setConversations(prev => {
        const updated = [...prev, conversation];
        // Save to localStorage immediately
        localStorage.setItem('xmtp-conversations', JSON.stringify(updated));
        console.log('💾 Saved new conversation to localStorage');
        return updated;
      });
      
      // Load profile for new conversation
      loadProfiles([targetAddress]);
      
      // Load messages immediately
      await loadMessages(conversation);
      
      toast({
        title: 'Chat started',
        description: `Started conversation with ${formatAddress(targetAddress)}`,
      });
    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Failed to start chat',
        description: error.message || 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConvo || !newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      console.log('📤 Sending message with optimistic UI...');
      
      // Get the actual conversation object
      const actualConvo = selectedConvo._conversationObject || selectedConvo;
      
      // Check if we have a valid XMTP conversation object with methods
      if (!actualConvo.sendOptimistic || typeof actualConvo.sendOptimistic !== 'function') {
        console.error('❌ No valid XMTP conversation object available');
        console.log('📊 Selected conversation:', selectedConvo);
        console.log('📊 Has _conversationObject:', !!selectedConvo._conversationObject);
        
        // Try to fetch the conversation from XMTP first
        if (selectedConvo.peerAddress && selectedConvo.peerAddress !== 'Unknown') {
          console.log('🔄 Attempting to create/fetch conversation for:', selectedConvo.peerAddress);
          try {
            const newConvo = await createDMConversation(selectedConvo.peerAddress);
            console.log('✅ Created/fetched conversation:', newConvo);
            
            // Update the selected conversation with the actual object
            setSelectedConvo({
              ...selectedConvo,
              _conversationObject: newConvo
            });
            
            // Now send the message with the new conversation
            await sendMessage(newConvo, messageText);
            
            toast({
              title: 'Message sent',
              description: 'Message delivered successfully',
            });
            return;
          } catch (createError) {
            console.error('❌ Failed to create conversation:', createError);
            throw new Error('Could not establish conversation. Please try starting a new chat with this address.');
          }
        } else {
          throw new Error('Invalid conversation. Please start a new chat with the user\'s address.');
        }
      }
      
      // Send message with optimistic UI (Step 5 from docs)
      await sendMessage(actualConvo, messageText);

      // The message is already added optimistically by XMTP, so we don't need to add it manually
      console.log('✅ Message sent successfully with optimistic UI');
      
      // Show success toast
      toast({
        title: 'Message sent',
        description: 'Message delivered successfully',
      });
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      
      // Restore message to input for retry
      setNewMessage(messageText);
      
      toast({
        title: 'Failed to send message',
        description: error.message || 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const getProfileForAddress = (address: string) => {
    if (!address || typeof address !== 'string') return undefined;
    return profiles[address.toLowerCase()];
  };

  const formatAddress = (address: string) => {
    if (!address || typeof address !== 'string') return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!fullAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-muted-foreground">Please connect your wallet to use messaging</p>
      </div>
    );
  }

  if (!isReady && isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
        <p className="ml-4 font-mono">Initializing XMTP V3...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-20 md:pb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="p-4 overflow-y-auto">
          <h2 className="text-xl font-mono font-bold mb-4 text-neon-green">
            <MessageSquare className="inline mr-2" />
            MESSAGES
          </h2>

          {/* New Chat */}
          <div className="mb-4 space-y-2">
            <div className="relative">
              <Input
                placeholder="Search for users by name or wallet address..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="font-mono text-base"
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((profile) => (
                    <div
                      key={profile.wallet_address}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleUserSelect(profile)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={profile.avatar_cid ? getIPFSGatewayUrl(profile.avatar_cid) : ''} 
                        />
                        <AvatarFallback className="bg-neon-green text-black font-mono text-xs">
                          {profile.artist_name?.charAt(0) || profile.wallet_address.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-medium truncate">
                          {profile.artist_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatAddress(profile.wallet_address)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Loading indicator */}
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => handleStartChat()} 
              disabled={!newChatAddress}
              className="w-full"
              variant="neon"
            >
              Start New Chat
            </Button>
            <Button 
              onClick={async () => {
                try {
                  console.log('🔄 Manual sync triggered...');
                  await syncAll();
                  console.log('✅ Manual sync complete - identity registered');
                  toast({
                    title: 'Identity synced',
                    description: 'You should now be reachable for messaging',
                  });
                } catch (error: any) {
                  console.error('Sync error:', error);
                  toast({
                    title: 'Sync failed',
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }}
              disabled={!xmtpClient}
              className="w-full"
              variant="outline"
            >
              🔄 Register Identity
            </Button>
            <Button 
              onClick={loadConversations}
              disabled={!xmtpClient}
              className="w-full"
              variant="outline"
            >
              📬 Load Conversations
            </Button>
            <Button 
              onClick={async () => {
                try {
                  console.log('🔄 Force refreshing conversations...');
                  
                  // Clear corrupted localStorage
                  localStorage.removeItem('xmtp-conversations');
                  console.log('🗑️ Cleared corrupted localStorage');
                  
                  // Force sync and reload
                  await syncAll();
                  await loadConversations();
                  
                  toast({
                    title: 'Conversations refreshed',
                    description: 'Cleared corrupted data and reloaded conversations',
                  });
                } catch (error: any) {
                  console.error('Refresh error:', error);
                  toast({
                    title: 'Refresh failed',
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }}
              disabled={!xmtpClient}
              className="w-full"
              variant="outline"
            >
              🔄 Force Refresh
            </Button>
            <Button 
              onClick={async () => {
                try {
                  console.log('🔄 Triggering history sync...');
                  
                  // Clear any corrupted localStorage data first
                  localStorage.removeItem('xmtp-conversations');
                  console.log('🗑️ Cleared corrupted localStorage conversations');
                  
                  const syncedConversations = await triggerHistorySync();
                  console.log('✅ History sync completed');
                  console.log('📊 Synced conversations:', syncedConversations.length);
                  
                  // The conversations are already processed in the hook with participants resolved
                  // Just save them to localStorage for persistence (but don't serialize the _conversationObject)
                  if (syncedConversations.length > 0) {
                    // Process each conversation to extract and resolve peer addresses
                    const serializableConvos = await Promise.all(syncedConversations.map(async (convo: any) => {
                      let peerAddress = 'Unknown';
                      
                      // Check if participants array exists and has addresses
                      if (convo.participants && Array.isArray(convo.participants) && convo.participants.length > 0) {
                        console.log('🔍 Synced conversation participants:', convo.participants);
                        
                        // Find the participant that's not the current user
                        const otherParticipant = convo.participants.find((p: string) => 
                          p && p.toLowerCase() !== fullAddress?.toLowerCase()
                        );
                        
                        if (otherParticipant) {
                          // Check if it's a wallet address or inbox ID
                          if (otherParticipant.match(/^0x[a-fA-F0-9]{40}$/)) {
                            peerAddress = otherParticipant;
                            console.log('✅ Using wallet address from participants:', peerAddress);
                          } else if (otherParticipant.length === 64 && otherParticipant.match(/^[a-f0-9]{64}$/)) {
                            console.log('🔍 Resolving inbox ID from synced conversation:', otherParticipant);
                            peerAddress = await resolveInboxIdToAddress(otherParticipant);
                            console.log('✅ Resolved to wallet address:', peerAddress);
                          } else {
                            peerAddress = otherParticipant;
                          }
                        }
                      }
                      
                      return {
                        id: convo.id,
                        peerAddress: peerAddress,
                        createdAt: convo.createdAt,
                        topic: convo.topic,
                        isGroup: convo.isGroup,
                        isDm: convo.isDm,
                        participants: convo.participants,
                      };
                    }));
                    
                    const existingConvos = JSON.parse(localStorage.getItem('xmtp-conversations') || '[]');
                    const combinedConvos = [...existingConvos, ...serializableConvos];
                    const uniqueConvos = combinedConvos.filter((convo, index, self) => 
                      index === self.findIndex(c => c.id === convo.id)
                    );
                    localStorage.setItem('xmtp-conversations', JSON.stringify(uniqueConvos));
                    console.log('💾 Saved synced conversations with resolved addresses to localStorage');
                    console.log('📊 Saved conversations:', uniqueConvos);
                  }
                  
                  // Reload conversations after history sync
                  await loadConversations();
                  
                  toast({
                    title: 'History synced',
                    description: `Found ${syncedConversations.length} conversations from other devices`,
                  });
                } catch (error: any) {
                  console.error('History sync error:', error);
                  toast({
                    title: 'History sync failed',
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }}
              disabled={!xmtpClient}
              className="w-full"
              variant="outline"
            >
              🔄 Sync History
            </Button>
            <Button 
              onClick={async () => {
                try {
                  console.log('🔄 Revoking other installations...');
                  await revokeOtherInstallations();
                  console.log('✅ Revoke complete');
                  toast({
                    title: 'Installations revoked',
                    description: 'Your identity has been revoked from other installations.',
                  });
                } catch (error: any) {
                  console.error('Revoke error:', error);
                  toast({
                    title: 'Revoke failed',
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }}
              disabled={!xmtpClient}
              className="w-full"
              variant="outline"
            >
              🚫 Revoke Installations
            </Button>
            <Button 
              onClick={async () => {
                try {
                  console.log('🗑️ Clearing XMTP storage...');
                  await clearXMTPStorage();
                  
                  // Also clear the corrupted localStorage conversations
                  localStorage.removeItem('xmtp-conversations');
                  console.log('🗑️ Cleared corrupted localStorage conversations');
                  
                  console.log('✅ Storage cleared');
                  toast({
                    title: 'Storage cleared',
                    description: 'XMTP storage and corrupted conversations cleared. Please refresh the page.',
                  });
                  // Refresh the page after clearing storage
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                } catch (error: any) {
                  console.error('Clear storage error:', error);
                  toast({
                    title: 'Clear storage failed',
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }}
              className="w-full"
              variant="destructive"
            >
              🗑️ Clear Storage
            </Button>
            <Button 
              onClick={() => {
                try {
                  console.log('🗑️ Clearing current messages...');
                  setMessages([]);
                  setSelectedConvo(null);
                  console.log('✅ Messages cleared');
                  toast({
                    title: 'Messages cleared',
                    description: 'Current conversation messages cleared',
                  });
                } catch (error: any) {
                  console.error('Clear messages error:', error);
                  toast({
                    title: 'Clear failed',
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }}
              className="w-full"
              variant="outline"
            >
              🗑️ Clear Messages
            </Button>
            <Button 
              onClick={async () => {
                try {
                  console.log('🔄 Cleaning corrupted conversations...');
                  
                  // Get current conversations
                  const currentConvos = JSON.parse(localStorage.getItem('xmtp-conversations') || '[]');
                  console.log('📬 Current saved conversations:', currentConvos.length);
                  
                  // Filter out conversations with "unknown" peerAddress
                  const cleanConvos = currentConvos.filter((convo: any) => 
                    convo.peerAddress && 
                    convo.peerAddress !== 'unknown' && 
                    convo.peerAddress !== 'Unknown' &&
                    convo.participants && 
                    Array.isArray(convo.participants) &&
                    convo.participants.length > 0
                  );
                  
                  console.log('🧹 Cleaned conversations:', cleanConvos.length);
                  console.log('🗑️ Removed corrupted conversations:', currentConvos.length - cleanConvos.length);
                  
                  // Save cleaned conversations
                  localStorage.setItem('xmtp-conversations', JSON.stringify(cleanConvos));
                  
                  // Reload conversations
                  await loadConversations();
                  
                  toast({
                    title: 'Corrupted conversations cleaned',
                    description: `Removed ${currentConvos.length - cleanConvos.length} corrupted conversations`,
                  });
                } catch (error: any) {
                  console.error('Clean conversations error:', error);
                  toast({
                    title: 'Clean failed',
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }}
              className="w-full"
              variant="outline"
            >
              🧹 Clean Corrupted
            </Button>
          </div>

          {/* Conversation List */}
          <div className="space-y-2">
            {conversations.map((convo, index) => {
              const profile = getProfileForAddress(convo.peerAddress);
              const avatarUrl = profile?.avatar_cid ? getIPFSGatewayUrl(profile.avatar_cid) : null;
              const displayName = profile?.artist_name || formatAddress(convo.peerAddress);
              const displayAddress = convo.peerAddress === 'Unknown' ? 'Unknown User' : convo.peerAddress;
              
              return (
                <Card
                  key={convo.id || convo.peerAddress || `convo-${index}`}
                  className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    selectedConvo?.id === convo.id || selectedConvo?.peerAddress === convo.peerAddress
                      ? 'bg-neon-green/10 border-neon-green' 
                      : ''
                  }`}
                  onClick={async () => {
                    console.log('💬 Selected conversation:', convo.id);
                    
                    try {
                      // Check if we have the actual conversation object
                      const actualConvo = convo._conversationObject;
                      
                      if (!actualConvo || !actualConvo.messages) {
                        console.log('🔄 Need to fetch conversation from XMTP...');
                        
                        // Get all conversations from XMTP to find the actual conversation object
                        const xmtpConversations = await getConversations();
                        console.log('📬 Available XMTP conversations:', xmtpConversations.length);
                        
                        // Find the matching conversation by ID
                        const matchingConvo = xmtpConversations.find((xmtpConvo: any) => 
                          xmtpConvo.id === convo.id
                        );
                        
                        if (matchingConvo) {
                          console.log('✅ Found matching XMTP conversation');
                          setSelectedConvo(matchingConvo);
                          return;
                        }
                        
                        // If no match by ID and we have a peer address, try to find by participant
                        if (convo.peerAddress && convo.peerAddress !== 'Unknown' && convo.peerAddress !== 'unknown') {
                          const peerMatch = xmtpConversations.find((xmtpConvo: any) => {
                            if (xmtpConvo.participants && Array.isArray(xmtpConvo.participants)) {
                              return xmtpConvo.participants.some((p: string) => 
                                p.toLowerCase() === convo.peerAddress.toLowerCase()
                              );
                            }
                            return false;
                          });
                          
                          if (peerMatch) {
                            console.log('✅ Found conversation by peer address');
                            setSelectedConvo(peerMatch);
                            return;
                          }
                        }
                        
                        toast({
                          title: 'Conversation not found',
                          description: 'This conversation may have been removed. Try refreshing.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      // If we have a proper XMTP conversation, use it directly
                      setSelectedConvo(convo);
                    } catch (error) {
                      console.error('❌ Error handling conversation click:', error);
                      toast({
                        title: 'Failed to load conversation',
                        description: 'Could not load the selected conversation',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl || ''} />
                      <AvatarFallback className="bg-neon-green text-black font-mono">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {displayAddress}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* Messages Area */}
        <div className="md:col-span-2 flex flex-col">
          {selectedConvo ? (
            <>
              {/* Chat Header */}
              <Card className="p-4 mb-4">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const profile = getProfileForAddress(selectedConvo.peerAddress);
                    const avatarUrl = profile?.avatar_cid ? getIPFSGatewayUrl(profile.avatar_cid) : null;
                    return (
                      <>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={avatarUrl || ''} />
                          <AvatarFallback className="bg-neon-green text-black font-mono">
                            {profile?.artist_name?.charAt(0) || formatAddress(selectedConvo.peerAddress).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-mono font-medium">
                            {profile?.artist_name || formatAddress(selectedConvo.peerAddress)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedConvo.peerAddress}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Card>

              {/* Messages */}
              <Card className="flex-1 p-4 overflow-y-auto messages-container">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMyMessage = msg.senderAddress.toLowerCase() === fullAddress?.toLowerCase();
                    console.log('🔍 Message debug:', {
                      content: msg.content,
                      senderAddress: msg.senderAddress,
                      myAddress: fullAddress,
                      isMyMessage: isMyMessage,
                      alignment: isMyMessage ? 'right' : 'left'
                    });
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isMyMessage ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`message-bubble ${
                            isMyMessage ? 'sent' : 'received'
                          }`}
                        >
                          <p className="font-mono text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.sent).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Message Input */}
              <Card className="p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 font-mono message-input"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    variant="neon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-mono text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}