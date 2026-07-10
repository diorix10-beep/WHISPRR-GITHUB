import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Cookie Usage in NEXA</h2>
        <p>
          NEXA uses cookies and local storage mechanisms to maintain your active session, store your API configurations securely in your browser, and remember your interface preferences (such as dark mode and text size).
        </p>
      </section>

      <section>
        <h2>2. Third-Party Trackers</h2>
        <p>
          Unlike traditional social networks, NEXA minimizes the use of third-party tracking. We only use essential analytics to monitor platform latency and AI generation response times. We do not use advertising trackers to monitor your private AI conversations.
        </p>
      </section>

      <section>
        <h2>3. Managing Preferences</h2>
        <p>
          You can clear your local storage or disable cookies via your browser. However, doing so will sign you out and may reset your local encryption keys, causing temporary loss of access to secure features.
        </p>
      </section>
    </LegalPageLayout>
  );
}
