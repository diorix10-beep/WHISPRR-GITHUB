import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Lock, Eye, Database, Trash2, Heart, ExternalLink, 
  FileText, Key, Clock, ShieldCheck, Download, Bot
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

type TopicId = 
  | 'commitments' 
  | 'terms' 
  | 'privacy' 
  | 'collection' 
  | 'never-collect' 
  | 'rights' 
  | 'export' 
  | 'delete' 
  | 'ai-transparency' 
  | 'security' 
  | 'retention';

interface Topic {
  id: TopicId;
  label: string;
  icon: any;
  title: string;
  description: string;
}

export default function TrustPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TopicId>('commitments');

  const topics: Topic[] = [
    { 
      id: 'commitments', 
      label: 'Trust Commitments', 
      icon: Heart,
      title: 'Our Unwavering Commitments',
      description: 'The core values guiding how we value and respect your digital space.'
    },
    { 
      id: 'terms', 
      label: 'Terms of Service', 
      icon: FileText,
      title: 'Terms of Service',
      description: 'Your rights and responsibilities when using the WHISPRR platform.'
    },
    { 
      id: 'privacy', 
      label: 'Privacy Policy', 
      icon: ShieldCheck,
      title: 'Privacy Policy',
      description: 'A detailed look at how we gather, process, and protect your data.'
    },
    { 
      id: 'collection', 
      label: 'Data Collection', 
      icon: Database,
      title: 'Information We Process',
      description: 'A transparent inventory of the fields and logs we collect to run the site.'
    },
    { 
      id: 'never-collect', 
      label: "Data We Don't Collect", 
      icon: Lock,
      title: 'Data We Categorically Reject',
      description: 'A strict list of variables, telemetry, and features we refuse to track.'
    },
    { 
      id: 'rights', 
      label: 'Your Rights', 
      icon: Eye,
      title: 'Your Digital Rights',
      description: 'Your entitlements under global data protection regulations.'
    },
    { 
      id: 'export', 
      label: 'Export My Data', 
      icon: Download,
      title: 'Request a Data Export',
      description: 'How to download a complete copy of your digital footprint.'
    },
    { 
      id: 'delete', 
      label: 'Delete My Account', 
      icon: Trash2,
      title: 'Account Deletion Protocols',
      description: 'What happens to your personal records when you request deletion.'
    },
    { 
      id: 'ai-transparency', 
      label: 'AI Transparency', 
      icon: Bot,
      title: 'AI Usage & NEXA Safety',
      description: 'How artificial intelligence models and Gemini APIs process information.'
    },
    { 
      id: 'security', 
      label: 'Security Practices', 
      icon: Key,
      title: 'System Security Measures',
      description: 'Technological shields we construct to prevent leaks and breaches.'
    },
    { 
      id: 'retention', 
      label: 'Data Retention', 
      icon: Clock,
      title: 'Data Retention Policies',
      description: 'How long logs and account history remain active on our servers.'
    }
  ];

  const handleTriggerExport = () => {
    showToast('Data export request received. We will email you within 30 days.', 'success');
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'commitments':
        return (
          <div className="space-y-4">
            <p>
              At WHISPRR, our primary commitment is to safeguard your digital autonomy. We unequivocally guarantee that your personal information is never commodified, sold to advertisers, or distributed to data brokers under any circumstances. We recognize that private communication must remain fundamentally private; therefore, your direct messages and group chats are strictly confidential, actively shielded from internal review, and never utilized to train artificial intelligence models.
            </p>
            <p>
              Furthermore, we operate on the principle that you inherently own the intellectual property you generate on our platform. Every whisper, interaction, and post remains your exclusive property, granting you the sovereign right to permanently delete your content and exercise your right to be forgotten at any given moment, without friction or interrogation. Finally, we pledge to communicate our policies in transparent, accessible language, entirely free of predatory legal jargon designed to obfuscate our actual practices.
            </p>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-6 prose dark:prose-invert max-w-none text-xs leading-relaxed text-warm-700 dark:text-warm-300">
            <div>
              <h4 className="font-bold text-warm-900 dark:text-warm-100 text-sm mb-1">1. Acceptance of Terms</h4>
              <p>By using the WHISPRR platform ("the Service"), you agree to be bound by these Terms of Service. This agreement constitutes a legally binding contract. If you do not accept these terms, you must discontinue access immediately.</p>
            </div>
            <div>
              <h4 className="font-bold text-warm-900 dark:text-warm-100 text-sm mb-1">2. Eligibility</h4>
              <p>The Service is intended solely for users who are at least eighteen (18) years of age. By accessing or utilizing the Service, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into this agreement. Users under the age of 18 are not permitted to create an account or use the Service.</p>
            </div>
            <div>
              <h4 className="font-bold text-warm-900 dark:text-warm-100 text-sm mb-1">3. Account Responsibilities</h4>
              <p>You assume full responsibility for maintaining the absolute confidentiality of your credentials. You agree to accept responsibility for all actions occurring under your account.</p>
            </div>
            <div>
              <h4 className="font-bold text-warm-900 dark:text-warm-100 text-sm mb-1">4. Acceptable Use Policy</h4>
              <p>You explicitly agree not to distribute illegal, harmful, threatening, abusive, harassing, defamatory, or objectionable content. Any engagement in bullying or hate speech will result in immediate suspension.</p>
            </div>
            <div>
              <h4 className="font-bold text-warm-900 dark:text-warm-100 text-sm mb-1">5. Content Ownership</h4>
              <p>You retain all ownership rights to the content you submit. By uploading content, you grant WHISPRR a non-exclusive, worldwide, royalty-free, transferable license to display and perform it solely in connection with the Service.</p>
            </div>
            <div>
              <h4 className="font-bold text-warm-900 dark:text-warm-100 text-sm mb-1">6. Content Moderation</h4>
              <p>WHISPRR maintains the discretionary right to refuse, remove, or modify any content that violates these Terms of Service or our community guidelines.</p>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-6 prose dark:prose-invert max-w-none text-xs leading-relaxed text-warm-700 dark:text-warm-300">
            <div>
              <h4 className="font-bold text-warm-900 dark:text-warm-100 text-sm mb-1">1. Introduction</h4>
              <p>WHISPRR operates the whisprr.xyz platform. This Privacy Policy comprehensively details the scope of our data practices, including how we systematically collect, process, utilize, disclose, and safeguard your personal information.</p>
            </div>
            <div>
              <h4 className="font-bold text-warm-900 dark:text-warm-100 text-sm mb-1">2. How We Use Your Information</h4>
              <p>The information we collect is strictly utilized to facilitate, enhance, and secure the WHISPRR platform. We rely on interaction patterns to algorithmically personalize recommendations. We do not sell data to advertisers.</p>
            </div>
            <div>
              <h4 className="font-bold text-warm-900 dark:text-warm-100 text-sm mb-1">3. Data Security Measures</h4>
              <p>We prioritize the structural integrity and security of your personal data by implementing sophisticated technical and organizational safeguards. These measures protect your information against unauthorized access, loss, or alteration.</p>
            </div>
            <div>
              <h4 className="font-bold text-warm-900 dark:text-warm-100 text-sm mb-1">4. Modifications to This Policy</h4>
              <p>We retain the right to modify this document at our discretion. Whenever substantive changes are implemented, we will proactively notify our user base by updating the comprehensive text on this page.</p>
            </div>
          </div>
        );
      case 'collection':
        return (
          <div className="space-y-4">
            <p>
              To operate the WHISPRR platform efficiently, we process a strictly limited set of informational signals:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Credentials:</strong> We securely encrypt your email address and password to facilitate secure authentication.</li>
              <li><strong>Profile Metadata:</strong> Your display name, chosen avatar emoji, and biography are processed explicitly to render your digital identity.</li>
              <li><strong>Platform Interactions:</strong> Public content, reactions, community follows, and whispers you actively publish are processed to construct your feed.</li>
              <li><strong>Diagnostic Telemetry:</strong> Non-identifying technical metadata (browser type, operating system) is briefly parsed for debugging and service stability.</li>
            </ul>
          </div>
        );
      case 'never-collect':
        return (
          <div className="space-y-4">
            <p>
              We draw a definitive ethical line regarding data acquisition. We categorically refuse to collect, store, or track the following:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Message Telemetry:</strong> We never scrape, scan, or analyze your private chat messages for advertising or profiling.</li>
              <li><strong>Location Data:</strong> We deliberately abstain from requesting or tracking your geographic location or GPS signals.</li>
              <li><strong>Contact Lists:</strong> We never attempt to scrape your personal address book or personal contact records.</li>
              <li><strong>Biometric Data:</strong> WHISPRR strictly prohibits the capture of biometric markers or health classifications.</li>
              <li><strong>Children's Privacy:</strong> We actively reject the retention of any data concerning individuals under eighteen, maintaining strict compliance with applicable privacy laws.</li>
            </ul>
          </div>
        );
      case 'rights':
        return (
          <div className="space-y-4">
            <p>
              You are entitled to comprehensive control of your digital footprint on WHISPRR. Under global data protection regulations, you possess:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Right to Access:</strong> The right to request and receive a full, portable export of your historical platform data.</li>
              <li><strong>Right to Rectification:</strong> The right to instantly correct, modify, or redact your profile details through settings.</li>
              <li><strong>Right to Erasure:</strong> The right to request permanent deletion of your account and all associated personal identifiers.</li>
              <li><strong>Cognitive Autonomy:</strong> Access to toggles that allow disabling all interest-based feed personalization algorithms.</li>
            </ul>
          </div>
        );
      case 'export':
        return (
          <div className="space-y-4">
            <p>
              You are entitled to a full copy of all data generated during your time on WHISPRR. This export file contains your profile metadata, whispers history, comments, and reaction statistics in a machine-readable JSON format.
            </p>
            <div className="p-4 bg-warm-100 dark:bg-warm-800 rounded-xl space-y-3">
              {user ? (
                <>
                  <p className="text-xs text-warm-700 dark:text-warm-300 font-semibold">
                    You are currently signed in as <strong>{user.email}</strong>.
                  </p>
                  <button
                    onClick={handleTriggerExport}
                    className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2"
                  >
                    <Download size={14} />
                    Request Instant Data Export
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-warm-600 dark:text-warm-400">
                    To request a data export, please sign in to your account and navigate to Settings → Trust & Privacy, or contact our support team.
                  </p>
                  <button
                    onClick={() => navigate('/auth')}
                    className="btn-secondary py-2 px-4 text-xs font-semibold"
                  >
                    Sign In to Export
                  </button>
                </>
              )}
            </div>
          </div>
        );
      case 'delete':
        return (
          <div className="space-y-4">
            <p>
              When you execute a request to delete your account, WHISPRR initiates a permanent cryptographic purge of your digital presence. This systemic erasure encompasses:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Core profile architecture and authentication logs.</li>
              <li>All associated personal identification variables.</li>
              <li>Your entire archive of private correspondence.</li>
              <li>Every public whisper, comment, or reaction you have submitted.</li>
              <li>Systematic removal of algorithmic interest scores.</li>
            </ul>
            <p className="text-xs text-warm-500 mt-2">
              Account deletion can be triggered under settings in the Danger Zone. Once initiated, data is immediately severed from production, with disaster-recovery backup rotation cleared within a maximum of 30 days.
            </p>
          </div>
        );
      case 'ai-transparency':
        return (
          <div className="space-y-4">
            <p>
              WHISPRR operates with complete AI integrity. Artificial intelligence models, including NEXA (our conversational character framework), are designed to respect privacy boundary layers:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>No Training on Chats:</strong> We categorically guarantee that direct messages, group chats, and private conversations are never utilized to train AI models.</li>
              <li><strong>Gemini API Boundaries:</strong> NEXA's conversational components operate through secure, private API endpoints. Your inputs are parsed to generate responses but are never stored by provider networks for model fine-tuning.</li>
              <li><strong>Explicit Contexts:</strong> AI characters only receive context you explicitly share in active chat sessions. They have no passive surveillance access to your profile data.</li>
            </ul>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-4">
            <p>
              We implement industry-standard technology solutions to keep your profile secure:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Transport Layer Security:</strong> All traffic on WHISPRR is strictly encrypted in transit using Secure Sockets Layer (HTTPS).</li>
              <li><strong>Cryptographic Password Hashing:</strong> Credentials are hashed using advanced hashing algorithms before storage, ensuring passwords can never be read in plain text.</li>
              <li><strong>Supabase Security Policy:</strong> Databases are shielded with Row-Level Security (RLS) policies, preventing unauthorized database reads and writes.</li>
            </ul>
          </div>
        );
      case 'retention':
        return (
          <div className="space-y-4">
            <p>
              Our data retention guidelines ensure we only retain information for as long as it is actively needed:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Active Accounts:</strong> We retain account data as long as your profile remains active.</li>
              <li><strong>Inactive Account Expirations:</strong> Accounts inactive for over 2 years will be queued for automated removal notification.</li>
              <li><strong>Backup Protocols:</strong> Encrypted disaster backups hold data segments for a maximum rotational period of 30 days.</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-sm text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-100 transition-colors font-semibold"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 mb-4">
            <Shield size={30} className="text-primary-500" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 dark:text-warm-50 mb-3">
            Trust & Privacy Center
          </h1>
          <p className="text-warm-600 dark:text-warm-400 text-sm leading-relaxed max-w-xl mx-auto">
            WHISPRR is built on transparency and digital safety. Access our terms, privacy policies, data rights, and commitments from one single hub.
          </p>
        </div>

        {/* 11 Topics layout */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left panel: topic selector */}
          <div className="col-span-12 md:col-span-4 space-y-2 bg-white dark:bg-warm-850 p-4 rounded-2xl border border-warm-100 dark:border-warm-700/80">
            <span className="text-[10px] font-bold text-warm-500 uppercase tracking-wider block px-2 mb-2">
              Center Directory
            </span>
            <div className="space-y-1">
              {topics.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold'
                        : 'text-warm-750 dark:text-warm-350 hover:bg-warm-50 dark:hover:bg-warm-800'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-primary-500' : 'text-warm-400'} />
                    <span className="text-xs truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: topic viewer */}
          <div className="col-span-12 md:col-span-8 bg-white dark:bg-warm-850 p-6 rounded-2xl border border-warm-100 dark:border-warm-700/80 min-h-[420px]">
            {(() => {
              const activeTopic = topics.find(t => t.id === activeTab)!;
              return (
                <div className="space-y-4">
                  <div className="border-b border-warm-100 dark:border-warm-800/80 pb-4">
                    <h2 className="font-serif text-2xl font-bold text-warm-900 dark:text-warm-50">
                      {activeTopic.title}
                    </h2>
                    <p className="text-xs text-warm-500 mt-1">
                      {activeTopic.description}
                    </p>
                  </div>
                  <div className="text-sm text-warm-700 dark:text-warm-300 leading-relaxed space-y-4 pt-2">
                    {renderActiveContent()}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer info */}
        <div className="trust-callout mt-12 text-center space-y-3 p-6 bg-warm-100/50 dark:bg-warm-850 rounded-2xl border border-warm-200/40 dark:border-warm-800/40">
          <p className="text-sm text-warm-700 dark:text-warm-300 font-semibold">Questions about your privacy?</p>
          <p className="text-xs text-warm-500">
            Reach out to our privacy and operations team directly. We respond as humans, not algorithms.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
            <a href="mailto:privacy@whisprr.xyz" className="btn-secondary py-2 px-5 text-sm flex items-center justify-center gap-1.5">
              <ExternalLink size={14} />
              Contact Privacy Team
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-warm-400 mt-8">
          Last updated: July 2026 · WHISPRR Trust & Security v3.5
        </p>
      </div>
    </div>
  );
}
