import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="page-container pb-32 sm:pb-24 px-4 sm:px-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-warm-600 dark:text-warm-400 hover:text-primary-500 mb-6"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="font-serif text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-warm-500 dark:text-warm-400 mb-8">
        Last updated: June 15, 2026
      </p>

      <div className="prose prose-warm dark:prose-invert max-w-none space-y-6 text-warm-700 dark:text-warm-300">
        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">1. Introduction</h2>
          <p className="leading-relaxed">
            WHISPRR ("we", "our", or "us") operates the whisprr.xyz platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">2. Information We Collect</h2>
          <p className="leading-relaxed mb-3">We collect information you provide directly:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Account information (email address, password)</li>
            <li>Profile information (display name, username, bio, avatar, interests, mood)</li>
            <li>Content you create (whispers, comments, reactions, messages)</li>
            <li>Community participation data</li>
          </ul>
          <p className="leading-relaxed mt-3">We automatically collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Device and browser information</li>
            <li>Usage data and interaction patterns</li>
            <li>Log data (IP address, access times)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and maintain our service</li>
            <li>To personalize your experience and content recommendations</li>
            <li>To facilitate connections between users</li>
            <li>To send notifications you have opted into</li>
            <li>To detect and prevent fraud or abuse</li>
            <li>To improve and develop new features</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">4. Information Sharing</h2>
          <p className="leading-relaxed">
            We do not sell your personal information. We may share information with:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Other users (based on your privacy settings)</li>
            <li>Service providers who assist in operating our platform</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">5. Data Security</h2>
          <p className="leading-relaxed">
            We implement appropriate technical and organizational measures to protect your personal data. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">6. Your Rights</h2>
          <p className="leading-relaxed">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Export your data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">7. Data Retention</h2>
          <p className="leading-relaxed">
            We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and data at any time by contacting support.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">8. Children's Privacy</h2>
          <p className="leading-relaxed">
            Our service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">9. Changes to This Policy</h2>
          <p className="leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">10. Contact Us</h2>
          <p className="leading-relaxed">
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:help@whisprr.xyz" className="text-primary-500 hover:underline">
              help@whisprr.xyz
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
