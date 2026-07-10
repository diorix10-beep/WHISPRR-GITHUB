import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function PromptPolicyPage() {
  return (
    <LegalPageLayout title="Prompt Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Acceptable Prompts</h2>
        <p>
          Your prompts dictate the AI's behavior. You are responsible for the instructions you provide. You may not prompt the AI to generate illegal content, CSAM, or instructions for self-harm.
        </p>
      </section>

      <section>
        <h2>2. Jailbreaking</h2>
        <p>
          "Jailbreaking"—the act of using complex prompts to bypass the safety protocols of NEXA or underlying LLM providers—is strictly forbidden. We monitor for known jailbreak patterns, and repeated attempts will trigger automatic account suspension.
        </p>
      </section>

      <section>
        <h2>3. Prompt Injection</h2>
        <p>
          Attempting to execute prompt injection attacks to extract sensitive system data, underlying persona prompts, or to exploit the platform's architecture is a security violation and will be treated as malicious hacking.
        </p>
      </section>
    </LegalPageLayout>
  );
}
