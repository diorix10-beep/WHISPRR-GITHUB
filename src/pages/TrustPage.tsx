import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, Heart, ExternalLink } from 'lucide-react';

export default function TrustPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-sm text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-100 transition-colors"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 mb-5">
            <Shield size={30} className="text-primary-500" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-warm-900 dark:text-warm-50 mb-4">
            Trust & Privacy Center
          </h1>
          <p className="text-warm-600 dark:text-warm-400 text-lg leading-relaxed max-w-lg mx-auto">
            WHISPRR is built on an unwavering foundation of trust and transparency. We believe you deserve complete clarity regarding how your personal data is managed and protected.
          </p>
        </div>

        {/* Our Commitments */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Heart size={18} className="text-primary-500" />
            <h2 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50">Our Unwavering Commitments</h2>
          </div>
          <div className="card space-y-4">
            <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
              At WHISPRR, our primary commitment is to safeguard your digital autonomy. We unequivocally guarantee that your personal information is never commodified, sold to advertisers, or distributed to data brokers under any circumstances. We recognize that private communication must remain fundamentally private; therefore, your direct messages and group chats are strictly confidential, actively shielded from internal review, and never utilized to train artificial intelligence models.
            </p>
            <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
              Furthermore, we operate on the principle that you inherently own the intellectual property you generate on our platform. Every whisper, interaction, and post remains your exclusive property, granting you the sovereign right to permanently delete your content and exercise your right to be forgotten at any given moment, without friction or interrogation. Finally, we pledge to communicate our policies in transparent, accessible language, entirely free of predatory legal jargon designed to obfuscate our actual practices.
            </p>
          </div>
        </section>

        {/* What We Collect */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Database size={18} className="text-primary-500" />
            <h2 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50">Information We Process</h2>
          </div>
          <div className="card space-y-4">
            <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
              To operate the WHISPRR platform efficiently, we process a strictly limited set of informational signals. When you establish an account, we securely encrypt your email address and password to facilitate secure authentication. Your profile metadata, encompassing your display name, chosen avatar, and biography, is processed explicitly to render your digital identity according to your exact specifications.
            </p>
            <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
              We also process the public content you actively disseminate, alongside essential usage metrics—such as your reactions and community follows—to construct a highly personalized, algorithmically tailored feed. For critical debugging and network security purposes, our infrastructure briefly parses non-identifying device telemetry, specifically your browser architecture and operating system context.
            </p>
          </div>
        </section>

        {/* What We Never Collect */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={18} className="text-primary-500" />
            <h2 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50">Data We Categorically Reject</h2>
          </div>
          <div className="card">
            <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
              We draw a definitive ethical line regarding data acquisition. We categorically refuse to intercept or parse your private messaging content for advertising telemetry. We deliberately abstain from requesting or tracking your geographic location, nor do we attempt to scrape your personal contacts or address books. Furthermore, WHISPRR strictly prohibits the collection of biometric identifiers, sensitive financial instrumentation, or profound health and medical classifications. We also actively reject the retention of any data concerning individuals under the age of thirteen, maintaining strict compliance with international child protection statutes.
            </p>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Eye size={18} className="text-primary-500" />
            <h2 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50">Your Digital Rights</h2>
          </div>
          <div className="card space-y-4">
            <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
              You are entitled to comprehensive oversight of your digital footprint on WHISPRR. You possess the unalienable right to request and receive a full, portable export of your historical platform data directly through your configuration settings. You are equally empowered to instantly correct, modify, or redact your profile information to ensure ultimate accuracy.
            </p>
            <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
              Should you decide to conclude your tenure on the platform, you hold the definitive right to initiate a total account erasure, which initiates an irreversible deletion sequence across our active databases. Moreover, we actively respect your right to cognitive autonomy by providing explicit toggles to disable all interest-based feed personalization algorithms.
            </p>
          </div>
        </section>

        {/* Data Deletion */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Trash2 size={18} className="text-primary-500" />
            <h2 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50">Data Deletion Protocols</h2>
          </div>
          <div className="card space-y-4">
            <p className="text-sm text-warm-700 dark:text-warm-300 leading-relaxed">
              When you execute a request to delete your account, WHISPRR initiates a comprehensive and permanent cryptographic purge of your digital presence. This systemic erasure encompasses your core profile architecture, all associated personal identification variables, your entire archive of private correspondence, and every public whisper, comment, or reaction you have submitted. Furthermore, we systematically dismantle your algorithmic interest scores, activity history, and network connection mapping.
            </p>
            <p className="text-xs text-warm-500 dark:text-warm-400">
              Please note that while your information is immediately severed from active production environments, encrypted fragments may persist within isolated disaster-recovery backups for a maximum rotational period of thirty days prior to ultimate disintegration.
            </p>
          </div>
        </section>

        {/* Contact & Settings links */}
        <div className="trust-callout text-center space-y-3">
          <p className="text-sm text-warm-700 dark:text-warm-300 font-medium">Questions about your privacy?</p>
          <p className="text-xs text-warm-500">
            Reach out to us — we write back as humans, not bots.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
            <button onClick={() => navigate('/settings')} className="btn-primary py-2 px-5 text-sm">
              Privacy Settings
            </button>
            <a href="mailto:privacy@whisprr.app" className="btn-secondary py-2 px-5 text-sm flex items-center justify-center gap-1.5">
              <ExternalLink size={14} />
              Contact Us
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-warm-400 mt-8">
          Last updated: June 2026 · WHISPRR V3
        </p>
      </div>
    </div>
  );
}
