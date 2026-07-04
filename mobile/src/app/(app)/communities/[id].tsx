import { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, 
  ActivityIndicator, Platform, RefreshControl, useColorScheme,
  Modal, ScrollView, SafeAreaView, KeyboardAvoidingView
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../constants/theme';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { MOODS, type Mood } from '~/types';

interface Community {
  id: string;
  name: string;
  description: string;
  interest: string;
  emoji: string;
  owner_id: string;
  created_at: string;
}

interface ProfileRelation {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
  photo_url: string | null;
  bio: string | null;
  mood: string | null;
  badges: string[];
  role: string;
}

interface Reaction {
  id: string;
  whisper_id: string;
  user_id: string;
  type: 'felt' | 'warmth' | 'spark';
  created_at: string;
}

interface Whisper {
  id: string;
  content: string;
  audio_url: string | null;
  mood: string | null;
  community_id: string | null;
  parent_id: string | null;
  created_at: string;
  user_id: string;
  profiles: ProfileRelation;
  reactions: Reaction[];
  comment_count: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_emoji: string;
    photo_url: string | null;
  };
}

function formatTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [community, setCommunity] = useState<Community | null>(null);
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [membersCount, setMembersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingJoin, setTogglingJoin] = useState(false);

  // Composer State
  const [showCompose, setShowCompose] = useState(false);
  const [composeContent, setComposeContent] = useState('');
  const [composeMood, setComposeMood] = useState<Mood | null>(null);
  const [submittingCompose, setSubmittingCompose] = useState(false);

  // Comments / Detail Modal State
  const [selectedWhisperForComments, setSelectedWhisperForComments] = useState<Whisper | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style).catch(() => {});
    }
  };

  const fetchCommunityData = useCallback(async () => {
    if (!id || !user) return;
    try {
      // 1. Fetch community details
      const { data: comm, error: commErr } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (commErr) throw commErr;
      setCommunity(comm);
      navigation.setOptions({
        title: comm.name,
      });

      // 2. Fetch membership status
      const { data: membership } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsJoined(!!membership);
      setMemberRole(membership?.role || null);

      // 3. Fetch members count
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', id);
      
      setMembersCount(count || 0);

      // 4. Fetch community whispers
      const { data: whispersData, error: whispersError } = await supabase
        .from('whispers')
        .select(`
          id,
          content,
          audio_url,
          created_at,
          user_id,
          mood,
          community_id,
          parent_id,
          profiles:user_id (
            id,
            user_id,
            username,
            display_name,
            avatar_emoji,
            photo_url,
            badges,
            role
          ),
          reactions (
            id,
            whisper_id,
            user_id,
            type,
            created_at
          )
        `)
        .eq('community_id', id)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (whispersError) throw whispersError;

      // 5. Fetch comment counts
      const whisperIds = (whispersData || []).map(w => w.id);
      const countMap: Record<string, number> = {};

      if (whisperIds.length > 0) {
        const { data: commentData, error: commentError } = await supabase
          .from('comments')
          .select('whisper_id')
          .in('whisper_id', whisperIds);

        if (!commentError && commentData) {
          commentData.forEach(c => {
            countMap[c.whisper_id] = (countMap[c.whisper_id] || 0) + 1;
          });
        }
      }

      // Map profiles and counts
      const mappedWhispers: Whisper[] = (whispersData || []).map((w: any) => {
        const profile = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;
        return {
          ...w,
          profiles: profile,
          reactions: w.reactions || [],
          comment_count: countMap[w.id] || 0
        };
      });

      setWhispers(mappedWhispers);
    } catch (err) {
      console.warn('Error loading community page details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user, navigation]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCommunityData();
  };

  const handleToggleMembership = async () => {
    if (!id || !user || togglingJoin) return;
    setTogglingJoin(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (isJoined) {
        // Leave
        const { error } = await supabase
          .from('community_members')
          .delete()
          .eq('community_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsJoined(false);
        setMemberRole(null);
        setMembersCount(prev => Math.max(0, prev - 1));
      } else {
        // Join
        const { error } = await supabase
          .from('community_members')
          .insert({
            community_id: id,
            user_id: user.id,
            role: 'member'
          });

        if (error) throw error;
        setIsJoined(true);
        setMemberRole('member');
        setMembersCount(prev => prev + 1);
      }
    } catch (err) {
      console.warn('Failed to toggle community membership:', err);
    } finally {
      setTogglingJoin(false);
    }
  };

  const handlePostWhisper = async () => {
    if (!composeContent.trim() || !user || !id) return;
    setSubmittingCompose(true);
    try {
      const { error } = await supabase
        .from('whispers')
        .insert({
          user_id: user.id,
          content: composeContent.trim(),
          mood: composeMood,
          community_id: id // connect to this community!
        });

      if (error) throw error;
      
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      setComposeContent('');
      setComposeMood(null);
      setShowCompose(false);
      fetchCommunityData();
    } catch (err: any) {
      console.warn('Failed to post community whisper:', err.message);
    } finally {
      setSubmittingCompose(false);
    }
  };

  const handleDeleteWhisper = async (whisperId: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setWhispers(prev => prev.filter(w => w.id !== whisperId));
      await supabase.from('reactions').delete().eq('whisper_id', whisperId);
      await supabase.from('comments').delete().eq('whisper_id', whisperId);
      await supabase.from('whispers').delete().eq('id', whisperId);
    } catch (err) {
      console.warn('Failed to delete whisper:', err);
      fetchCommunityData();
    }
  };

  const handleToggleReaction = async (whisperId: string, type: 'felt' | 'warmth' | 'spark') => {
    if (!user) return;

    const whisperIndex = whispers.findIndex(w => w.id === whisperId);
    if (whisperIndex === -1) return;

    const whisper = whispers[whisperIndex];
    const existingReactionIdx = (whisper.reactions || []).findIndex(
      r => r.user_id === user.id && r.type === type
    );
    const hasReacted = existingReactionIdx > -1;

    // Optimistic update
    const newReactions = [...(whisper.reactions || [])];
    if (hasReacted) {
      newReactions.splice(existingReactionIdx, 1);
    } else {
      newReactions.push({
        id: Math.random().toString(),
        whisper_id: whisperId,
        user_id: user.id,
        type,
        created_at: new Date().toISOString()
      });
    }

    const updatedWhispers = [...whispers];
    updatedWhispers[whisperIndex] = {
      ...whisper,
      reactions: newReactions
    };
    setWhispers(updatedWhispers);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (hasReacted) {
        await supabase
          .from('reactions')
          .delete()
          .eq('whisper_id', whisperId)
          .eq('user_id', user.id)
          .eq('type', type);
      } else {
        await supabase.from('reactions').insert({
          whisper_id: whisperId,
          type,
        });

        if (whisper.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: whisper.user_id,
            actor_id: user.id,
            type: 'reaction',
            reference_id: whisperId,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to toggle reaction on community page, rolling back:', err);
      fetchCommunityData();
    }
  };

  const handleOpenComments = async (whisper: Whisper) => {
    setSelectedWhisperForComments(whisper);
    setCommentsLoading(true);
    setComments([]);
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            username,
            display_name,
            avatar_emoji,
            photo_url
          )
        `)
        .eq('whisper_id', whisper.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const mappedComments = (data || []).map((c: any) => ({
        ...c,
        profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
      }));

      setComments(mappedComments);
    } catch (err) {
      console.warn('Error loading comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!selectedWhisperForComments || !newCommentText.trim() || !user) return;
    setPostingComment(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          whisper_id: selectedWhisperForComments.id,
          user_id: user.id,
          content: newCommentText.trim()
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            username,
            display_name,
            avatar_emoji,
            photo_url
          )
        `)
        .single();

      if (error) throw error;

      const newComment: Comment = {
        ...data,
        profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
      };

      setComments(prev => [...prev, newComment]);
      setNewCommentText('');
      
      setWhispers(prev => prev.map(w => {
        if (w.id === selectedWhisperForComments.id) {
          return { ...w, comment_count: w.comment_count + 1 };
        }
        return w;
      }));

      if (selectedWhisperForComments.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: selectedWhisperForComments.user_id,
          actor_id: user.id,
          type: 'comment',
          reference_id: selectedWhisperForComments.id,
        });
      }
    } catch (err) {
      console.warn('Error posting comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  const renderWhisperItem = ({ item }: { item: Whisper }) => {
    const profile = item.profiles;
    if (!profile) return null;

    const username = profile.username || 'user';
    const displayName = profile.display_name || username;
    const initials = displayName.slice(0, 2).toUpperCase();
    const isOwnWhisper = user?.id === item.user_id;

    // Reactions count
    const reactionCounts = {
      felt: item.reactions.filter(r => r.type === 'felt').length,
      warmth: item.reactions.filter(r => r.type === 'warmth').length,
      spark: item.reactions.filter(r => r.type === 'spark').length,
    };

    const userReactions = {
      felt: item.reactions.some(r => r.user_id === user?.id && r.type === 'felt'),
      warmth: item.reactions.some(r => r.user_id === user?.id && r.type === 'warmth'),
      spark: item.reactions.some(r => r.user_id === user?.id && r.type === 'spark'),
    };

    return (
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            {profile.avatar_emoji ? (
              <Text style={styles.avatarEmoji}>{profile.avatar_emoji}</Text>
            ) : (
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
            )}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
            <Text style={[styles.username, { color: colors.textSecondary }]}>@{username} • {formatTimeAgo(item.created_at)}</Text>
          </View>
          {isOwnWhisper && (
            <TouchableOpacity onPress={() => handleDeleteWhisper(item.id)} style={styles.deleteButton}>
              <SymbolView
                name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                size={16}
                tintColor={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Mood Badge */}
        {item.mood && (
          <View style={styles.moodBadgeContainer}>
            <View style={[styles.moodBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.moodBadgeText, { color: colors.primary }]}>{item.mood}</Text>
            </View>
          </View>
        )}

        {/* Content */}
        <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>

        {/* Reactions & Comments Footer */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.reactionsContainer}>
            <TouchableOpacity 
              onPress={() => handleToggleReaction(item.id, 'felt')}
              style={[
                styles.reactionPill,
                userReactions.felt && { backgroundColor: '#FFEDEC', borderColor: '#FFC5C2' }
              ]}
            >
              <SymbolView
                name={{ ios: userReactions.felt ? 'heart.fill' : 'heart', android: 'favorite', web: 'favorite' }}
                size={14}
                tintColor={userReactions.felt ? '#C96059' : colors.textSecondary}
              />
              <Text style={[styles.reactionCount, { color: userReactions.felt ? '#C96059' : colors.textSecondary }]}>
                {reactionCounts.felt}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleToggleReaction(item.id, 'warmth')}
              style={[
                styles.reactionPill,
                userReactions.warmth && { backgroundColor: '#FFF5EB', borderColor: '#FFE2C5' }
              ]}
            >
              <SymbolView
                name={{ ios: userReactions.warmth ? 'flame.fill' : 'flame', android: 'whatshot', web: 'whatshot' }}
                size={14}
                tintColor={userReactions.warmth ? '#E67E22' : colors.textSecondary}
              />
              <Text style={[styles.reactionCount, { color: userReactions.warmth ? '#E67E22' : colors.textSecondary }]}>
                {reactionCounts.warmth}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleToggleReaction(item.id, 'spark')}
              style={[
                styles.reactionPill,
                userReactions.spark && { backgroundColor: '#F8F0FC', borderColor: '#EED6FA' }
              ]}
            >
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                size={14}
                tintColor={userReactions.spark ? '#9B59B6' : colors.textSecondary}
              />
              <Text style={[styles.reactionCount, { color: userReactions.spark ? '#9B59B6' : colors.textSecondary }]}>
                {reactionCounts.spark}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => handleOpenComments(item)} style={styles.commentPill}>
            <SymbolView
              name={{ ios: 'bubble.right', android: 'chat_bubble', web: 'chat_bubble' }}
              size={13}
              tintColor={colors.textSecondary}
            />
            <Text style={[styles.commentCount, { color: colors.textSecondary }]}>
              {item.comment_count}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading || !community) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isOwner = user?.id === community.owner_id;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Community Detail Header Card */}
      <View style={[styles.detailsCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <View style={styles.detailsRow}>
          <View style={[styles.bigEmojiBox, { backgroundColor: colors.primary + '15' }]}>
            <Text style={styles.bigEmojiText}>{community.emoji}</Text>
          </View>
          <View style={styles.detailsTextInfo}>
            <Text style={[styles.titleName, { color: colors.text }]}>{community.name}</Text>
            <View style={styles.statsRow}>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                {membersCount} {membersCount === 1 ? 'member' : 'members'} • {community.interest}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.detailsDesc, { color: colors.text }]}>
          {community.description || 'Welcome to this authentic space.'}
        </Text>

        <View style={styles.detailsFooter}>
          {isOwner ? (
            <View style={[styles.ownerBadge, { borderColor: colors.primary }]}>
              <Text style={[styles.ownerText, { color: colors.primary }]}>👑 Creator</Text>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={handleToggleMembership}
              disabled={togglingJoin}
              style={[
                styles.joinButton, 
                { backgroundColor: colors.primary },
                isJoined && { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 1 }
              ]}
            >
              {togglingJoin ? (
                <ActivityIndicator size="small" color={isJoined ? colors.primary : '#fff'} />
              ) : (
                <Text style={[styles.joinButtonText, { color: '#fff' }, isJoined && { color: colors.primary }]}>
                  {isJoined ? 'Leave Space' : 'Join Space'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Whispers Feed */}
      <FlatList
        data={whispers}
        renderItem={renderWhisperItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No whispers in this community yet.
            </Text>
          </View>
        }
      />

      {/* Floating Action Button (FAB) - only show if joined */}
      {isJoined && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            setShowCompose(true);
          }}
        >
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={24}
            tintColor="#fff"
          />
        </TouchableOpacity>
      )}

      {/* COMPOSE MODAL */}
      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCompose(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCompose(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Post to Space</Text>
            <TouchableOpacity 
              onPress={handlePostWhisper}
              disabled={submittingCompose || !composeContent.trim()}
            >
              <Text style={[
                styles.modalPost, 
                { color: colors.primary },
                (!composeContent.trim() || submittingCompose) && { opacity: 0.4 }
              ]}>
                Post
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <TextInput
              placeholder={`Share a whisper inside ${community.name}...`}
              placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
              multiline
              maxLength={5000}
              value={composeContent}
              onChangeText={setComposeContent}
              style={[styles.composeInput, { color: colors.text }]}
              autoFocus
            />

            <View style={styles.moodSelectionSection}>
              <Text style={[styles.moodSectionTitle, { color: colors.text }]}>Attach a Mood</Text>
              <View style={styles.moodPillsGrid}>
                {MOODS.map(mood => (
                  <TouchableOpacity
                    key={mood}
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setComposeMood(composeMood === mood ? null : mood);
                    }}
                    style={[
                      styles.moodSelectionPill,
                      { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                      composeMood === mood && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                    ]}
                  >
                    <Text style={[
                      styles.moodSelectionText,
                      { color: colors.text },
                      composeMood === mood && { color: colors.primary, fontWeight: 'bold' }
                    ]}>
                      {mood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.composeFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.charCountText, { color: colors.textSecondary }]}>
                {composeContent.length} / 5000 characters
              </Text>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* COMMENTS / DETAIL MODAL */}
      <Modal visible={selectedWhisperForComments !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedWhisperForComments(null)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedWhisperForComments(null)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Replies</Text>
            <View style={{ width: 50 }} />
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
            style={{ flex: 1 }}
          >
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              ListHeaderComponent={
                selectedWhisperForComments ? (
                  <View style={[styles.originalWhisperBox, { borderBottomColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.avatar, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                        {selectedWhisperForComments.profiles.avatar_emoji ? (
                          <Text style={styles.avatarEmoji}>{selectedWhisperForComments.profiles.avatar_emoji}</Text>
                        ) : (
                          <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                            {selectedWhisperForComments.profiles.display_name.slice(0, 2).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.headerTextContainer}>
                        <Text style={[styles.displayName, { color: colors.text }]}>
                          {selectedWhisperForComments.profiles.display_name}
                        </Text>
                        <Text style={[styles.username, { color: colors.textSecondary }]}>
                          @{selectedWhisperForComments.profiles.username} • {formatTimeAgo(selectedWhisperForComments.created_at)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.originalWhisperContent, { color: colors.text }]}>
                      {selectedWhisperForComments.content}
                    </Text>
                    {selectedWhisperForComments.mood && (
                      <View style={[styles.moodBadge, { alignSelf: 'flex-start', marginTop: 8, backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.moodBadgeText, { color: colors.primary }]}>{selectedWhisperForComments.mood}</Text>
                      </View>
                    )}
                    <Text style={[styles.repliesCountDivider, { color: colors.textSecondary }]}>
                      Replies ({comments.length})
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.commentAvatar, { backgroundColor: colors.primary + '10' }]}>
                      {item.profiles?.avatar_emoji ? (
                        <Text style={{ fontSize: 13 }}>{item.profiles.avatar_emoji}</Text>
                      ) : (
                        <Text style={[styles.avatarInitials, { fontSize: 10, color: colors.primary }]}>
                          {item.profiles?.display_name.slice(0, 2).toUpperCase() || 'U'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.commentTextContainer}>
                      <Text style={[styles.commentUser, { color: colors.text }]}>
                        {item.profiles?.display_name} <Text style={{ fontWeight: 'normal', color: colors.textSecondary }}>@{item.profiles?.username}</Text>
                      </Text>
                      <Text style={[styles.commentTime, { color: colors.textSecondary }]}>{formatTimeAgo(item.created_at)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>
                </View>
              )}
              ListEmptyComponent={
                commentsLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No replies yet.</Text>
                  </View>
                )
              }
            />

            <View style={[styles.replyInputBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                value={newCommentText}
                onChangeText={setNewCommentText}
                placeholder="Write a warm reply..."
                placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
                style={[styles.replyInput, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                multiline
              />
              <TouchableOpacity 
                onPress={handlePostComment}
                disabled={postingComment || !newCommentText.trim()}
                style={[styles.sendCommentButton, { backgroundColor: colors.primary }, !newCommentText.trim() && { opacity: 0.5 }]}
              >
                {postingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <SymbolView
                    name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
                    size={16}
                    tintColor="#fff"
                  />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
  detailsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bigEmojiBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigEmojiText: {
    fontSize: 26,
  },
  detailsTextInfo: {
    marginLeft: 14,
    flex: 1,
  },
  titleName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  statsRow: {
    marginTop: 2,
  },
  statsLabel: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  detailsDesc: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  detailsFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  ownerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  ownerText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  avatarInitials: {
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  username: {
    fontSize: 12,
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  deleteButton: {
    padding: 6,
  },
  moodBadgeContainer: {
    marginBottom: 10,
  },
  moodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  moodBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  commentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  commentCount: {
    fontSize: 11,
    fontWeight: 'bold',
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
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
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
  composeInput: {
    fontSize: 17,
    lineHeight: 24,
    minHeight: 180,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  moodSelectionSection: {
    marginTop: 24,
  },
  moodSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  moodPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 40,
  },
  moodSelectionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  moodSelectionText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  composeFooter: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  charCountText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  originalWhisperBox: {
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
  },
  originalWhisperContent: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  repliesCountDivider: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 18,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  commentItem: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  commentTime: {
    fontSize: 10,
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    paddingLeft: 38,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  replyInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  sendCommentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
