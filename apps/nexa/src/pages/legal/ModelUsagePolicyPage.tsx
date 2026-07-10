import { LegalPageLayout } from '@whisprr/shared';

export default function ModelUsagePolicyPage() {
  return (
    <LegalPageLayout title="Model Usage Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Access to Models</h2>
        <p>
          NEXA provides access to a variety of LLMs (Large Language Models). Some models are available for free, while advanced models are restricted to NEXA+ subscribers. We do not guarantee the continuous availability of any specific third-party model.
        </p>
      </section>

      <section>
        <h2>2. Fair Use and Rate Limiting</h2>
        <p>
          To ensure platform stability, all model usage is subject to rate limiting. Attempting to bypass these limits using automated scripts or multiple accounts is a violation of this policy.
        </p>
      </section>

      <section>
        <h2>3. Third-Party Terms</h2>
        <p>
          When selecting specific third-party models (such as those from OpenAI or Anthropic), your usage is also subject to their respective acceptable use policies, particularly concerning the generation of illegal or harmful content.
        </p>
      </section>
    </LegalPageLayout>
  );
}
