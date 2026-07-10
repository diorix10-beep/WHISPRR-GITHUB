import { LegalPageLayout } from '@whisprr/shared';

export default function AiSafetyPolicyPage() {
  return (
    <LegalPageLayout title="AI Safety Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Safety First</h2>
        <p>
          NEXA integrates multiple layers of safety filters to prevent the generation of harmful, illegal, or highly dangerous content. Our safety architecture works across both user prompts and model outputs.
        </p>
      </section>

      <section>
        <h2>2. Hallucinations and Disclaimers</h2>
        <p>
          Artificial intelligence models are prone to "hallucinations"—generating confident but factually incorrect or nonsensical information. You must not rely on NEXA's AI models for critical medical, legal, financial, or safety advice. AI outputs should always be verified.
        </p>
      </section>

      <section>
        <h2>3. Mature Content</h2>
        <p>
          While NEXA allows for creative freedom and mature roleplay scenarios (NSFW), all interactions must comply with our hard limits. Content involving non-consensual acts, child exploitation, or extreme violence is strictly prohibited and filtered.
        </p>
      </section>

      <section>
        <h2>4. Reporting Unsafe Outputs</h2>
        <p>
          If an AI model generates an output that violates our safety guidelines or causes distress, we encourage users to utilize the in-chat reporting tools. This feedback loop is critical for refining our safety filters.
        </p>
      </section>
    </LegalPageLayout>
  );
}
