import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p className="text-sm text-warm-500 dark:text-warm-400 mb-8">
        Last updated: June 15, 2026
      </p>

      <div className="prose prose-warm dark:prose-invert max-w-none space-y-6 text-warm-700 dark:text-warm-300">
        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By accessing or using WHISPRR ("the Service"), available at whisprr.xyz, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">2. Eligibility</h2>
          <p className="leading-relaxed">
            You must be at least 13 years of age to use this Service. By using the Service, you represent and warrant that you meet this requirement. Users between 13 and 18 must have parental or guardian consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">3. Account Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You are responsible for all activity that occurs under your account</li>
            <li>You must provide accurate and complete information during registration</li>
            <li>You must not create accounts for others without their permission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">4. Acceptable Use</h2>
          <p className="leading-relaxed mb-3">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Post content that is illegal, harmful, threatening, abusive, or harassing</li>
            <li>Impersonate any person or entity</li>
            <li>Spam, advertise, or solicit without authorization</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Upload malware or malicious code</li>
            <li>Collect user data without consent</li>
            <li>Engage in bullying, hate speech, or discrimination</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">5. Content Ownership</h2>
          <p className="leading-relaxed">
            You retain ownership of content you create on the Service. By posting content, you grant WHISPRR a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">6. Content Moderation</h2>
          <p className="leading-relaxed">
            We reserve the right to remove content that violates these terms or our community guidelines. We may suspend or terminate accounts that repeatedly violate our policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">7. Privacy</h2>
          <p className="leading-relaxed">
            Your use of the Service is also governed by our{' '}
            <a href="/privacy" className="text-primary-500 hover:underline">Privacy Policy</a>,
            which describes how we collect, use, and protect your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">8. Termination</h2>
          <p className="leading-relaxed">
            We may terminate or suspend your account at any time for violations of these Terms. You may also delete your account at any time. Upon termination, your right to use the Service will immediately cease.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">9. Disclaimers</h2>
          <p className="leading-relaxed">
            The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free. We are not responsible for user-generated content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">10. Limitation of Liability</h2>
          <p className="leading-relaxed">
            To the maximum extent permitted by law, WHISPRR shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">11. Changes to Terms</h2>
          <p className="leading-relaxed">
            We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">12. Contact</h2>
          <p className="leading-relaxed">
            For questions about these Terms, please contact us at{' '}
            <a href="mailto:help@whisprr.xyz" className="text-primary-500 hover:underline">
              help@whisprr.xyz
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
