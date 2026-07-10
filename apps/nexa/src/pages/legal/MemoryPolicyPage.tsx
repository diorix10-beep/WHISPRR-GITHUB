import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function MemoryPolicyPage() {
  return (
    <LegalPageLayout title="AI Memory Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. How AI Memory Works</h2>
        <p>
          NEXA utilizes advanced AI Memory systems to allow Personas to remember you across multiple sessions. This memory is extracted dynamically from your conversations to build long-term context.
        </p>
      </section>

      <section>
        <h2>2. Memory Privacy</h2>
        <p>
          The memory vectors extracted by the AI are strongly encrypted and tied strictly to your account and the specific Persona. They are never shared publicly or used to train foundational models.
        </p>
      </section>

      <section>
        <h2>3. User Control</h2>
        <p>
          You have complete ownership over your AI Memory. You can view extracted facts, edit incorrect memories, or completely wipe a Persona's memory of you at any time through the chat interface.
        </p>
      </section>
    </LegalPageLayout>
  );
}
