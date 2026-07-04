import { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, 
  ActivityIndicator, Platform, RefreshControl, useColorScheme,
  Modal, ScrollView, SafeAreaView, KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../constants/theme';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { INTERESTS } from '~/types';

interface Community {
  id: string;
  name: string;
  description: string;
  interest: string;
  emoji: string;
  owner_id: string;
  created_at: string;
}

export default function CommunitiesIndexScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Community Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEmoji, setNewEmoji] = useState('🌍');
  const [newInterest, setNewInterest] = useState<string>(INTERESTS[0]);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [formError, setFormError] = useState('');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style).catch(() => {});
    }
  };

  const fetchCommunities = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch all communities
      const { data: comms, error: commsErr } = await supabase
        .from('communities')
        .select('*')
        .order('name', { ascending: true });

      if (commsErr) throw commsErr;

      // 2. Fetch user's joined community list
      const { data: joined, error: joinedErr } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      if (joinedErr) throw joinedErr;

      const joinedSet = new Set((joined || []).map(j => j.community_id));
      
      setCommunities(comms || []);
      setJoinedCommunityIds(joinedSet);
    } catch (err) {
      console.warn('Error fetching communities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCommunities();
  };

  const handleCreateCommunity = async () => {
    if (!newName.trim() || !newInterest || !user) {
      setFormError('Name and interest tag are required');
      return;
    }
    setSubmittingCreate(true);
    setFormError('');
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 1. Insert community
      const { data: newComm, error: createError } = await supabase
        .from('communities')
        .insert({
          name: newName.trim(),
          description: newDesc.trim(),
          interest: newInterest,
          emoji: newEmoji.trim() || '🌍',
          owner_id: user.id
        })
        .select('*')
        .single();

      if (createError) throw createError;

      // 2. Insert creator as community owner/member
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: newComm.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // 3. Reset form and close
      setNewName('');
      setNewDesc('');
      setNewEmoji('🌍');
      setNewInterest(INTERESTS[0]);
      setShowCreateModal(false);
      
      fetchCommunities();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create community');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const filteredCommunities = communities.filter(c => {
    const query = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query) || c.interest.toLowerCase().includes(query);
  });

  const renderCommunityItem = ({ item }: { item: Community }) => {
    const isJoined = joinedCommunityIds.has(item.id);
    return (
      <TouchableOpacity 
        onPress={() => router.push(`/communities/${item.id}`)}
        style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.emojiBox, { backgroundColor: colors.primary + '15' }]}>
            <Text style={styles.emojiText}>{item.emoji}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.nameText, { color: colors.text }]}>{item.name}</Text>
            <View style={[styles.interestBadge, { backgroundColor: colors.backgroundSelected }]}>
              <Text style={[styles.interestText, { color: colors.textSecondary }]}>{item.interest}</Text>
            </View>
          </View>
          {isJoined && (
            <View style={[styles.joinedBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.joinedText, { color: colors.primary }]}>Joined</Text>
            </View>
          )}
        </View>
        <Text style={[styles.descText, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description || 'No description provided.'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input Box */}
      <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <TextInput
          placeholder="Search community tags or names..."
          placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Communities List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCommunities}
          renderItem={renderCommunityItem}
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
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'No matching spaces found.' : 'No communities created yet.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
          setShowCreateModal(true);
        }}
      >
        <SymbolView
          name={{ ios: 'plus', android: 'add', web: 'add' }}
          size={24}
          tintColor="#fff"
        />
      </TouchableOpacity>

      {/* CREATE COMMUNITY MODAL */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreateModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Community</Text>
            <TouchableOpacity 
              onPress={handleCreateCommunity}
              disabled={submittingCreate || !newName.trim()}
            >
              <Text style={[
                styles.modalPost, 
                { color: colors.primary },
                (!newName.trim() || submittingCreate) && { opacity: 0.4 }
              ]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Space Emoji</Text>
              <TextInput
                value={newEmoji}
                onChangeText={setNewEmoji}
                maxLength={2}
                style={[styles.textInput, styles.emojiInput, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Community Name</Text>
              <TextInput
                placeholder="e.g. Writers' Haven"
                placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
                value={newName}
                onChangeText={setNewName}
                maxLength={40}
                style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                placeholder="Describe the vibes..."
                placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
                value={newDesc}
                onChangeText={setNewDesc}
                multiline
                numberOfLines={3}
                maxLength={160}
                style={[styles.textInput, styles.textarea, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Interest Tag</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interestSelectorScroll}>
                {INTERESTS.map(interest => (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setNewInterest(interest);
                    }}
                    style={[
                      styles.interestSelectPill,
                      { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                      newInterest === interest && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                    ]}
                  >
                    <Text style={[
                      styles.interestSelectText,
                      { color: colors.text },
                      newInterest === interest && { color: colors.primary, fontWeight: 'bold' }
                    ]}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emojiBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 18,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
    alignItems: 'flex-start',
  },
  nameText: {
    fontSize: 14.5,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  interestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  interestText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  joinedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  joinedText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  descText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#C96059',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  modalPost: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  errorText: {
    color: '#ff4d4d',
    backgroundColor: 'rgba(255,77,77,0.08)',
    padding: 12,
    borderRadius: 10,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  emojiInput: {
    width: 60,
    textAlign: 'center',
    fontSize: 20,
  },
  textarea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  interestSelectorScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  interestSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  interestSelectText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
});
