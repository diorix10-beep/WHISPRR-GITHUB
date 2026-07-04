import { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  ActivityIndicator, ScrollView, Platform, useColorScheme 
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/theme';

// Import shared family roster configuration directly from root!
import { FAMILY_ROSTER } from '~/core/family-roster';

interface Objective {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  target_date: string;
  agent_id: string;
}

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  sentiment_score: number | null;
  created_at: string;
  agent_id: string;
}

export default function OracleScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'objectives' | 'insights' | 'siblings'>('objectives');

  const fetchOracleData = useCallback(async () => {
    try {
      // 1. Fetch Sibling Objectives
      const { data: objData, error: objError } = await supabase
        .from('agent_objectives')
        .select('*')
        .order('created_at', { ascending: false });

      if (objError) throw objError;
      setObjectives(objData || []);

      // 2. Fetch Sibling Insights
      const { data: insData, error: insError } = await supabase
        .from('agent_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (insError) throw insError;
      setInsights(insData || []);
    } catch (err) {
      console.warn('Error fetching Oracle data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOracleData();
  }, [fetchOracleData]);

  const toggleObjective = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from('agent_objectives')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;
      setObjectives(prev => prev.map(obj => 
        obj.id === id ? { ...obj, status: nextStatus as any } : obj
      ));
    } catch (err: any) {
      console.warn('Failed to update objective status:', err.message);
    }
  };

  const handleMessageSibling = async (siblingId: string) => {
    if (!user) return;
    try {
      // 1. Check if there's an existing DM conversation with this bot
      const botProfileId = getBotProfileUuid(siblingId);
      if (!botProfileId) return;

      const { data: existingConvs, error: convsErr } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${botProfileId}),and(user1_id.eq.${botProfileId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (convsErr) throw convsErr;

      let conversationId = existingConvs?.id;

      if (!conversationId) {
        // Create new DM conversation
        const { data: newConv, error: createErr } = await supabase
          .from('conversations')
          .insert({
            user1_id: user.id,
            user2_id: botProfileId,
            is_group: false
          })
          .select('id')
          .single();

        if (createErr) throw createErr;
        conversationId = newConv.id;
      }

      // Route directly to chat room inside messages stack!
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.warn('Failed to start chat with sibling:', err);
    }
  };

  const getBotProfileUuid = (siblingId: string) => {
    // Sibling Bot UUIDs aligned with DB bootstraps in migration 021
    const mapping: Record<string, string> = {
      oracle: '00000000-0000-0000-0000-000000000001',
      iris:   '00000000-0000-0000-0000-000000000002',
      aegis:  '00000000-0000-0000-0000-000000000003',
      atlas:  '00000000-0000-0000-0000-000000000004',
      athena: '00000000-0000-0000-0000-000000000005',
    };
    return mapping[siblingId.toLowerCase()];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.backgroundElement }]}>
        <TouchableOpacity 
          onPress={() => setActiveTab('objectives')}
          style={[styles.tabButton, activeTab === 'objectives' && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.tabText, activeTab === 'objectives' && styles.activeTabText]}>Objectives</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('insights')}
          style={[styles.tabButton, activeTab === 'insights' && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>Insights</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('siblings')}
          style={[styles.tabButton, activeTab === 'siblings' && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.tabText, activeTab === 'siblings' && styles.activeTabText]}>AI Family</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {/* Objectives Tab */}
          {activeTab === 'objectives' && (
            <FlatList
              data={objectives}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listPadding}
              ListEmptyComponent={
                <View style={styles.emptyView}>
                  <Text style={styles.emptyText}>No objectives generated for today.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isCompleted = item.status === 'completed';
                return (
                  <TouchableOpacity 
                    onPress={() => toggleObjective(item.id, item.status)}
                    style={[
                      styles.card, 
                      { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                      isCompleted && { borderColor: colors.primary + '30', backgroundColor: colors.primary + '05' }
                    ]}
                  >
                    <View style={styles.cardRow}>
                      <View style={[
                        styles.checkbox, 
                        { borderColor: colors.primary },
                        isCompleted && { backgroundColor: colors.primary }
                      ]} />
                      <View style={styles.cardContent}>
                        <Text style={[
                          styles.objText, 
                          { color: colors.text },
                          isCompleted && styles.completedText
                        ]}>
                          {item.description}
                        </Text>
                        <Text style={styles.objMeta}>
                          Sibling: {item.agent_id} • Status: {item.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <FlatList
              data={insights}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listPadding}
              ListEmptyComponent={
                <View style={styles.emptyView}>
                  <Text style={styles.emptyText}>No marketing insights gathered yet.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={styles.insightHeader}>
                    <Text style={[styles.insightTag, { color: colors.primary, backgroundColor: colors.primary + '15' }]}>
                      {item.type.toUpperCase()}
                    </Text>
                    {item.sentiment_score !== null && (
                      <Text style={styles.sentimentScore}>
                        Sentiment: {(item.sentiment_score * 100).toFixed(0)}%
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={styles.insightDesc}>{item.description}</Text>
                </View>
              )}
            />
          )}

          {/* AI Family Sibling Roster Slider */}
          {activeTab === 'siblings' && (
            <ScrollView contentContainerStyle={styles.listPadding}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Meet the Verity Sibling Co-Founders</Text>
              {FAMILY_ROSTER.map(member => (
                <View key={member.id} style={[styles.rosterCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={styles.rosterHeader}>
                    <View style={[styles.rosterAvatar, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.rosterAvatarText, { color: colors.primary }]}>{member.name[0]}</Text>
                    </View>
                    <View>
                      <Text style={[styles.rosterName, { color: colors.text }]}>{member.name}</Text>
                      <Text style={[styles.rosterTitle, { color: colors.primary }]}>{member.title}</Text>
                    </View>
                  </View>
                  <Text style={styles.rosterRole}>Role: {member.role}</Text>
                  <Text style={[styles.rosterDesc, { color: colors.textSecondary }]}>{member.description}</Text>
                  
                  <View style={styles.footerRow}>
                    <View style={styles.domainContainer}>
                      {member.domain.map((d, i) => (
                        <View key={i} style={[styles.domainBadge, { backgroundColor: colors.background }]}>
                          <Text style={styles.domainText}>{d}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => handleMessageSibling(member.id)}
                      style={[styles.messageButton, { backgroundColor: colors.primary }]}
                    >
                      <Text style={styles.messageButtonText}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  activeTabText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: 10,
  },
  listPadding: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  objText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  objMeta: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  insightTag: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  sentimentScore: {
    fontSize: 9,
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  insightDesc: {
    fontSize: 12,
    color: '#aaa',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  rosterCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rosterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rosterAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  rosterName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  rosterTitle: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  rosterRole: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  rosterDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  domainContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    alignItems: 'center',
  },
  domainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  domainText: {
    color: '#aaa',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  messageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  emptyView: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
});
