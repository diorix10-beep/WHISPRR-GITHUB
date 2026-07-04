import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, useColorScheme 
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../constants/theme';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

interface OtherUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_emoji: string | null;
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    const currentUserId = user?.id;
    if (!currentUserId || !id) return;
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', id)
        .neq('sender_id', currentUserId)
        .eq('read', false);
    } catch (err) {
      console.warn('Failed to mark messages as read:', err);
    }
  }, [user, id]);

  // Fetch initial chat data
  useEffect(() => {
    if (!id || !user) return;
    const currentUserId = user.id;

    let active = true;

    async function loadChatData() {
      try {
        // 1. Fetch conversation details & participants
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .select('*, conversation_participants(*)')
          .eq('id', id)
          .single();

        if (convErr) throw convErr;

        // Find the other participant's profile
        const otherUserId = (conv.conversation_participants || [])
          .find((p: any) => p.user_id !== currentUserId)?.user_id;

        if (otherUserId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_emoji')
            .eq('user_id', otherUserId)
            .maybeSingle();

          if (active && profileData) {
            setOtherUser(profileData);
            navigation.setOptions({
              title: profileData.display_name || `@${profileData.username}`,
            });
          }
        }

        // 2. Fetch messages
        const { data: msgs, error: msgsErr } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true });

        if (msgsErr) throw msgsErr;

        if (active) {
          setMessages(msgs || []);
          markMessagesAsRead();
        }
      } catch (err) {
        console.warn('Failed to load chat room messages:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadChatData();

    // 3. Subscribe to Realtime messages inside this conversation
    const channel = supabase
      .channel(`chat-room-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        
        if (newMsg.sender_id !== currentUserId) {
          markMessagesAsRead();
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id, user, navigation, markMessagesAsRead]);

  // Scroll to bottom when messages load
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !id) return;
    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      // 1. Insert message
      const { data: createdMsg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: user.id,
          text: textToSend,
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update local state proactively
      setMessages(prev => {
        if (prev.some(m => m.id === createdMsg.id)) return prev;
        return [...prev, createdMsg];
      });

      // 2. Update conversation last message snippet
      await supabase
        .from('conversations')
        .update({
          last_message_text: textToSend,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      scrollToBottom();
    } catch (err: any) {
      console.warn('Failed to send message:', err.message);
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    const formattedTime = new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return (
      <View style={[
        styles.messageRow, 
        isMe ? styles.messageRowMe : styles.messageRowOther
      ]}>
        {!isMe && (
          <View style={[styles.chatAvatar, { backgroundColor: colors.primary + '15' }]}>
            <Text style={styles.chatAvatarEmoji}>{otherUser?.avatar_emoji || '👤'}</Text>
          </View>
        )}
        <View style={[
          styles.bubble,
          isMe 
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 } 
            : { backgroundColor: colors.backgroundElement, borderBottomLeftRadius: 4, borderColor: colors.border, borderWidth: 1 }
        ]}>
          <Text style={[
            styles.messageText, 
            { color: isMe ? '#fff' : colors.text }
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime, 
            { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {formattedTime}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Send a message to start this authentic connection.</Text>
          </View>
        }
      />

      {/* Input controls bar */}
      <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TextInput
          placeholder="Message..."
          placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          style={[styles.textInput, { 
            backgroundColor: colors.backgroundElement, 
            borderColor: colors.border, 
            color: colors.text 
          }]}
        />
        <TouchableOpacity 
          onPress={handleSendMessage} 
          disabled={sending || !inputText.trim()}
          style={[
            styles.sendButton, 
            { backgroundColor: colors.primary },
            !inputText.trim() && styles.sendButtonDisabled
          ]}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
    maxWidth: '85%',
  },
  messageRowMe: {
    alignSelf: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatAvatarEmoji: {
    fontSize: 16,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  messageTime: {
    fontSize: 8.5,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    marginRight: 10,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
});
