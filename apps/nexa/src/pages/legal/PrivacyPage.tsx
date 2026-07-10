import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Introduction</h2>
        <p>
          NEXA is committed to safeguarding your data while providing state-of-the-art AI interactions. This Privacy Policy details how your prompts, conversations, and Persona settings are processed.
        </p>
      </section>

      <section>
        <h2>2. Data We Process</h2>
        <p>
          We collect and process the following information:
        </p>
        <ul>
          <li><strong>Conversations & Prompts:</strong> The text, audio, and images you send to AI models.</li>
          <li><strong>Persona Configurations:</strong> System prompts, knowledge files, and voice templates you upload.</li>
          <li><strong>AI Memory:</strong> Information the AI extracts and retains to maintain context across sessions.</li>
          <li><strong>Account Information:</strong> Credentials and billing information for premium NEXA services.</li>
        </ul>
      </section>

      <section>
        <h2>3. AI Processing & Third-Party Providers</h2>
        <p>
          To generate responses, NEXA routes your prompts through our proprietary models and selected third-party Large Language Model (LLM) providers. We have strict data processing agreements in place: third-party providers are <strong>not</strong> permitted to use your private conversations to train their foundational models.
        </p>
      </section>

      <section>
        <h2>4. Data Retention and Deletion</h2>
        <p>
          Your conversation history and AI Memory are retained so you can resume sessions seamlessly. You have full control to clear AI memory, delete specific messages, or wipe entire chat histories. Once deleted, this data is removed from our active systems.
        </p>
      </section>

      <section>
        <h2>5. Security & International Processing</h2>
        <p>
          We use strong encryption for data in transit and at rest. Your AI interactions may be processed on servers located internationally depending on the model selected. We ensure adequate safeguards are in place for cross-border data transfers.
        </p>
      </section>

      <section>
        <h2>6. Privacy Rights & Contact</h2>
        <p>
          You retain the right to request a data export or complete account deletion. For privacy inquiries regarding our AI processing pipeline, contact privacy@nexa.ai.
        </p>
      </section>
    </LegalPageLayout>
  );
}
