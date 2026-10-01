import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="September 30, 2026">
      <section>
        <h2>1. Cookie Usage in CHIMERA</h2>
        <p>
          CHIMERA uses cookies and local storage mechanisms to maintain your active session, preserve unsaved creative drafts and retry identifiers, and remember your interface preferences (such as dark mode and text size).
        </p>
      </section>

      <section>
        <h2>2. Third-Party Trackers</h2>
        <p>
          This application does not enable an optional analytics or advertising tracker in its current source. Authentication, requested AI generation, and purchases communicate with the services needed for those actions. AI assistance is optional; the writing preview explains what context is sent. Externally hosted images may also contact their image host when displayed. Any future optional tracking needs a separate consent decision before activation.
        </p>
      </section>

      <section>
        <h2>3. Managing Preferences</h2>
        <p>
          You can clear site storage or block cookies through your browser. Clearing storage can sign you out, reset preferences, and erase unsaved local drafts or payment retry identifiers. Save or export your writing and resolve pending purchases before clearing storage. Server-saved content is not deleted by clearing browser storage.
        </p>
      </section>
    </LegalPageLayout>
  );
}
