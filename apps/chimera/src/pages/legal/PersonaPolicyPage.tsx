import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function PersonaPolicyPage() {
  return (
    <LegalPageLayout title="Persona Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Creating Personas</h2>
        <p>
          CHIMERA allows you to craft customized AI Personas. You must ensure that the Personas you create—whether for private use or public publishing—do not violate our AI Safety policies or intellectual property rights.
        </p>
      </section>

      <section>
        <h2>2. Public Personas</h2>
        <p>
          When you publish a Persona to the public directory, it becomes accessible to the CHIMERA community. Public Personas are subject to stricter moderation. We reserve the right to unpublish or remove Personas that are deemed unsafe, highly offensive, or in violation of copyright (e.g., direct clones of existing intellectual property without permission).
        </p>
      </section>

      <section>
        <h2>3. Importing Personas</h2>
        <p>
          If you import Persona definitions (such as character cards or JSON files) from third-party platforms, you are solely responsible for ensuring the content complies with CHIMERA's policies.
        </p>
      </section>
    </LegalPageLayout>
  );
}
