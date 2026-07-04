import { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, 
  ActivityIndicator, Platform, RefreshControl, useColorScheme 
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/theme';

interface Whisper {
  id: string;
  content: string;
  audio_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: any;
}

export default function FeedScreen() {
  const { user, signOut, profile } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newWhisper, setNewWhisper] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWhispers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whispers')
        .select(`
          id,
          content,
          audio_url,
          created_at,
          user_id,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWhispers(data || []);
    } catch (err) {
      console.warn('Error fetching whispers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWhispers();
  }, [fetchWhispers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWhispers();
  };

  const handlePostWhisper = async () => {
    if (!newWhisper.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('whispers')
        .insert({
          user_id: user?.id,
          content: newWhisper.trim()
        });

      if (error) throw error;
      setNewWhisper('');
      fetchWhispers();
    } catch (err: any) {
      console.warn('Failed to post whisper:', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderWhisperItem = ({ item }: { item: Whisper }) => {
    const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    const username = profileData?.username || 'user';
    const initials = (profileData?.display_name || username).slice(0, 2).toUpperCase();
    const formattedDate = new Date(item.created_at).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.username, { color: colors.text }]}>@{username}</Text>
            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </View>
        
        <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>

        {item.audio_url && (
          <View style={[styles.audioContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.audioBadge, { color: colors.primary }]}>🔊 Voice Whisper</Text>
            <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.backgroundSelected }]}>
              <Text style={[styles.playButtonText, { color: colors.text }]}>▶ Play Recording</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Input Composer */}
      <View style={[styles.composer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <TextInput
          placeholder="Share a whisper..."
          placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
          value={newWhisper}
          onChangeText={setNewWhisper}
          multiline
          maxLength={300}
          style={[styles.input, { color: colors.text }]}
        />
        <View style={styles.composerFooter}>
          <Text style={styles.charCount}>{newWhisper.length}/300</Text>
          <TouchableOpacity 
            onPress={handlePostWhisper} 
            disabled={submitting || !newWhisper.trim()}
            style={[styles.postButton, { backgroundColor: colors.primary }, !newWhisper.trim() && styles.postButtonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={whispers}
          renderItem={renderWhisperItem}
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
              <Text style={styles.emptyText}>No whispers posted yet.</Text>
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
  composer: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  input: {
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
  },
  charCount: {
    fontSize: 11,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  username: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  content: {
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  audioContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audioBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  playButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  playButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
});
