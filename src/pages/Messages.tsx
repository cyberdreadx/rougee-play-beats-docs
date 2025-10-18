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
    streamMessages
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
      console.log('📬 XMTP ready, loading conversations...');
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
      const convos = await getConversations();
      setConversations(convos);
      
      // Load profiles for all conversation participants
      const addresses = convos.map((c: any) => c.peerAddress);
      if (addresses.length > 0) {
        loadProfiles(addresses);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversation: any) => {
    try {
      const msgs = await conversation.messages();
      setMessages(msgs);

      // Stream new messages
      streamMessages(conversation, (msg: any) => {
        setMessages(prev => [...prev, msg]);
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadProfiles = async (addresses: string[]) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_address, artist_name, avatar_cid')
        .in('wallet_address', addresses.map(a => a.toLowerCase()));

      if (error) throw error;

      const profileMap: Record<string, ProfileData> = {};
      data?.forEach((profile) => {
        if (profile.wallet_address) {
          profileMap[profile.wallet_address.toLowerCase()] = profile;
        }
      });
      setProfiles(profileMap);
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
      setSelectedConvo(conversation);
      setNewChatAddress('');
      
      // Load profile for new conversation
      loadProfiles([targetAddress]);
      
      // Refresh conversations list
      loadConversations();
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
    return profiles[address.toLowerCase()];
  };

  const formatAddress = (address: string) => {
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
          </div>

          {/* Conversation List */}
          <div className="space-y-2">
            {conversations.map((convo) => {
              const profile = getProfileForAddress(convo.peerAddress);
              const avatarUrl = profile?.avatar_cid ? getIPFSGatewayUrl(profile.avatar_cid) : null;
              
              return (
                <Card
                  key={convo.peerAddress}
                  className={`p-3 cursor-pointer hover:border-neon-green transition-colors ${
                    selectedConvo?.peerAddress === convo.peerAddress ? 'border-neon-green' : ''
                  }`}
                  onClick={() => setSelectedConvo(convo)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {avatarUrl && <AvatarImage src={avatarUrl} />}
                      <AvatarFallback className="bg-neon-green/20 text-neon-green font-mono">
                        {profile?.artist_name?.[0]?.toUpperCase() || convo.peerAddress[2]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold truncate">
                        {profile?.artist_name || formatAddress(convo.peerAddress)}
                      </p>
                      {profile?.artist_name && (
                        <button
                          className="font-mono text-xs text-muted-foreground hover:text-neon-green transition-colors truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(convo.peerAddress);
                            toast({ title: "Address copied!", description: convo.peerAddress });
                          }}
                        >
                          {formatAddress(convo.peerAddress)}
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* Chat Window */}
        <Card className="md:col-span-2 p-4 flex flex-col">
          {selectedConvo ? (
            <>
              {/* Chat Header */}
              <div className="mb-4 pb-4 border-b border-border">
                {(() => {
                  const profile = getProfileForAddress(selectedConvo.peerAddress);
                  const avatarUrl = profile?.avatar_cid ? getIPFSGatewayUrl(profile.avatar_cid) : null;
                  
                  return (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {avatarUrl && <AvatarImage src={avatarUrl} />}
                        <AvatarFallback className="bg-neon-green/20 text-neon-green font-mono">
                          {profile?.artist_name?.[0]?.toUpperCase() || selectedConvo.peerAddress[2]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-mono font-semibold">
                          {profile?.artist_name || formatAddress(selectedConvo.peerAddress)}
                        </p>
                        <button
                          className="font-mono text-xs text-muted-foreground hover:text-neon-green transition-colors flex items-center gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedConvo.peerAddress);
                            toast({ title: "Address copied!", description: selectedConvo.peerAddress });
                          }}
                        >
                          {formatAddress(selectedConvo.peerAddress)}
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg max-w-[70%] ${
                      msg.senderAddress === fullAddress?.toLowerCase()
                        ? 'ml-auto bg-neon-green/20 text-right'
                        : 'mr-auto bg-muted'
                    }`}
                  >
                    <p className="font-mono text-sm">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.sent).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="font-mono text-base"
                />
                <Button onClick={handleSendMessage} variant="neon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="font-mono">Select a conversation to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
