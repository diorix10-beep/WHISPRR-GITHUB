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
            By accessing, browsing, or otherwise using the WHISPRR platform ("the Service"), available at whisprr.xyz, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. This agreement constitutes a legally binding contract between you and WHISPRR. If you do not accept these terms in their entirety, you are strictly prohibited from using the Service and must discontinue access immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">2. Eligibility</h2>
          <p className="leading-relaxed">
            The Service is intended solely for users who are at least eighteen (18) years of age. By creating an account or accessing the Service, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into this agreement.
          </p>
          <p className="leading-relaxed mt-4">
            Users under the age of 18 are not permitted to create an account or use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">3. Account Responsibilities</h2>
          <p className="leading-relaxed">
            Upon registering for an account on the Service, you assume full responsibility for maintaining the absolute confidentiality of your account credentials, including your password. You agree to accept responsibility for all activities and actions that occur under your account, whether authorized by you or not. You are obligated to provide accurate, current, and complete information during the registration process. Furthermore, the creation of accounts on behalf of other individuals or entities without explicit, documented authorization is strictly prohibited and constitutes grounds for immediate account termination.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">4. Acceptable Use Policy</h2>
          <p className="leading-relaxed">
            Your privilege to use the Service is contingent upon your adherence to our acceptable use standards. You explicitly agree that you will not post, transmit, or distribute any content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable. Impersonation of any person or entity, as well as the dissemination of unsolicited promotional material or spam, is strictly forbidden. You further agree not to interfere with the proper functioning of the Service, circumvent our security measures, distribute malicious software, or harvest user data without explicit consent. Any engagement in bullying, hate speech, or targeted harassment will result in immediate suspension.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">5. Content Ownership</h2>
          <p className="leading-relaxed">
            WHISPRR respects your intellectual property rights. You retain all ownership rights to the original content you submit, post, or display on the Service. However, by uploading content to the platform, you grant WHISPRR a non-exclusive, worldwide, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform that content solely in connection with the provision and operation of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">6. Content Moderation</h2>
          <p className="leading-relaxed">
            WHISPRR maintains the absolute right, though not the obligation, to monitor, review, and moderate all content submitted to the Service. We reserve the discretionary right to refuse, remove, or modify any content that we determine, in our sole judgment, violates these Terms of Service or our overarching community guidelines. Users who repeatedly violate our content policies may face temporary suspension or permanent termination of their account access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">7. Privacy and Data Handling</h2>
          <p className="leading-relaxed">
            Your use of the Service is fundamentally linked to our data practices. We urge you to review our comprehensive <a href="/privacy" className="text-primary-500 hover:underline">Privacy Policy</a>, which details our precise methodologies for collecting, utilizing, and safeguarding your personal information. By using the Service, you consent to the data practices outlined in that policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">8. Termination of Service</h2>
          <p className="leading-relaxed">
            WHISPRR reserves the right to terminate or suspend your access to all or part of the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms of Service. Conversely, you retain the right to terminate this agreement at any time by permanently deleting your account and discontinuing all use of the Service. Upon termination, all provisions of the Terms which by their nature should survive termination shall survive.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">9. Disclaimers</h2>
          <p className="leading-relaxed">
            The Service and all included content are provided on an "as is" and "as available" basis without any warranties, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. WHISPRR does not warrant that the Service will function uninterrupted, be completely secure, or be free of errors or defects. Furthermore, we assume no liability or responsibility for any user-generated content hosted on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">10. Limitation of Liability</h2>
          <p className="leading-relaxed">
            To the maximum extent permitted by applicable law, in no event shall WHISPRR, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages. This includes, without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service, regardless of legal theory.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">11. Modifications to Terms</h2>
          <p className="leading-relaxed">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. When substantial changes are made, we will make reasonable efforts to provide adequate notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you explicitly agree to be bound by the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">12. Contact Information</h2>
          <p className="leading-relaxed">
            Should you have any questions, concerns, or legal inquiries regarding these Terms of Service, please direct your correspondence to our administrative team at <a href="mailto:help@whisprr.xyz" className="text-primary-500 hover:underline">help@whisprr.xyz</a>. We are committed to addressing your concerns promptly and transparently.
          </p>
        </section>
      </div>
    </div>
  );
}
