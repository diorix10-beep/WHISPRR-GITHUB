import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Welcome to CHIMERA</h2>
        <p>
          CHIMERA is a professional AI Studio and Persona Platform. By accessing or using CHIMERA ("the Service"), you agree to be bound by these Terms of Service. CHIMERA provides tools for creating, publishing, and interacting with artificial intelligence models and Personas.
        </p>
      </section>

      <section>
        <h2>2. Platform Eligibility</h2>
        <p>
          CHIMERA requires users to be at least 18 years old due to the complex nature of generative AI and the potential for mature or unpredictable content generation. By registering, you confirm you meet this requirement.
        </p>
      </section>

      <section>
        <h2>3. Acceptable AI Usage</h2>
        <p>
          You agree to use CHIMERA's intelligence tools responsibly. You must not use the platform to generate illegal content, CSAM, non-consensual deepfakes, or content that assists in the creation of biological weapons or cyberattacks.
        </p>
      </section>

      <section>
        <h2>4. Persona Creation & Publishing</h2>
        <p>
          Creators using the CHIMERA Forge to build Personas must ensure their creations do not violate our AI Safety policies. When publishing a Persona, you are responsible for its initial system prompts, voice clones, and associated knowledge bases.
        </p>
      </section>

      <section>
        <h2>5. Intellectual Property & Copyright</h2>
        <p>
          You retain the rights to the system prompts and original world-building lore you create. You must not upload copyrighted material to a Persona's knowledge base unless you own the rights or have permission. CHIMERA claims no ownership over the AI-generated outputs produced during your private sessions.
        </p>
      </section>

      <section>
        <h2>6. Prompt Abuse & Jailbreaking</h2>
        <p>
          Deliberately attempting to "jailbreak" CHIMERA's AI models, bypassing safety filters, or using prompt injection attacks to force the AI to violate our core safety rules is strictly prohibited and will result in account termination.
        </p>
      </section>

      <section>
        <h2>7. Platform Enforcement</h2>
        <p>
          We employ automated moderation and review systems to ensure compliance. We reserve the right to unpublish Personas, revoke API access, suspend features, or terminate accounts that breach these Terms.
        </p>
      </section>

      <section>
        <h2>8. Future Features</h2>
        <p>
          As CHIMERA expands to include AI Agents, autonomous plugins, API access, and advanced world-building simulations, these Terms will govern your use of those new intelligence capabilities.
        </p>
      </section>
    </LegalPageLayout>
  );
}
