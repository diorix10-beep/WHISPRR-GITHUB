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
            WHISPRR ("we", "our", or "us") operates the whisprr.xyz platform. This Privacy Policy comprehensively details the scope of our data practices, including how we systematically collect, process, utilize, disclose, and safeguard your personal information when you interact with our service. Protecting your privacy is a foundational priority for us, and this document serves to ensure complete transparency regarding your digital footprint on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">2. Information We Collect</h2>
          <p className="leading-relaxed mb-3">
            To provide a seamless and secure experience, we collect specific categories of information from our users. First, we gather information that you provide directly to us during the registration and profiling process. This encompasses fundamental account details such as your email address and encrypted password, as well as optional profile data including your display name, username, biography, avatar, stated interests, and mood indicators. Furthermore, we store the content you actively create and distribute on the platform, which includes your whispers, comments, reactions, direct messages, and broader community participation metrics.
          </p>
          <p className="leading-relaxed">
            In addition to the data you actively provide, our systems automatically collect technical and behavioral information as you navigate the platform. This encompasses diagnostic device and browser specifications, intricate usage data outlining your interaction patterns with the service, and standard server log data containing your IP address and access timestamps. This automated collection is essential for maintaining platform stability and optimizing performance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">3. How We Use Your Information</h2>
          <p className="leading-relaxed">
            The information we collect is strictly utilized to facilitate, enhance, and secure the WHISPRR platform. Primarily, your data enables us to provide and seamlessly maintain the core functionalities of our service, ensuring that connections between users are successfully established. We heavily rely on interaction patterns to algorithmically personalize your user experience, curating content recommendations and community suggestions tailored to your preferences. Additionally, we use your contact information to deliver essential system notifications and updates that you have opted to receive. On a foundational level, your data is continuously analyzed to detect and aggressively prevent instances of fraud, security breaches, or abuse, while also guiding our internal development of new features and platform improvements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">4. Information Sharing and Disclosure</h2>
          <p className="leading-relaxed">
            WHISPRR fundamentally respects your privacy and categorically refuses to sell your personal information to third-party data brokers or advertisers. The sharing of your information is strictly limited to specific, necessary scenarios. Depending entirely on the privacy settings you have configured, elements of your profile and content may be shared with other users on the platform. We additionally share requisite technical data with deeply vetted third-party service providers who directly assist in operating our infrastructure and delivering our core functionalities. Finally, we may disclose your information to law enforcement agencies or regulatory bodies strictly when compelled to do so by a legally binding subpoena, court order, or other applicable legal requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">5. Data Security Measures</h2>
          <p className="leading-relaxed">
            We prioritize the structural integrity and security of your personal data by implementing sophisticated technical and organizational safeguards. These measures are actively designed to protect your information against unauthorized access, accidental loss, destruction, or alteration. Despite our rigorous security protocols and encryption standards, it is imperative to acknowledge that no method of digital transmission over the Internet, nor any method of electronic storage, can be guaranteed to be one hundred percent secure. Consequently, while we strive to use commercially acceptable means to protect your data, we cannot guarantee its absolute, impenetrable security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">6. Your Data Rights</h2>
          <p className="leading-relaxed">
            We firmly believe that you should maintain comprehensive control over your personal information. As a user of WHISPRR, you inherently possess the right to access and review the personal data we hold about you. Should you identify any inaccuracies, you maintain the right to instantly correct and update your information through your account settings. Furthermore, you reserve the uncompromising right to request the permanent deletion of your account and all associated personal data from our active databases. We also support your right to export your data in a portable format and to explicitly opt out of any non-essential marketing or promotional communications at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">7. Data Retention Policy</h2>
          <p className="leading-relaxed">
            Our data retention practices dictate that we only hold your personal information for the duration that your account remains active, or for as long as it is demonstrably necessary to provide you with uninterrupted access to our services. We may also retain specific data points as required to comply with our binding legal obligations, resolve disputes, and enforce our user agreements. Should you choose to initiate an account deletion request through our support channels, your data will be permanently purged from our active systems, subject only to temporary retention within encrypted, inaccessible system backups for a strictly limited period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">8. Children's Privacy Guidelines</h2>
          <p className="leading-relaxed">
            The WHISPRR platform is rigorously designed for mature audiences and is explicitly not directed toward individuals under the age of thirteen (13). We adhere strictly to the Children's Online Privacy Protection Act (COPPA) and equivalent international frameworks, meaning we never knowingly solicit, collect, or retain personal information from children under thirteen. If we receive confirmed notification that we have inadvertently collected data from an underage user, we will take immediate action to expunge that information from our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">9. Modifications to This Policy</h2>
          <p className="leading-relaxed">
            As our platform evolves, it may become necessary to update or revise this Privacy Policy to accurately reflect changes in our data practices or operational compliance. We retain the right to modify this document at our discretion. Whenever substantive changes are implemented, we will proactively notify our user base by updating the comprehensive text on this page and revising the effective "Last updated" date located at the top of the document.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-3">10. Contact Information</h2>
          <p className="leading-relaxed">
            Your privacy is our utmost priority. Should you require further clarification, wish to submit a formal data inquiry, or have persistent questions regarding the terms established in this Privacy Policy, please direct your formal correspondence to our dedicated privacy and support team at <a href="mailto:help@whisprr.xyz" className="text-primary-500 hover:underline">help@whisprr.xyz</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
