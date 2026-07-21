import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Bot, Check, RefreshCw, 
  Settings, AlertTriangle, User, FileText, UploadCloud, Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { StructuredArchitectureForm } from '../components/character/StructuredArchitectureForm';
import { compileCharacterSystemPrompt, type CharacterArchitecture } from '../lib/promptCompiler';

export default function AiCharacterCreator() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'general' | 'architecture' | 'definition'>('general');
  const [loading, setLoading] = useState(false);

  // Sync / Network States
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
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
    conversationStyle: 'Warm, conversational, structured.',
    rpDefinition: '',
    systemDefinition: '',
    systemCharacterDefinition: '',
    knowledge: '',
    creatorNotes: '',
    exampleConversations: '',
    tagsString: ''
  });

  const [archData, setArchData] = useState<CharacterArchitecture>({});

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
          JSON.stringify({ formData })
        );
        setTimeout(() => {
          setSaveStatus('saved');
        }, 800);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [formData, isOnline]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getFriendlyErrorMessage = (errorMsg: string) => {
    const lower = errorMsg.toLowerCase();
    if (lower.includes('check constraint') || lower.includes('profiles_role_check')) {
      return "We couldn't publish your character right now due to a profile formatting restriction. Please check that your details are valid.";
    }
    if (lower.includes('unique constraint') || lower.includes('username already taken')) {
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
            p_banner_url: formData.avatarUrl.trim() || '',
            p_content_rating: formData.contentRating,
            p_creator_notes: formData.creatorNotes.trim(),
            p_example_conversations: formData.exampleConversations.trim(),
            p_rp_definition: formData.rpDefinition.trim(),
            p_system_definition: formData.systemDefinition.trim(),
            p_system_character_definition: formData.systemCharacterDefinition.trim()
          });

          if (error) throw error;

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

  return (
    <div className="min-h-screen bg-warm-900 flex text-warm-100 font-sans">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-warm-800 bg-warm-900 hidden md:flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-warm-800">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-warm-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            My Characters
          </button>
        </div>
        
        <div className="p-4">
          <h2 className="font-serif text-xl font-bold text-white mb-6">New Character</h2>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'general' 
                  ? 'bg-warm-800 text-white' 
                  : 'text-warm-400 hover:bg-warm-800/50 hover:text-white'
              }`}
            >
              <User size={16} />
              General
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'architecture' 
                  ? 'bg-warm-800 text-white' 
                  : 'text-warm-400 hover:bg-warm-800/50 hover:text-white'
              }`}
            >
              <Bot size={16} />
              16-Section Architecture
            </button>
            <button
              onClick={() => setActiveTab('definition')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'definition' 
                  ? 'bg-warm-800 text-white' 
                  : 'text-warm-400 hover:bg-warm-800/50 hover:text-white'
              }`}
            >
              <FileText size={16} />
              Raw Definition
            </button>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-warm-900 pb-24 relative">
        <div className="max-w-4xl mx-auto p-6 sm:p-10">
          
          {/* Top Mobile Header */}
          <div className="md:hidden flex items-center mb-8 gap-4 border-b border-warm-800 pb-4">
            <button onClick={() => navigate('/')} className="text-warm-400"><ArrowLeft size={20} /></button>
            <h1 className="font-serif text-xl font-bold text-white">New Character</h1>
          </div>

          {/* Form Content */}
          <div className="space-y-8">
            {activeTab === 'general' ? (
              <>
                <h3 className="text-xl font-serif font-bold text-white mb-2">Create a character</h3>
                <p className="text-sm text-warm-400 mb-8 border-b border-warm-800 pb-6">
                  Set up how your character looks, speaks, and behaves in chat.
                </p>

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
                            {formData.contentRating === 'Limitless' ? 'Limitless' : 'Limited'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Image Upload */}
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-warm-400 mb-2 uppercase tracking-wide">Image *</label>
                    <div className="w-full h-48 border-2 border-dashed border-warm-700 rounded-2xl bg-warm-800/50 flex flex-col items-center justify-center p-6 text-center hover:border-warm-500 transition-colors cursor-pointer group">
                      <UploadCloud size={32} className="text-warm-500 mb-3 group-hover:text-warm-300 transition-colors" />
                      <p className="text-sm font-semibold text-warm-300">Drag & drop an image here, or click to select</p>
                      <p className="text-xs text-warm-500 mt-2">Or enter an image URL below</p>
                    </div>
                    <input
                      type="text"
                      name="avatarUrl"
                      value={formData.avatarUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/image.png"
                      className="w-full bg-warm-800 border border-warm-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500 mt-3"
                    />
                    <ul className="text-[10px] text-warm-400 mt-3 space-y-1 list-disc list-inside">
                      <li>Select an image as bot avatar, or you can import a Tavern PNG file.</li>
                      <li>Please make sure your image/character does not violate our guidelines.</li>
                      <li>Important: updating the image on a public character can take up to 30 seconds to verify.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-warm-400 mb-2">Title *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="A unique title for your character"
                      className="w-full bg-warm-800 border border-warm-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-400 mb-2">Chat name</label>
                    <input
                      type="text"
                      placeholder="Optional nickname shown in chats instead of the character's name"
                      className="w-full bg-warm-800 border border-warm-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-400 mb-2">Bio *</label>
                    {/* Simulated Rich Text Editor toolbar for visual matching */}
                    <div className="border border-warm-700 rounded-xl overflow-hidden bg-warm-800 focus-within:border-red-500 transition-colors">
                      <div className="bg-warm-850 px-3 py-2 border-b border-warm-700 flex flex-wrap gap-2 text-warm-400 text-xs">
                        <button className="px-2 py-1 hover:bg-warm-700 rounded font-bold">Paragraph ▾</button>
                        <button className="px-2 py-1 hover:bg-warm-700 rounded font-bold">B</button>
                        <button className="px-2 py-1 hover:bg-warm-700 rounded italic">I</button>
                        <button className="px-2 py-1 hover:bg-warm-700 rounded underline">U</button>
                        <span className="w-px h-4 bg-warm-700 my-auto mx-1"></span>
                        <button className="px-2 py-1 hover:bg-warm-700 rounded text-sm">≡</button>
                        <button className="px-2 py-1 hover:bg-warm-700 rounded text-sm">🔗</button>
                      </div>
                      <textarea
                        name="shortDescription"
                        value={formData.shortDescription}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Start writing..."
                        className="w-full bg-transparent p-4 text-sm text-white focus:outline-none resize-none"
                      />
                    </div>
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
                          value="Limitless"
                          checked={formData.contentRating === 'Limitless'}
                          onChange={() => setFormData(prev => ({...prev, contentRating: 'Limitless'}))}
                          className="w-4 h-4 text-red-500 bg-warm-800 border-warm-700 focus:ring-red-500 focus:ring-offset-warm-900"
                        />
                        <span className="text-sm font-bold text-warm-100 group-hover:text-white transition-colors">Limitless</span>
                      </label>
                    </div>
                    <ul className="text-[10px] text-warm-400 space-y-1 list-disc list-inside bg-warm-800/30 p-4 rounded-xl border border-warm-800">
                      <li><strong>Minor characters (under 18 years old) are not allowed regardless of tag.</strong></li>
                      <li>Themes of rape and sexual violence are treated as consensual non-consent, with clear content warnings required.</li>
                      <li>Bots requiring a 'Limitless' tag include those with detailing in coding related to sexual mannerisms or explicit dialogue.</li>
                      <li>Please ensure your bot adheres to these guidelines to maintain a safe and respectful environment.</li>
                    </ul>
                  </div>

                </div>
              </>
            ) : activeTab === 'architecture' ? (
              <>
                <div className="flex items-center justify-between mb-4 border-b border-warm-800 pb-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-white">16-Section Persona Architecture</h3>
                    <p className="text-xs text-warm-400 mt-1">
                      Fill out dedicated sections to build a bullet-proof, consistent AI character. CHIMERA will automatically compile this into an optimal system prompt.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const compiled = compileCharacterSystemPrompt(archData);
                      setFormData(prev => ({ ...prev, personality: compiled }));
                      showToast('Compiled 16-section architecture into System Prompt!', 'success');
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles size={14} />
                    Compile to System Prompt
                  </button>
                </div>

                <StructuredArchitectureForm
                  value={archData}
                  onChange={(updated) => {
                    setArchData(updated);
                    // Automatically compile and sync personality field
                    const compiled = compileCharacterSystemPrompt(updated);
                    setFormData(prev => ({
                      ...prev,
                      name: updated.name || prev.name,
                      personality: compiled
                    }));
                  }}
                />
              </>
            ) : (
              <>
                <h3 className="text-xl font-serif font-bold text-white mb-2">Definition</h3>
                <p className="text-sm text-warm-400 mb-8 border-b border-warm-800 pb-6">
                  The heart of your character — how they speak, behave, and what they know.
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
                    <label className="block text-xs font-bold text-warm-400 mb-1">Initial messages (first messages) *</label>
                    <p className="text-[10px] text-warm-500 mb-2">First message from your character. Provide a lengthy first message to encourage the character to give longer responses.</p>
                    <div className="bg-warm-800/50 border border-warm-700 rounded-xl overflow-hidden">
                      <div className="flex bg-warm-800 border-b border-warm-700">
                        <button className="px-4 py-2 text-xs font-bold text-white border-b-2 border-red-500 bg-warm-700/50">Write</button>
                        <button className="px-4 py-2 text-xs font-bold text-warm-400 hover:text-white transition-colors">Preview</button>
                      </div>
                      <div className="p-3 bg-warm-850 flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-bold bg-warm-700 rounded-lg text-white">Message 1</button>
                        <button className="px-3 py-1.5 text-xs font-bold bg-warm-800 border border-warm-700 rounded-lg text-warm-400 hover:text-white"><Plus size={14}/></button>
                      </div>
                      <textarea
                        name="greeting"
                        value={formData.greeting}
                        onChange={handleChange}
                        rows={6}
                        className="w-full bg-transparent p-4 text-sm text-white focus:outline-none resize-none"
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
                      rows={8}
                      className="w-full bg-warm-800 border border-warm-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      {/* FLOATING ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-warm-900 border-t border-warm-800 p-4 px-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-4 text-xs text-warm-500">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${saveStatus === 'offline' ? 'bg-red-500' : saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Offline'}
          </span>
        </div>
        <button
          onClick={handleFinalPublish}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg transition-all"
        >
          Create a Character
        </button>
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
                    className="flex-1 py-2.5 bg-warm-800 text-warm-305 rounded-xl text-xs font-semibold"
                  >
                    Save as Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
