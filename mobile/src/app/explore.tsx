import { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  ActivityIndicator, ScrollView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  const { profile } = useAuth();
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Oracle Center</Text>
        <Text style={styles.headerSubtitle}>Orchestrating Brand & Sibling Operations</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          onPress={() => setActiveTab('objectives')}
          style={[styles.tabButton, activeTab === 'objectives' && styles.activeTabButton]}
        >
          <Text style={[styles.tabText, activeTab === 'objectives' && styles.activeTabText]}>Objectives</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('insights')}
          style={[styles.tabButton, activeTab === 'insights' && styles.activeTabButton]}
        >
          <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>Insights</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('siblings')}
          style={[styles.tabButton, activeTab === 'siblings' && styles.activeTabButton]}
        >
          <Text style={[styles.tabText, activeTab === 'siblings' && styles.activeTabText]}>AI Family</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4d80" />
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
                    style={[styles.card, isCompleted && styles.completedCard]}
                  >
                    <View style={styles.cardRow}>
                      <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]} />
                      <View style={styles.cardContent}>
                        <Text style={[styles.objText, isCompleted && styles.completedText]}>
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
                <View style={styles.card}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightTag}>{item.type.toUpperCase()}</Text>
                    {item.sentiment_score !== null && (
                      <Text style={styles.sentimentScore}>
                        Sentiment: {(item.sentiment_score * 100).toFixed(0)}%
                      </Text>
                    )}
                  </View>
                  <Text style={styles.insightTitle}>{item.title}</Text>
                  <Text style={styles.insightDesc}>{item.description}</Text>
                </View>
              )}
            />
          )}

          {/* AI Family Sibling Roster Slider */}
          {activeTab === 'siblings' && (
            <ScrollView contentContainerStyle={styles.listPadding}>
              <Text style={styles.sectionTitle}>Meet the Verity Sibling Co-Founders</Text>
              {FAMILY_ROSTER.map(member => (
                <View key={member.id} style={styles.rosterCard}>
                  <View style={styles.rosterHeader}>
                    <View style={styles.rosterAvatar}>
                      <Text style={styles.rosterAvatarText}>{member.name[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.rosterName}>{member.name}</Text>
                      <Text style={styles.rosterTitle}>{member.title}</Text>
                    </View>
                  </View>
                  <Text style={styles.rosterRole}>Role: {member.role}</Text>
                  <Text style={styles.rosterDesc}>{member.description}</Text>
                  <View style={styles.domainContainer}>
                    {member.domain.map((d, i) => (
                      <View key={i} style={styles.domainBadge}>
                        <Text style={styles.domainText}>{d}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
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
  headerSubtitle: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
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
  activeTabButton: {
    backgroundColor: '#ff4d80',
  },
  tabText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 12,
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
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  completedCard: {
    borderColor: '#ff4d8030',
    backgroundColor: '#181416',
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
    borderColor: '#ff4d80',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#ff4d80',
  },
  cardContent: {
    flex: 1,
  },
  objText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
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
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  insightTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ff4d80',
    backgroundColor: '#ff4d8015',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sentimentScore: {
    fontSize: 9,
    color: '#888',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 12,
    color: '#aaa',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginLeft: 4,
  },
  rosterCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
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
    backgroundColor: '#ff4d8030',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rosterAvatarText: {
    color: '#ff4d80',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rosterName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  rosterTitle: {
    fontSize: 10,
    color: '#ff4d80',
  },
  rosterRole: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
  },
  rosterDesc: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 18,
    marginBottom: 12,
  },
  domainContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  domainBadge: {
    backgroundColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  domainText: {
    color: '#aaa',
    fontSize: 9,
    fontWeight: 'bold',
  },
  emptyView: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
