import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Save, Bot, Check, RefreshCw, 
  Sparkles, Play, Settings, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

const CATEGORY_OPTIONS = [
  'Romance', 'Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Action', 
  'Adventure', 'Historical', 'Slice of Life', 'Anime', 'Games', 
  'Superheroes', 'School', 'Mafia', 'Royalty', 'Medieval', 
  'Cyberpunk', 'Post-Apocalyptic', 'Original Characters (OC)', 'Fandoms'
];

const THEMES = ['Age Regression', 'Comfort', 'Healing', 'Angst', 'Found Family', 'Domestic Life', 'School Life', 'Parenthood'];
const DYNAMICS = ['Lovers', 'Friends', 'Family', 'Caregiver', 'Mentor', 'Rivals', 'Siblings'];
const SETTINGS = ['Modern', 'Medieval', 'School', 'Space', 'Apocalypse', 'Cyberpunk'];
const MOODS = ['Wholesome', 'Emotional', 'Dark', 'Psychological', 'Comedic', 'Cozy'];

interface ChatMessage {
  sender: 'oracle' | 'user';
  text: string;
}

export default function AiCharacterCreator() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  // Mode Selection: 'creator' (conversational storytelling) or 'advanced' (technical fields)
  const [creationMode, setCreationMode] = useState<'creator' | 'advanced'>('creator');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Draft Restore States
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  // Sync / Network States
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Publishing Pipeline State
  const [publishPipeline, setPublishPipeline] = useState<{
    isActive: boolean;
    step: 'saving' | 'validating' | 'uploading' | 'publishing' | 'success' | 'failed';
    error?: string;
  }>({ isActive: false, step: 'saving' });

  // Guided Interview State
  const [interviewStep, setInterviewStep] = useState(0);
  const [oracleMessages, setOracleMessages] = useState<ChatMessage[]>([
    { sender: 'oracle', text: "Hello! Let's build someone unforgettable today. What's their name?" }
  ]);
  const [interviewInput, setInterviewInput] = useState('');
  const [isOracleTyping, setIsOracleTyping] = useState(false);

  // Playtest State
  const [playtestMode, setPlaytestMode] = useState(false);
  const [playtestConversationId, setPlaytestConversationId] = useState<string | null>(null);
  const [playtestBotId, setPlaytestBotId] = useState<string | null>(null);
  const [playtestMessages, setPlaytestMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [playtestInput, setPlaytestInput] = useState('');
  const [isPlaytestTyping, setIsPlaytestTyping] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Romance',
    visibility: 'public' as 'public' | 'private' | 'unlisted',
    contentRating: 'SFW' as 'SFW' | 'Mature' | 'NSFW',
    avatarUrl: '',
    bannerUrl: '',
    bannerGradient: 'from-purple-500/20 to-purple-600/5',
    greeting: '',
    shortDescription: '',
    longDescription: '',
    personality: '',
    scenario: '',
    exampleDialogues: '',
    conversationStyle: 'Warm, conversational, structured.',
    rpDefinition: '',
    systemDefinition: '',
    systemCharacterDefinition: '',
    knowledge: '',
    creatorNotes: '',
    exampleConversations: '',
    tagsString: ''
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSaveStatus('saved');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check draft on mount
  useEffect(() => {
    const saved = localStorage.getItem('chimera-character-creator-draft');
    if (saved) {
      try {
        const { formData: savedData } = JSON.parse(saved);
        if (savedData && (savedData.name || savedData.greeting || savedData.personality)) {
          setShowRestoreBanner(true);
        }
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, []);

  // Background Autosave
  useEffect(() => {
    if (!isOnline) {
      setSaveStatus('offline');
      return;
    }

    const interval = setInterval(() => {
      if (formData.name || formData.greeting || formData.personality) {
        setSaveStatus('saving');
        localStorage.setItem(
          'chimera-character-creator-draft',
          JSON.stringify({ formData, currentStep, creationMode, interviewStep })
        );
        setTimeout(() => {
          setSaveStatus('saved');
        }, 800);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [formData, currentStep, creationMode, interviewStep, isOnline]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tag: string) => {
    const list = formData.tagsString.split(',').map(t => t.trim()).filter(Boolean);
    const index = list.indexOf(tag);
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(tag);
    }
    setFormData(prev => ({ ...prev, tagsString: list.join(', ') }));
  };

  const handleRestoreDraft = () => {
    const saved = localStorage.getItem('chimera-character-creator-draft');
    if (saved) {
      try {
        const { formData: savedData, currentStep: savedStep, creationMode: savedMode, interviewStep: savedIS } = JSON.parse(saved);
        setFormData(savedData);
        setCurrentStep(savedStep || 1);
        setCreationMode(savedMode || 'creator');
        setInterviewStep(savedIS || 0);
        showToast('We found your draft and restored it!', 'success');
      } catch (e) {
        showToast('Failed to restore draft', 'error');
      }
    }
    setShowRestoreBanner(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('chimera-character-creator-draft');
    setShowRestoreBanner(false);
    showToast('Draft discarded', 'info');
  };

  // Reassurance-based Friendly Error Messages (Requirement 36 / 37.4)
  const getFriendlyErrorMessage = (errorMsg: string) => {
    const lower = errorMsg.toLowerCase();
    if (lower.includes('check constraint') || lower.includes('profiles_role_check') || lower.includes('violates check constraint')) {
      return "We couldn't publish your character right now due to a profile formatting restriction. Please check that your details are valid.";
    }
    if (lower.includes('unique constraint') || lower.includes('username already taken') || lower.includes('already taken')) {
      return "That name is already claimed. Please try a different name.";
    }
    if (lower.includes('not authenticated') || lower.includes('jwt')) {
      return "Your session has expired. Please sign in again.";
    }
    if (lower.includes('network') || lower.includes('fetch')) {
      return "We couldn't reach the server. Your draft has been safely saved locally and we'll sync when your connection returns.";
    }
    return "Something went wrong while publishing. Please try again in a moment. Your draft has been safely saved.";
  };

  // Guided Interview Logic
  const handleSendInterviewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewInput.trim()) return;

    const userText = interviewInput.trim();
    const currentMessages = [...oracleMessages, { sender: 'user', text: userText } as ChatMessage];
    setOracleMessages(currentMessages);
    setInterviewInput('');
    setIsOracleTyping(true);

    try {
      const response = await fetch('/api/oracle-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages,
          formData,
          interviewStep
        })
      });

      if (!response.ok) throw new Error('Failed to reach Oracle');
      const data = await response.json();

      let nextFormData = { ...formData };
      
      // If Oracle extracted structured field data, sync it live to the form state
      if (data.extractedField && data.extractedValue) {
        const field = data.extractedField;
        const val = data.extractedValue;
        
        if (field === 'longDescription') {
          nextFormData.longDescription = val;
          nextFormData.shortDescription = val.substring(0, 80);
        } else if (field === 'personality') {
          nextFormData.personality = val;
          nextFormData.systemCharacterDefinition = `[Character: ${nextFormData.name || '{{char}}'}]\n[Mind: ${val}]`;
        } else {
          // @ts-ignore
          nextFormData[field] = val;
        }
        setFormData(nextFormData);
      }

      setOracleMessages(prev => [...prev, { sender: 'oracle', text: data.response }]);

      if (data.shouldAdvance) {
        setInterviewStep(prev => Math.min(prev + 1, 7));
      }

    } catch (err) {
      console.error('Oracle guide API error:', err);
      setOracleMessages(prev => [...prev, { 
        sender: 'oracle', 
        text: "I had a brief connection issue, but my digital sensors are back online. Could you tell me more about that?" 
      }]);
    } finally {
      setIsOracleTyping(false);
    }
  };

  // Meet Your Character / Start Playtest Draft
  const handleStartPlaytest = async () => {
    if (!profile) {
      showToast('You must be logged in to playtest', 'error');
      return;
    }

    setLoading(true);
    // Generate a unique username for draft bots to satisfy Supabase constraints
    const tempUsername = `draft_${Math.random().toString(36).substring(2, 10)}`;
    const tags = formData.tagsString.split(',').map(t => t.trim()).filter(Boolean);

    try {
      // Step 1: Call RPC to insert Bot Profile & Character in DB privately
      const { data: botId, error: rpcError } = await supabase.rpc('create_ai_character', {
        p_name: formData.name.trim() || 'Playtest Bot',
        p_username: tempUsername,
        p_avatar_emoji: '🤖',
        p_greeting: formData.greeting.trim() || 'Hello! I am ready to playtest.',
        p_short_description: formData.shortDescription.trim() || 'Playtest Draft',
        p_long_description: formData.longDescription.trim() || 'A temporary draft for creator testing.',
        p_personality: formData.personality.trim() || 'Friendly, helpful.',
        p_scenario: formData.scenario.trim(),
        p_example_dialogues: formData.exampleDialogues.trim(),
        p_conversation_style: formData.conversationStyle.trim(),
        p_knowledge: formData.knowledge.trim(),
        p_tags: tags,
        p_category: formData.category,
        p_visibility: 'private', // Keep draft strictly private to creator
        p_avatar_url: formData.avatarUrl.trim() || '',
        p_banner_url: formData.bannerUrl.trim() || '',
        p_content_rating: formData.contentRating,
        p_creator_notes: formData.creatorNotes.trim(),
        p_example_conversations: formData.exampleConversations.trim(),
        p_rp_definition: formData.rpDefinition.trim(),
        p_system_definition: formData.systemDefinition.trim(),
        p_system_character_definition: formData.systemCharacterDefinition.trim()
      });

      if (rpcError) throw rpcError;

      setPlaytestBotId(botId);

      // Step 2: Create a conversation between user and the bot
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'dm' })
        .select('id')
        .single();

      if (convError) throw convError;

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: conversation.id, user_id: profile.user_id },
        { conversation_id: conversation.id, user_id: botId }
      ]);

      setPlaytestConversationId(conversation.id);
      setPlaytestMessages([
        { sender: 'bot', text: formData.greeting.trim() || 'Hello! I am ready to playtest.' }
      ]);
      setPlaytestMode(true);
      showToast('Playtest workspace initialized!', 'success');

    } catch (err: any) {
      console.error('Error starting playtest:', err);
      showToast(getFriendlyErrorMessage(err.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Playtest Chat Sending
  const handleSendPlaytestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playtestInput.trim() || !playtestConversationId || !playtestBotId) return;

    const userText = playtestInput.trim();
    setPlaytestMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setPlaytestInput('');
    setIsPlaytestTyping(true);

    try {
      // 1. Insert user message in database
      await supabase.from('messages').insert({
        conversation_id: playtestConversationId,
        sender_id: profile?.user_id,
        content: userText
      });

      // 2. Fetch AI response via edge API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          conversation_id: playtestConversationId,
          bot_user_id: playtestBotId
        })
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();

      setPlaytestMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
    } catch (err) {
      console.error('Playtest message error:', err);
      setPlaytestMessages(prev => [...prev, { sender: 'bot', text: '*(System: Connection lost or playtest failed. Your changes are safe.)*' }]);
    } finally {
      setIsPlaytestTyping(false);
    }
  };

  // Publishing Pipeline Workflow
  const handleFinalPublish = async () => {
    if (!profile) {
      showToast('You must be logged in to publish', 'error');
      return;
    }

    setPublishPipeline({ isActive: true, step: 'saving' });

    // Step 1: Save Draft
    setTimeout(() => {
      // Step 2: Validate Character Required Fields
      setPublishPipeline(prev => ({ ...prev, step: 'validating' }));
      
      if (!formData.name.trim()) {
        setPublishPipeline({ 
          isActive: true, 
          step: 'failed', 
          error: 'Please enter a name for your character.' 
        });
        return;
      }
      if (!formData.greeting.trim()) {
        setPublishPipeline({ 
          isActive: true, 
          step: 'failed', 
          error: 'A greeting message is required so roleplay can start.' 
        });
        return;
      }

      // Step 3: Upload Assets (Simulated or Public)
      setPublishPipeline(prev => ({ ...prev, step: 'uploading' }));

      // Step 4: Publish character (Update draft visibility or insert new)
      setTimeout(async () => {
        setPublishPipeline(prev => ({ ...prev, step: 'publishing' }));

        try {
          if (playtestBotId) {
            // Update the existing playtest draft bot visibility to public/unlisted
            const { error } = await supabase
              .from('ai_characters')
              .update({
                visibility: formData.visibility,
                category: formData.category,
                greeting: formData.greeting.trim(),
                short_description: formData.shortDescription.trim(),
                long_description: formData.longDescription.trim(),
                personality: formData.personality.trim(),
                scenario: formData.scenario.trim(),
                example_dialogues: formData.exampleDialogues.trim(),
                knowledge: formData.knowledge.trim(),
                rp_definition: formData.rpDefinition.trim(),
                system_definition: formData.systemDefinition.trim(),
                system_character_definition: formData.systemCharacterDefinition.trim()
              })
              .eq('user_id', playtestBotId);

            if (error) throw error;

            // Also update the profile display name in case it changed
            await supabase
              .from('profiles')
              .update({
                display_name: formData.name.trim(),
                bio: formData.shortDescription.trim()
              })
              .eq('user_id', playtestBotId);

          } else {
            // First time publishing directly from Advanced Editor
            const tempUsername = `bot_${Math.random().toString(36).substring(2, 10)}`;
            const tags = formData.tagsString.split(',').map(t => t.trim()).filter(Boolean);

            const { error } = await supabase.rpc('create_ai_character', {
              p_name: formData.name.trim(),
              p_username: tempUsername,
              p_avatar_emoji: '🤖',
              p_greeting: formData.greeting.trim(),
              p_short_description: formData.shortDescription.trim(),
              p_long_description: formData.longDescription.trim(),
              p_personality: formData.personality.trim(),
              p_scenario: formData.scenario.trim(),
              p_example_dialogues: formData.exampleDialogues.trim(),
              p_conversation_style: formData.conversationStyle.trim(),
              p_knowledge: formData.knowledge.trim(),
              p_tags: tags,
              p_category: formData.category,
              p_visibility: formData.visibility,
              p_avatar_url: formData.avatarUrl.trim() || '',
              p_banner_url: formData.bannerUrl.trim() || '',
              p_content_rating: formData.contentRating,
              p_creator_notes: formData.creatorNotes.trim(),
              p_example_conversations: formData.exampleConversations.trim(),
              p_rp_definition: formData.rpDefinition.trim(),
              p_system_definition: formData.systemDefinition.trim(),
              p_system_character_definition: formData.systemCharacterDefinition.trim()
            });

            if (error) throw error;
          }

          // Step 5: Success
          setPublishPipeline(prev => ({ ...prev, step: 'success' }));
          localStorage.removeItem('chimera-character-creator-draft');
          
          setTimeout(() => {
            showToast('Character published to CHIMERA Nexus!', 'success');
            navigate('/');
          }, 1500);

        } catch (err: any) {
          console.error('Publish error:', err);
          setPublishPipeline({ 
            isActive: true, 
            step: 'failed', 
            error: getFriendlyErrorMessage(err.message || '')
          });
        }
      }, 1000);
    }, 800);
  };

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 8));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Helper for toggle mode terminology
  const term = (tech: string, creative: string) => {
    return creationMode === 'creator' ? creative : tech;
  };

  return (
    <>
    <div className="page-container max-w-6xl mx-auto py-6 sm:py-8 flex flex-col min-h-screen relative">
      
      {/* Draft Recovery Banner */}
      {showRestoreBanner && (
        <div className="mb-6 p-4 bg-red-500/10 dark:bg-red-950/20 border border-red-500/20 dark:border-red-900/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in shadow-sm">
          <div>
            <p className="text-sm font-semibold text-warm-900 dark:text-warm-100">
              Unsaved draft found
            </p>
            <p className="text-xs text-warm-500 dark:text-warm-400 mt-0.5">
              We found a character draft from your last session. Would you like to restore it?
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleRestoreDraft}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-650 text-white rounded-xl text-xs font-semibold shadow"
            >
              Restore Draft
            </button>
            <button
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 bg-warm-200 dark:bg-warm-800 hover:bg-warm-300 dark:hover:bg-warm-750 text-warm-700 dark:text-warm-300 rounded-xl text-xs font-semibold"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Top Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-warm-200 dark:border-warm-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Bot size={24} className="text-red-500" />
          <div>
            <h1 className="text-2xl font-serif font-bold text-warm-900 dark:text-warm-50">CHIMERA Forge</h1>
            <p className="text-xs text-warm-500 dark:text-warm-405">Character Forging Studio</p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-full text-xs font-medium text-warm-600 dark:text-warm-400">
            {saveStatus === 'saved' && <span className="text-emerald-500">🟢 All changes saved</span>}
            {saveStatus === 'saving' && <span className="text-amber-500 animate-pulse">✍️ Saving...</span>}
            {saveStatus === 'offline' && <span className="text-rose-500">📡 Working offline</span>}
          </div>

          {/* Mode Switcher Toggle */}
          <div className="flex items-center bg-warm-100 dark:bg-warm-800 p-1 rounded-xl border border-warm-200 dark:border-warm-700">
            <button
              onClick={() => setCreationMode('creator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                creationMode === 'creator'
                  ? 'bg-red-500 text-white shadow'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900'
              }`}
            >
              <Sparkles size={12} />
              Storytelling
            </button>
            <button
              onClick={() => setCreationMode('advanced')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                creationMode === 'advanced'
                  ? 'bg-red-500 text-white shadow'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900'
              }`}
            >
              <Settings size={12} />
              Advanced
            </button>
          </div>
        </div>
      </div>

      {/* Main Work Area */}
      {creationMode === 'creator' ? (
        /* STORYTELLING MODE (Oracle Conversational Interview) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Oracle Conversational Panel */}
          <div className="lg:col-span-7 flex flex-col bg-white dark:bg-warm-850/50 rounded-3xl border border-warm-200 dark:border-warm-800 shadow-xl overflow-hidden min-h-[600px] max-h-[650px]">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-500/10 to-transparent border-b border-warm-100 dark:border-warm-800 flex items-center gap-3">
              <img
                src="/nexy_mascot.png"
                alt="Oracle"
                className="w-8 h-8 rounded-lg object-cover border border-red-500/25 chimera-glow-red"
              />
              <div>
                <h3 className="font-serif font-bold text-sm text-warm-900 dark:text-warm-100">Oracle Guide</h3>
                <p className="text-[10px] text-warm-500">Guided Storytelling Forge</p>
              </div>
            </div>

            {/* Message Log */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
              {oracleMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {msg.sender === 'oracle' && (
                    <img 
                      src="/nexy_mascot.png" 
                      alt="Oracle" 
                      className="w-6 h-6 rounded-md object-cover border border-red-500/10" 
                    />
                  )}
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-red-500 text-white rounded-tr-none'
                      : 'bg-warm-100 dark:bg-warm-800 text-warm-800 dark:text-warm-200 rounded-tl-none border border-warm-200/50 dark:border-warm-700/50'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isOracleTyping && (
                <div className="flex gap-3 max-w-[80%]">
                  <img src="/nexy_mascot.png" alt="Oracle" className="w-6 h-6 rounded-md object-cover" />
                  <div className="p-3 bg-warm-100 dark:bg-warm-800 text-warm-400 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-warm-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-warm-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-warm-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            {interviewStep < 7 ? (
              <form onSubmit={handleSendInterviewMessage} className="p-4 border-t border-warm-100 dark:border-warm-800 bg-warm-50 dark:bg-warm-850 flex gap-2">
                <input
                  type="text"
                  value={interviewInput}
                  onChange={(e) => setInterviewInput(e.target.value)}
                  placeholder="Describe details here..."
                  className="flex-1 bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl px-4 py-3 text-xs text-warm-900 dark:text-warm-100 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-red-500 hover:bg-red-650 text-white rounded-2xl text-xs font-bold transition-all shadow"
                >
                  Reply
                </button>
              </form>
            ) : (
              /* Playtest Activation trigger */
              <div className="p-6 border-t border-warm-100 dark:border-warm-800 bg-warm-50 dark:bg-warm-850 text-center flex flex-col sm:flex-row gap-3 justify-center items-center">
                {!playtestMode ? (
                  <button
                    onClick={handleStartPlaytest}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-650 text-white rounded-2xl text-xs font-bold transition-all shadow-lg hover:scale-102 active:scale-98"
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                    <span>Meet Your Character (Playtest)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFinalPublish}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-650 text-white rounded-2xl text-xs font-bold transition-all shadow-lg hover:scale-102 active:scale-98"
                  >
                    <Check size={14} />
                    <span>Publish Character</span>
                  </button>
                )}
                <button
                  onClick={() => setCreationMode('advanced')}
                  className="px-4 py-3 bg-warm-200 dark:bg-warm-800 hover:bg-warm-300 dark:hover:bg-warm-750 text-warm-700 dark:text-warm-300 rounded-2xl text-xs font-semibold"
                >
                  Fine-tune in Advanced Mode
                </button>
              </div>
            )}
          </div>

          {/* Right: Live Preview & Playtest Workspace */}
          <div className="lg:col-span-5 flex flex-col bg-white dark:bg-warm-850/50 rounded-3xl border border-warm-200 dark:border-warm-800 shadow-xl overflow-hidden min-h-[600px] max-h-[650px]">
            {!playtestMode ? (
              /* Character Card Preview Visualizer */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className={`w-28 h-28 rounded-3xl border border-warm-200 dark:border-warm-700 flex items-center justify-center bg-gradient-to-br ${formData.bannerGradient} mb-4 relative overflow-hidden`}>
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Bot size={48} className="text-red-500/40" />
                  )}
                </div>
                <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50 truncate max-w-full">
                  {formData.name || 'Anonymous Draft'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-md mt-2">
                  {formData.category || 'General'}
                </span>
                
                {formData.tagsString && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3 max-w-full px-4">
                    {formData.tagsString.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="text-[9px] font-semibold bg-warm-100 dark:bg-warm-800 text-warm-650 dark:text-warm-400 px-2 py-0.5 rounded-full border border-warm-200 dark:border-warm-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-warm-500 dark:text-warm-400 mt-4 max-w-xs leading-normal">
                  {formData.shortDescription || 'Your character\'s bio will update live as you reply to Oracle.'}
                </p>

                <div className="mt-8 border-t border-warm-100 dark:border-warm-800 w-full pt-6 flex flex-col gap-2">
                  <div className="text-[10px] text-left text-warm-400 px-3">Greeting message preview:</div>
                  <div className="text-[10px] bg-warm-50 dark:bg-warm-800 p-3 rounded-2xl text-warm-600 dark:text-warm-350 border border-warm-200 dark:border-warm-750 text-left mx-3 line-clamp-3 italic">
                    "{formData.greeting || '...'}"
                  </div>
                </div>
              </div>
            ) : (
              /* Inline Playtest Workspace Chat */
              <div className="flex-1 flex flex-col h-full bg-warm-50 dark:bg-warm-900">
                <div className="px-4 py-3 bg-white dark:bg-warm-850 border-b border-warm-200 dark:border-warm-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500/25 flex items-center justify-center font-bold text-xs text-red-500">
                      {formData.name.charAt(0) || 'P'}
                    </div>
                    <span className="text-xs font-bold text-warm-900 dark:text-warm-100">{formData.name} Playtest</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Private Test</span>
                </div>

                {/* Chat Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar">
                  {playtestMessages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`p-2.5 rounded-2xl text-[11px] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-red-500 text-white rounded-tr-none'
                          : 'bg-white dark:bg-warm-800 text-warm-800 dark:text-warm-200 rounded-tl-none border border-warm-200 dark:border-warm-750 shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isPlaytestTyping && (
                    <div className="flex gap-2 max-w-[80%]">
                      <div className="p-2.5 bg-white dark:bg-warm-800 text-warm-400 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm border border-warm-200 dark:border-warm-750">
                        <span className="w-1 h-1 bg-warm-400 rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-warm-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1 h-1 bg-warm-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSendPlaytestMessage} className="p-3 bg-white dark:bg-warm-850 border-t border-warm-200 dark:border-warm-800 flex gap-2">
                  <input
                    type="text"
                    value={playtestInput}
                    onChange={(e) => setPlaytestInput(e.target.value)}
                    placeholder="Type testing message..."
                    className="flex-1 bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl px-3 py-2 text-[11px] focus:outline-none"
                  />
                  <button type="submit" className="px-3 py-2 bg-red-500 hover:bg-red-650 text-white rounded-xl text-[10px] font-bold">
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ADVANCED MODE (Form-Based Technical Editor) */
        <div className="space-y-8">
          
          {/* Step Indicators */}
          <div className="mb-6 overflow-x-auto pb-4 no-scrollbar">
            <div className="flex gap-4 min-w-[650px] justify-between">
              {['Identity', 'Appearance', 'Opening Scene', term('System Prompt', 'Creator Core'), 'Voice Examples', term('Behavioral Rules', 'Character Rules'), term('Lorebook / World Info', 'Universe Library'), 'Review & Publish'].map((step, idx) => {
                const stepId = idx + 1;
                const isCompleted = currentStep > stepId;
                const isActive = currentStep === stepId;

                return (
                  <div key={stepId} className="flex-1 flex flex-col gap-2 relative">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                        isCompleted 
                          ? 'bg-red-500 text-white' 
                          : isActive 
                            ? 'bg-warm-900 dark:bg-warm-50 text-white dark:text-warm-950 scale-105' 
                            : 'bg-warm-100 dark:bg-warm-800 text-warm-400 dark:text-warm-550 border border-warm-200 dark:border-warm-700'
                      }`}>
                        {isCompleted ? <Check size={12} /> : stepId}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        isActive ? 'text-warm-900 dark:text-warm-50' : 'text-warm-400 dark:text-warm-500'
                      }`}>
                        {step}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-750 rounded-3xl p-6 shadow-sm">
            
            {/* Step 1: Identity */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-base font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
                  Identity Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Lara Croft"
                      className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs text-warm-900 dark:text-warm-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs text-warm-900 dark:text-warm-50 focus:outline-none"
                    >
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                      Content Rating
                    </label>
                    <select
                      name="contentRating"
                      value={formData.contentRating}
                      onChange={handleChange}
                      className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs text-warm-900 dark:text-warm-50 focus:outline-none"
                    >
                      <option value="SFW">SFW (All Ages)</option>
                      <option value="Mature">Mature (17+)</option>
                      <option value="NSFW">NSFW (18+ / Explicit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                      Visibility
                    </label>
                    <select
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleChange}
                      className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs text-warm-900 dark:text-warm-50 focus:outline-none"
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>

                {/* Themes, Dynamics, Settings & Mood Selectors */}
                <div className="space-y-4 pt-4 border-t border-warm-100 dark:border-warm-800">
                  <h4 className="text-xs font-bold text-warm-850 dark:text-warm-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-red-500" />
                    <span>Story Themes & Classifications</span>
                  </h4>
                  <p className="text-[10px] text-warm-500">
                    Select themes, settings, dynamics, and moods to help other creators discover your character inside the Nexus.
                  </p>
                  
                  {/* Themes */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-warm-500">Themes</span>
                    <div className="flex flex-wrap gap-1.5">
                      {THEMES.map(t => {
                        const active = formData.tagsString.split(',').map(tag => tag.trim().toLowerCase()).includes(t.toLowerCase());
                        return (
                          <button
                            type="button"
                            key={t}
                            onClick={() => toggleTag(t)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${
                              active
                                ? 'bg-red-50 border-red-300 text-red-750 dark:bg-red-950/30 dark:border-red-900 dark:text-red-350'
                                : 'bg-warm-50 dark:bg-warm-800 border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:border-warm-300'
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamics */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-warm-500">Relationship Dynamics</span>
                    <div className="flex flex-wrap gap-1.5">
                      {DYNAMICS.map(t => {
                        const active = formData.tagsString.split(',').map(tag => tag.trim().toLowerCase()).includes(t.toLowerCase());
                        return (
                          <button
                            type="button"
                            key={t}
                            onClick={() => toggleTag(t)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${
                              active
                                ? 'bg-red-50 border-red-300 text-red-750 dark:bg-red-950/30 dark:border-red-900 dark:text-red-350'
                                : 'bg-warm-50 dark:bg-warm-800 border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:border-warm-300'
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-warm-500">Settings</span>
                    <div className="flex flex-wrap gap-1.5">
                      {SETTINGS.map(t => {
                        const active = formData.tagsString.split(',').map(tag => tag.trim().toLowerCase()).includes(t.toLowerCase());
                        return (
                          <button
                            type="button"
                            key={t}
                            onClick={() => toggleTag(t)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${
                              active
                                ? 'bg-red-50 border-red-300 text-red-750 dark:bg-red-950/30 dark:border-red-900 dark:text-red-350'
                                : 'bg-warm-50 dark:bg-warm-800 border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:border-warm-300'
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Moods */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-warm-500">Mood</span>
                    <div className="flex flex-wrap gap-1.5">
                      {MOODS.map(t => {
                        const active = formData.tagsString.split(',').map(tag => tag.trim().toLowerCase()).includes(t.toLowerCase());
                        return (
                          <button
                            type="button"
                            key={t}
                            onClick={() => toggleTag(t)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${
                              active
                                ? 'bg-red-50 border-red-300 text-red-750 dark:bg-red-950/30 dark:border-red-900 dark:text-red-350'
                                : 'bg-warm-50 dark:bg-warm-800 border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:border-warm-300'
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Tags */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-warm-500">Custom Tags (Comma Separated)</span>
                    <input
                      type="text"
                      name="tagsString"
                      value={formData.tagsString}
                      onChange={handleChange}
                      placeholder="e.g. superhero, ninja, custom-tag"
                      className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs text-warm-900 dark:text-warm-50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Appearance */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-base font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
                  Appearance & Avatars
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                      Avatar Image URL
                    </label>
                    <input
                      type="text"
                      name="avatarUrl"
                      value={formData.avatarUrl}
                      onChange={handleChange}
                      placeholder="e.g. https://domain.com/avatar.jpg"
                      className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                      Banner Image URL
                    </label>
                    <input
                      type="text"
                      name="bannerUrl"
                      value={formData.bannerUrl}
                      onChange={handleChange}
                      placeholder="e.g. https://domain.com/banner.jpg"
                      className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Opening Scene */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-base font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
                  {term('Scenario', 'Opening Scene')}
                </h3>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                    Greeting Message *
                  </label>
                  <textarea
                    name="greeting"
                    value={formData.greeting}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Provide the opening sentence or line of roleplay dialogue..."
                    className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                    Opening Scene Context / Scenario
                  </label>
                  <textarea
                    name="scenario"
                    value={formData.scenario}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe where the conversation starts (e.g. {{char}} meets you in a tavern)..."
                    className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Character Core */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-base font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
                  {term('System Prompt', 'Creator Core')}
                </h3>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                    Personality Traits
                  </label>
                  <textarea
                    name="personality"
                    value={formData.personality}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe their traits, quirks, flaws, emotional behavior..."
                    className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                    {term('System Prompt (System Character Definition)', 'Creator Core')}
                  </label>
                  <textarea
                    name="systemCharacterDefinition"
                    value={formData.systemCharacterDefinition}
                    onChange={handleChange}
                    rows={4}
                    placeholder="[Character: {{char}}]\n[Behavior: cold, analytical...]"
                    className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Voice Examples */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-base font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
                  {term('Example Dialogue', 'Voice Examples')}
                </h3>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                    Example Dialogues / Conversations
                  </label>
                  <textarea
                    name="exampleDialogues"
                    value={formData.exampleDialogues}
                    onChange={handleChange}
                    rows={8}
                    placeholder="<START>\n{{user}}: What is your name?\n{{char}}: I am Lara Croft."
                    className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Behavior Rules */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h3 className="text-base font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
                  {term('Behavioral Rules', 'Character Rules')}
                </h3>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                    {term('Behavioral Rules (OOC Instructions & Guidelines)', 'Character Rules')}
                  </label>
                  <textarea
                    name="systemDefinition"
                    value={formData.systemDefinition}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Guidelines the AI must obey (e.g. Do not speak for user)..."
                    className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                    Director's Notes (Author's Note)
                  </label>
                  <textarea
                    name="rpDefinition"
                    value={formData.rpDefinition}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Guidelines about writing style, formatting style, romance boundaries..."
                    className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 7: Universe Library */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <h3 className="text-base font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
                  {term('Lorebook / World Info', 'Universe Library')}
                </h3>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                    {term('Lorebook / World Knowledge', 'Character Facts')}
                  </label>
                  <textarea
                    name="knowledge"
                    value={formData.knowledge}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Input locations, magic systems, Kingdoms, species information..."
                    className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl py-3 px-4 text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 8: Review & Publish */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <h3 className="text-base font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
                  Publish Character Draft
                </h3>
                <div className="flex flex-col items-center justify-center text-center p-6 bg-warm-50 dark:bg-warm-800 rounded-2xl border border-warm-200 dark:border-warm-750">
                  <Bot size={48} className="text-red-500 mb-4 animate-bounce" />
                  <h4 className="font-serif font-bold text-warm-900 dark:text-warm-50">{formData.name || 'Untitled Character'}</h4>
                  <p className="text-xs text-warm-500 mt-2 max-w-sm">
                    Your character will be published to CHIMERA Nexus under the <strong>{formData.visibility}</strong> visibility.
                  </p>
                  
                  {/* Playtest Trigger in Advanced Mode */}
                  <button
                    onClick={handleStartPlaytest}
                    className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-650 text-white rounded-xl text-xs font-bold transition-all shadow"
                  >
                    <Play size={12} />
                    <span>Meet Character (Private Playtest)</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Navigation Buttons for Advanced Editor */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1 || loading}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-xs transition-all border ${
                currentStep === 1 
                  ? 'border-transparent text-warm-300 dark:text-warm-700 cursor-not-allowed'
                  : 'border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 hover:bg-warm-150 dark:hover:bg-warm-800'
              }`}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            {currentStep < 8 ? (
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 bg-warm-900 dark:bg-warm-55 text-white dark:text-warm-950 hover:bg-warm-800 dark:hover:bg-warm-150 font-semibold px-6 py-3 rounded-2xl shadow transition-all"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleFinalPublish}
                disabled={loading}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-650 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg transition-all"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Publish Character</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* Publishing Pipeline Overlay Screen (Requirement 37.3 / 38) */}
      {publishPipeline.isActive && (
        <div className="fixed inset-0 z-[9999] bg-warm-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-750 shadow-2xl p-6 flex flex-col gap-6 text-center">
            
            {publishPipeline.step !== 'success' && publishPipeline.step !== 'failed' && (
              <div className="flex flex-col items-center gap-4">
                <RefreshCw size={36} className="text-red-500 animate-spin" />
                <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">Publishing Workspace</h3>
              </div>
            )}

            {publishPipeline.step === 'success' && (
              <div className="flex flex-col items-center gap-4 animate-scale-in">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <Check size={24} />
                </div>
                <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">✅ Published Successfully</h3>
                <p className="text-xs text-warm-500">Your character joins CHIMERA storytelling ecosystem.</p>
              </div>
            )}

            {publishPipeline.step === 'failed' && (
              <div className="flex flex-col items-center gap-4 animate-scale-in">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/20">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">⚠️ Publishing Failed</h3>
                <p className="text-xs text-warm-500 leading-relaxed px-2">
                  {publishPipeline.error || 'Something went wrong while publishing. Your draft remains completely safe.'}
                </p>
                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={handleFinalPublish}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-650 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setPublishPipeline({ isActive: false, step: 'saving' })}
                    className="flex-1 py-2.5 bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-305 rounded-xl text-xs font-semibold"
                  >
                    Save as Draft
                  </button>
                </div>
              </div>
            )}

            {/* Step list progression */}
            {publishPipeline.step !== 'success' && publishPipeline.step !== 'failed' && (
              <div className="flex flex-col text-left gap-3 px-4">
                <div className="flex items-center justify-between text-xs">
                  <span className={publishPipeline.step === 'saving' ? 'text-red-500 font-bold' : 'text-warm-400 dark:text-warm-500'}>1. Saving Final Draft</span>
                  {publishPipeline.step === 'saving' ? '✍️' : '✅'}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={publishPipeline.step === 'validating' ? 'text-red-500 font-bold' : 'text-warm-400 dark:text-warm-500'}>2. Validating Configuration</span>
                  {publishPipeline.step === 'saving' ? '⏳' : publishPipeline.step === 'validating' ? '✍️' : '✅'}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={publishPipeline.step === 'uploading' ? 'text-red-500 font-bold' : 'text-warm-400 dark:text-warm-500'}>3. Uploading Core Assets</span>
                  {publishPipeline.step === 'saving' || publishPipeline.step === 'validating' ? '⏳' : publishPipeline.step === 'uploading' ? '✍️' : '✅'}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={publishPipeline.step === 'publishing' ? 'text-red-500 font-bold' : 'text-warm-400 dark:text-warm-500'}>4. Syncing Character to Nexus</span>
                  {publishPipeline.step === 'publishing' ? '✍️' : '⏳'}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
    </>
  );
}
