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
    streamMessages,
    revokeOtherInstallations
  } = useXMTPV3();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newChatAddress, setNewChatAddress] = useState('');
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});

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

  const loadConversations = async () => {
    try {
      console.log('🔄 Loading conversations from XMTP...');
      const convos = await getConversations();
      console.log('📬 Found conversations:', convos.length);
      console.log('📬 Raw conversations data:', convos);
      
      // Add peerAddress to each conversation for UI display
      const conversationsWithPeerAddress = convos.map((convo: any) => {
        console.log('🔍 Processing conversation:', convo);
        
        // Try multiple ways to extract peer address
        let peerAddress = convo.peerAddress;
        
        // Method 1: Check if peerAddress is already set
        if (peerAddress && peerAddress !== 'Unknown') {
          console.log('✅ Found peerAddress:', peerAddress);
        }
        // Method 2: Check participants array
        else if (convo.participants && Array.isArray(convo.participants)) {
          const otherParticipant = convo.participants.find((p: string) => 
            p && p.toLowerCase() !== fullAddress?.toLowerCase()
          );
          if (otherParticipant) {
            peerAddress = otherParticipant;
            console.log('✅ Found peerAddress from participants:', peerAddress);
          }
        }
        // Method 3: Check for peerAddress in different properties
        else if (convo.peerAddress) {
          peerAddress = convo.peerAddress;
          console.log('✅ Found peerAddress property:', peerAddress);
        }
        // Method 4: Check for address in other properties
        else if (convo.address) {
          peerAddress = convo.address;
          console.log('✅ Found address property:', peerAddress);
        }
        // Method 5: Check for peer in properties
        else if (convo.peer) {
          peerAddress = convo.peer;
          console.log('✅ Found peer property:', peerAddress);
        }
        
        const result = {
          ...convo,
          peerAddress: peerAddress || 'Unknown',
          id: convo.id || convo.conversationId || `convo-${Math.random()}`
        };
        
        console.log('📝 Final conversation:', result);
        return result;
      });
      
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
      console.log('📩 Loading messages from conversation:', conversation);
      
      // Clear current messages for this convo
      setMessages([]);

      // Load existing messages first using XMTP V3 API
      try {
        // Try different methods to get messages from conversation
        let messages = [];
        
        // Method 1: Try conversation.messages() if it exists
        if (typeof conversation.messages === 'function') {
          messages = await conversation.messages();
        }
        // Method 2: Try conversation.getMessages() if it exists
        else if (typeof conversation.getMessages === 'function') {
          messages = await conversation.getMessages();
        }
        // Method 3: Try accessing messages property directly
        else if (conversation.messages && Array.isArray(conversation.messages)) {
          messages = conversation.messages;
        }
        // Method 4: Try using the client to get messages
        else if (xmtpClient && conversation.id) {
          try {
            messages = await xmtpClient.conversations.getMessages(conversation.id);
          } catch (clientError) {
            console.warn('⚠️ Could not load messages via client:', clientError);
          }
        }
        
        // Method 5: If all else fails, just show empty messages for now
        if (!messages || messages.length === 0) {
          console.log('📭 No messages found or could not load messages');
          messages = [];
        }
        
        console.log('📨 Loaded existing messages:', messages.length);
        
        // Process existing messages
        const formattedMessages = messages.map((msg: any) => ({
          id: msg.id || `msg-${Math.random()}`,
          content: typeof msg.content === 'string' ? msg.content : msg.content?.text || JSON.stringify(msg.content),
          senderAddress: msg.senderAddress || msg.sender || '',
          sent: msg.sent || msg.timestamp || new Date(),
        }));
        
        setMessages(formattedMessages);
        console.log('✅ Messages loaded and displayed:', formattedMessages.length);
        
      } catch (messageError) {
        console.error('❌ Error loading existing messages:', messageError);
        // Set empty messages array if loading fails
        setMessages([]);
      }

      // Set up streaming for new messages (optional - can be done separately)
      try {
        await streamMessages(conversation, (msg: any) => {
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

  const handleStartChat = async (address?: string) => {
    const targetAddress = address || newChatAddress;
    if (!targetAddress) return;

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
      
      // Add the new conversation to the list
      setConversations(prev => [...prev, conversation]);
      
      // Load profile for new conversation
      loadProfiles([targetAddress]);
      
      // Load messages immediately
      await loadMessages(conversation);
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

    try {
      // Send message (Step 5 from docs)
      await sendMessage(selectedConvo, newMessage);

      // Optimistically add to UI
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          content: newMessage,
          senderAddress: fullAddress?.toLowerCase() || '',
          sent: new Date(),
        },
      ]);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Failed to send message',
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
            <Input
              placeholder="0x... wallet address"
              value={newChatAddress}
              onChange={(e) => setNewChatAddress(e.target.value)}
              className="font-mono text-base"
            />
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
                  await xmtpClient?.conversations.syncAll(['allowed']);
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
                  onClick={() => setSelectedConvo(convo)}
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
              <Card className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderAddress.toLowerCase() === fullAddress?.toLowerCase()
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.senderAddress.toLowerCase() === fullAddress?.toLowerCase()
                            ? 'bg-neon-green text-black'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <p className="font-mono text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.sent).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
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
                    className="flex-1 font-mono"
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