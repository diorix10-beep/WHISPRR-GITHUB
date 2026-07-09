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

type PanelTab = 'system' | 'monitoring' | 'users' | 'communities' | 'badges' | 'updates' | 'testing' | 'feedback' | 'community';

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
  const [aiDrafts, setAiDrafts] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiObjectives, setAiObjectives] = useState<any[]>([]);
  const [aiCampaigns, setAiCampaigns] = useState<any[]>([]);

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

      {activeTab === 'community' && (
        <div className="space-y-6">
            <div className="public-card p-6 space-y-4 shadow-soft">
               <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-white border-b border-warm-150 dark:border-white/[0.06] pb-3">
                  Community Program Manager
               </h3>
               <p className="text-xs text-warm-650 dark:text-warm-400">
                  Manage Ambassador applications, Creator badges allocation, and audit global referral network loops.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Ambassador & Creator Applications List */}
               <div className="public-card p-6 space-y-4 shadow-soft">
                  <h4 className="font-serif text-base font-bold text-warm-900 dark:text-white">Pending Applications</h4>
                  {loadingApps ? (
                     <div className="flex justify-center py-6">
                        <Loader2 size={18} className="animate-spin text-primary-500" />
                     </div>
                  ) : applications.filter(app => app.status === 'pending').length === 0 ? (
                     <p className="text-xs text-warm-500 italic text-center py-6">No pending applications at this time.</p>
                  ) : (
                     <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                        {applications.filter(app => app.status === 'pending').map(app => (
                           <div key={app.id} className="p-4 rounded-2xl bg-warm-50/50 dark:bg-white/[0.02] border border-warm-200/50 dark:border-white/[0.04] space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                 <span className={`font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full ${
                                    app.type === 'ambassador' ? 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400' :
                                    app.type === 'creator' ? 'bg-primary-50/50 dark:bg-primary-950/20 text-primary-650 dark:text-primary-400' :
                                    'bg-purple-50/50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-400'
                                 }`}>
                                    {app.type} Application
                                 </span>
                                 <span className="text-warm-500 font-mono">Pending</span>
                              </div>
                              <h5 className="font-bold text-sm text-warm-900 dark:text-white">
                                 @{app.username} {app.name ? `(${app.name})` : ''}
                                 {app.platform ? ` • ${app.platform}` : ''}
                                 {app.handle ? ` (${app.handle})` : ''}
                              </h5>
                              <p className="text-xs text-warm-700 dark:text-warm-300 whitespace-pre-wrap">{app.motivation}</p>
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
               <div className="public-card p-6 space-y-4 shadow-soft">
                  <h4 className="font-serif text-base font-bold text-warm-900 dark:text-white">Referral Campaigns</h4>
                  <div className="space-y-4">
                     <div className="p-4 bg-warm-50/50 dark:bg-white/[0.02] border border-warm-200/50 dark:border-white/[0.04] rounded-2xl space-y-2">
                        <h5 className="font-bold text-xs text-warm-900 dark:text-white">Launch Campaign: WHISPRR Early Adopter</h5>
                        <p className="text-[11px] text-warm-600 dark:text-warm-400">Reward: Early Member Badge to every user inviting 3+ friends.</p>
                        <div className="flex justify-between items-center text-xs pt-2">
                           <span className="text-emerald-550 dark:text-emerald-400 font-semibold">● Active</span>
                           <span className="text-warm-500">124 users qualified</span>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <h5 className="font-bold text-xs text-warm-900 dark:text-white">Leaderboard Audit</h5>
                        {loadingReferrals ? (
                           <div className="flex justify-center py-4">
                              <Loader2 size={16} className="animate-spin text-primary-500" />
                           </div>
                        ) : referralLeaderboard.length === 0 ? (
                           <p className="text-xs text-warm-500 italic py-2">No community referrals yet.</p>
                        ) : (
                           <div className="space-y-2 text-xs text-warm-750 dark:text-warm-300">
                              {referralLeaderboard.map((item, i) => (
                                 <div key={i} className="flex justify-between border-b border-warm-150 dark:border-white/[0.02] pb-1 last:border-0">
                                    <span>{i + 1}. @{item.username} <span className="text-[10px] text-warm-500 capitalize">({item.role})</span></span>
                                    <span className="font-mono text-warm-900 dark:text-white">{item.referrals_count || item.referrals || 0} invites</span>
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
