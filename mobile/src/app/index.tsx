import { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, 
  ActivityIndicator, Platform, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.username}>@{username}</Text>
            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </View>
        
        <Text style={styles.content}>{item.content}</Text>

        {item.audio_url && (
          <View style={styles.audioContainer}>
            <Text style={styles.audioBadge}>🔊 Voice Whisper</Text>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ Play Recording</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>WHISPRR</Text>
          <Text style={styles.headerUser}>Welcome, @{profile?.username || 'member'}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Input Composer */}
      <View style={styles.composer}>
        <TextInput
          placeholder="Share a whisper..."
          placeholderTextColor="#666"
          value={newWhisper}
          onChangeText={setNewWhisper}
          multiline
          maxLength={300}
          style={styles.input}
        />
        <View style={styles.composerFooter}>
          <Text style={styles.charCount}>{newWhisper.length}/300</Text>
          <TouchableOpacity 
            onPress={handlePostWhisper} 
            disabled={submitting || !newWhisper.trim()}
            style={[styles.postButton, !newWhisper.trim() && styles.postButtonDisabled]}
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
          <ActivityIndicator size="large" color="#ff4d80" />
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
              tintColor="#ff4d80"
              colors={['#ff4d80']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No whispers posted yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1e1e1e',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff4d80',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerUser: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  logoutText: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: 'bold',
  },
  composer: {
    backgroundColor: '#1e1e1e',
    margin: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    fontSize: 14,
    color: '#fff',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: '#2d2d2d',
    paddingTop: 10,
  },
  charCount: {
    fontSize: 11,
    color: '#666',
  },
  postButton: {
    backgroundColor: '#ff4d80',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ff4d8050',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1c1c1c',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
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
    backgroundColor: '#ff4d8020',
    borderWidth: 1,
    borderColor: '#ff4d8040',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ff4d80',
    fontWeight: 'bold',
    fontSize: 12,
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  username: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
  content: {
    fontSize: 13.5,
    color: '#e0e0e0',
    lineHeight: 20,
  },
  audioContainer: {
    marginTop: 12,
    backgroundColor: '#161616',
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audioBadge: {
    color: '#ff4d80',
    fontSize: 11,
    fontWeight: 'bold',
  },
  playButton: {
    backgroundColor: '#262626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  },
});

