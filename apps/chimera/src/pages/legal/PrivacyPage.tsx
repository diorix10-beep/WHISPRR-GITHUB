import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="September 30, 2026">
      <section>
        <h2>1. Introduction</h2>
        <p>
          CHIMERA is committed to safeguarding your data while providing state-of-the-art AI interactions. This Privacy Policy details how your prompts, conversations, and Persona settings are processed.
        </p>
      </section>

      <section>
        <h2>2. Data We Process</h2>
        <p>
          We collect and process the following information:
        </p>
        <ul>
          <li><strong>Conversations & Prompts:</strong> The text, audio, and images you send to AI models.</li>
          <li><strong>Creative Context:</strong> Characters, personas, world notes, lore and the context you choose to share.</li>
          <li><strong>Continuity:</strong> Source-backed conversation summaries, creator-approved durable facts and proposals awaiting approval. Private persona memories are isolated from shared human/hybrid rooms.</li>
          <li><strong>Account and Purchases:</strong> The shared account identity, wallet ledger and purchase references. Authentication is handled by Supabase and card payments by Stripe; card credentials are not stored in CHIMERA client code.</li>
        </ul>
      </section>

      <section>
        <h2>3. AI Processing & Third-Party Providers</h2>
        <p>
          Requested AI features send the prompt and relevant accessible context to the selected provider through CHIMERA’s server. Voice generation sends the requested text to ElevenLabs, and scene illustration sends your chosen scene direction to the image provider. Provider retention, training settings, processing agreements and locations must be verified for the configured service accounts; this page does not assert unverified guarantees.
        </p>
      </section>

      <section>
        <h2>4. Data Retention and Deletion</h2>
        <p>
          Saved history and continuity allow sessions to resume. Hiding or soft-deleting a message does not establish that every source record, revision, backup or provider copy has been erased. Settings offers a request for review of CHIMERA creative-data removal, preserving the shared account and WHISPRR data. Removal is not automatic; collaborative content, financial-record retention, backups and the final scope require review.
        </p>
      </section>

      <section>
        <h2>5. Security & International Processing</h2>
        <p>
          Authentication and database access are protected by server checks and database authorization rules. Browser storage holds session state, preferences and unsaved draft recovery; those drafts are not end-to-end encrypted and can be read by someone with access to your browser profile. AI content may be processed internationally depending on the provider. Jurisdiction-specific safeguards and retention commitments require founder review.
        </p>
      </section>

      <section>
        <h2>6. Privacy Rights & Contact</h2>
        <p>
          Use Settings to request a data export or review of CHIMERA creative-data removal. The shared ecosystem account is preserved by the CHIMERA removal workflow. Contact the support address shown in Settings for review; applicable privacy rights and response deadlines depend on jurisdiction and require a reviewed policy.
        </p>
      </section>
    </LegalPageLayout>
  );
}
