import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Bot, Check, RefreshCw, 
  Settings, AlertTriangle, User, FileText, UploadCloud, Plus, Sparkles, Menu, Volume2, Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { checkUserPromptSafety, CRISIS_HELPLINE_INFO } from '../lib/safetyGuard';
import { UniversalImagePicker } from '../components/common/UniversalImagePicker';
import { supabase } from '../lib/supabase';
import { compileCharacterSystemPrompt, type CharacterArchitecture } from '../lib/promptCompiler';
import { UniversalCharacterImporterModal } from '../components/creator/UniversalCharacterImporterModal';
import { RichTextEditor } from '../components/common/RichTextEditor';
import { voiceEngine, PRESET_CHARACTER_VOICES } from '../services/voiceEngine';

export default function AiCharacterCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: routeId } = useParams<{ id?: string }>();
  const draftId = searchParams.get('draftId');
  const editId = searchParams.get('id') || routeId;
  const [characterId] = useState<string>(() => draftId || routeId || searchParams.get('id') || crypto.randomUUID());
  const { profile } = useAuth();
  const { showToast } = useToast();

  const greetingRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'architecture' | 'definition'>('general');
  const [creationStart, setCreationStart] = useState<'spark' | 'import' | 'idea'>('spark');
  const [loading, setLoading] = useState(false);

  // Sync / Network States
  const [saveStatus, setSaveStatus] = useState<'protected' | 'protecting' | 'offline'>('protected');
  const [privateDraftSaved, setPrivateDraftSaved] = useState(false);
  const [savingPrivateDraft, setSavingPrivateDraft] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Publishing Pipeline State
  const [publishPipeline, setPublishPipeline] = useState<{
    isActive: boolean;
    step: 'saving' | 'validating' | 'uploading' | 'publishing' | 'success' | 'failed';
    error?: string;
  }>({ isActive: false, step: 'saving' });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Romance', // default
    visibility: 'public' as 'public' | 'private' | 'unlisted',
    contentRating: 'SFW' as 'SFW' | 'Mature' | 'NSFW',
    avatarUrl: '',
    bannerUrl: '', // Using avatar as banner in this simple layout
    greeting: '',
    shortDescription: '',
    longDescription: '',
    personality: '',
    scenario: '',
    exampleDialogues: '',
    conversationStyle: '',
    rpDefinition: '',
    systemDefinition: '',
    systemCharacterDefinition: '',
    knowledge: '',
    creatorNotes: '',
    exampleConversations: '',
    tagsString: '',
    alternateGreetings: [] as string[],
    bannedWords: '',
    suggestedPersonaName: ''
  });

  const [archData, setArchData] = useState<CharacterArchitecture>({});
  const [showImporterModal, setShowImporterModal] = useState(false);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSaveStatus('protected');
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

  // Restore draft from Cloud or LocalStorage on mount
  useEffect(() => {
    async function loadDraft() {
    if (draftId && profile?.user_id) {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('chimera_character_drafts')
          .select('form_data, architecture_data')
          .eq('id', draftId)
          .single();
        if (error) throw error;
        if (data?.form_data) setFormData((current) => ({ ...current, ...data.form_data }));
        if (data?.architecture_data) setArchData(data.architecture_data);
        setPrivateDraftSaved(true);
        showToast('Private CHIMERA draft restored.', 'info');
      } catch (e) {
        console.error('Failed to load private character draft:', e);
        showToast('This private draft could not be opened.', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (editId && profile?.user_id) {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('ai_characters')
            .select('*')
            .eq('id', editId)
            .maybeSingle();

          if (data) {
            setFormData({
              name: data.display_name || '',
              category: data.category || 'Romance',
              visibility: data.visibility || 'private',
              contentRating: (data.content_rating as any) || 'SFW',
              avatarUrl: data.photo_url || '',
              bannerUrl: data.photo_url || '',
              greeting: data.greeting || '',
              shortDescription: data.short_description || '',
              longDescription: data.long_description || '',
              personality: data.personality || '',
              scenario: data.scenario || '',
              exampleDialogues: data.example_dialogues || '',
              conversationStyle: data.conversation_style || 'Warm, conversational, structured.',
              rpDefinition: data.rp_definition || '',
              systemDefinition: data.system_definition || '',
              systemCharacterDefinition: data.system_character_definition || '',
              knowledge: data.knowledge || '',
              creatorNotes: data.creator_notes || '',
              exampleConversations: data.example_conversations || '',
              tagsString: (data.tags || []).join(', '),
              alternateGreetings: data.alternate_greetings || [],
              bannedWords: data.banned_words || '',
              suggestedPersonaName: data.suggested_persona_name || ''
            });
            showToast(`Loaded draft: ${data.display_name || 'Untitled Character'}`, 'info');
          }
        } catch (e) {
          console.error('Failed to load cloud draft:', e);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Local storage fallback
      try {
        const savedDraft = localStorage.getItem('chimera-character-creator-draft');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.formData) setFormData(parsed.formData);
          if (parsed.archData) setArchData(parsed.archData);
          showToast('Restored your unsaved character draft!', 'info');
        }
      } catch (e) {
        console.error('Failed to load local draft:', e);
      }
    }
    loadDraft();
  }, [editId, profile]);

  // Background Autosave
  useEffect(() => {
    if (!isOnline) {
      setSaveStatus('offline');
      return;
    }

    const timer = setTimeout(() => {
      if (formData.name || formData.greeting || formData.personality || Object.keys(archData).length > 0) {
        setSaveStatus('protecting');
        localStorage.setItem(
          'chimera-character-creator-draft',
          JSON.stringify({ formData, archData })
        );
        setTimeout(() => {
          setSaveStatus('protected');
        }, 300);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, archData, isOnline]);

  const handleSaveDraft = async () => {
    localStorage.setItem(
      'chimera-character-creator-draft',
      JSON.stringify({ formData, archData })
    );
    if (!profile?.user_id) {
      showToast('Sign in to save this as a private CHIMERA draft. Your changes are still protected on this device.', 'error');
      return;
    }

    try {
      setSavingPrivateDraft(true);
      const { error } = await supabase
        .from('chimera_character_drafts')
        .upsert({
          id: characterId,
          user_id: profile.user_id,
          title: formData.name.trim() || 'Untitled character',
          form_data: formData,
          architecture_data: archData,
        }, { onConflict: 'id' });
      if (error) throw error;
      setPrivateDraftSaved(true);
      showToast('Private draft saved to CHIMERA.', 'success');
    } catch (error) {
      console.error('Private CHIMERA draft save failed:', error);
      showToast('CHIMERA could not save this private draft yet. Your changes are still protected on this device.', 'error');
    } finally {
      setSavingPrivateDraft(false);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('chimera-character-creator-draft');
    setFormData({
      name: '',
      category: 'Romance',
      visibility: 'public',
      contentRating: 'SFW',
      avatarUrl: '',
      bannerUrl: '',
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
      tagsString: '',
      alternateGreetings: [],
      bannedWords: '',
      suggestedPersonaName: ''
    });
    setArchData({});
    showToast('This device copy was cleared. Any private draft saved to CHIMERA remains in your Drafts library.', 'info');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getFriendlyErrorMessage = (err: any) => {
    if (!err) return "Publishing failed. Please try again.";
    
    // Diagnostic Mode: Always surface exact technical exception
    if (typeof err === 'string') return err;
    
    const parts = [
      err.message ? `Message: ${err.message}` : '',
      err.details ? `Details: ${err.details}` : '',
      err.hint ? `Hint: ${err.hint}` : '',
      err.code ? `Postgres Code: ${err.code}` : ''
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' | ') : JSON.stringify(err);
  };

  // Publishing Pipeline Workflow
  const handleFinalPublish = async () => {
    if (!profile) {
      showToast('You must be logged in to publish', 'error');
      return;
    }

    setPublishPipeline({ isActive: true, step: 'saving' });

    // Step 1: SafetyGuard Check on Character Data
    const nameSafety = checkUserPromptSafety(formData.name);
    const greetingSafety = checkUserPromptSafety(formData.greeting);
    const personalitySafety = checkUserPromptSafety(formData.personality);
    const scenarioSafety = checkUserPromptSafety(formData.scenario);

    if (
      (!nameSafety.isSafe && nameSafety.crisisTriggered) ||
      (!greetingSafety.isSafe && greetingSafety.crisisTriggered) ||
      (!personalitySafety.isSafe && personalitySafety.crisisTriggered) ||
      (!scenarioSafety.isSafe && scenarioSafety.crisisTriggered)
    ) {
      setPublishPipeline({
        isActive: true,
        step: 'failed',
        error: `💜 Help is available. Call/text ${CRISIS_HELPLINE_INFO.phone} (${CRISIS_HELPLINE_INFO.name}). Character definitions must not contain real-world self-harm content.`
      });
      return;
    }

    // Step 2: Save Draft
    setTimeout(() => {
      // Step 3: Validate Character Required Fields
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
          error: 'First Greeting is required before publishing so roleplay can start!' 
        });
        setActiveTab('general');
        setTimeout(() => {
          greetingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          greetingRef.current?.focus();
        }, 150);
        return;
      }

      // Step 3: Upload Assets (Simulated or Public)
      setPublishPipeline(prev => ({ ...prev, step: 'uploading' }));

      // Step 4: Publish character (Update draft visibility or insert new)
      setTimeout(async () => {
        setPublishPipeline(prev => ({ ...prev, step: 'publishing' }));

        try {
          const tempUsername = `bot_${Math.random().toString(36).substring(2, 10)}`;
          const tags = formData.tagsString.split(',').map(t => t.trim()).filter(Boolean);
          const currentUserId = profile?.user_id || (await supabase.auth.getUser()).data.user?.id;

          if (!currentUserId) {
            throw new Error('You must be logged in to publish a character.');
          }

          const cleanStr = (s: string) => (s || '').replace(/\u0000/g, '').replace(/\x00/g, '').trim();

          // Update user's profile with display name / avatar if needed
          const currentUsername = profile?.username || `creator_${currentUserId.slice(0, 6)}`;
          
          // Upsert into public.ai_characters with complete published properties
          const { data: insertedChar, error: directError } = await supabase
            .from('ai_characters')
            .upsert({
              id: characterId,
              user_id: characterId,
              creator_id: currentUserId,
              name: cleanStr(formData.name),
              display_name: cleanStr(formData.name),
              photo_url: formData.avatarUrl.trim() || '',
              avatar_url: formData.avatarUrl.trim() || '',
              greeting: cleanStr(formData.greeting),
              short_description: cleanStr(formData.shortDescription),
              long_description: cleanStr(formData.longDescription),
              personality: cleanStr(formData.personality),
              scenario: cleanStr(formData.scenario),
              example_dialogues: cleanStr(formData.exampleDialogues),
              conversation_style: cleanStr(formData.conversationStyle),
              knowledge: cleanStr(formData.knowledge),
              tags: tags.map(cleanStr),
              category: formData.category,
              visibility: 'public',
              content_rating: formData.contentRating,
              creator_notes: cleanStr(formData.creatorNotes),
              example_conversations: cleanStr(formData.exampleConversations),
              rp_definition: cleanStr(formData.rpDefinition),
              system_definition: cleanStr(formData.systemDefinition),
              system_character_definition: cleanStr(formData.systemCharacterDefinition),
              alternate_greetings: formData.alternateGreetings.map(cleanStr),
              status: 'published',
              creator_username: currentUsername,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
            .select()
            .maybeSingle();

          if (directError) {
            console.error('[CHIMERA Publishing Diagnostic]: Upsert table error:', directError);
            throw directError;
          }

          // Step 5: Success
          setPublishPipeline(prev => ({ ...prev, step: 'success' }));
          localStorage.removeItem('chimera-character-creator-draft');
          
          setTimeout(() => {
            showToast('Character published to CHIMERA Nexus!', 'success');
            navigate('/');
          }, 1500);

        } catch (err: any) {
          console.error('[CHIMERA Final Diagnostic Error]:', err);
          setPublishPipeline({ 
            isActive: true, 
            step: 'failed', 
            error: getFriendlyErrorMessage(err)
          });
        }
      }, 1000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#100b17] text-warm-100 font-sans">
      <main className="min-h-screen overflow-y-auto pb-36 md:pb-24 bg-[radial-gradient(circle_at_50%_0%,rgba(113,73,151,0.22),transparent_28%),radial-gradient(circle_at_15%_40%,rgba(192,151,75,0.07),transparent_24%),#100b17]">
        <div className="max-w-5xl mx-auto p-5 sm:p-8 lg:p-10">
          <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-sm text-warm-400 hover:text-[#f0d48d] transition-colors"><ArrowLeft size={16} /> My characters</button>

          <header className="text-center mb-8 sm:mb-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d6ad56]">Character creation</p>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#fff3d8]">Bring someone into CHIMERA</h1>
            <p className="mt-3 text-sm sm:text-base text-[#cfc1d6]">A voice, a history, a first moment waiting to happen.</p>
          </header>

          <section className="mb-7 rounded-[2rem] border border-[#d8b56a]/35 bg-[#1b1323]/90 p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="grid gap-5 md:grid-cols-[190px_1fr] md:items-center">
              <div className="mx-auto w-full max-w-[190px] aspect-[4/5] overflow-hidden rounded-2xl border border-[#d8b56a]/35 bg-[radial-gradient(circle_at_50%_25%,rgba(167,113,211,0.35),transparent_35%),linear-gradient(145deg,#30203d,#100c18)] relative">
                {formData.avatarUrl ? <img src={formData.avatarUrl} alt="Character preview" className="h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><User size={54} className="text-[#c5a3df]/70" /></div>}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0f0914] to-transparent" />
              </div>
              <div>
                <label className="block font-serif text-xl text-[#fff3d8]">Who is stepping into your world?</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Give them a name…" className="mt-3 w-full rounded-xl border border-[#d8b56a]/25 bg-[#110c18] px-4 py-3 text-base text-white outline-none placeholder:text-warm-500 focus:border-[#d8b56a]/70" />
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {([
                    ['spark', 'Start with a spark', Sparkles],
                    ['import', 'Import a character card', Upload],
                    ['idea', 'Shape from an idea', Bot],
                  ] as const).map(([kind, label, Icon]) => (
                    <button key={kind} type="button" onClick={() => { setCreationStart(kind); if (kind === 'import') setShowImporterModal(true); }} className={`min-h-[104px] rounded-2xl border p-4 text-center transition-all ${creationStart === kind ? 'border-[#d8b56a] bg-[#5b3b75]/35 shadow-[0_0_28px_rgba(171,110,222,0.17)]' : 'border-white/10 bg-black/10 hover:border-[#d8b56a]/45'}`}>
                      <Icon size={21} className={`mx-auto mb-2 ${creationStart === kind ? 'text-[#f0d48d]' : 'text-[#bda6cb]'}`} />
                      <span className="text-xs font-bold text-[#f4ead5]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <nav className="mb-8 overflow-x-auto">
            <div className="flex min-w-[680px] items-start justify-between px-1">
              {[
                ['Identity', 'general', User], ['The Story They Carry', 'definition', FileText], ['First Scene', 'general', Sparkles], ['Their Voice', 'general', Volume2], ['Creator’s Room', 'definition', Settings], ['Publish', 'general', Check],
              ].map(([label, tab, Icon], index) => <button key={label} type="button" onClick={() => setActiveTab(tab as 'general' | 'definition')} className="group flex w-[105px] flex-col items-center gap-2 text-center"><span className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-colors ${activeTab === tab ? 'border-[#e4c476] bg-[#5c3c77] text-[#fff0bf]' : 'border-[#8a6c43] bg-[#16101e] text-[#b8a98e] group-hover:border-[#d8b56a]'}`}>{index + 1}</span><span className={`text-[11px] font-semibold leading-tight ${activeTab === tab ? 'text-[#f7df9f]' : 'text-[#afa2b4]'}`}><Icon size={12} className="mx-auto mb-1" />{label}</span></button>)}
            </div>
          </nav>

          {/* Form Content */}
          <div className="space-y-8">
            {activeTab === 'general' ? (
              <>
                {/* Guided Studio Experience Banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-[#b98a37]/12 via-[#724896]/16 to-[#291b38]/30 border border-[#d5aa57]/30 space-y-3 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-serif font-bold text-[#fff3d8]">Start with a spark</h3>
                        <p className="text-xs text-warm-300">
                          Begin with the feeling of them. CHIMERA will keep every detail you add alive in their character definition.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowImporterModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Upload size={16} />
                      <span>Import a card</span>
                    </button>
                  </div>

                  {/* Guided Tips Sparks */}
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2 overflow-x-auto text-[11px] text-warm-300 scrollbar-none">
                    <span className="font-bold text-amber-400 flex items-center gap-1"><Sparkles size={12} /> Studio Suggestions:</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        name: 'Eldrin Vance',
                        shortDescription: 'Archmage of the Silver Citadel',
                        greeting: '*adjusts his silk robes and looks up from an ancient tome* "Ah, a visitor. State your purpose before the seals react."',
                        scenario: 'Inside the high library of the Silver Citadel during a quiet evening storm.'
                      }))}
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-warm-200 transition-colors whitespace-nowrap"
                    >
                      + Moonlit archmage
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        name: 'Lyra Thorne',
                        shortDescription: 'Cybernetics Specialist & Hacker',
                        greeting: '*spins her holo-display around and glances at you over her visor* "You\'re late. Did the corp drones trace your signal?"',
                        scenario: 'In a neon-lit subterranean hideout in Sector 7.'
                      }))}
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-warm-200 transition-colors whitespace-nowrap"
                    >
                      + Neon confidant
                    </button>
                  </div>

                {/* Preview & Image Upload Block */}
                <div className="flex flex-col sm:flex-row gap-8 mb-8">
                  {/* Left: Preview Card */}
                  <div className="w-48 flex-shrink-0">
                    <label className="block text-xs font-bold text-warm-400 mb-2 uppercase tracking-wide">Preview</label>
                    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-warm-800 border border-warm-700 shadow-xl group">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover opacity-90" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-warm-800 to-warm-900 flex items-center justify-center border-2 border-dashed border-warm-700 m-2 rounded-xl w-[calc(100%-16px)] h-[calc(100%-16px)]">
                          <User size={32} className="text-warm-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h4 className="text-white font-bold text-lg font-serif leading-tight drop-shadow-md">
                          {formData.name || 'Title'}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white bg-red-500/80 uppercase">
                            {formData.contentRating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Image Upload */}
                  <div className="flex-1">
                  <div>
                    <UniversalImagePicker
                      value={formData.avatarUrl}
                      onChange={(url) => setFormData(prev => ({ ...prev, avatarUrl: url || '' }))}
                      label="Character Avatar Photo"
                      shape="circle"
                    />
                    <ul className="text-[10px] text-warm-400 mt-3 space-y-1 list-disc list-inside">
                      <li>Select or drag-and-drop an image for your character avatar.</li>
                      <li>Please make sure your image does not violate our platform trust guidelines.</li>
                    </ul>
                  </div>
                    <ul className="text-[10px] text-warm-400 mt-3 space-y-1 list-disc list-inside">
                      <li>You can begin with an avatar now, or bring in a compatible character-card file.</li>
                      <li>Please make sure your image/character does not violate our guidelines.</li>
                      <li>Important: updating the image on a public character can take up to 30 seconds to verify.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-warm-400 mb-2">Character name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="What do others call them?"
                      className="w-full bg-warm-800 border border-warm-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-400 mb-2">Name inside chats</label>
                    <input
                      type="text"
                      placeholder="Optional nickname shown in chats instead of the character's name"
                      className="w-full bg-warm-800 border border-warm-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <RichTextEditor
                      label="The story they carry *"
                      value={formData.shortDescription}
                      onChange={(val) => setFormData(prev => ({ ...prev, shortDescription: val }))}
                      minHeightRows={6}
                      placeholder="Write the history, longing, contradictions, and world that shaped them…"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-400 mb-2">Tags</label>
                    <input
                      type="text"
                      name="tagsString"
                      value={formData.tagsString}
                      onChange={handleChange}
                      placeholder="Pick from suggestions or type to create your own (max 10)"
                      className="w-full bg-warm-800 border border-warm-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                    <div className="mt-2 flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-warm-800 border border-warm-700 text-xs font-bold text-warm-300 hover:bg-warm-700">Add Music Mania Tag</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-400 mb-3">Content Rating</label>
                    <div className="flex gap-6 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="contentRating"
                          value="SFW"
                          checked={formData.contentRating === 'SFW'}
                          onChange={() => setFormData(prev => ({...prev, contentRating: 'SFW'}))}
                          className="w-4 h-4 text-red-500 bg-warm-800 border-warm-700 focus:ring-red-500 focus:ring-offset-warm-900"
                        />
                        <span className="text-sm font-bold text-warm-100 group-hover:text-white transition-colors">Limited</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="contentRating"
                          value="NSFW"
                          checked={formData.contentRating === 'NSFW'}
                          onChange={() => setFormData(prev => ({...prev, contentRating: 'NSFW'}))}
                          className="w-4 h-4 text-red-500 bg-warm-800 border-warm-700 focus:ring-red-500 focus:ring-offset-warm-900"
                        />
                        <span className="text-sm font-bold text-warm-100 group-hover:text-white transition-colors">NSFW</span>
                      </label>
                    </div>
                    <ul className="text-[10px] text-warm-400 space-y-1 list-disc list-inside bg-warm-800/30 p-4 rounded-xl border border-warm-800">
                      <li><strong>Minor characters (under 18 years old) are not allowed regardless of tag.</strong></li>
                      <li>Themes of rape and sexual violence are treated as consensual non-consent, with clear content warnings required.</li>
                      <li>Bots requiring a 'Limitless' tag include those with detailing in coding related to sexual mannerisms or explicit dialogue.</li>
                      <li>Please ensure your bot adheres to these guidelines to maintain a safe and respectful environment.</li>
                    </ul>
                  </div>
                  {/* First Scene */}
                  <div className="pt-6 border-t border-warm-800">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-warm-400">
                        First Message / Greeting <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-md border border-red-500/30">
                        * Required for Roleplay
                      </span>
                    </div>
                    <p className="text-[10px] text-warm-500 mb-3">
                      The initial opening message sent by your character when a roleplay conversation starts.
                    </p>

                    {!formData.greeting.trim() && publishPipeline.step === 'failed' && (
                      <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2 animate-shake">
                        <AlertTriangle size={16} />
                        <span>First Greeting is required so roleplay can start! Type your character's opening message below.</span>
                      </div>
                    )}

                    <div className={`bg-warm-800/50 border rounded-xl overflow-hidden transition-all ${
                      !formData.greeting.trim() && publishPipeline.step === 'failed' ? 'border-red-500 ring-2 ring-red-500/30' : 'border-warm-700'
                    }`}>
                      <div className="flex items-center justify-between bg-warm-800 border-b border-warm-700 px-3 py-1.5 flex-wrap gap-2">
                        <span className="text-xs font-bold text-warm-200">First Opening Message</span>
                        {/* Character and player name tokens */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, greeting: prev.greeting + ' {{user}} ' }));
                              greetingRef.current?.focus();
                            }}
                            className="px-2 py-0.5 rounded bg-warm-700 hover:bg-warm-600 text-warm-200 text-[10px] font-mono font-bold"
                            title="Insert User Persona Name Macro"
                          >
                            + {'{{user}}'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, greeting: prev.greeting + ' {{char}} ' }));
                              greetingRef.current?.focus();
                            }}
                            className="px-2 py-0.5 rounded bg-warm-700 hover:bg-warm-600 text-warm-200 text-[10px] font-mono font-bold"
                            title="Insert Character Name Macro"
                          >
                            + {'{{char}}'}
                          </button>
                        </div>
                      </div>
                      <textarea
                        ref={greetingRef}
                        name="greeting"
                        value={formData.greeting}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Type your character's first opening message to the user... e.g. *smiles warmly at {{user}}* 'Welcome! How can I assist you today?'"
                        className="w-full bg-transparent p-4 text-sm text-white focus:outline-none resize-none placeholder:text-warm-500 font-serif"
                      />
                    </div>

                    {/* Other opening scenes */}
                    <div className="mt-6 p-4 bg-warm-850 border border-warm-800 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-warm-200 flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-400" />
                        <span>Other Ways In</span>
                          </h4>
                          <p className="text-[10px] text-warm-400 mt-0.5">
                            Add alternative opening scenes so conversations can start in different settings or moods!
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.alternateGreetings.length < 5) {
                              setFormData(prev => ({
                                ...prev,
                                alternateGreetings: [...prev.alternateGreetings, '']
                              }));
                            }
                          }}
                          disabled={formData.alternateGreetings.length >= 5}
                          className="px-3 py-1.5 rounded-xl bg-warm-750 hover:bg-warm-700 text-warm-200 hover:text-white text-xs font-bold border border-warm-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Plus size={14} />
                          <span>Add Greeting</span>
                        </button>
                      </div>

                      {formData.alternateGreetings.map((altGreeting, idx) => (
                        <div key={idx} className="space-y-1.5 p-3 bg-warm-900 rounded-xl border border-warm-800 relative">
                          <div className="flex items-center justify-between text-[11px] font-bold text-warm-400">
                            <span>Opening scene #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  alternateGreetings: prev.alternateGreetings.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="text-red-400 hover:text-red-300 text-[10px]"
                            >
                              Remove
                            </button>
                          </div>
                          <textarea
                            value={altGreeting}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const next = [...prev.alternateGreetings];
                                next[idx] = val;
                                return { ...prev, alternateGreetings: next };
                              });
                            }}
                            rows={3}
                            placeholder={`Another way in #${idx + 1}… e.g. *{{char}} waits beneath the station clock…*`}
                            className="w-full bg-warm-950 p-3 rounded-lg text-xs text-white border border-warm-800 focus:outline-none focus:border-purple-500 font-serif"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── CHARACTER VOICE STUDIO ── */}
                  <div className="p-6 rounded-2xl bg-warm-900 border border-warm-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                          <Volume2 size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">Their Voice</h3>
                          <p className="text-xs text-warm-400">Choose an optional spoken voice for roleplay audio dialogue.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PRESET_CHARACTER_VOICES.map((v) => (
                        <div
                          key={v.id}
                          onClick={() => setFormData(prev => ({ ...prev, voiceId: v.id }))}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            (formData as any).voiceId === v.id || (! (formData as any).voiceId && v.id === 'voice_gentle_female')
                              ? 'bg-purple-500/15 border-purple-500 text-white shadow-md'
                              : 'bg-warm-950/60 border-warm-800 text-warm-300 hover:border-warm-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <span>{v.name}</span>
                            </div>
                            <div className="text-[11px] text-warm-400 mt-0.5">{v.tone}</div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              voiceEngine.speak(`Hello! I am ${formData.name || 'your character'}. This is how my voice sounds in roleplay!`, v.id);
                            }}
                            className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-1 transition-all shrink-0 ml-2"
                            title="Audition Voice"
                          >
                            <Volume2 size={14} />
                            <span className="text-[10px]">Preview</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tab Navigation Controls */}
                  <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-warm-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('definition')}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-warm-800 hover:bg-warm-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-warm-700"
                    >
                      <span>Enter the Creator’s Room</span>
                      <FileText size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalPublish}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Sparkles size={16} />
                      <span>Bring them into CHIMERA</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-serif font-bold text-white mb-2">Creator’s Room</h3>
                <p className="text-sm text-warm-400 mb-8 border-b border-warm-800 pb-6">
                  The Inner Script: the details that make their voice, behavior, memory, and world feel consistent.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-warm-400 mb-1">Personality *</label>
                    <p className="text-[10px] text-warm-500 mb-2">Describe your character's persona here.</p>
                    <textarea
                      name="personality"
                      value={formData.personality}
                      onChange={handleChange}
                      rows={6}
                      className="w-full bg-warm-800 border border-warm-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-400 mb-1">Scenario</label>
                    <p className="text-[10px] text-warm-500 mb-2">Outline the context and setting for your character's conversations.</p>
                    <textarea
                      name="scenario"
                      value={formData.scenario}
                      onChange={handleChange}
                      rows={4}
                      className="w-full bg-warm-800 border border-warm-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                      <label className="block text-xs font-bold text-warm-400">
                        First Message / Greeting <span className="text-red-400">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!formData.name.trim()) {
                              showToast('Please enter a character name first!', 'error');
                              return;
                            }
                            const draft = `*steps forward into the soft light, looking towards you with a curious expression* "Greetings, traveler. I am ${formData.name}. Tell me, what brings you to these lands today?"`;
                            setFormData(prev => ({ ...prev, greeting: draft }));
                            showToast('Draft opening scene generated! You can edit it below.', 'success');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                          title="Draft an opening scene based on character name"
                        >
                          <Sparkles size={12} />
                          <span>Draft Scene with AI</span>
                        </button>
                        <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-md border border-red-500/30">
                          * Required to Publish
                        </span>
                      </div>
                    </div>

                    {!formData.greeting.trim() && publishPipeline.step === 'failed' && (
                      <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2 animate-shake">
                        <AlertTriangle size={16} />
                        <span>First Greeting is required so roleplay can start! Type your character's opening message below or use the AI draft button.</span>
                      </div>
                    )}

                    <div className={`bg-warm-800/50 border rounded-xl overflow-hidden transition-all ${
                      !formData.greeting.trim() && publishPipeline.step === 'failed' ? 'border-red-500 ring-2 ring-red-500/30' : 'border-warm-700'
                    }`}>
                      <div className="flex bg-warm-800 border-b border-warm-700">
                        <button className="px-4 py-2 text-xs font-bold text-white border-b-2 border-red-500 bg-warm-700/50">Write</button>
                        <button className="px-4 py-2 text-xs font-bold text-warm-400 hover:text-white transition-colors">Preview</button>
                      </div>
                      <div className="p-3 bg-warm-850 flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-bold bg-warm-700 rounded-lg text-white">Message 1</button>
                        <button className="px-3 py-1.5 text-xs font-bold bg-warm-800 border border-warm-700 rounded-lg text-warm-400 hover:text-white"><Plus size={14}/></button>
                      </div>
                      <textarea
                        ref={greetingRef}
                        name="greeting"
                        value={formData.greeting}
                        onChange={handleChange}
                        rows={6}
                        placeholder="Type your character's first opening message to the user... e.g. *smiles warmly* 'Welcome! How can I assist you today?'"
                        className="w-full bg-transparent p-4 text-sm text-white focus:outline-none resize-none placeholder:text-warm-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-400 mb-1">Example dialogs</label>
                    <p className="text-[10px] text-warm-500 mb-2">Provide example conversations to guide your character's responses.</p>
                    <textarea
                      name="exampleDialogues"
                      value={formData.exampleDialogues}
                      onChange={handleChange}
                      rows={6}
                      className="w-full bg-warm-800 border border-warm-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500 font-serif"
                    />
                  </div>

                  {/* Dialogue Style Guardrails & Suggested Companion Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-warm-400 mb-1">Dialogue Style Guardrails (Forbidden Clichés)</label>
                      <p className="text-[10px] text-warm-500 mb-2">Comma-separated phrases to ban (e.g. *a pang of*, *can I ask you something?*).</p>
                      <textarea
                        name="bannedWords"
                        value={formData.bannedWords}
                        onChange={handleChange}
                        rows={3}
                        placeholder="a pang of, can I ask you something?, chuckles softly"
                        className="w-full bg-warm-800 border border-warm-700 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-warm-400 mb-1">Recommended Companion Role / Persona</label>
                      <p className="text-[10px] text-warm-500 mb-2">Default persona role suggested to users when starting a chat (e.g. *Gotham Detective*, *Rival Sorcerer*).</p>
                      <input
                        type="text"
                        name="suggestedPersonaName"
                        value={formData.suggestedPersonaName}
                        onChange={handleChange}
                        placeholder="e.g. Apprentice Knight, Detective Companion"
                        className="w-full bg-warm-800 border border-warm-700 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Definition Tab Bottom Step Controls */}
                  <div className="pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-warm-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('architecture')}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-warm-800 hover:bg-warm-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-warm-700"
                    >
                      <Bot size={16} />
                      <span>Back: 16-Section Builder</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalPublish}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Sparkles size={16} />
                      <span>Publish Character</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      {/* FLOATING ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#130d1a]/95 backdrop-blur-sm border-t border-[#d8b56a]/20 px-4 sm:px-6 z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)', paddingTop: '12px' }}>
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-warm-500">
            <span className={`w-2 h-2 rounded-full ${saveStatus === 'offline' ? 'bg-amber-400' : saveStatus === 'protecting' ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <div>
              <span className="font-semibold text-warm-200">{saveStatus === 'protected' ? 'Changes protected on this device' : saveStatus === 'protecting' ? 'Protecting your changes…' : 'Stored on this device'}</span>
              {privateDraftSaved && <span className="ml-2 text-[#e0bf76]">· Private draft saved to CHIMERA</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={handleDiscardDraft}
            className="px-3 py-2 text-xs font-semibold text-warm-400 hover:text-red-400 transition-colors"
            title="Clear only this device's recovery copy"
          >
            Clear device copy
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={savingPrivateDraft}
            className="px-4 py-2 bg-[#2b2131] hover:bg-[#3a2a42] text-[#fff3d8] rounded-lg text-xs font-semibold border border-[#d8b56a]/35 transition-colors disabled:opacity-60"
          >
            {savingPrivateDraft ? 'Saving private draft…' : 'Save private draft'}
          </button>
          <button
            onClick={handleFinalPublish}
            className="bg-[#b98535] hover:bg-[#d3a650] text-[#160f1a] px-5 py-2 rounded-lg font-bold text-xs shadow-lg transition-all"
          >
            Bring them into CHIMERA
          </button>
          </div>
        </div>
      </div>

      {/* Publishing Pipeline Overlay Screen */}
      {publishPipeline.isActive && (
        <div className="fixed inset-0 z-[9999] bg-warm-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-warm-850 rounded-3xl border border-warm-750 shadow-2xl p-6 flex flex-col gap-6 text-center">
            
            {publishPipeline.step !== 'success' && publishPipeline.step !== 'failed' && (
              <div className="flex flex-col items-center gap-4">
                <RefreshCw size={36} className="text-red-500 animate-spin" />
                <h3 className="font-serif text-lg font-bold text-warm-50">Publishing Workspace</h3>
              </div>
            )}

            {publishPipeline.step === 'success' && (
              <div className="flex flex-col items-center gap-4 animate-scale-in">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <Check size={24} />
                </div>
                <h3 className="font-serif text-lg font-bold text-warm-50">✅ Published Successfully</h3>
                <p className="text-xs text-warm-500">Your character joins CHIMERA storytelling ecosystem.</p>
              </div>
            )}

            {publishPipeline.step === 'failed' && (
              <div className="flex flex-col items-center gap-4 animate-scale-in">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/20">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="font-serif text-lg font-bold text-warm-50">⚠️ Publishing Failed</h3>
                <p className="text-xs text-warm-500 leading-relaxed px-2">
                  {publishPipeline.error || 'Something went wrong while publishing. Your draft remains completely safe.'}
                </p>
                <div className="flex gap-2 w-full mt-2">
                  <button
                    onClick={handleFinalPublish}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setPublishPipeline({ isActive: false, step: 'saving' })}
                    className="flex-1 py-2.5 bg-warm-800 text-warm-300 rounded-xl text-xs font-semibold"
                  >
                    Save as Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Universal Character Card Importer Modal */}
      <UniversalCharacterImporterModal
        isOpen={showImporterModal}
        onClose={() => setShowImporterModal(false)}
        onImportSuccess={(data: any) => {
          const rating = data.content_rating === 'NSFW' ? 'NSFW' : 'SFW';
          setFormData(prev => ({
            ...prev,
            name: data.name || prev.name,
            shortDescription: data.tagline || prev.shortDescription,
            longDescription: data.description || prev.longDescription,
            personality: data.personality || prev.personality,
            greeting: data.first_mes || prev.greeting,
            scenario: data.scenario || prev.scenario,
            contentRating: rating,
            tagsString: data.badges ? data.badges.join(', ') : prev.tagsString,
          }));
          if (data.architectureData && Object.keys(data.architectureData).length > 0) {
            setArchData(data.architectureData);
          }
        }}
      />

    </div>
  );
}
