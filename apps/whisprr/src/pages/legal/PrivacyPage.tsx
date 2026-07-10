import { LegalPageLayout } from '@whisprr/shared';

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Introduction</h2>
        <p>
          At WHISPRR, your privacy is paramount. This Privacy Policy explains how we collect, use, and protect your data when you use our social network. We believe in transparency and giving you control over your digital footprint.
        </p>
      </section>

      <section>
        <h2>2. Data We Collect</h2>
        <p>
          We collect information to provide a personalized social experience:
        </p>
        <ul>
          <li><strong>Account Information:</strong> Username, email address, password, and date of birth (for age verification).</li>
          <li><strong>Profile Data:</strong> Display name, bio, profile photo, and interests.</li>
          <li><strong>Social Interactions:</strong> Posts, likes, comments, followers, following lists, and community memberships.</li>
          <li><strong>Private Messages:</strong> Content of your direct messages, voice notes, and media shared privately.</li>
          <li><strong>Device & Usage Data:</strong> IP address, browser type, device identifiers, and how you navigate the feed.</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Data</h2>
        <p>
          Your data powers the WHISPRR experience. We use it to:
        </p>
        <ul>
          <li>Deliver the core social networking functionality.</li>
          <li>Power our feed recommendation engine to show you relevant content and creators.</li>
          <li>Deliver essential notifications regarding your account and network activity.</li>
          <li>Enforce our community guidelines through automated and human moderation.</li>
          <li>Provide targeted advertisements to keep the platform sustainable (you can opt-out of personalized ads in your settings).</li>
        </ul>
      </section>

      <section>
        <h2>4. User-Generated Content & Visibility</h2>
        <p>
          Content you post publicly is visible to anyone on or off the platform. You control the privacy of your account and can choose to make your profile private, restricting visibility to approved followers only.
        </p>
      </section>

      <section>
        <h2>5. Cookies & Analytics</h2>
        <p>
          We use cookies and similar tracking technologies to analyze platform usage, remember your preferences, and serve relevant advertisements. Please refer to our Cookie Policy for detailed information and opt-out instructions.
        </p>
      </section>

      <section>
        <h2>6. Moderation, Reporting, & Security</h2>
        <p>
          To keep WHISPRR safe, we log reporting actions and block lists. We employ industry-standard encryption to protect your data, especially Private Messages, from unauthorized access.
        </p>
      </section>

      <section>
        <h2>7. International Processing & Privacy Rights</h2>
        <p>
          Your data may be processed in countries outside your own. Depending on your jurisdiction (e.g., GDPR, CCPA), you have the right to access, correct, download, or delete your personal data. You can manage these rights directly from your Account Settings.
        </p>
      </section>
      
      <section>
        <h2>8. Future Ecosystem Expansions</h2>
        <p>
          As we introduce premium features, voice AI integration, and new creator tools, your data will continue to be protected under these core privacy principles. Any significant changes to data collection will be communicated transparently.
        </p>
      </section>

      <section>
        <h2>9. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact our Data Protection Officer at privacy@whisprr.xyz.
        </p>
      </section>
    </LegalPageLayout>
  );
}
