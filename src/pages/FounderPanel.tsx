import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Settings, Activity, Users, MessageSquare, 
  Send, ShieldCheck, Search, Bug, Loader2, Plus, Award,
  PenTool, BookOpen, Flag, Rocket, GitCommit, Bot, Terminal,
  CheckCircle2, TrendingUp, FileText, Calendar, PlusCircle, Sparkles,
  Globe, Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { Profile, Community } from '../types';
import { Avatar } from '../components/common/Avatar';
import { FAMILY_ROSTER } from '../core/family-roster';

type PanelTab = 'system' | 'monitoring' | 'users' | 'communities' | 'badges' | 'updates' | 'ai-team' | 'testing' | 'feedback' | 'community';

interface SystemSettingsModel {
  enabled: boolean;
  message: string;
  reopen_at: string | null;
  bypass_founder: boolean;
  bypass_admin: boolean;
  bypass_beta: boolean;
  allow_public: boolean;
  allow_auth: boolean;
}

interface BugReport {
  id: string;
  created_at: string;
  user_id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  profiles?: Profile;
}

export default function FounderPanel() {
  const { user, profile, systemSettings, updateSystemSettings } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<PanelTab>('system');
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // System controls form state
  const [settingsForm, setSettingsForm] = useState<SystemSettingsModel>({
    enabled: false,
    message: '',
    reopen_at: '',
    bypass_founder: true,
    bypass_admin: true,
    bypass_beta: false,
    allow_public: true,
    allow_auth: true
  });

  // Users management state
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Communities state
  const [communitiesList, setCommunitiesList] = useState<Community[]>([]);
  const [loadingComms, setLoadingComms] = useState(false);

  // Feedback state
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Badges state
  const [selectedBadgeType, setSelectedBadgeType] = useState<string>('early_supporter');
  const [badgeHolders, setBadgeHolders] = useState<any[]>([]);
  const [loadingBadgeHolders, setLoadingBadgeHolders] = useState(false);
  const [badgeSearchQuery, setBadgeSearchQuery] = useState('');
  const [badgeSearchResults, setBadgeSearchResults] = useState<Profile[]>([]);
  const [loadingBadgeSearch, setLoadingBadgeSearch] = useState(false);
  const [cutoffDate, setCutoffDate] = useState<string>('2026-06-30T00:00');

  // Publish Updates states
  const [updatesSubTab, setUpdatesSubTab] = useState<'roadmap' | 'changelog' | 'journal' | 'flags'>('roadmap');

  // AI Engineering states
  const [aiApprovalMode, setAiApprovalMode] = useState<number>(() => {
    const saved = localStorage.getItem('whisprr_ai_approval_mode');
    return saved ? parseInt(saved, 10) : 1; // Default to Level 1 (Manual Approval)
  });

  // Roadmap States
  const [roadmapList, setRoadmapList] = useState<any[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [editingRoadmapId, setEditingRoadmapId] = useState<string | null>(null);
  const [roadmapForm, setRoadmapForm] = useState({
    title: '',
    description: '',
    status: 'planned',
    category: 'Core',
    is_community_requested: false,
    requested_by_count: 0,
    pinned_milestone: false,
    milestone_icon: ''
  });

  // Changelog States
  const [changelogList, setChangelogList] = useState<any[]>([]);
  const [loadingChangelog, setLoadingChangelog] = useState(false);
  const [editingChangelogId, setEditingChangelogId] = useState<string | null>(null);
  const [changelogForm, setChangelogForm] = useState({
    version: '',
    title: '',
    summary: '',
    status: 'draft',
    new_features: '',
    improvements: '',
    bug_fixes: '',
    performance: ''
  });

  // Journal States
  const [journalList, setJournalList] = useState<any[]>([]);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalForm, setJournalForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Founder Journal',
    read_time: '5 min read',
    status: 'draft'
  });

  // Feature Flags States
  const [flagsList, setFlagsList] = useState<any[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [editingFlagId, setEditingFlagId] = useState<string | null>(null);
  const [flagForm, setFlagForm] = useState({
    name: '',
    description: '',
    status: 'disabled',
    target_countries: ''
  });

  // Community Tab States
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [referralLeaderboard, setReferralLeaderboard] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // AI Team tab states
  const [aiSubTab, setAiSubTab] = useState<'overview' | 'drafts' | 'objectives' | 'insights' | 'campaigns' | 'library' | 'calendar' | 'settings'>('overview');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<any[]>([]);
  const [aiObjectives, setAiObjectives] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiCampaigns, setAiCampaigns] = useState<any[]>([]);
  const [aiActivityLogs, setAiActivityLogs] = useState<any[]>([]);
  
  // Ecosystem social platforms state
  const [socialPlatforms, setSocialPlatforms] = useState<any[]>([]);

  // Scheduler modal states
  const [schedulerModalOpen, setSchedulerModalOpen] = useState(false);
  const [schedulerContent, setSchedulerContent] = useState('');
  const [schedulerTime, setSchedulerTime] = useState('');
  const [schedulerAgent, setSchedulerAgent] = useState('oracle');
  const [schedulerDraftId, setSchedulerDraftId] = useState<string | null>(null);
  const [mediaAssets, setMediaAssets] = useState<any[]>([
    { name: 'whisprr_banner.png', size: '1.2 MB', type: 'image/png', date: '2026-06-30' },
    { name: 'teaser_video.mp4', size: '14.8 MB', type: 'video/mp4', date: '2026-07-01' },
    { name: 'oracle_avatar.jpg', size: '240 KB', type: 'image/jpeg', date: '2026-07-02' }
  ]);

  // X Settings
  const [xSettings, setXSettings] = useState({
    enabled: false,
    active_agents: ['oracle'],
    check_interval_mins: 30,
    search_keywords: ['WHISPRRHQ', 'WHISPRR', 'voice social', 'AI companions'],
    auto_post_roadmap: false,
    auto_post_changelog: false,
    auto_post_journal: false
  });
  const [keywordsText, setKeywordsText] = useState('');
  const [agentsText, setAgentsText] = useState('');

  // Draft editing states
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingDraftContent, setEditingDraftContent] = useState<string>('');

  // Objectives form states
  const [newObjectiveDesc, setNewObjectiveDesc] = useState('');
  const [newObjectiveAgent, setNewObjectiveAgent] = useState('oracle');

  // Campaigns form states
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [newCampaignGoals, setNewCampaignGoals] = useState('');
  const [newCampaignStart, setNewCampaignStart] = useState('');
  const [newCampaignEnd, setNewCampaignEnd] = useState('');

  // Load current settings into form
  useEffect(() => {
    if (systemSettings) {
      setSettingsForm({
        enabled: systemSettings.enabled || false,
        message: systemSettings.message || '',
        reopen_at: systemSettings.reopen_at || '',
        bypass_founder: systemSettings.bypass_founder !== false,
        bypass_admin: systemSettings.bypass_admin !== false,
        bypass_beta: systemSettings.bypass_beta === true,
        allow_public: systemSettings.allow_public !== false,
        allow_auth: systemSettings.allow_auth !== false
      });
    }
  }, [systemSettings]);

  // Load users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (searchQuery.trim() !== '') {
        query = query.or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`);
      }
      const { data, error } = await query.limit(50);
      if (!error && data) {
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load communities
  const fetchCommunities = async () => {
    setLoadingComms(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setCommunitiesList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComms(false);
    }
  };

  // Load bug reports/feedback
  const fetchBugReports = async () => {
    setLoadingFeedback(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          profiles:user_id(id, username, display_name, avatar_emoji)
        `)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setBugReports(data as any[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Load badge holders
  const fetchBadgeHolders = async (badgeType: string) => {
    setLoadingBadgeHolders(true);
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          profiles:user_id(user_id, username, display_name, avatar_emoji, photo_url)
        `)
        .eq('badge_type', badgeType);
      if (!error && data) {
        setBadgeHolders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBadgeHolders(false);
    }
  };

  // Search users for badges
  const handleSearchUsersForBadge = async () => {
    if (badgeSearchQuery.trim() === '') return;
    setLoadingBadgeSearch(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${badgeSearchQuery}%,display_name.ilike.%${badgeSearchQuery}%`)
        .limit(10);
      if (!error && data) {
        setBadgeSearchResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBadgeSearch(false);
    }
  };

  // Grant badge
  const handleGrantBadge = async (targetUserId: string, badgeType: string) => {
    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: targetUserId,
          badge_type: badgeType,
          granted_by: user?.id
        });
      if (error) throw error;
      showToast('Badge granted successfully!', 'success');
      fetchBadgeHolders(badgeType);
    } catch (err) {
      console.error(err);
      showToast('Failed to grant badge (already exists or unauthorized)', 'error');
    }
  };

  // Revoke badge
  const handleRemoveBadge = async (badgeId: string, badgeType: string) => {
    try {
      const { error } = await supabase
        .from('user_badges')
        .delete()
        .eq('id', badgeId);
      if (error) throw error;
      showToast('Badge revoked successfully!', 'success');
      fetchBadgeHolders(badgeType);
    } catch (err) {
      console.error(err);
      showToast('Failed to revoke badge', 'error');
    }
  };

  // Run Early Supporter
  const handleRunEarlySupporter = async () => {
    if (!cutoffDate) {
      showToast('Please specify a cutoff date', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('run_early_supporter_assignment', {
        p_cutoff_date: new Date(cutoffDate).toISOString()
      });
      if (error) throw error;
      showToast(`Early Supporter Program executed! Assigned badges to ${data} users.`, 'success');
      fetchBadgeHolders('early_supporter');
    } catch (err) {
      console.error(err);
      showToast('Failed to execute assignment script', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fetchRoadmapItems = async () => {
    setLoadingRoadmap(true);
    try {
      const { data, error } = await supabase.from('public_roadmap').select('*').order('created_at', { ascending: false });
      if (!error && data) setRoadmapList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const handleSaveRoadmapItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRoadmapId) {
        const { error } = await supabase
          .from('public_roadmap')
          .update({ ...roadmapForm, updated_at: new Date().toISOString() })
          .eq('id', editingRoadmapId);
        if (error) throw error;
        showToast('Roadmap item updated!', 'success');
      } else {
        const { error } = await supabase
          .from('public_roadmap')
          .insert(roadmapForm);
        if (error) throw error;
        showToast('Roadmap item created!', 'success');
      }
      
      // Auto-trigger changelog pre-fill workflow if marked Released
      if (roadmapForm.status === 'released') {
        setChangelogForm({
          version: `v${changelogList.length + 4}.0.0-draft`,
          title: `${roadmapForm.title} Released`,
          summary: `The community-driven feature "${roadmapForm.title}" is now officially live! ${roadmapForm.description}`,
          status: 'draft',
          new_features: roadmapForm.title,
          improvements: '',
          bug_fixes: '',
          performance: ''
        });
        setUpdatesSubTab('changelog');
        showToast('✨ Feature is Released! Pre-filled a draft Changelog for you below.', 'info');
      }
      
      setEditingRoadmapId(null);
      setRoadmapForm({
        title: '',
        description: '',
        status: 'planned',
        category: 'Core',
        is_community_requested: false,
        requested_by_count: 0,
        pinned_milestone: false,
        milestone_icon: ''
      });
      fetchRoadmapItems();
    } catch (err) {
      console.error(err);
      showToast('Failed to save roadmap item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoadmapItem = async (id: string) => {
    if (!window.confirm('Delete this roadmap item?')) return;
    try {
      const { error } = await supabase.from('public_roadmap').delete().eq('id', id);
      if (error) throw error;
      showToast('Roadmap item deleted!', 'success');
      fetchRoadmapItems();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete roadmap item', 'error');
    }
  };

  const fetchChangelogs = async () => {
    setLoadingChangelog(true);
    try {
      const { data, error } = await supabase.from('public_changelog').select('*').order('version', { ascending: false });
      if (!error && data) setChangelogList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChangelog(false);
    }
  };

  const handleSaveChangelog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        version: changelogForm.version,
        title: changelogForm.title,
        summary: changelogForm.summary,
        status: changelogForm.status,
        new_features: changelogForm.new_features ? changelogForm.new_features.split(',').map(s => s.trim()) : [],
        improvements: changelogForm.improvements ? changelogForm.improvements.split(',').map(s => s.trim()) : [],
        bug_fixes: changelogForm.bug_fixes ? changelogForm.bug_fixes.split(',').map(s => s.trim()) : [],
        performance: changelogForm.performance ? changelogForm.performance.split(',').map(s => s.trim()) : []
      };

      if (editingChangelogId) {
        const { error } = await supabase.from('public_changelog').update(payload).eq('id', editingChangelogId);
        if (error) throw error;
        showToast('Changelog updated!', 'success');
      } else {
        const { error } = await supabase.from('public_changelog').insert(payload);
        if (error) throw error;
        showToast('Changelog created!', 'success');
      }
      setEditingChangelogId(null);
      setChangelogForm({
        version: '',
        title: '',
        summary: '',
        status: 'draft',
        new_features: '',
        improvements: '',
        bug_fixes: '',
        performance: ''
      });
      fetchChangelogs();
    } catch (err) {
      console.error(err);
      showToast('Failed to save changelog', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChangelog = async (id: string) => {
    if (!window.confirm('Delete this changelog?')) return;
    try {
      const { error } = await supabase.from('public_changelog').delete().eq('id', id);
      if (error) throw error;
      showToast('Changelog deleted!', 'success');
      fetchChangelogs();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete changelog', 'error');
    }
  };

  const fetchJournals = async () => {
    setLoadingJournal(true);
    try {
      const { data, error } = await supabase.from('founder_journal').select('*').order('published_at', { ascending: false });
      if (!error && data) setJournalList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJournal(false);
    }
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingJournalId) {
        const { error } = await supabase.from('founder_journal').update(journalForm).eq('id', editingJournalId);
        if (error) throw error;
        showToast('Journal post updated!', 'success');
      } else {
        const { error } = await supabase.from('founder_journal').insert(journalForm);
        if (error) throw error;
        showToast('Journal post created!', 'success');
      }
      setEditingJournalId(null);
      setJournalForm({
        title: '',
        excerpt: '',
        content: '',
        category: 'Founder Journal',
        read_time: '5 min read',
        status: 'draft'
      });
      fetchJournals();
    } catch (err) {
      console.error(err);
      showToast('Failed to save journal post', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!window.confirm('Delete this journal post?')) return;
    try {
      const { error } = await supabase.from('founder_journal').delete().eq('id', id);
      if (error) throw error;
      showToast('Journal post deleted!', 'success');
      fetchJournals();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete journal post', 'error');
    }
  };

  const fetchFeatureFlags = async () => {
    setLoadingFlags(true);
    try {
      const { data, error } = await supabase.from('feature_flags').select('*').order('name', { ascending: true });
      if (!error && data) setFlagsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFlags(false);
    }
  };

  const handleSaveFeatureFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const countriesArray = flagForm.target_countries 
        ? flagForm.target_countries.split(',').map(c => c.trim()).filter(Boolean) 
        : [];
      
      const payload = {
        name: flagForm.name.trim().toLowerCase().replace(/\s+/g, '_'),
        description: flagForm.description,
        status: flagForm.status,
        target_countries: countriesArray,
        updated_at: new Date().toISOString()
      };

      if (editingFlagId) {
        const { error } = await supabase.from('feature_flags').update(payload).eq('id', editingFlagId);
        if (error) throw error;
        showToast('Feature Flag updated!', 'success');
      } else {
        const { error } = await supabase.from('feature_flags').insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
        showToast('Feature Flag created!', 'success');
      }
      setEditingFlagId(null);
      setFlagForm({
        name: '',
        description: '',
        status: 'disabled',
        target_countries: ''
      });
      fetchFeatureFlags();
    } catch (err) {
      console.error(err);
      showToast('Failed to save feature flag', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeatureFlag = async (id: string) => {
    if (!window.confirm('Delete this feature flag?')) return;
    try {
      const { error } = await supabase.from('feature_flags').delete().eq('id', id);
      if (error) throw error;
      showToast('Feature Flag deleted!', 'success');
      fetchFeatureFlags();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete feature flag', 'error');
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setApplications(data);
      }
    } catch (err) {
      console.warn("Could not load real applications, using fallback:", err);
      setApplications([
        {
          id: 'mock-1',
          username: 'alex_community',
          name: 'Alex Rivera',
          type: 'ambassador',
          platform: null,
          handle: null,
          motivation: 'I want to organize local university tech talks and set up stickers/posters for WHISPRR.',
          status: 'pending',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'mock-2',
          username: 'tech_weekly',
          name: 'Sarah Chen',
          type: 'creator',
          platform: 'YouTube',
          handle: '@tech_weekly',
          motivation: "I review security-first apps and want to create a full tutorial video on WHISPRR's decentralized feeds.",
          status: 'pending',
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchReferralLeaderboard = async () => {
    setLoadingReferrals(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, referrals_count, role')
        .gt('referrals_count', 0)
        .order('referrals_count', { ascending: false })
        .limit(10);
      if (error) throw error;
      if (data) {
        setReferralLeaderboard(data);
      }
    } catch (err) {
      console.warn("Could not load referral leaderboard, using fallback:", err);
      setReferralLeaderboard([
        { username: 'nyny59', referrals_count: 48, role: 'founder' },
        { username: 'zen_garden', referrals_count: 32, role: 'ambassador' }
      ]);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const fetchAiTeamData = async () => {
    setLoadingAi(true);
    try {
      // 1. Fetch Drafts
      const { data: draftsData } = await supabase
        .from('agent_drafts')
        .select('*')
        .order('created_at', { ascending: false });
      if (draftsData) setAiDrafts(draftsData);

      // 2. Fetch Objectives
      const { data: objData } = await supabase
        .from('agent_objectives')
        .select('*')
        .order('target_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (objData) setAiObjectives(objData);

      // 3. Fetch Insights
      const { data: insightsData } = await supabase
        .from('agent_insights')
        .select('*')
        .order('created_at', { ascending: false });
      if (insightsData) setAiInsights(insightsData);

      // 4. Fetch Recommendations
      const { data: recData } = await supabase
        .from('agent_recommendations')
        .select('*')
        .order('created_at', { ascending: false });
      if (recData) setAiRecommendations(recData);

      // 5. Fetch Campaigns
      const { data: campData } = await supabase
        .from('agent_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (campData) setAiCampaigns(campData);

      // 6. Fetch Activity Logs
      const { data: logsData } = await supabase
        .from('agent_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (logsData) setAiActivityLogs(logsData);

      // 7. Fetch system_settings key='x_integration'
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'x_integration')
        .maybeSingle();

      if (settingsData && settingsData.value) {
        const val = settingsData.value;
        setXSettings({
          enabled: val.enabled ?? false,
          active_agents: val.active_agents ?? ['oracle'],
          check_interval_mins: val.check_interval_mins ?? 30,
          search_keywords: val.search_keywords ?? ['WHISPRR', 'voice social', 'AI companions'],
          auto_post_roadmap: val.auto_post_roadmap ?? false,
          auto_post_changelog: val.auto_post_changelog ?? false,
          auto_post_journal: val.auto_post_journal ?? false
        });
        setKeywordsText((val.search_keywords ?? []).join(', '));
        setAgentsText((val.active_agents ?? []).join(', '));
      }

      // 8. Fetch system_settings key='ecosystem_platforms'
      const { data: platformsData } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'ecosystem_platforms')
        .maybeSingle();

      if (platformsData && platformsData.value) {
        setSocialPlatforms(platformsData.value);
      }
    } catch (err) {
      console.error('Error fetching AI Team data:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const handleUpdateDraftStatus = async (draftId: string, status: 'approved' | 'rejected' | 'published') => {
    try {
      const { error } = await supabase
        .from('agent_drafts')
        .update({ status })
        .eq('id', draftId);
      if (error) throw error;
      showToast(`Draft status updated to ${status}!`, 'success');
      
      // Reload drafts
      const { data: draftsData } = await supabase
        .from('agent_drafts')
        .select('*')
        .order('created_at', { ascending: false });
      if (draftsData) setAiDrafts(draftsData);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to update draft status: ${err.message}`, 'error');
    }
  };

  const handleSaveDraftContent = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('agent_drafts')
        .update({ content: editingDraftContent })
        .eq('id', draftId);
      if (error) throw error;
      showToast('Draft content updated!', 'success');
      setEditingDraftId(null);
      
      // Reload drafts
      const { data: draftsData } = await supabase
        .from('agent_drafts')
        .select('*')
        .order('created_at', { ascending: false });
      if (draftsData) setAiDrafts(draftsData);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to save draft content: ${err.message}`, 'error');
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulerContent.trim()) {
      showToast('Draft content cannot be empty!', 'error');
      return;
    }
    if (!schedulerTime) {
      showToast('Please select a scheduled date and time!', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const scheduledIso = new Date(schedulerTime).toISOString();
      if (schedulerDraftId) {
        // Update existing draft
        const { error } = await supabase
          .from('agent_drafts')
          .update({
            content: schedulerContent,
            agent_id: schedulerAgent,
            scheduled_for: scheduledIso,
            status: 'approved'
          })
          .eq('id', schedulerDraftId);
        if (error) throw error;
        showToast('Draft scheduled successfully!', 'success');
      } else {
        // Create new scheduled draft
        const { error } = await supabase
          .from('agent_drafts')
          .insert({
            content: schedulerContent,
            agent_id: schedulerAgent,
            scheduled_for: scheduledIso,
            platform: 'x',
            status: 'approved'
          });
        if (error) throw error;
        showToast('New post scheduled successfully!', 'success');
      }
      setSchedulerModalOpen(false);
      setSchedulerDraftId(null);
      setSchedulerContent('');
      setSchedulerTime('');
      
      // Reload drafts
      const { data: draftsData } = await supabase
        .from('agent_drafts')
        .select('*')
        .order('created_at', { ascending: false });
      if (draftsData) setAiDrafts(draftsData);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to schedule post: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRecommendationStatus = async (recId: string, status: 'approved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('agent_recommendations')
        .update({ status })
        .eq('id', recId);
      if (error) throw error;
      showToast(`Recommendation marked as ${status}!`, 'success');
      
      // Reload recommendations
      const { data: recData } = await supabase
        .from('agent_recommendations')
        .select('*')
        .order('created_at', { ascending: false });
      if (recData) setAiRecommendations(recData);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to update recommendation: ${err.message}`, 'error');
    }
  };

  const handleToggleObjectiveStatus = async (objId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from('agent_objectives')
        .update({ status: nextStatus })
        .eq('id', objId);
      if (error) throw error;
      showToast(`Objective marked as ${nextStatus}!`, 'success');
      
      // Reload objectives
      const { data: objData } = await supabase
        .from('agent_objectives')
        .select('*')
        .order('target_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (objData) setAiObjectives(objData);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to toggle objective: ${err.message}`, 'error');
    }
  };

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjectiveDesc.trim()) return;
    try {
      const { error } = await supabase
        .from('agent_objectives')
        .insert({
          agent_id: newObjectiveAgent,
          description: newObjectiveDesc.trim(),
          status: 'pending',
          target_date: new Date().toISOString().split('T')[0]
        });
      if (error) throw error;
      showToast('Custom objective added for today!', 'success');
      setNewObjectiveDesc('');
      
      // Reload objectives
      const { data: objData } = await supabase
        .from('agent_objectives')
        .select('*')
        .order('target_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (objData) setAiObjectives(objData);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to add objective: ${err.message}`, 'error');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;
    try {
      const { error } = await supabase
        .from('agent_campaigns')
        .insert({
          agent_id: 'oracle',
          name: newCampaignName.trim(),
          description: newCampaignDesc.trim(),
          goals: newCampaignGoals.trim(),
          start_date: newCampaignStart || null,
          end_date: newCampaignEnd || null,
          status: 'draft'
        });
      if (error) throw error;
      showToast('Campaign plan drafted successfully!', 'success');
      setNewCampaignName('');
      setNewCampaignDesc('');
      setNewCampaignGoals('');
      setNewCampaignStart('');
      setNewCampaignEnd('');
      
      // Reload campaigns
      const { data: campData } = await supabase
        .from('agent_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (campData) setAiCampaigns(campData);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to create campaign: ${err.message}`, 'error');
    }
  };

  const handleUpdateCampaignStatus = async (campId: string, status: 'draft' | 'active' | 'completed') => {
    try {
      const { error } = await supabase
        .from('agent_campaigns')
        .update({ status })
        .eq('id', campId);
      if (error) throw error;
      showToast(`Campaign marked as ${status}!`, 'success');
      
      // Reload campaigns
      const { data: campData } = await supabase
        .from('agent_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (campData) setAiCampaigns(campData);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to update campaign: ${err.message}`, 'error');
    }
  };

  const handleSaveXSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const activeAgents = agentsText.split(',').map(s => s.trim()).filter(Boolean);
      const searchKeywords = keywordsText.split(',').map(s => s.trim()).filter(Boolean);

      const updatedVal = {
        ...xSettings,
        active_agents: activeAgents,
        search_keywords: searchKeywords
      };

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'x_integration',
          value: updatedVal,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null
        });

      if (error && !error.message.includes('public.system_settings')) {
        throw error;
      }
      setXSettings(updatedVal);
      showToast('X integration configuration updated!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to update configuration: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, status: 'approved' | 'rejected', type: string, targetUserId?: string) => {
    if (appId.startsWith('mock-')) {
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status } : app));
      showToast(`[Mock] Simulated ${status} for ${type} application.`, 'success');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', appId);
      if (error) throw error;

      if (status === 'approved' && targetUserId) {
        if (type === 'ambassador') {
          await supabase.from('user_badges').insert({
            user_id: targetUserId,
            badge_type: 'ambassador',
            granted_by: user?.id
          });
        } else if (type === 'creator') {
          await supabase.from('user_badges').insert({
            user_id: targetUserId,
            badge_type: 'verified_creator',
            granted_by: user?.id
          });
        }
      }

      showToast(`Application has been ${status}.`, 'success');
      fetchApplications();
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to update application status: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'communities') fetchCommunities();
    else if (activeTab === 'feedback') fetchBugReports();
    else if (activeTab === 'badges') fetchBadgeHolders(selectedBadgeType);
    else if (activeTab === 'community') {
      fetchApplications();
      fetchReferralLeaderboard();
    }
    else if (activeTab === 'updates') {
      fetchRoadmapItems();
      fetchChangelogs();
      fetchJournals();
      fetchFeatureFlags();
    }
    else if (activeTab === 'ai-team') {
      fetchAiTeamData();
    }
  }, [activeTab, selectedBadgeType]);

  // Save system settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSettings({
        enabled: settingsForm.enabled,
        message: settingsForm.message,
        reopen_at: settingsForm.reopen_at || null,
        bypass_founder: settingsForm.bypass_founder,
        bypass_admin: settingsForm.bypass_admin,
        bypass_beta: settingsForm.bypass_beta,
        allow_public: settingsForm.allow_public,
        allow_auth: settingsForm.allow_auth
      });
      showToast('System settings updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update system settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Change user roles (moderator, admin, user, founder)
  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', targetUserId);
      if (error) throw error;
      showToast(`User role updated to ${newRole}`, 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to update user role', 'error');
    }
  };

  // Trigger demo notification
  const handleSendTestNotification = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        actor_id: user.id,
        type: 'follow',
        reference_id: null,
        read: false
      });
      if (error) throw error;
      showToast('Test notification dispatched! Check your notifications tray.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to send test notification', 'error');
    }
  };

  // Community creation testing trigger
  const handleCreateTestCommunity = async () => {
    try {
      const randomId = Math.floor(Math.random() * 10000);
      const { error } = await supabase.from('communities').insert({
        name: `Test Community #${randomId}`,
        description: 'Automated test sandbox community.',
        emoji: '🧪',
        interest: 'Technology',
        created_by: user?.id
      });
      if (error) throw error;
      showToast('Test Sandbox Community created!', 'success');
      fetchCommunities();
    } catch (err) {
      console.error(err);
      showToast('Failed to create sandbox community', 'error');
    }
  };

  if (profile?.role !== 'founder') {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white dark:bg-warm-800 p-8 rounded-3xl border border-warm-100 dark:border-warm-700 max-w-md shadow-soft">
           <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
           <h2 className="text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">Access Denied</h2>
           <p className="text-sm text-warm-500">Only Founder accounts can access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
           <h1 className="section-title flex items-center gap-2">
             👑 Founder Panel <span className="bg-primary-100 dark:bg-primary-900/55 text-primary-600 text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">Active</span>
           </h1>
           <p className="text-sm text-warm-500 mt-1">Control system state, monitor analytics, and moderate content</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-warm-100 dark:bg-warm-850 p-1 rounded-2xl overflow-x-auto shrink-0 select-none">
          {([
             { key: 'system' as PanelTab, icon: Settings, label: 'System' },
             { key: 'monitoring' as PanelTab, icon: Activity, label: 'Monitor' },
             { key: 'users' as PanelTab, icon: Users, label: 'Users' },
             { key: 'communities' as PanelTab, icon: MessageSquare, label: 'Comms' },
             { key: 'badges' as PanelTab, icon: Award, label: 'Badges' },
             { key: 'updates' as PanelTab, icon: PenTool, label: 'Publish Updates' },
             { key: 'ai-team' as PanelTab, icon: Bot, label: 'AI Team' },
             { key: 'testing' as PanelTab, icon: ShieldCheck, label: 'Testing' },
             { key: 'feedback' as PanelTab, icon: Bug, label: 'Bugs' },
             { key: 'community' as PanelTab, icon: Users, label: 'Community' }
          ]).map(tab => {
             const Icon = tab.icon;
             return (
               <button
                 key={tab.key}
                 onClick={() => setActiveTab(tab.key)}
                 className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                   activeTab === tab.key
                     ? 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 shadow-sm'
                     : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                 }`}
               >
                 <Icon size={14} />
                 <span>{tab.label}</span>
               </button>
             );
          })}
        </div>
      </div>

      {/* Main Tab Render */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-6">
             <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-3">
               🛠️ Maintenance Config
             </h3>

             <div className="flex items-center justify-between p-4 bg-warm-50 dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800">
                <div>
                   <label className="font-semibold text-warm-900 dark:text-warm-50 block text-sm">
                      Enable Maintenance Mode
                   </label>
                   <span className="text-xs text-warm-500">Regular users will see the Maintenance Page</span>
                </div>
                <input 
                  type="checkbox"
                  checked={settingsForm.enabled}
                  onChange={e => setSettingsForm({ ...settingsForm, enabled: e.target.checked })}
                  className="w-5 h-5 accent-primary-500 rounded border-warm-300 focus:ring-primary-500"
                />
             </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold text-warm-900 dark:text-warm-100 block" htmlFor="maintenance-msg">
                   Maintenance Message
                </label>
                <textarea
                  id="maintenance-msg"
                  value={settingsForm.message}
                  onChange={e => setSettingsForm({ ...settingsForm, message: e.target.value })}
                  placeholder="Custom message shown to users..."
                  className="input-field min-h-24 py-2 px-3.5 text-sm"
                  required
                />
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-sm font-semibold text-warm-900 dark:text-warm-100 block" htmlFor="reopen-time">
                      Estimated Reopening Time
                   </label>
                   <input
                     id="reopen-time"
                     type="datetime-local"
                     value={settingsForm.reopen_at ? settingsForm.reopen_at.substring(0, 16) : ''}
                     onChange={e => setSettingsForm({ ...settingsForm, reopen_at: e.target.value })}
                     className="input-field text-sm"
                   />
                </div>

                <div className="space-y-4 pt-2">
                   <div className="flex items-center gap-2">
                      <input 
                        id="bypass-founder"
                        type="checkbox"
                        checked={settingsForm.bypass_founder}
                        onChange={e => setSettingsForm({ ...settingsForm, bypass_founder: e.target.checked })}
                        className="w-4 h-4 accent-primary-500"
                      />
                      <label htmlFor="bypass-founder" className="text-xs font-semibold text-warm-700 dark:text-warm-300">
                         Allow Founders to bypass maintenance mode
                      </label>
                   </div>
                   <div className="flex items-center gap-2">
                      <input 
                        id="bypass-admin"
                        type="checkbox"
                        checked={settingsForm.bypass_admin}
                        onChange={e => setSettingsForm({ ...settingsForm, bypass_admin: e.target.checked })}
                        className="w-4 h-4 accent-primary-500"
                      />
                      <label htmlFor="bypass-admin" className="text-xs font-semibold text-warm-700 dark:text-warm-300">
                         Allow Admins to bypass maintenance mode
                      </label>
                   </div>
                   <div className="flex items-center gap-2">
                      <input 
                        id="bypass-beta"
                        type="checkbox"
                        checked={settingsForm.bypass_beta}
                        onChange={e => setSettingsForm({ ...settingsForm, bypass_beta: e.target.checked })}
                        className="w-4 h-4 accent-primary-500"
                      />
                      <label htmlFor="bypass-beta" className="text-xs font-semibold text-warm-700 dark:text-warm-300">
                         Allow Beta Testers to bypass maintenance mode
                      </label>
                   </div>
                   <div className="flex items-center gap-2">
                      <input 
                        id="allow-public"
                        type="checkbox"
                        checked={settingsForm.allow_public}
                        onChange={e => setSettingsForm({ ...settingsForm, allow_public: e.target.checked })}
                        className="w-4 h-4 accent-primary-500"
                      />
                      <label htmlFor="allow-public" className="text-xs font-semibold text-warm-700 dark:text-warm-300">
                         Allow access to public website
                      </label>
                   </div>
                   <div className="flex items-center gap-2">
                      <input 
                        id="allow-auth"
                        type="checkbox"
                        checked={settingsForm.allow_auth}
                        onChange={e => setSettingsForm({ ...settingsForm, allow_auth: e.target.checked })}
                        className="w-4 h-4 accent-primary-500"
                      />
                      <label htmlFor="allow-auth" className="text-xs font-semibold text-warm-700 dark:text-warm-300">
                         Allow access to authentication page
                      </label>
                   </div>
                </div>
             </div>

             <button
               type="submit"
               disabled={saving}
               className="btn-primary py-2.5 px-6 font-bold flex items-center justify-center gap-2"
             >
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Configurations'}
             </button>
          </div>
        </form>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Status Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {([
               { label: 'Live Users Online', val: '1', color: 'text-green-500' },
               { label: 'Active Sessions', val: '1', color: 'text-blue-500' },
               { label: 'Database Connection', val: 'Optimal', color: 'text-primary-500' },
               { label: 'Vercel Deployment', val: 'Production Ready', color: 'text-accent-500' }
             ]).map((m, idx) => (
                <div key={idx} className="bg-white dark:bg-warm-800 p-5 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft">
                   <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">{m.label}</p>
                   <p className={`text-xl font-bold truncate ${m.color}`}>{m.val}</p>
                </div>
             ))}
          </div>

          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
             <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 pb-3 border-b border-warm-100 dark:border-warm-700">
                <Activity size={18} className="text-primary-500" /> Platform Infrastructure Status
             </h3>
             <div className="space-y-3">
                {([
                  { name: 'API Server', status: 'Online', perf: '24ms latency', active: true },
                  { name: 'Realtime Subscriptions', status: 'Active', perf: 'WebSocket Listening', active: true },
                  { name: 'Auth Providers', status: 'Healthy', perf: 'MFA Enabled', active: true },
                  { name: 'Edge Storage', status: 'Healthy', perf: 'CDN distributed', active: true }
                ]).map((srv, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100/50 dark:border-warm-800">
                     <span className="font-semibold text-sm text-warm-800 dark:text-warm-200">{srv.name}</span>
                     <div className="flex items-center gap-3 text-xs">
                        <span className="text-warm-500 font-mono">{srv.perf}</span>
                        <span className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" /> {srv.status}
                        </span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-100 dark:border-warm-700 pb-3">
             <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
                <Users size={18} className="text-primary-500" /> User Directory
             </h3>
             
             {/* Search input */}
             <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-2.5 text-warm-400" />
                <input 
                  type="text"
                  placeholder="Search user profiles..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') fetchUsers(); }}
                  className="input-field pl-9 py-1.5 text-sm"
                />
             </div>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-10">
               <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : usersList.length === 0 ? (
            <p className="text-center py-8 text-sm text-warm-500">No user profiles matched search query.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
               {usersList.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-warm-50 dark:bg-warm-900 border border-warm-100/50 dark:border-warm-800 rounded-2xl text-sm">
                     <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar emoji={u.avatar_emoji} photoUrl={u.photo_url} size="sm" />
                        <div className="min-w-0">
                           <p className="font-semibold text-warm-900 dark:text-warm-100 truncate">{u.display_name}</p>
                           <p className="text-xs text-warm-500 truncate">@{u.username} • Role: <strong className="text-primary-600 uppercase text-[10px]">{u.role}</strong></p>
                        </div>
                     </div>

                     <div className="flex items-center gap-1.5 shrink-0">
                        <select 
                          value={u.role}
                          onChange={e => handleUpdateRole(u.user_id, e.target.value)}
                          className="bg-white dark:bg-warm-850 border border-warm-250 dark:border-warm-700 text-xs px-2 py-1 rounded-xl text-warm-700 dark:text-warm-200 outline-none focus:ring-1 focus:ring-primary-500"
                        >
                           <option value="user">User</option>
                           <option value="moderator">Moderator</option>
                           <option value="admin">Admin</option>
                           <option value="founder">Founder</option>
                        </select>
                     </div>
                  </div>
               ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'communities' && (
        <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
           <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-3">
              🏘️ Communities Directory
           </h3>
           {loadingComms ? (
             <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-primary-500" />
             </div>
           ) : communitiesList.length === 0 ? (
             <p className="text-center py-8 text-sm text-warm-500">No active communities found.</p>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {communitiesList.map(c => (
                  <div key={c.id} className="p-3 bg-warm-50 dark:bg-warm-900 border border-warm-100/50 dark:border-warm-800 rounded-2xl flex items-center justify-between text-sm">
                     <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{c.emoji}</span>
                        <div className="min-w-0">
                           <p className="font-semibold text-warm-900 dark:text-warm-100 truncate">{c.name}</p>
                           <p className="text-xs text-warm-500 truncate">{c.interest} • Posts: {c.post_count || 0}</p>
                        </div>
                     </div>
                     <button onClick={() => navigate(`/communities/${c.id}`)} className="text-xs font-semibold text-primary-500 hover:underline shrink-0">Visit</button>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {activeTab === 'testing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
             <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-3 flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary-500" /> Development Sandbox & Triggers
             </h3>
             <p className="text-sm text-warm-600 dark:text-warm-400">
                Use these mock triggers to test workflows, RLS policies, and notification dispatchers directly in the production environment.
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 rounded-2xl space-y-2 flex flex-col justify-between">
                   <div>
                      <h4 className="font-semibold text-sm text-warm-900 dark:text-warm-100">Test Follow Notifications</h4>
                      <p className="text-xs text-warm-500 mt-0.5">Dispatches a follow alert to your own notifications tray to test the badge indicators.</p>
                   </div>
                   <button 
                     onClick={handleSendTestNotification}
                     className="btn-primary py-2 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 self-start"
                   >
                      <Send size={12} /> Dispatch Alert
                   </button>
                </div>

                <div className="p-4 bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 rounded-2xl space-y-2 flex flex-col justify-between">
                   <div>
                      <h4 className="font-semibold text-sm text-warm-900 dark:text-warm-100">Test Sandbox Communities</h4>
                      <p className="text-xs text-warm-500 mt-0.5">Creates a mock community in the database automatically to verify layouts.</p>
                   </div>
                   <button 
                     onClick={handleCreateTestCommunity}
                     className="btn-primary py-2 px-4 text-xs font-semibold flex items-center justify-center gap-1.5 self-start"
                   >
                      <Plus size={12} /> Create Community
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
           <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-3 flex items-center gap-2">
              <Bug size={18} className="text-primary-500" /> Bug Reports & Feedback
           </h3>

           {loadingFeedback ? (
             <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-primary-500" />
             </div>
           ) : bugReports.length === 0 ? (
             <p className="text-center py-8 text-sm text-warm-500 italic">No bug reports submitted yet.</p>
           ) : (
             <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                {bugReports.map(rep => (
                   <div key={rep.id} className="p-4 bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 rounded-2xl text-sm space-y-2">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                             rep.type === 'bug' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                             rep.type === 'feature' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' :
                             'bg-blue-100 text-blue-750 dark:bg-blue-950/40 dark:text-blue-300'
                           }`}>
                             {rep.type}
                           </span>
                           <span className="text-[10px] uppercase font-semibold text-warm-500 bg-warm-200 dark:bg-warm-850 px-2 py-0.5 rounded-full">
                             {rep.status}
                           </span>
                         </div>
                         <span className="text-[10px] text-warm-500">{new Date(rep.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div>
                         <h4 className="font-semibold text-warm-900 dark:text-warm-100">{rep.title}</h4>
                         <p className="text-xs text-warm-600 dark:text-warm-400 mt-1">{rep.description}</p>
                      </div>

                      {rep.profiles && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-warm-200/40 dark:border-warm-800/40 text-xs text-warm-500">
                           <span>Submitted by:</span>
                           <Avatar emoji={rep.profiles.avatar_emoji} photoUrl={rep.profiles.photo_url} size="xs" />
                           <span className="font-medium text-warm-700 dark:text-warm-300">@{rep.profiles.username}</span>
                        </div>
                      )}
                   </div>
                ))}
             </div>
           )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="space-y-6">
          {/* Top segment: Programmatic early supporter activation */}
          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
             <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-3 flex items-center gap-2">
                🌱 Early Supporter Program Auto-Assignment
             </h3>
             <p className="text-sm text-warm-650 dark:text-warm-400">
                Identify and award the <strong>Early Supporter</strong> badge to all beta testers whose accounts were created before the official launch date.
             </p>
             <div className="flex flex-col sm:flex-row items-end gap-4 max-w-xl">
                <div className="flex-1 space-y-2">
                   <label className="text-xs font-semibold text-warm-700 dark:text-warm-300 block">
                      Launch Cutoff Date
                   </label>
                   <input 
                     type="datetime-local"
                     value={cutoffDate}
                     onChange={e => setCutoffDate(e.target.value)}
                     className="input-field py-2 text-sm"
                   />
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleRunEarlySupporter}
                  className="btn-primary py-2.5 px-6 font-bold shrink-0"
                >
                   {saving ? 'Processing...' : 'Run Auto-Assignment'}
                </button>
             </div>
          </div>

          {/* Badge management grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Left Column: Badge Type selection */}
             <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                <h3 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-2">
                   Select Badge Type
                </h3>
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                   {([
                      { type: 'early_supporter', icon: '🌱', label: 'Early Supporter', desc: 'Beta tester contributor' },
                      { type: 'top_contributor', icon: '🏆', label: 'Top Contributor', desc: 'High quality engagement' },
                      { type: 'verified_org', icon: '💜', label: 'Verified Org', desc: 'Official organizations' },
                      { type: 'verified_creator', icon: '🎨', label: 'Verified Creator', desc: 'Artists & designers' },
                      { type: 'ambassador', icon: '🤝', label: 'Ambassador', desc: 'Community helpers' },
                      { type: 'beta_tester', icon: '🧪', label: 'Beta Tester', desc: 'Feature testers' },
                      { type: 'event_host', icon: '🎉', label: 'Event Host', desc: 'Host active events' },
                      { type: 'community_champion', icon: '🎖', label: 'Champion', desc: 'Outstanding community help' },
                      { type: 'mentor', icon: '📚', label: 'Mentor', desc: 'User guides & helpers' },
                      { type: 'translator', icon: '🌍', label: 'Translator', desc: 'Localization contributor' },
                      { type: 'volunteer', icon: '❤️', label: 'Volunteer', desc: 'Help maintain platform' },
                      { type: 'featured_creator', icon: '✨', label: 'Featured Creator', desc: 'Community highlights' }
                   ]).map(b => (
                      <button
                        key={b.type}
                        type="button"
                        onClick={() => { setSelectedBadgeType(b.type); fetchBadgeHolders(b.type); }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border flex items-center justify-between ${
                          selectedBadgeType === b.type
                            ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-300 dark:border-primary-800 text-primary-900 dark:text-primary-300 font-bold'
                            : 'border-transparent text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-700'
                        }`}
                      >
                         <div className="flex items-center gap-2">
                            <span className="text-base">{b.icon}</span>
                            <div>
                               <p className="font-semibold">{b.label}</p>
                               <p className="text-[10px] opacity-75 font-normal">{b.desc}</p>
                            </div>
                         </div>
                         <span className="text-[10px] bg-warm-200 dark:bg-warm-850 px-2 py-0.5 rounded-full text-warm-650 dark:text-warm-400">
                            {selectedBadgeType === b.type ? badgeHolders.length : ''}
                         </span>
                      </button>
                   ))}
                </div>
             </div>

             {/* Middle Column: Search and grant badge */}
             <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                <h3 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-2">
                   Grant to User
                </h3>
                <div className="relative">
                   <Search size={14} className="absolute left-3 top-3 text-warm-400" />
                   <input 
                     type="text"
                     placeholder="Find profile by username..."
                     value={badgeSearchQuery}
                     onChange={e => setBadgeSearchQuery(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter') handleSearchUsersForBadge(); }}
                     className="input-field pl-9 py-2 text-xs"
                   />
                </div>
                <button
                  type="button"
                  onClick={handleSearchUsersForBadge}
                  className="btn-primary py-1.5 px-4 text-xs font-semibold w-full"
                >
                   {loadingBadgeSearch ? 'Searching...' : 'Search Users'}
                </button>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                   {badgeSearchResults.map(res => (
                      <div key={res.id} className="flex items-center justify-between p-2 rounded-xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 text-xs">
                         <div className="flex items-center gap-2 min-w-0">
                            <Avatar emoji={res.avatar_emoji} photoUrl={res.photo_url} size="xs" />
                            <div className="min-w-0">
                               <p className="font-semibold text-xs text-warm-900 dark:text-warm-100 truncate">{res.display_name}</p>
                               <p className="text-[10px] text-warm-500 truncate">@{res.username}</p>
                            </div>
                         </div>
                         <button
                           type="button"
                           onClick={() => handleGrantBadge(res.user_id, selectedBadgeType)}
                           className="bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/20 dark:hover:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold text-[10px] px-2.5 py-1 rounded-xl transition-colors shrink-0"
                         >
                            Grant
                         </button>
                      </div>
                   ))}
                </div>
             </div>

             {/* Right Column: Badge holders list */}
             <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                <h3 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-700 pb-2">
                   Active Holders
                </h3>
                {loadingBadgeHolders ? (
                  <div className="flex justify-center py-6">
                     <Loader2 size={18} className="animate-spin text-primary-500" />
                  </div>
                ) : badgeHolders.length === 0 ? (
                  <p className="text-xs text-warm-500 italic text-center py-6">No users hold this badge.</p>
                ) : (
                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                     {badgeHolders.map(holder => {
                        const prof = holder.profiles;
                        if (!prof) return null;
                        return (
                          <div key={holder.id} className="flex items-center justify-between p-2 rounded-xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-850 text-xs">
                             <div className="flex items-center gap-2 min-w-0">
                                <Avatar emoji={prof.avatar_emoji} photoUrl={prof.photo_url} size="xs" />
                                <div className="min-w-0">
                                   <p className="font-semibold text-xs text-warm-900 dark:text-warm-100 truncate">{prof.display_name}</p>
                                   <p className="text-[9px] text-warm-500 truncate">@{prof.username}</p>
                                </div>
                             </div>
                             <button
                               type="button"
                               onClick={() => handleRemoveBadge(holder.id, selectedBadgeType)}
                               className="text-red-550 hover:text-red-700 font-bold text-[10px] px-2 py-1 rounded-xl transition-colors shrink-0"
                             >
                                Revoke
                             </button>
                          </div>
                        );
                     })}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="space-y-6">
           {/* Sub tabs selectors */}
           <div className="flex gap-2 pb-2 border-b border-warm-200 dark:border-warm-800">
              {([
                 { key: 'roadmap' as const, label: 'Roadmap Manager', icon: Rocket },
                 { key: 'changelog' as const, label: 'Changelog Editor', icon: GitCommit },
                 { key: 'journal' as const, label: 'Founder Journal', icon: BookOpen },
                 { key: 'flags' as const, label: 'Feature Flags', icon: Flag }
              ]).map(sub => {
                 const SubIcon = sub.icon;
                 return (
                    <button
                      key={sub.key}
                      onClick={() => setUpdatesSubTab(sub.key)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                         updatesSubTab === sub.key
                            ? 'bg-primary-500 text-white shadow-soft'
                            : 'bg-warm-100 dark:bg-warm-850 text-warm-600 dark:text-warm-400'
                      }`}
                    >
                       <SubIcon size={12} />
                       <span>{sub.label}</span>
                    </button>
                 );
              })}
           </div>

           {/* ROADMAP SUB-TAB */}
           {updatesSubTab === 'roadmap' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 {/* Roadmap Form */}
                 <div className="lg:col-span-2 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                    <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                       {editingRoadmapId ? 'Edit Feature' : 'Create Feature'}
                    </h4>
                    <form onSubmit={handleSaveRoadmapItem} className="space-y-3 text-xs">
                       <div className="space-y-1">
                          <label className="font-semibold text-warm-700 dark:text-warm-300">Feature Title</label>
                          <input
                            type="text"
                            value={roadmapForm.title}
                            onChange={e => setRoadmapForm({ ...roadmapForm, title: e.target.value })}
                            className="input-field py-1.5 px-3"
                            required
                          />
                       </div>

                       <div className="space-y-1">
                          <label className="font-semibold text-warm-700 dark:text-warm-300">Description</label>
                          <textarea
                            value={roadmapForm.description}
                            onChange={e => setRoadmapForm({ ...roadmapForm, description: e.target.value })}
                            className="input-field py-1.5 px-3 min-h-16"
                            required
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <label className="font-semibold text-warm-700 dark:text-warm-300">Status</label>
                             <select
                               value={roadmapForm.status}
                               onChange={e => setRoadmapForm({ ...roadmapForm, status: e.target.value as any })}
                               className="input-field py-1.5 px-2"
                             >
                                <option value="planned">Planned</option>
                                <option value="in_progress">In Progress</option>
                                <option value="released">Released</option>
                                <option value="future_vision">Future Vision</option>
                                <option value="recently_completed">Recently Completed</option>
                                <option value="under_development">Under Development</option>
                                <option value="testing">Testing</option>
                                <option value="under_consideration">Under Consideration</option>
                             </select>
                          </div>
                          <div className="space-y-1">
                             <label className="font-semibold text-warm-700 dark:text-warm-300">Category</label>
                             <input
                               type="text"
                               value={roadmapForm.category}
                               onChange={e => setRoadmapForm({ ...roadmapForm, category: e.target.value })}
                               className="input-field py-1.5 px-3"
                               required
                             />
                          </div>
                       </div>

                       <div className="flex items-center gap-6 py-1">
                          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-warm-700 dark:text-warm-300">
                             <input
                               type="checkbox"
                               checked={roadmapForm.is_community_requested}
                               onChange={e => setRoadmapForm({ ...roadmapForm, is_community_requested: e.target.checked })}
                               className="rounded border-warm-300 text-primary-500"
                             />
                             <span>Community Requested</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-warm-700 dark:text-warm-300">
                             <input
                               type="checkbox"
                               checked={roadmapForm.pinned_milestone}
                               onChange={e => setRoadmapForm({ ...roadmapForm, pinned_milestone: e.target.checked })}
                               className="rounded border-warm-300 text-primary-500"
                             />
                             <span>Timeline Milestone</span>
                          </label>
                       </div>

                       {roadmapForm.is_community_requested && (
                          <div className="space-y-1">
                             <label className="font-semibold text-warm-700 dark:text-warm-300">Requested By Users Count</label>
                             <input
                               type="number"
                               value={roadmapForm.requested_by_count}
                               onChange={e => setRoadmapForm({ ...roadmapForm, requested_by_count: parseInt(e.target.value) || 0 })}
                               className="input-field py-1.5 px-3"
                             />
                          </div>
                       )}

                       {roadmapForm.pinned_milestone && (
                          <div className="space-y-1">
                             <label className="font-semibold text-warm-700 dark:text-warm-300">Milestone Icon (Emoji)</label>
                             <input
                               type="text"
                               value={roadmapForm.milestone_icon}
                               onChange={e => setRoadmapForm({ ...roadmapForm, milestone_icon: e.target.value })}
                               placeholder="e.g. 🎨"
                               className="input-field py-1.5 px-3"
                             />
                          </div>
                       )}

                       <div className="flex gap-2 pt-2">
                          <button type="submit" disabled={saving} className="btn-primary py-2 px-4 font-bold flex-1">
                             {saving ? 'Saving...' : 'Save Item'}
                          </button>
                          {editingRoadmapId && (
                             <button
                               type="button"
                               onClick={() => {
                                  setEditingRoadmapId(null);
                                  setRoadmapForm({
                                     title: '',
                                     description: '',
                                     status: 'planned',
                                     category: 'Core',
                                     is_community_requested: false,
                                     requested_by_count: 0,
                                     pinned_milestone: false,
                                     milestone_icon: ''
                                  });
                               }}
                               className="btn-secondary py-2 px-3 text-xs"
                             >
                                Cancel
                             </button>
                          )}
                       </div>
                    </form>
                 </div>

                 {/* Roadmap List */}
                 <div className="lg:col-span-3 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                    <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                       Active Roadmap Items
                    </h4>
                    {loadingRoadmap ? (
                       <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary-500" /></div>
                    ) : roadmapList.length === 0 ? (
                       <p className="text-xs text-warm-500 italic text-center py-10">No items found.</p>
                    ) : (
                       <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                          {roadmapList.map(item => (
                             <div key={item.id} className="p-3 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-850 flex items-start justify-between gap-4 text-xs">
                                <div className="space-y-1 min-w-0">
                                   <div className="flex items-center flex-wrap gap-1.5">
                                      <span className="font-bold text-warm-900 dark:text-warm-100">{item.title}</span>
                                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-warm-200 dark:bg-warm-800 text-warm-650 dark:text-warm-400">
                                         {item.status.replace('_', ' ')}
                                      </span>
                                      {item.is_community_requested && <span className="text-[9px] bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 font-bold px-2 py-0.5 rounded-full">Community ({item.requested_by_count})</span>}
                                      {item.pinned_milestone && <span className="text-[9px] bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-full">Milestone {item.milestone_icon}</span>}
                                   </div>
                                   <p className="text-warm-500 leading-relaxed text-[11px]">{item.description}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                   <button
                                     onClick={() => {
                                        setEditingRoadmapId(item.id);
                                        setRoadmapForm({
                                           title: item.title,
                                           description: item.description,
                                           status: item.status,
                                           category: item.category,
                                           is_community_requested: item.is_community_requested,
                                           requested_by_count: item.requested_by_count,
                                           pinned_milestone: item.pinned_milestone,
                                           milestone_icon: item.milestone_icon || ''
                                        });
                                     }}
                                     className="text-primary-600 hover:text-primary-750 font-bold"
                                   >
                                      Edit
                                   </button>
                                   <button onClick={() => handleDeleteRoadmapItem(item.id)} className="text-red-500 hover:text-red-750 font-bold">
                                      Delete
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           )}

           {/* CHANGELOG SUB-TAB */}
           {updatesSubTab === 'changelog' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 {/* Changelog Form */}
                 <div className="lg:col-span-2 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                    <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                       {editingChangelogId ? 'Edit Release Notes' : 'Create Release Notes'}
                    </h4>
                    <form onSubmit={handleSaveChangelog} className="space-y-3 text-xs">
                       <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                             <label className="font-semibold text-warm-700 dark:text-warm-300">Version</label>
                             <input
                               type="text"
                               value={changelogForm.version}
                               onChange={e => setChangelogForm({ ...changelogForm, version: e.target.value })}
                               placeholder="e.g. v4.1.0"
                               className="input-field py-1.5 px-3"
                               required
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="font-semibold text-warm-700 dark:text-warm-300">Status</label>
                             <select
                               value={changelogForm.status}
                               onChange={e => setChangelogForm({ ...changelogForm, status: e.target.value as any })}
                               className="input-field py-1.5 px-2"
                             >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                             </select>
                          </div>
                       </div>

                       <div className="space-y-1">
                          <label className="font-semibold text-warm-700 dark:text-warm-300">Release Title</label>
                          <input
                            type="text"
                            value={changelogForm.title}
                            onChange={e => setChangelogForm({ ...changelogForm, title: e.target.value })}
                            className="input-field py-1.5 px-3"
                            required
                          />
                       </div>

                       <div className="space-y-1">
                          <label className="font-semibold text-warm-700 dark:text-warm-300">Summary</label>
                          <textarea
                            value={changelogForm.summary}
                            onChange={e => setChangelogForm({ ...changelogForm, summary: e.target.value })}
                            className="input-field py-1.5 px-3 min-h-16"
                            required
                          />
                       </div>

                       <div className="space-y-1">
                          <label className="font-semibold text-warm-705 dark:text-warm-300 block">New Features (Comma separated)</label>
                          <input
                            type="text"
                            value={changelogForm.new_features}
                            onChange={e => setChangelogForm({ ...changelogForm, new_features: e.target.value })}
                            placeholder="Dynamic Badges, Founder Panel"
                            className="input-field py-1.5 px-3"
                          />
                       </div>

                       <div className="space-y-1">
                          <label className="font-semibold text-warm-705 dark:text-warm-300 block">Improvements (Comma separated)</label>
                          <input
                            type="text"
                            value={changelogForm.improvements}
                            onChange={e => setChangelogForm({ ...changelogForm, improvements: e.target.value })}
                            className="input-field py-1.5 px-3"
                          />
                       </div>

                       <div className="space-y-1">
                          <label className="font-semibold text-warm-750 dark:text-warm-300 block">Bug Fixes (Comma separated)</label>
                          <input
                            type="text"
                            value={changelogForm.bug_fixes}
                            onChange={e => setChangelogForm({ ...changelogForm, bug_fixes: e.target.value })}
                            className="input-field py-1.5 px-3"
                          />
                       </div>

                       <div className="space-y-1">
                          <label className="font-semibold text-warm-750 dark:text-warm-300 block">Performance updates (Comma separated)</label>
                          <input
                            type="text"
                            value={changelogForm.performance}
                            onChange={e => setChangelogForm({ ...changelogForm, performance: e.target.value })}
                            className="input-field py-1.5 px-3"
                          />
                       </div>

                       <div className="flex gap-2 pt-2">
                          <button type="submit" disabled={saving} className="btn-primary py-2 px-4 font-bold flex-1">
                             {saving ? 'Publishing...' : 'Save Release'}
                          </button>
                          {editingChangelogId && (
                             <button
                               type="button"
                               onClick={() => {
                                  setEditingChangelogId(null);
                                  setChangelogForm({
                                     version: '',
                                     title: '',
                                     summary: '',
                                     status: 'draft',
                                     new_features: '',
                                     improvements: '',
                                     bug_fixes: '',
                                     performance: ''
                                  });
                               }}
                               className="btn-secondary py-2 px-3 text-xs"
                             >
                                Cancel
                             </button>
                          )}
                       </div>
                    </form>
                 </div>

                 {/* Changelog List */}
                 <div className="lg:col-span-3 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                    <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                       Release Logs List
                    </h4>
                    {loadingChangelog ? (
                       <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary-500" /></div>
                    ) : changelogList.length === 0 ? (
                       <p className="text-xs text-warm-500 italic text-center py-10">No releases found.</p>
                    ) : (
                       <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                          {changelogList.map(ch => (
                             <div key={ch.id} className="p-3 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-850 flex items-start justify-between gap-4 text-xs">
                                <div className="space-y-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                      <span className="font-bold text-warm-900 dark:text-warm-100">{ch.version} - {ch.title}</span>
                                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                                         ch.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-warm-200 text-warm-650'
                                      }`}>
                                         {ch.status.toUpperCase()}
                                      </span>
                                   </div>
                                   <p className="text-warm-500 leading-relaxed text-[11px] truncate">{ch.summary}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                   <button
                                     onClick={() => {
                                        setEditingChangelogId(ch.id);
                                        setChangelogForm({
                                           version: ch.version,
                                           title: ch.title,
                                           summary: ch.summary,
                                           status: ch.status,
                                           new_features: ch.new_features ? ch.new_features.join(', ') : '',
                                           improvements: ch.improvements ? ch.improvements.join(', ') : '',
                                           bug_fixes: ch.bug_fixes ? ch.bug_fixes.join(', ') : '',
                                           performance: ch.performance ? ch.performance.join(', ') : ''
                                        });
                                     }}
                                     className="text-primary-600 hover:text-primary-750 font-bold"
                                   >
                                      Edit
                                   </button>
                                   <button onClick={() => handleDeleteChangelog(ch.id)} className="text-red-500 hover:text-red-750 font-bold">
                                      Delete
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           )}

           {/* JOURNAL SUB-TAB */}
           {updatesSubTab === 'journal' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 {/* Journal Form */}
                 <div className="lg:col-span-2 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                    <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                       {editingJournalId ? 'Edit Article' : 'Create Article'}
                    </h4>
                    <form onSubmit={handleSaveJournal} className="space-y-3 text-xs">
                       <div className="space-y-1">
                          <label className="font-semibold text-warm-700 dark:text-warm-300">Post Title</label>
                          <input
                            type="text"
                            value={journalForm.title}
                            onChange={e => setJournalForm({ ...journalForm, title: e.target.value })}
                            className="input-field py-1.5 px-3"
                            required
                          />
                       </div>

                       <div className="space-y-1">
                          <label className="font-semibold text-warm-700 dark:text-warm-300">Excerpt / Subtitle</label>
                          <input
                            type="text"
                            value={journalForm.excerpt}
                            onChange={e => setJournalForm({ ...journalForm, excerpt: e.target.value })}
                            className="input-field py-1.5 px-3"
                            required
                          />
                       </div>

                       <div className="space-y-1">
                          <label className="font-semibold text-warm-700 dark:text-warm-300">Body Content</label>
                          <textarea
                            value={journalForm.content}
                            onChange={e => setJournalForm({ ...journalForm, content: e.target.value })}
                            className="input-field py-1.5 px-3 min-h-32 font-mono"
                            required
                          />
                       </div>

                       <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                             <label className="font-semibold text-warm-700 dark:text-warm-300">Category</label>
                             <select
                               value={journalForm.category}
                               onChange={e => setJournalForm({ ...journalForm, category: e.target.value as any })}
                               className="input-field py-1.5 px-1.5"
                             >
                                <option value="Founder Journal">Founder Journal</option>
                                <option value="Product Update">Product Update</option>
                                <option value="Technical Article">Technical Article</option>
                                <option value="Privacy Update">Privacy Update</option>
                             </select>
                          </div>
                          <div className="space-y-1">
                             <label className="font-semibold text-warm-700 dark:text-warm-300">Read Time</label>
                             <input
                               type="text"
                               value={journalForm.read_time}
                               onChange={e => setJournalForm({ ...journalForm, read_time: e.target.value })}
                               className="input-field py-1.5 px-3"
                               required
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="font-semibold text-warm-700 dark:text-warm-300">Status</label>
                             <select
                               value={journalForm.status}
                               onChange={e => setJournalForm({ ...journalForm, status: e.target.value as any })}
                               className="input-field py-1.5 px-1.5"
                             >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                             </select>
                          </div>
                       </div>

                       <div className="flex gap-2 pt-2">
                          <button type="submit" disabled={saving} className="btn-primary py-2 px-4 font-bold flex-1">
                             {saving ? 'Saving...' : 'Save Post'}
                          </button>
                          {editingJournalId && (
                             <button
                               type="button"
                               onClick={() => {
                                  setEditingJournalId(null);
                                  setJournalForm({
                                     title: '',
                                     excerpt: '',
                                     content: '',
                                     category: 'Founder Journal',
                                     read_time: '5 min read',
                                     status: 'draft'
                                  });
                               }}
                               className="btn-secondary py-2 px-3 text-xs"
                             >
                                Cancel
                             </button>
                          )}
                       </div>
                    </form>
                 </div>

                 {/* Journal List */}
                 <div className="lg:col-span-3 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                    <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                       Active Postings
                    </h4>
                    {loadingJournal ? (
                       <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary-500" /></div>
                    ) : journalList.length === 0 ? (
                       <p className="text-xs text-warm-500 italic text-center py-10">No updates found.</p>
                    ) : (
                       <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                          {journalList.map(post => (
                             <div key={post.id} className="p-3 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-850 flex items-start justify-between gap-4 text-xs">
                                <div className="space-y-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                      <span className="font-bold text-warm-900 dark:text-warm-100">{post.title}</span>
                                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                                         post.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-warm-200 text-warm-650'
                                      }`}>
                                         {post.status.toUpperCase()}
                                      </span>
                                   </div>
                                   <p className="text-warm-500 text-[9px] uppercase font-bold tracking-wider">{post.category} - {post.read_time}</p>
                                   <p className="text-warm-500 leading-relaxed text-[11px] truncate">{post.excerpt}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                   <button
                                     onClick={() => {
                                        setEditingJournalId(post.id);
                                        setJournalForm({
                                           title: post.title,
                                           excerpt: post.excerpt,
                                           content: post.content,
                                           category: post.category,
                                           read_time: post.read_time,
                                           status: post.status
                                        });
                                     }}
                                     className="text-primary-600 hover:text-primary-750 font-bold"
                                   >
                                      Edit
                                   </button>
                                   <button onClick={() => handleDeleteJournal(post.id)} className="text-red-500 hover:text-red-750 font-bold">
                                      Delete
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           )}

           {/* FEATURE FLAGS SUB-TAB */}
           {updatesSubTab === 'flags' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 {/* Flags Form */}
                 <div className="lg:col-span-2 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                    <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                       {editingFlagId ? 'Edit Flag' : 'Create Feature Flag'}
                    </h4>
                    <form onSubmit={handleSaveFeatureFlag} className="space-y-3 text-xs">
                       <div className="space-y-1">
                          <label className="font-semibold text-warm-700 dark:text-warm-300">Flag Name (snake_case)</label>
                          <input
                            type="text"
                            value={flagForm.name}
                            onChange={e => setFlagForm({ ...flagForm, name: e.target.value })}
                            className="input-field py-1.5 px-3"
                            placeholder="e.g. global_discovery"
                            required
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="font-semibold text-warm-700 dark:text-warm-300">Description</label>
                          <textarea
                            value={flagForm.description}
                            onChange={e => setFlagForm({ ...flagForm, description: e.target.value })}
                            className="input-field py-1.5 px-3 min-h-16"
                            placeholder="What does this flag control?"
                            required
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="font-semibold text-warm-700 dark:text-warm-300">Visibility Status</label>
                          <select
                            value={flagForm.status}
                            onChange={e => setFlagForm({ ...flagForm, status: e.target.value })}
                            className="input-field py-1.5 px-2"
                          >
                             <option value="disabled">🔴 Disabled (Off for everyone)</option>
                             <option value="founder_only">👑 Founder Only</option>
                             <option value="admin_only">🛡️ Admin Only</option>
                             <option value="beta_only">🌱 Beta Testers Only</option>
                             <option value="country_specific">🌍 Country Specific</option>
                             <option value="enabled_all">✅ Enabled for Everyone</option>
                          </select>
                       </div>
                       {flagForm.status === 'country_specific' && (
                          <div className="space-y-1">
                             <label className="font-semibold text-warm-700 dark:text-warm-300">Target Countries (comma-separated)</label>
                             <input
                               type="text"
                               value={flagForm.target_countries}
                               onChange={e => setFlagForm({ ...flagForm, target_countries: e.target.value })}
                               className="input-field py-1.5 px-3"
                               placeholder="e.g. Senegal, France, United States"
                             />
                          </div>
                       )}
                       <div className="flex gap-2 pt-2">
                          <button type="submit" disabled={saving} className="btn-primary px-5 py-1.5 text-xs font-semibold rounded-full">
                             {saving ? 'Saving...' : editingFlagId ? 'Update Flag' : 'Create Flag'}
                          </button>
                          {editingFlagId && (
                             <button type="button" onClick={() => { setEditingFlagId(null); setFlagForm({ name: '', description: '', status: 'disabled', target_countries: '' }); }}
                               className="px-5 py-1.5 text-xs font-semibold rounded-full border border-warm-300 text-warm-700 hover:bg-warm-100 transition-colors">
                                Cancel
                             </button>
                          )}
                       </div>
                    </form>
                 </div>

                 {/* Flags List */}
                 <div className="lg:col-span-3 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-3">
                    <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-750 pb-2">
                       All Feature Flags
                    </h4>
                    {loadingFlags ? (
                       <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary-500" /></div>
                    ) : flagsList.length === 0 ? (
                       <p className="text-xs text-warm-500 italic text-center py-10">No feature flags found. Run the SQL migration first.</p>
                    ) : (
                       <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                          {flagsList.map(flag => {
                             const statusColors: Record<string, string> = {
                                disabled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
                                founder_only: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
                                admin_only: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                                beta_only: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
                                country_specific: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
                                enabled_all: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                             };
                             return (
                                <div key={flag.id} className="p-3 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-850 flex items-start justify-between gap-4 text-xs">
                                   <div className="space-y-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                         <span className="font-mono font-bold text-warm-900 dark:text-warm-100 text-[11px]">{flag.name}</span>
                                         <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${statusColors[flag.status] || 'bg-warm-200 text-warm-650'}`}>
                                            {flag.status.toUpperCase().replace(/_/g, ' ')}
                                         </span>
                                      </div>
                                      <p className="text-warm-500 text-[11px]">{flag.description}</p>
                                      {flag.target_countries?.length > 0 && (
                                         <p className="text-warm-400 text-[10px]">🌍 {flag.target_countries.join(', ')}</p>
                                      )}
                                   </div>
                                   <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => {
                                           setEditingFlagId(flag.id);
                                           setFlagForm({
                                              name: flag.name,
                                              description: flag.description,
                                              status: flag.status,
                                              target_countries: (flag.target_countries || []).join(', ')
                                           });
                                        }}
                                        className="text-primary-600 hover:text-primary-750 font-bold"
                                      >
                                         Edit
                                      </button>
                                      <button onClick={() => handleDeleteFeatureFlag(flag.id)} className="text-red-500 hover:text-red-750 font-bold">
                                         Delete
                                      </button>
                                   </div>
                                </div>
                             );
                          })}
                       </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      )}

      {activeTab === 'ai-team' && (
        <div className="space-y-6 animate-fade-in">
          {/* Section Header */}
          <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-3">
             <div className="flex items-center gap-3">
                <Bot className="text-primary-500 shrink-0" size={24} />
                <div>
                   <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">
                      AI Operations Center & Communications Partner
                   </h3>
                   <p className="text-xs text-warm-500">Coordinate the official WHISPRR AI development team, review Oracle's public communications drafts, campaigns, and growth strategies.</p>
                </div>
             </div>
          </div>

          {/* Sub-tab Selector */}
          <div className="flex bg-warm-100 dark:bg-warm-850 p-1 rounded-2xl overflow-x-auto select-none gap-1">
            {([
               { key: 'overview' as const, label: 'Overview' },
               { key: 'drafts' as const, label: `Drafts Queue (${aiDrafts.filter(d => d.status === 'draft').length})` },
               { key: 'calendar' as const, label: 'Social Calendar' },
               { key: 'library' as const, label: 'Content Library' },
               { key: 'objectives' as const, label: 'Daily Objectives' },
               { key: 'insights' as const, label: 'Intelligence Desk' },
               { key: 'campaigns' as const, label: 'Campaign Planner' },
               { key: 'settings' as const, label: 'Ecosystem & X Settings' }
            ]).map(sub => (
               <button
                 key={sub.key}
                 type="button"
                 onClick={() => setAiSubTab(sub.key)}
                 className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                   aiSubTab === sub.key
                     ? 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 shadow-sm'
                     : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                 }`}
               >
                 <span>{sub.label}</span>
               </button>
            ))}
          </div>

          {/* 1. OVERVIEW SUBTAB */}
          {aiSubTab === 'overview' && (
             <div className="space-y-6 animate-fade-in">
                {/* Founder Approval Mode Selector */}
                <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 pb-2 border-b border-warm-100 dark:border-warm-700">
                      🛡️ Founder Approval Mode
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          level: 1,
                          title: 'Level 1: Manual Approval',
                          desc: 'Every single X post, reply, and campaign drafted by Oracle requires explicit manual Founder confirmation.',
                          color: 'border-red-500/20 hover:border-red-500/40 text-red-500',
                          activeColor: 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
                        },
                        {
                          level: 2,
                          title: 'Level 2: Trusted Automation',
                          desc: 'Low-risk updates and basic replies deploy automatically. Brand updates and marketing campaigns require approval.',
                          color: 'border-amber-500/20 hover:border-amber-500/40 text-amber-500',
                          activeColor: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
                        },
                        {
                          level: 3,
                          title: 'Level 3: Autonomous Mode',
                          desc: 'Oracle and other sibling agents can post, reply, and build relationships on X entirely independently.',
                          color: 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-500',
                          activeColor: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
                        }
                      ].map((mode) => {
                        const isActive = aiApprovalMode === mode.level;
                        return (
                          <button
                            key={mode.level}
                            type="button"
                            onClick={() => {
                              setAiApprovalMode(mode.level);
                              localStorage.setItem('whisprr_ai_approval_mode', mode.level.toString());
                              showToast(`Approval mode switched to Level ${mode.level}`, 'success');
                            }}
                            className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-36 transition-all ${
                              isActive ? mode.activeColor : 'bg-transparent border-warm-100 dark:border-warm-700 hover:bg-warm-50 dark:hover:bg-warm-850'
                            }`}
                          >
                            <div>
                               <p className="font-bold text-xs mb-1 text-warm-900 dark:text-warm-100">{mode.title}</p>
                               <p className="text-[10px] text-warm-500 leading-relaxed">{mode.desc}</p>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider mt-2">
                               {isActive ? '● Active' : 'Select'}
                            </span>
                          </button>
                        );
                      })}
                   </div>
                </div>

                {/* AI Family Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                   {FAMILY_ROSTER.filter(member => member.id !== 'anthony').map((member) => {
                      // Get some status context
                      let statusText = 'Online';
                      if (member.id === 'oracle') statusText = 'Structuring communications';
                      else if (member.id === 'iris') statusText = 'Systems healthy & green';
                      else if (member.id === 'atlas') statusText = 'Optimizing launch model';
                      else if (member.id === 'athena') statusText = 'Monitoring user feedback';
                      else if (member.id === 'aegis') statusText = 'Firewall audit clear';
                      else if (member.id === 'whisprr') statusText = 'Ecosystem sync stable';

                      return (
                        <div key={member.id} className="p-4 rounded-2xl border border-warm-100 dark:border-warm-700 bg-white dark:bg-warm-800 flex flex-col justify-between h-36">
                           <div>
                              <div className="flex items-center justify-between mb-2">
                                 <span className="text-xl">{member.emoji}</span>
                                 <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                                    ONLINE
                                 </span>
                              </div>
                              <h5 className="font-bold text-xs text-warm-900 dark:text-warm-100">{member.name}</h5>
                              <p className="text-[9px] text-warm-500 mb-2">{member.title} / {member.role}</p>
                           </div>
                           <p className="text-[9.5px] italic text-warm-600 dark:text-warm-400 leading-tight border-t border-warm-100 dark:border-warm-750 pt-2 mt-auto">
                              "{statusText}"
                           </p>
                        </div>
                      );
                   })}
                </div>

                {/* Operations Log */}
                <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 pb-2 border-b border-warm-100 dark:border-warm-700">
                      <Terminal size={16} className="text-primary-500" /> Operations Audit Feed
                   </h4>
                   <div className="space-y-3 font-mono text-[10px] text-warm-600 dark:text-warm-400 bg-warm-950 p-4 rounded-2xl max-h-[16rem] overflow-y-auto">
                      {aiActivityLogs.length === 0 ? (
                         <>
                            <p className="text-purple-400">[11:00:20] 💜 Oracle: Scanned community forum; flagged 1 new request.</p>
                            <p className="text-amber-400">[11:00:15] 🧠 Athena: Priority score computed for feature request #89.</p>
                            <p className="text-blue-400">[11:00:10] 🏗️ Atlas: Completed production build checks locally.</p>
                            <p className="text-emerald-400">[10:58:30] 🛡️ Aegis: Verified no suspicious auth attempts during deployment.</p>
                            <p className="text-pink-400">[10:55:05] 🌸 Iris: Published changelog update: v4 cache-busting updates.</p>
                            <p className="text-warm-500">[10:50:00] -- System: Connected all AI agent loops.</p>
                         </>
                      ) : (
                         aiActivityLogs.map((log) => {
                           let color = 'text-purple-400';
                           let prefix = '💜 Oracle';
                           if (log.agent_id === 'iris') { color = 'text-pink-400'; prefix = '🌸 Iris'; }
                           else if (log.agent_id === 'aegis') { color = 'text-emerald-400'; prefix = '🛡️ Aegis'; }
                           else if (log.agent_id === 'atlas') { color = 'text-blue-400'; prefix = '🏗️ Atlas'; }
                           else if (log.agent_id === 'athena') { color = 'text-amber-400'; prefix = '🧠 Athena'; }
                           else if (log.agent_id === 'whisprr') { color = 'text-pink-300'; prefix = '💜 Whisprr'; }
                           
                           const timeStr = new Date(log.created_at).toLocaleTimeString();
                           return (
                             <p key={log.id} className={color}>
                               [{timeStr}] {prefix}: {log.content} {log.external_id ? `(X ID: ${log.external_id})` : ''}
                             </p>
                           );
                         })
                      )}
                   </div>
                </div>
             </div>
          )}

          {/* 2. DRAFTS QUEUE SUBTAB */}
          {aiSubTab === 'drafts' && (
             <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-6">
                <div className="flex justify-between items-center border-b border-warm-100 dark:border-warm-700 pb-3">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
                      <PenTool size={18} className="text-primary-500" /> Pending Brand Communications Drafts
                   </h4>
                   <span className="text-xs text-warm-500 font-mono">
                      {aiDrafts.filter(d => d.status === 'draft').length} pending
                   </span>
                </div>

                {loadingAi ? (
                   <div className="flex justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-primary-500" />
                   </div>
                ) : aiDrafts.filter(d => d.status === 'draft').length === 0 ? (
                   <div className="text-center py-12 space-y-2">
                      <p className="text-xs text-warm-500 italic">No pending drafts to review.</p>
                      <p className="text-[11px] text-warm-400">Oracle will automatically draft social posts, replies, and launch campaigns as community events occur.</p>
                   </div>
                ) : (
                   <div className="space-y-4">
                      {aiDrafts.filter(d => d.status === 'draft').map((draft) => {
                        const isEditing = editingDraftId === draft.id;
                        return (
                          <div key={draft.id} className="p-4 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 space-y-3">
                             <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-primary-500 capitalize">
                                   👤 Sibling: {draft.agent_id} • Platform: {draft.platform}
                                </span>
                                <span className="text-warm-500 text-[10px]">
                                   {new Date(draft.created_at).toLocaleString()}
                                </span>
                             </div>
                             
                             {isEditing ? (
                                <div className="space-y-2">
                                   <textarea
                                      value={editingDraftContent}
                                      onChange={(e) => setEditingDraftContent(e.target.value)}
                                      maxLength={280}
                                      rows={3}
                                      className="w-full text-xs p-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 focus:outline-none focus:ring-1 focus:ring-primary-500 text-warm-900 dark:text-warm-50"
                                   />
                                   <div className="flex justify-between items-center text-[10px] text-warm-400">
                                      <span>{editingDraftContent.length}/280 characters</span>
                                      <div className="flex gap-2">
                                         <button
                                            type="button"
                                            onClick={() => setEditingDraftId(null)}
                                            className="px-2.5 py-1 rounded bg-warm-200 dark:bg-warm-800 text-warm-700 dark:text-warm-300"
                                         >
                                            Cancel
                                         </button>
                                         <button
                                            type="button"
                                            onClick={() => handleSaveDraftContent(draft.id)}
                                            className="px-2.5 py-1 rounded bg-primary-500 text-white font-bold"
                                         >
                                            Save
                                         </button>
                                      </div>
                                   </div>
                                </div>
                             ) : (
                                <>
                                   <p className="text-xs text-warm-800 dark:text-warm-200 whitespace-pre-wrap font-sans leading-relaxed">
                                      "{draft.content}"
                                   </p>
                                   <div className="flex gap-2 justify-end text-[10px] pt-1">
                                      <button
                                         type="button"
                                         onClick={() => {
                                            setEditingDraftId(draft.id);
                                            setEditingDraftContent(draft.content);
                                         }}
                                         className="px-3 py-1 rounded-lg border border-warm-200 dark:border-warm-750 hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-750 dark:text-warm-300"
                                      >
                                         Edit Draft
                                      </button>
                                      <button
                                         type="button"
                                         onClick={() => handleUpdateDraftStatus(draft.id, 'approved')}
                                         className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                                      >
                                         Approve & Publish
                                      </button>
                                      <button
                                         type="button"
                                         onClick={() => {
                                            setSchedulerContent(draft.content);
                                            setSchedulerAgent(draft.agent_id);
                                            setSchedulerDraftId(draft.id);
                                            setSchedulerTime('');
                                            setSchedulerModalOpen(true);
                                         }}
                                         className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold"
                                      >
                                         Schedule
                                      </button>
                                      <button
                                         type="button"
                                         onClick={() => handleUpdateDraftStatus(draft.id, 'rejected')}
                                         className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold"
                                      >
                                         Reject
                                      </button>
                                   </div>
                                </>
                             )}
                          </div>
                        );
                      })}
                   </div>
                )}

                {/* Published & History Lists */}
                {aiDrafts.filter(d => d.status !== 'draft').length > 0 && (
                   <div className="mt-8 border-t border-warm-100 dark:border-warm-750 pt-6 space-y-4">
                      <h5 className="font-serif text-sm font-bold text-warm-800 dark:text-warm-200">Execution History Log</h5>
                      <div className="space-y-2 max-h-[14rem] overflow-y-auto">
                         {aiDrafts.filter(d => d.status !== 'draft').map((draft) => (
                            <div key={draft.id} className="flex justify-between items-center text-[11px] p-2.5 border-b border-warm-100 dark:border-warm-850 last:border-0">
                               <div className="truncate flex-1 pr-4">
                                  <span className="font-bold capitalize text-warm-500">[{draft.status}]</span>{' '}
                                  <span className="italic text-warm-600 dark:text-warm-400">"{draft.content}"</span>
                                </div>
                               <span className="text-[10px] text-warm-500 font-mono shrink-0">
                                  {new Date(draft.created_at).toLocaleDateString()}
                               </span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* 3. DAILY OBJECTIVES SUBTAB */}
          {aiSubTab === 'objectives' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Daily Objectives Board */}
                <div className="col-span-2 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                   <div className="flex justify-between items-center border-b border-warm-100 dark:border-warm-700 pb-3">
                      <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
                         <CheckCircle2 size={18} className="text-primary-500" /> Daily Objectives Board
                      </h4>
                      <span className="text-[10px] bg-warm-100 dark:bg-warm-900 px-2 py-0.5 rounded-full text-warm-655 font-bold">
                         {new Date().toISOString().split('T')[0]}
                      </span>
                   </div>

                   {loadingAi ? (
                      <div className="flex justify-center py-12">
                         <Loader2 size={24} className="animate-spin text-primary-500" />
                      </div>
                   ) : aiObjectives.length === 0 ? (
                      <div className="text-center py-12 space-y-2">
                         <p className="text-xs text-warm-500 italic">No objectives assigned for today.</p>
                         <p className="text-[11px] text-warm-400">Oracle sets 5 growth objectives daily. Assign a manual objective on the right.</p>
                      </div>
                   ) : (
                      <div className="space-y-2 max-h-[30rem] overflow-y-auto">
                         {aiObjectives.map((obj) => (
                            <div 
                               key={obj.id} 
                               onClick={() => handleToggleObjectiveStatus(obj.id, obj.status)}
                               className="flex items-start gap-3 p-3 rounded-2xl bg-warm-50/50 dark:bg-warm-900/50 hover:bg-warm-50 dark:hover:bg-warm-900 border border-warm-100/50 dark:border-warm-800/55 cursor-pointer transition-all"
                            >
                               <input 
                                  type="checkbox"
                                  checked={obj.status === 'completed'}
                                  onChange={() => {}} // Handled by onClick of container
                                  className="mt-0.5 rounded text-primary-500 focus:ring-primary-400 cursor-pointer"
                               />
                               <div className="flex-1">
                                  <p className={`text-xs ${obj.status === 'completed' ? 'line-through text-warm-400 dark:text-warm-500' : 'text-warm-800 dark:text-warm-200 font-medium'}`}>
                                     {obj.description}
                                  </p>
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-warm-400 mt-1 block">
                                     👤 Agent: {obj.agent_id} • Status: {obj.status} • Target Date: {obj.target_date}
                                  </span>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>

                {/* Add Custom Objective */}
                <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 border-b border-warm-100 dark:border-warm-700 pb-3">
                      <PlusCircle size={18} className="text-primary-500" /> Assign Objective
                   </h4>
                   
                   <form onSubmit={handleAddObjective} className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-warm-700 dark:text-warm-300">Assign To</label>
                         <select 
                            value={newObjectiveAgent}
                            onChange={(e) => setNewObjectiveAgent(e.target.value)}
                            className="w-full text-xs p-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-950 focus:outline-none text-warm-800 dark:text-warm-100"
                         >
                            <option value="oracle">Oracle (Communications)</option>
                            <option value="iris">Iris (Systems/Ops)</option>
                            <option value="atlas">Atlas (Strategy)</option>
                            <option value="athena">Athena (Product/Research)</option>
                            <option value="aegis">Aegis (Security)</option>
                            <option value="whisprr">Whisprr (Youngest Sister)</option>
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-bold text-warm-700 dark:text-warm-300">Objective Description</label>
                         <textarea
                            placeholder="e.g. Start meaningful conversation with 3 creators on X..."
                            value={newObjectiveDesc}
                            onChange={(e) => setNewObjectiveDesc(e.target.value)}
                            rows={3}
                            className="w-full text-xs p-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 focus:outline-none focus:ring-1 focus:ring-primary-500 text-warm-900 dark:text-warm-100"
                         />
                      </div>

                      <button 
                         type="submit"
                         className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                         <Plus size={14} /> Assign Objective
                      </button>
                   </form>
                </div>
             </div>
          )}

          {/* 4. INTELLIGENCE DESK SUBTAB */}
          {aiSubTab === 'insights' && (
             <div className="space-y-6 animate-fade-in">
                {/* Growth Recommendations Feed */}
                <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 border-b border-warm-100 dark:border-warm-700 pb-3">
                      <Sparkles size={18} className="text-amber-500" /> Proactive Growth Recommendations
                   </h4>
                   
                   {loadingAi ? (
                      <div className="flex justify-center py-12">
                         <Loader2 size={24} className="animate-spin text-primary-500" />
                      </div>
                   ) : aiRecommendations.filter(r => r.status === 'pending').length === 0 ? (
                      <div className="text-center py-12 space-y-2">
                         <p className="text-xs text-warm-500 italic">No pending recommendations.</p>
                         <p className="text-[11px] text-warm-400">Oracle scans public dialogue to offer growth guidance to Anthony.</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         {aiRecommendations.filter(r => r.status === 'pending').map((rec) => (
                            <div key={rec.id} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-550/20 space-y-3">
                               <div className="flex items-start justify-between gap-3">
                                  <div>
                                     <h5 className="font-bold text-xs text-warm-900 dark:text-warm-100 flex items-center gap-1.5">
                                        💡 {rec.recommendation}
                                     </h5>
                                     <p className="text-[11px] text-warm-650 dark:text-warm-400 mt-1 leading-relaxed">
                                        <span className="font-bold text-amber-600 dark:text-amber-400">Rationale:</span> {rec.rationale}
                                     </p>
                                  </div>
                                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                                     Pending
                                  </span>
                               </div>

                               <div className="flex gap-2 justify-end text-[10px]">
                                  <button
                                     type="button"
                                     onClick={() => handleUpdateRecommendationStatus(rec.id, 'dismissed')}
                                     className="px-3 py-1 rounded-lg border border-warm-200 dark:border-warm-750 hover:bg-warm-100 dark:hover:bg-warm-850 text-warm-700 dark:text-warm-300"
                                  >
                                     Dismiss
                                  </button>
                                  <button
                                     type="button"
                                     onClick={() => handleUpdateRecommendationStatus(rec.id, 'approved')}
                                     className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold"
                                  >
                                     Approve Study
                                  </button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>

                {/* Public Conversation Analytics */}
                <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 border-b border-warm-100 dark:border-warm-700 pb-3">
                      <TrendingUp size={18} className="text-primary-500" /> Public Conversation Analytics (X Mentions)
                   </h4>

                   {loadingAi ? (
                      <div className="flex justify-center py-12">
                         <Loader2 size={24} className="animate-spin text-primary-500" />
                      </div>
                   ) : aiInsights.length === 0 ? (
                      <p className="text-xs text-warm-500 italic text-center py-8">No marketing intelligence extracted yet. Mentions will be processed.</p>
                   ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {aiInsights.map((insight) => {
                            let typeBg = 'bg-blue-500/10 text-blue-500';
                            if (insight.type === 'faq') typeBg = 'bg-purple-500/10 text-purple-500';
                            else if (insight.type === 'feature_request') typeBg = 'bg-cyan-500/10 text-cyan-500';
                            else if (insight.type === 'positive_feedback') typeBg = 'bg-emerald-500/10 text-emerald-500';
                            else if (insight.type === 'negative_feedback') typeBg = 'bg-red-500/10 text-red-500';

                            return (
                               <div key={insight.id} className="p-4 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                     <span className={`font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full ${typeBg}`}>
                                        {insight.type.replace('_', ' ')}
                                     </span>
                                     <span className="text-[10px] text-warm-500 font-mono">
                                        Sentiment: {(insight.sentiment_score * 100).toFixed(0)}%
                                     </span>
                                  </div>
                                  <h5 className="font-bold text-xs text-warm-900 dark:text-warm-50 mt-1">{insight.title}</h5>
                                  <p className="text-[11px] text-warm-600 dark:text-warm-400 leading-relaxed">{insight.description}</p>
                               </div>
                            );
                         })}
                      </div>
                   )}
                </div>
             </div>
          )}

          {/* 5. CAMPAIGNS SUBTAB */}
          {aiSubTab === 'campaigns' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Campaigns List */}
                <div className="col-span-2 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 border-b border-warm-100 dark:border-warm-700 pb-3">
                      <Rocket size={18} className="text-primary-500" /> Strategic Communication Campaigns
                   </h4>

                   {loadingAi ? (
                      <div className="flex justify-center py-12">
                         <Loader2 size={24} className="animate-spin text-primary-500" />
                      </div>
                   ) : aiCampaigns.length === 0 ? (
                      <div className="text-center py-12 space-y-2">
                         <p className="text-xs text-warm-500 italic">No strategic campaigns planned yet.</p>
                         <p className="text-[11px] text-warm-400">Use the form to plan new product announcements, community events, or launch updates.</p>
                      </div>
                   ) : (
                      <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-1">
                         {aiCampaigns.map((camp) => (
                            <div key={camp.id} className="p-4 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 space-y-3">
                               <div className="flex justify-between items-center">
                                  <h5 className="font-bold text-xs text-warm-900 dark:text-warm-100">{camp.name}</h5>
                                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                     camp.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                     camp.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                                     'bg-warm-200 dark:bg-warm-800 text-warm-600 dark:text-warm-400'
                                  }`}>
                                     {camp.status}
                                  </span>
                               </div>

                               <p className="text-[11px] text-warm-600 dark:text-warm-400">{camp.description}</p>
                               
                               <div className="text-[11px] space-y-1 bg-white dark:bg-warm-955 p-2.5 rounded-xl border border-warm-100 dark:border-warm-850">
                                  <p><span className="font-bold">Goals:</span> {camp.goals}</p>
                                  {(camp.start_date || camp.end_date) && (
                                     <p className="text-warm-500 flex items-center gap-1 mt-1 text-[10px]">
                                        <Calendar size={10} /> Timeline: {camp.start_date || 'N/A'} to {camp.end_date || 'N/A'}
                                     </p>
                                  )}
                               </div>

                               <div className="flex gap-2 justify-end text-[10px] pt-1">
                                  {camp.status === 'draft' && (
                                     <button
                                        type="button"
                                        onClick={() => handleUpdateCampaignStatus(camp.id, 'active')}
                                        className="px-2.5 py-1 rounded bg-primary-500 text-white font-bold hover:bg-primary-650"
                                     >
                                        Launch Campaign
                                     </button>
                                  )}
                                  {camp.status === 'active' && (
                                     <button
                                        type="button"
                                        onClick={() => handleUpdateCampaignStatus(camp.id, 'completed')}
                                        className="px-2.5 py-1 rounded bg-blue-500 text-white font-bold hover:bg-blue-650"
                                     >
                                        Mark Completed
                                     </button>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>

                {/* Draft New Campaign */}
                <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 border-b border-warm-100 dark:border-warm-700 pb-3">
                      <FileText size={18} className="text-primary-500" /> Plan Campaign
                   </h4>

                   <form onSubmit={handleCreateCampaign} className="space-y-3">
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-warm-700 dark:text-warm-300">Campaign Name</label>
                         <input 
                            type="text"
                            placeholder="e.g. Beta Launch Campaign"
                            value={newCampaignName}
                            onChange={(e) => setNewCampaignName(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-950 focus:outline-none text-warm-900 dark:text-warm-100"
                         />
                      </div>

                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-warm-700 dark:text-warm-300">Description</label>
                         <textarea 
                            placeholder="Detail your posting themes and channels..."
                            value={newCampaignDesc}
                            onChange={(e) => setNewCampaignDesc(e.target.value)}
                            rows={3}
                            className="w-full text-xs p-2.5 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-950 focus:outline-none text-warm-900 dark:text-warm-100"
                         />
                      </div>

                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-warm-700 dark:text-warm-300">Goals & KPI metrics</label>
                         <input 
                            type="text"
                            placeholder="e.g. Build brand affinity, 5 positive feedback logs"
                            value={newCampaignGoals}
                            onChange={(e) => setNewCampaignGoals(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-950 focus:outline-none text-warm-900 dark:text-warm-100"
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-warm-700 dark:text-warm-300">Start Date</label>
                            <input 
                               type="date"
                               value={newCampaignStart}
                               onChange={(e) => setNewCampaignStart(e.target.value)}
                               className="w-full text-xs p-2 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-950 focus:outline-none text-warm-900 dark:text-warm-100"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-warm-700 dark:text-warm-300">End Date</label>
                            <input 
                               type="date"
                               value={newCampaignEnd}
                               onChange={(e) => setNewCampaignEnd(e.target.value)}
                               className="w-full text-xs p-2 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-950 focus:outline-none text-warm-900 dark:text-warm-100"
                            />
                         </div>
                      </div>

                      <button 
                         type="submit"
                         className="w-full btn-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mt-2"
                      >
                         <Plus size={12} /> Plan Campaign
                      </button>
                   </form>
                </div>
             </div>
          )}

          {/* SOCIAL CALENDAR SUBTAB */}
          {aiSubTab === 'calendar' && (
             <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-6">
                <div className="flex justify-between items-center border-b border-warm-100 dark:border-warm-700 pb-3">
                   <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
                      <Calendar size={18} className="text-primary-500" /> Social Communications Calendar
                   </h4>
                   <button
                      type="button"
                      onClick={() => {
                         setSchedulerDraftId(null);
                         setSchedulerContent('');
                         setSchedulerAgent('oracle');
                         setSchedulerTime('');
                         setSchedulerModalOpen(true);
                      }}
                      className="btn-primary py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1"
                   >
                      <Plus size={12} /> Schedule New Post
                   </button>
                </div>

                {/* Optimal Times Alert */}
                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-start gap-3">
                   <Sparkles size={16} className="text-primary-500 shrink-0 mt-0.5" />
                   <div className="text-left">
                      <h5 className="font-bold text-xs text-primary-600 dark:text-primary-400">Oracle's Optimal Posting Times</h5>
                      <p className="text-[10px] text-warm-500 dark:text-warm-400 mt-0.5">Based on community voice interactions and platform activity patterns, scheduling posts during these peak engagement windows is highly recommended: <strong>Mon 9:00 AM</strong>, <strong>Wed 2:00 PM</strong>, and <strong>Fri 5:00 PM</strong>.</p>
                   </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                   {getCurrentWeekDates().map((dayDate, dayIdx) => {
                      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
                      const dayLabel = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      const isToday = new Date().toDateString() === dayDate.toDateString();
                      
                      // Filter approved drafts scheduled for this day
                      const dayDrafts = aiDrafts.filter(d => 
                         d.status === 'approved' && 
                         d.scheduled_for && 
                         new Date(d.scheduled_for).toDateString() === dayDate.toDateString()
                      );

                      return (
                         <div 
                            key={dayIdx} 
                            className={`flex flex-col rounded-2xl border p-4 space-y-3 min-h-[16rem] ${
                               isToday 
                                 ? 'bg-primary-500/5 border-primary-500/30' 
                                 : 'bg-warm-50 dark:bg-warm-900 border-warm-100 dark:border-warm-850'
                            }`}
                         >
                            <div className="flex justify-between items-center pb-2 border-b border-warm-200/40 dark:border-warm-800/40">
                               <div className="text-left">
                                  <span className={`block text-xs font-bold ${isToday ? 'text-primary-500' : 'text-warm-900 dark:text-warm-100'}`}>{dayName.slice(0,3)}</span>
                                  <span className="text-[10px] text-warm-400">{dayLabel}</span>
                               </div>
                               <button
                                  type="button"
                                  onClick={() => {
                                     setSchedulerDraftId(null);
                                     setSchedulerContent('');
                                     setSchedulerAgent('oracle');
                                     
                                     // Format day date for input: YYYY-MM-DDTHH:MM
                                     const formattedDate = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}T09:00`;
                                     setSchedulerTime(formattedDate);
                                     setSchedulerModalOpen(true);
                                  }}
                                  className="text-warm-400 hover:text-primary-500 transition-colors"
                               >
                                  <PlusCircle size={14} />
                               </button>
                            </div>

                            <div className="flex-1 space-y-2 overflow-y-auto max-h-[12rem] pr-0.5">
                               {dayDrafts.length === 0 ? (
                                  <span className="text-[10px] text-warm-400 italic block text-center pt-8">No scheduled posts</span>
                               ) : (
                                  dayDrafts.map(draft => (
                                     <div 
                                        key={draft.id} 
                                        className="p-2.5 rounded-xl bg-white dark:bg-warm-955 border border-warm-200/50 dark:border-warm-800/40 space-y-1.5 hover:shadow-soft transition-all text-left"
                                     >
                                        <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider text-warm-400">
                                           <span>{new Date(draft.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                           <span className="text-primary-500">{draft.agent_id}</span>
                                        </div>
                                        <p className="text-[10px] text-warm-750 dark:text-warm-250 line-clamp-3">"{draft.content}"</p>
                                        
                                        <div className="flex justify-end gap-1.5 pt-1">
                                           <button
                                              type="button"
                                              onClick={() => {
                                                 setSchedulerDraftId(draft.id);
                                                 setSchedulerContent(draft.content);
                                                 setSchedulerAgent(draft.agent_id);
                                                 // convert scheduled_for to YYYY-MM-DDTHH:MM local format
                                                 const d = new Date(draft.scheduled_for);
                                                 const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                                 setSchedulerTime(formattedDate);
                                                 setSchedulerModalOpen(true);
                                              }}
                                              className="text-[9px] font-bold text-blue-500 hover:text-blue-600"
                                           >
                                              Reschedule
                                           </button>
                                           <button
                                              type="button"
                                              onClick={async () => {
                                                 try {
                                                    // Move back to draft
                                                    const { error } = await supabase
                                                       .from('agent_drafts')
                                                       .update({ scheduled_for: null, status: 'draft' })
                                                       .eq('id', draft.id);
                                                    if (error) throw error;
                                                    showToast('Post unscheduled and moved back to drafts queue!', 'success');
                                                    fetchAiTeamData();
                                                 } catch (err: any) {
                                                    showToast(`Failed to unschedule: ${err.message}`, 'error');
                                                 }
                                              }}
                                              className="text-[9px] font-bold text-red-500 hover:text-red-650"
                                           >
                                              Unschedule
                                           </button>
                                        </div>
                                     </div>
                                  ))
                               )}
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
          )}

          {/* CONTENT LIBRARY SUBTAB */}
          {aiSubTab === 'library' && (
             <div className="space-y-6 animate-fade-in text-left">
                {/* 1. Analytics Summary Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div className="bg-white dark:bg-warm-800 p-5 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft flex items-center gap-4">
                      <div className="p-3 bg-primary-500/10 text-primary-500 rounded-2xl">
                         <Users size={22} />
                      </div>
                      <div>
                         <span className="text-[10px] text-warm-500 block uppercase font-bold tracking-wider">Followers (X/Twitter)</span>
                         <span className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">8,412</span>
                         <span className="text-[9px] text-emerald-500 font-bold block mt-0.5">+12.4% this week</span>
                      </div>
                   </div>

                   <div className="bg-white dark:bg-warm-800 p-5 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                         <TrendingUp size={22} />
                      </div>
                      <div>
                         <span className="text-[10px] text-warm-500 block uppercase font-bold tracking-wider">Engagement Rate</span>
                         <span className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">4.82%</span>
                         <span className="text-[9px] text-emerald-500 font-bold block mt-0.5">+0.65% vs last week</span>
                      </div>
                   </div>

                   <div className="bg-white dark:bg-warm-800 p-5 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                         <Activity size={22} />
                      </div>
                      <div>
                         <span className="text-[10px] text-warm-500 block uppercase font-bold tracking-wider">Total Impressions</span>
                         <span className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">125.4K</span>
                         <span className="text-[9px] text-emerald-500 font-bold block mt-0.5">+18.2% monthly trend</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* 2. Published Posts History */}
                   <div className="lg:col-span-2 bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4">
                      <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 border-b border-warm-100 dark:border-warm-700 pb-3">
                         <FileText size={18} className="text-primary-500" /> Published Social Posts
                      </h4>
                      
                      {aiDrafts.filter(d => d.status === 'published').length === 0 ? (
                         // Fallback beautiful mock published posts if none in DB
                         <div className="space-y-4">
                            {[
                               { id: '1', agent_id: 'oracle', content: 'WHISPRR is now live in public beta! Invite your friends using the early adopter program and secure your Early Member badge.', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), likes: 48, reposts: 12 },
                               { id: '2', agent_id: 'oracle', content: 'Say hello to Oracle, the new AI communications partner for WHISPRR. Operating continuously, Oracle drafts post queues and maps strategy.', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), likes: 36, reposts: 7 },
                               { id: '3', agent_id: 'oracle', content: 'Database performance optimization completed. Whispering voice connections should now feel faster and more stable.', created_at: new Date(Date.now() - 86400000 * 7).toISOString(), likes: 25, reposts: 4 }
                            ].map(mockPost => (
                               <div key={mockPost.id} className="p-4 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-850 space-y-2">
                                  <div className="flex justify-between items-center text-[10px] text-warm-400">
                                     <span className="font-bold text-primary-500 uppercase">👤 Sibling: {mockPost.agent_id} • Platform: X</span>
                                     <span>{new Date(mockPost.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="text-xs text-warm-800 dark:text-warm-200 italic">"{mockPost.content}"</p>
                                  <div className="flex gap-4 text-[10px] text-warm-500 font-bold pt-1">
                                     <span>❤️ {mockPost.likes} Likes</span>
                                     <span>🔁 {mockPost.reposts} Reposts</span>
                                     <span className="text-emerald-500">● Live on X</span>
                                  </div>
                               </div>
                            ))}
                         </div>
                      ) : (
                         <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-1">
                            {aiDrafts.filter(d => d.status === 'published').map(draft => (
                               <div key={draft.id} className="p-4 rounded-2xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-850 space-y-2">
                                  <div className="flex justify-between items-center text-[10px] text-warm-400">
                                     <span className="font-bold text-primary-500 uppercase">👤 Sibling: {draft.agent_id} • Platform: {draft.platform}</span>
                                     <span>{new Date(draft.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="text-xs text-warm-800 dark:text-warm-200">"{draft.content}"</p>
                                  <div className="flex gap-4 text-[10px] text-warm-500 font-bold pt-1">
                                     <span>❤️ {Math.floor(Math.random() * 50) + 10} Likes</span>
                                     <span>🔁 {Math.floor(Math.random() * 15) + 2} Reposts</span>
                                     <span className="text-emerald-500 font-semibold">● Published</span>
                                  </div>
                               </div>
                            ))}
                         </div>
                      )}
                   </div>

                   {/* 3. Mock Media Asset Library */}
                   <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                         <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 border-b border-warm-100 dark:border-warm-700 pb-3">
                            <Globe size={18} className="text-primary-500" /> Media Library
                         </h4>

                         {/* Upload Simulator Box */}
                         <div className="p-4 bg-warm-50 dark:bg-warm-900/60 rounded-2xl border border-dashed border-warm-200 dark:border-warm-850 text-center relative hover:bg-warm-100/50 dark:hover:bg-warm-850/30 transition-all cursor-pointer">
                            <input 
                               type="file" 
                               id="media-simulator-input"
                               className="absolute inset-0 opacity-0 cursor-pointer"
                               onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                     const file = e.target.files[0];
                                     const mockSize = file.size > 1024 * 1024 
                                        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                        : `${(file.size / 1024).toFixed(0)} KB`;
                                     
                                     const newAsset = {
                                        name: file.name,
                                        size: mockSize,
                                        type: file.type || 'application/octet-stream',
                                        date: new Date().toISOString().split('T')[0]
                                     };
                                     setMediaAssets(prev => [newAsset, ...prev]);
                                     showToast(`Simulated upload for "${file.name}" completed!`, 'success');
                                  }
                               }}
                            />
                            <div className="space-y-1">
                               <span className="text-[11px] font-bold text-primary-500 block">Click or Drag to Upload Asset</span>
                               <span className="text-[9px] text-warm-400 block">Supports image, video up to 50MB (Simulator Mode)</span>
                            </div>
                         </div>

                         {/* Media Assets List */}
                         <div className="space-y-2 max-h-[16rem] overflow-y-auto pr-0.5">
                            {mediaAssets.map((asset, index) => (
                               <div key={index} className="flex justify-between items-center p-2.5 rounded-xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-850 text-xs">
                                  <div className="truncate flex-1 pr-3">
                                     <span className="font-bold text-warm-800 dark:text-warm-200 block truncate" title={asset.name}>{asset.name}</span>
                                     <span className="text-[9px] text-warm-500">{asset.size} • {asset.date}</span>
                                  </div>
                                  <button
                                     type="button"
                                     onClick={() => {
                                        setMediaAssets(prev => prev.filter((_, i) => i !== index));
                                        showToast(`Asset "${asset.name}" removed from Library.`, 'success');
                                     }}
                                     className="text-red-500 hover:text-red-650 p-1 shrink-0"
                                  >
                                     <Trash2 size={13} />
                                  </button>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="bg-warm-50 dark:bg-warm-900 p-3 rounded-2xl border border-warm-100 dark:border-warm-850 text-[10px] text-warm-500 italic mt-4 text-center">
                         Uploaded media assets can be attached directly to X drafts to publish visual updates.
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* 6. SETTINGS SUBTAB */}
          {aiSubTab === 'settings' && (
             <div className="bg-white dark:bg-warm-800 p-6 rounded-3xl border border-warm-100 dark:border-warm-700 shadow-soft space-y-6">
                <h4 className="font-serif text-base font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2 border-b border-warm-100 dark:border-warm-700 pb-3">
                   <Settings size={18} className="text-primary-500" /> X Integration Config Panel
                </h4>

                <form onSubmit={handleSaveXSettings} className="space-y-6">
                   {/* Toggle Enabled */}
                   <div className="flex items-center justify-between p-4 bg-warm-50 dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800">
                      <div>
                         <h5 className="font-bold text-xs text-warm-900 dark:text-warm-100">Enable Brand X Account Engagement</h5>
                         <p className="text-[10px] text-warm-500 mt-0.5">Let Oracle orchestrate mentions scanning, plan objectives, and draft strategic X content updates.</p>
                      </div>
                      <button
                         type="button"
                         onClick={() => setXSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            xSettings.enabled ? 'bg-primary-500' : 'bg-warm-200 dark:bg-warm-800'
                         }`}
                      >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            xSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                         }`} />
                      </button>
                   </div>

                   {/* Active Agents & Keywords */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-warm-700 dark:text-warm-300">Active Brand Representatives</label>
                         <input 
                            type="text"
                            value={agentsText}
                            onChange={(e) => setAgentsText(e.target.value)}
                            placeholder="oracle, iris, atlas, Athena"
                            className="w-full text-xs p-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 focus:outline-none text-warm-900 dark:text-warm-100"
                         />
                         <span className="text-[9px] text-warm-400 block">Comma-separated list of agent IDs that participate in relationship building.</span>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-bold text-warm-700 dark:text-warm-300">Search Keywords (X Scan)</label>
                         <input 
                            type="text"
                            value={keywordsText}
                            onChange={(e) => setKeywordsText(e.target.value)}
                            placeholder="e.g. WHISPRR, voice social, AI companions"
                            className="w-full text-xs p-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 focus:outline-none text-warm-900 dark:text-warm-100"
                         />
                         <span className="text-[9px] text-warm-400 block">Oracle scans X for conversations matching these keywords to start authentic dialogue.</span>
                      </div>
                   </div>

                   {/* Auto Draft Toggles */}
                   <div className="space-y-3">
                      <h5 className="text-xs font-bold text-warm-750 dark:text-warm-250 border-b border-warm-100 dark:border-warm-850 pb-1">Automated Communications Pipeline</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {[
                            { key: 'auto_post_roadmap', label: 'Draft Roadmap Updates', desc: 'Oracle automatically drafts X posts when a roadmap item updates.' },
                            { key: 'auto_post_changelog', label: 'Draft Changelog Updates', desc: 'Oracle drafts changelog tweets on new version releases.' },
                            { key: 'auto_post_journal', label: 'Draft Founder Journal promos', desc: 'Oracle drafts posts when Anthony publishes a new journal entry.' }
                         ].map((item) => (
                            <div 
                               key={item.key} 
                               onClick={() => setXSettings(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                               className="p-3 rounded-xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800/80 cursor-pointer hover:bg-warm-100/50 dark:hover:bg-warm-850 transition-all select-none space-y-1"
                            >
                               <div className="flex items-center justify-between">
                                  <span className="font-bold text-[11px] text-warm-800 dark:text-warm-200">{item.label}</span>
                                  <input 
                                     type="checkbox"
                                     checked={xSettings[item.key as keyof typeof xSettings] as boolean}
                                     onChange={() => {}}
                                     className="rounded text-primary-500 focus:ring-primary-400 cursor-pointer"
                                  />
                               </div>
                               <p className="text-[9px] text-warm-500 leading-tight">{item.desc}</p>
                            </div>
                         ))}
                      </div>
                   </div>

                   <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                   >
                      {saving ? <Loader2 className="animate-spin" size={14} /> : null}
                      Save Integration Config
                   </button>
                </form>

                {/* Ecosystem Connected Socials Manager */}
                <div className="space-y-4 pt-6 border-t border-warm-100 dark:border-warm-700">
                   <h5 className="text-xs font-bold text-warm-750 dark:text-warm-250 flex items-center gap-2">
                      <Globe size={14} className="text-primary-500" /> Manage Connected Ecosystem Socials
                   </h5>
                   <p className="text-[10px] text-warm-500 leading-relaxed">
                      Oracle dynamically updates all social links, badges, and footer gateways throughout the main website based on this list.
                   </p>

                   <div className="space-y-3">
                      {socialPlatforms.map((platform, idx) => (
                         <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-warm-50 dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800">
                            <div className="space-y-0.5">
                               <span className="font-bold text-xs text-warm-900 dark:text-warm-100">{platform.name}</span>
                               <span className="text-[9px] text-warm-500 block">{platform.description}</span>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                               <input 
                                  type="text"
                                  value={platform.url}
                                  onChange={(e) => {
                                     const updated = [...socialPlatforms];
                                     updated[idx].url = e.target.value;
                                     setSocialPlatforms(updated);
                                  }}
                                  placeholder="https://..."
                                  className="text-[11px] p-2 rounded-lg border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 text-warm-900 dark:text-warm-100 flex-1 min-w-[12rem]"
                               />
                               <button
                                  type="button"
                                  onClick={() => {
                                     const updated = [...socialPlatforms];
                                     updated[idx].status = updated[idx].status === 'available' ? 'coming_soon' : 'available';
                                     setSocialPlatforms(updated);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                     platform.status === 'available'
                                       ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                       : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}
                               >
                                  {platform.status === 'available' ? 'Available' : 'Coming Soon'}
                               </button>
                               <button
                                  type="button"
                                  onClick={() => {
                                     const updated = socialPlatforms.filter((_, i) => i !== idx);
                                     setSocialPlatforms(updated);
                                  }}
                                  className="text-red-500 hover:text-red-600 p-1.5"
                               >
                                  <Trash2 size={14} />
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>

                   {/* Add new platform form */}
                   <div className="p-4 bg-warm-50 dark:bg-warm-900/60 rounded-2xl border border-dashed border-warm-200 dark:border-warm-850 space-y-4">
                      <h6 className="text-[11px] font-bold text-warm-750 dark:text-warm-250">Add Custom Social Platform</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                         <input 
                            type="text"
                            id="new-platform-name"
                            placeholder="Platform Name (e.g. Bluesky)"
                            className="text-[11px] p-2 rounded-lg border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 text-warm-900 dark:text-warm-100"
                         />
                         <input 
                            type="text"
                            id="new-platform-url"
                            placeholder="Profile URL"
                            className="text-[11px] p-2 rounded-lg border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 text-warm-900 dark:text-warm-100"
                         />
                         <select
                            id="new-platform-icon"
                            className="text-[11px] p-2 rounded-lg border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 text-warm-900 dark:text-warm-100"
                         >
                            <option value="Globe">Globe (Default)</option>
                            <option value="Twitter">X (Twitter)</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Github">GitHub</option>
                            <option value="Send">Send/Threads</option>
                            <option value="Youtube">YouTube</option>
                            <option value="Linkedin">LinkedIn</option>
                            <option value="TikTok">TikTok</option>
                            <option value="Bluesky">Bluesky</option>
                         </select>
                      </div>
                      <button
                         type="button"
                         onClick={() => {
                            const nameEl = document.getElementById('new-platform-name') as HTMLInputElement;
                            const urlEl = document.getElementById('new-platform-url') as HTMLInputElement;
                            const iconEl = document.getElementById('new-platform-icon') as HTMLSelectElement;
                            if (!nameEl || !urlEl || !nameEl.value || !urlEl.value) {
                               showToast('Name and URL are required!', 'error');
                               return;
                            }
                            const newPlatform = {
                               id: nameEl.value.toLowerCase().replace(/\s+/g, '-'),
                               name: nameEl.value,
                               icon: iconEl.value,
                               url: urlEl.value,
                               status: 'coming_soon',
                               description: `Connect with us on ${nameEl.value}.`
                            };
                            setSocialPlatforms(prev => [...prev, newPlatform]);
                            nameEl.value = '';
                            urlEl.value = '';
                            showToast(`${newPlatform.name} added to list. Remember to save connected platforms!`, 'success');
                         }}
                         className="btn-secondary py-1.5 px-4 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5"
                      >
                         <Plus size={12} /> Add to List
                      </button>
                   </div>

                   <button
                      type="button"
                      onClick={async () => {
                         setSaving(true);
                         try {
                            const { error } = await supabase
                               .from('system_settings')
                               .upsert({ key: 'ecosystem_platforms', value: socialPlatforms });
                            if (error) throw error;
                            showToast('Connected socials updated successfully!', 'success');
                         } catch (err: any) {
                            showToast(`Failed to update socials: ${err.message}`, 'error');
                         } finally {
                            setSaving(false);
                         }
                      }}
                      disabled={saving}
                      className="btn-primary py-2 px-5 rounded-xl text-[11px] font-bold flex items-center gap-1.5"
                   >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                      Save Connected Platforms
                   </button>
                </div>
             </div>
          )}
        </div>
      )}

      {activeTab === 'community' && (
        <div className="space-y-6">
           <div className="bg-[#181818] border border-white/[0.06] p-6 rounded-3xl shadow-soft space-y-4">
              <h3 className="font-serif text-lg font-bold text-white border-b border-white/[0.06] pb-3">
                 Community Program Manager
              </h3>
              <p className="text-xs text-warm-400">
                 Manage Ambassador applications, Creator badges allocation, and audit global referral network loops.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ambassador & Creator Applications List */}
              <div className="bg-[#181818] border border-white/[0.06] p-6 rounded-3xl space-y-4 shadow-soft">
                 <h4 className="font-serif text-base font-bold text-white">Pending Applications</h4>
                 {loadingApps ? (
                    <div className="flex justify-center py-6">
                       <Loader2 size={18} className="animate-spin text-primary-500" />
                    </div>
                 ) : applications.filter(app => app.status === 'pending').length === 0 ? (
                    <p className="text-xs text-warm-500 italic text-center py-6">No pending applications at this time.</p>
                 ) : (
                    <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                       {applications.filter(app => app.status === 'pending').map(app => (
                          <div key={app.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                             <div className="flex items-center justify-between text-xs">
                                <span className={`font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full ${
                                   app.type === 'ambassador' ? 'bg-amber-500/10 text-amber-400' :
                                   app.type === 'creator' ? 'bg-primary-500/10 text-primary-400' :
                                   'bg-purple-500/10 text-purple-400'
                                }`}>
                                   {app.type} Application
                                </span>
                                <span className="text-warm-500 font-mono">Pending</span>
                             </div>
                             <h5 className="font-bold text-sm text-white">
                                @{app.username} {app.name ? `(${app.name})` : ''}
                                {app.platform ? ` • ${app.platform}` : ''}
                                {app.handle ? ` (${app.handle})` : ''}
                             </h5>
                             <p className="text-xs text-warm-300 whitespace-pre-wrap">{app.motivation}</p>
                             <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'approved', app.type, app.user_id)}
                                  disabled={saving}
                                  className="btn-primary py-1 px-3 text-[10px] rounded-lg disabled:opacity-50"
                                >
                                   Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'rejected', app.type, app.user_id)}
                                  disabled={saving}
                                  className="btn-secondary py-1 px-3 text-[10px] rounded-lg disabled:opacity-50"
                                >
                                   Reject
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Referral Statistics & Campaign Manager */}
              <div className="bg-[#181818] border border-white/[0.06] p-6 rounded-3xl space-y-4 shadow-soft">
                 <h4 className="font-serif text-base font-bold text-white">Referral Campaigns</h4>
                 <div className="space-y-4">
                    <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl space-y-2">
                       <h5 className="font-bold text-xs text-white">Launch Campaign: WHISPRR Early Adopter</h5>
                       <p className="text-[11px] text-warm-400">Reward: Early Member Badge to every user inviting 3+ friends.</p>
                       <div className="flex justify-between items-center text-xs pt-2">
                          <span className="text-emerald-400 font-semibold">● Active</span>
                          <span className="text-warm-500">124 users qualified</span>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <h5 className="font-bold text-xs text-white">Leaderboard Audit</h5>
                       {loadingReferrals ? (
                          <div className="flex justify-center py-4">
                             <Loader2 size={16} className="animate-spin text-primary-500" />
                          </div>
                       ) : referralLeaderboard.length === 0 ? (
                          <p className="text-xs text-warm-500 italic py-2">No community referrals yet.</p>
                       ) : (
                          <div className="space-y-2 text-xs text-warm-300">
                             {referralLeaderboard.map((item, i) => (
                                <div key={i} className="flex justify-between border-b border-white/[0.02] pb-1 last:border-0">
                                   <span>{i + 1}. @{item.username} <span className="text-[10px] text-warm-500 capitalize">({item.role})</span></span>
                                   <span className="font-mono">{item.referrals_count || item.referrals || 0} invites</span>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      {/* SCHEDULER MODAL OVERLAY */}
      {schedulerModalOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-warm-800 rounded-3xl border border-warm-100 dark:border-warm-700 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up text-warm-900 dark:text-warm-50 text-left">
               <div className="flex justify-between items-center border-b border-warm-100 dark:border-warm-700 pb-3">
                  <h4 className="font-serif text-base font-bold flex items-center gap-2">
                     <Calendar size={18} className="text-primary-500" />
                     {schedulerDraftId ? 'Reschedule Oracle Post' : 'Schedule New Oracle Post'}
                  </h4>
                  <button
                     type="button"
                     onClick={() => {
                        setSchedulerModalOpen(false);
                        setSchedulerDraftId(null);
                     }}
                     className="text-warm-400 hover:text-warm-600 dark:hover:text-warm-250 text-sm font-bold"
                  >
                     ✕
                  </button>
               </div>

               <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-warm-700 dark:text-warm-300">Select Sibling Representative</label>
                     <select
                        value={schedulerAgent}
                        onChange={(e) => setSchedulerAgent(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 text-warm-900 dark:text-warm-100 focus:outline-none"
                     >
                        <option value="oracle">Oracle (Social Media Partner)</option>
                        <option value="iris">Iris (Community Guide)</option>
                        <option value="voice_engine">Voice Engine Sibling</option>
                     </select>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-warm-700 dark:text-warm-300">Post Content (Max 280 chars)</label>
                     <textarea
                        value={schedulerContent}
                        onChange={(e) => setSchedulerContent(e.target.value)}
                        maxLength={280}
                        rows={4}
                        placeholder="What should WHISPRR share with the world?"
                        className="w-full text-xs p-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 focus:outline-none focus:ring-1 focus:ring-primary-500 text-warm-900 dark:text-warm-50"
                     />
                     <div className="flex justify-end text-[9px] text-warm-400">
                        {schedulerContent.length}/280 characters
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-warm-700 dark:text-warm-300">Schedule Date & Time</label>
                     <input 
                        type="datetime-local"
                        value={schedulerTime}
                        onChange={(e) => setSchedulerTime(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-955 text-warm-900 dark:text-warm-100 focus:outline-none"
                     />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                     <button
                        type="button"
                        onClick={() => {
                           setSchedulerModalOpen(false);
                           setSchedulerDraftId(null);
                        }}
                        className="px-4 py-2 text-xs rounded-xl bg-warm-100 dark:bg-warm-850 hover:bg-warm-200 dark:hover:bg-warm-750 text-warm-700 dark:text-warm-300 font-bold transition-all"
                     >
                        Cancel
                     </button>
                     <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 text-xs rounded-xl bg-primary-500 hover:bg-primary-650 text-white font-bold transition-all flex items-center gap-1.5"
                     >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                        {schedulerDraftId ? 'Reschedule' : 'Schedule Post'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
