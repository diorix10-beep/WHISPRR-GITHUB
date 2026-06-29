import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, Heart, ExternalLink } from 'lucide-react';

const commitments = [
  { icon: '🚫', title: 'We never sell your data', desc: 'Your personal information is never sold to advertisers, data brokers, or any third party. Period.' },
  { icon: '🔒', title: 'Private messages stay private', desc: 'Your direct messages and group chats are never read by us, never used to train AI models, and never shared.' },
  { icon: '✍️', title: 'You own what you create', desc: 'Every whisper, reply, and post you write belongs to you. You can delete your content at any time.' },
  { icon: '🗑️', title: 'The right to be forgotten', desc: 'You can permanently delete your account and all associated personal data at any time, no questions asked.' },
  { icon: '📖', title: 'Plain language, always', desc: 'Our privacy policies are written in plain, human-readable English — no legal jargon designed to confuse.' },
];

const collected = [
  { label: 'Account info', detail: 'Email and password (encrypted) so you can sign in.' },
  { label: 'Profile info', detail: 'Display name, username, avatar, bio — what you choose to share.' },
  { label: 'Your content', detail: 'Whispers, comments, and replies you post publicly.' },
  { label: 'Usage signals', detail: 'Interactions (reactions, follows) used to personalize your feed.' },
  { label: 'Device info', detail: 'Browser type and OS for debugging and security purposes only.' },
];

const neverCollected = [
  'Your private message content for advertising',
  'Location data (we never ask for it)',
  'Contacts or address book',
  'Biometric data',
  'Financial information',
  'Data about children under 13',
  'Sensitive health or medical data',
];

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
            WHISPRR is built on trust. Here is everything you need to know about how we handle your data — in plain language.
          </p>
        </div>

        {/* Our Commitments */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Heart size={18} className="text-primary-500" />
            <h2 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50">Our Commitments</h2>
          </div>
          <div className="space-y-3">
            {commitments.map(c => (
              <div key={c.title} className="card flex items-start gap-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{c.icon}</span>
                <div>
                  <h3 className="font-semibold text-warm-900 dark:text-warm-50 text-sm mb-1">{c.title}</h3>
                  <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What We Collect */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Database size={18} className="text-primary-500" />
            <h2 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50">What We Collect & Why</h2>
          </div>
          <div className="card divide-y divide-warm-100 dark:divide-warm-700">
            {collected.map(item => (
              <div key={item.label} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-warm-900 dark:text-warm-50 mb-0.5">{item.label}</p>
                <p className="text-sm text-warm-500 dark:text-warm-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What We Never Collect */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={18} className="text-primary-500" />
            <h2 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50">What We Never Collect</h2>
          </div>
          <div className="card">
            <ul className="space-y-2">
              {neverCollected.map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-warm-700 dark:text-warm-300">
                  <span className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-success-600 dark:text-success-400 text-xs font-bold">✓</span>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Eye size={18} className="text-primary-500" />
            <h2 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50">Your Rights</h2>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Access your data', desc: 'You can request a full export of your data at any time from your Settings.' },
              { title: 'Correct your information', desc: 'Update your profile, bio, and preferences in your Settings at any time.' },
              { title: 'Delete your account', desc: 'Permanently delete your account and all associated data. This is irreversible and takes effect within 30 days.' },
              { title: 'Opt out of personalization', desc: 'Turn off interest-based feed personalization in your Settings.' },
            ].map(r => (
              <div key={r.title} className="card">
                <h3 className="font-semibold text-warm-900 dark:text-warm-50 text-sm mb-1">{r.title}</h3>
                <p className="text-sm text-warm-600 dark:text-warm-400">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Deletion */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Trash2 size={18} className="text-primary-500" />
            <h2 className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50">Data Deletion</h2>
          </div>
          <div className="card">
            <p className="text-sm text-warm-700 dark:text-warm-300 leading-relaxed mb-4">
              When you delete your account, we permanently remove:
            </p>
            <ul className="space-y-1.5 mb-4">
              {['Your profile and personal information', 'Your private messages', 'Your posted content (whispers, comments)', 'Your interest scores and activity history', 'Your follows and connections'].map(item => (
                <li key={item} className="text-sm text-warm-600 dark:text-warm-400 flex items-center gap-2">
                  <span className="text-primary-400">→</span> {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-warm-400 dark:text-warm-500">
              Some data may be retained for up to 30 days in backups before permanent removal.
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
