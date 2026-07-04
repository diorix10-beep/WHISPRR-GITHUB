import { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, 
  ActivityIndicator, Platform, RefreshControl, useColorScheme 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../constants/theme';

interface Participant {
  user_id: string;
}

interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  conversation_participants: Participant[];
  other_user?: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_emoji: string | null;
    avatar_url: string | null;
  };
  unread_count?: number;
}

interface SearchUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_emoji: string | null;
  avatar_url: string | null;
}

export default function InboxScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch conversations with participants
      const { data, error } = await supabase
        .from('conversations')
        .select('*, conversation_participants(*)')
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // 2. Filter conversations where current user is a participant
      const userConvs = (data || []).filter((conv: any) =>
        (conv.conversation_participants || []).some((p: any) => p.user_id === user.id)
      );

      // 3. Fetch profiles for other participants
      const conversationsWithProfiles = await Promise.all(
        userConvs.map(async (conv: any) => {
          if (conv.type === 'dm') {
            const otherUserId = (conv.conversation_participants || [])
              .find((p: any) => p.user_id !== user.id)?.user_id;

            if (otherUserId) {
              const { data: otherProfile } = await supabase
                .from('profiles')
                .select('user_id, username, display_name, avatar_emoji, avatar_url')
                .eq('user_id', otherUserId)
                .maybeSingle();

              return {
                ...conv,
                other_user: otherProfile || undefined,
              };
            }
          }
          return conv;
        })
      );

      // 4. Fetch unread counts
      const convIds = conversationsWithProfiles.map(c => c.id);
      const unreadCounts: Record<string, number> = {};
      
      if (convIds.length > 0) {
        const { data: msgs, error: msgsErr } = await supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('read', false)
          .neq('sender_id', user.id);

        if (!msgsErr && msgs) {
          msgs.forEach((m: any) => {
            unreadCounts[m.conversation_id] = (unreadCounts[m.conversation_id] || 0) + 1;
          });
        }
      }

      const finalConversations = conversationsWithProfiles.map(c => ({
        ...c,
        unread_count: unreadCounts[c.id] || 0,
      }));

      setConversations(finalConversations);
    } catch (err) {
      console.warn('Error fetching conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();

    if (!user) return;

    // Listen for new messages / conversation updates
    const channel = supabase
      .channel('conversations-list-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => {
        fetchConversations();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_emoji, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('user_id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.warn('Failed to search users:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async (targetUser: SearchUser) => {
    if (!user) return;
    try {
      // Check if conversation already exists
      const { data: existing, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('type', 'dm')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUser.user_id}),and(user1_id.eq.${targetUser.user_id},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (error) throw error;

      let conversationId = existing?.id;

      if (!conversationId) {
        // Create conversation
        const { data: created, error: createErr } = await supabase
          .from('conversations')
          .insert({
            user1_id: user.id,
            user2_id: targetUser.user_id,
            type: 'dm'
          })
          .select('id')
          .single();

        if (createErr) throw createErr;
        conversationId = created.id;
      }

      setSearchQuery('');
      setSearchResults([]);
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.warn('Failed to start conversation:', err);
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const isDM = item.type === 'dm';
    const title = isDM ? item.other_user?.display_name || item.other_user?.username || 'User' : item.name || 'Group Chat';
    const subtitle = isDM ? `@${item.other_user?.username || 'member'}` : 'Group';
    const initials = title.slice(0, 2).toUpperCase();
    const avatarEmoji = isDM ? item.other_user?.avatar_emoji : '👥';
    const unread = item.unread_count || 0;

    const formattedDate = item.last_message_at 
      ? new Date(item.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : '';

    return (
      <TouchableOpacity 
        onPress={() => router.push(`/messages/${item.id}`)}
        style={[styles.chatRow, { borderBottomColor: colors.border }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          {avatarEmoji ? (
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          ) : (
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.row}>
            <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.chatTime, { color: colors.textSecondary }]}>{formattedDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.lastMessage, { color: unread > 0 ? colors.text : colors.textSecondary }]} numberOfLines={1}>
              {item.last_message_text || subtitle}
            </Text>
            {unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadCount}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Inbox / Start New Chat */}
      <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <TextInput
          placeholder="Search members to message..."
          placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
          value={searchQuery}
          onChangeText={handleSearchUsers}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Search results list overlay */}
      {searchQuery.trim().length > 0 && (
        <View style={[styles.searchResultsOverlay, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {searching ? (
            <ActivityIndicator style={styles.searchLoader} color={colors.primary} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={item => item.user_id}
              ListEmptyComponent={<Text style={styles.emptyText}>No matching members found</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => handleStartChat(item)}
                  style={[styles.searchResultRow, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.smallAvatar, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={styles.smallAvatarEmoji}>{item.avatar_emoji || '👤'}</Text>
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={[styles.searchResultName, { color: colors.text }]}>{item.display_name}</Text>
                    <Text style={[styles.searchResultUsername, { color: colors.textSecondary }]}>@{item.username}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No chats started yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBox: {
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    fontSize: 14,
    padding: 0,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  searchResultsOverlay: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    paddingHorizontal: 16,
  },
  searchLoader: {
    marginTop: 20,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarEmoji: {
    fontSize: 16,
  },
  searchResultInfo: {
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  searchResultUsername: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 1,
  },
  chatName: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  chatTime: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  lastMessage: {
    fontSize: 12.5,
    flex: 1,
    marginRight: 10,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    marginTop: 10,
  },
});
