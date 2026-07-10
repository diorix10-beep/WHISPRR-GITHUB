import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function AiCreatorPolicyPage() {
  return (
    <LegalPageLayout title="AI Creator Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Empowering AI Creators</h2>
        <p>
          CHIMERA's Creator Forge is designed for builders. AI Creators who publish Personas, Lorebooks, or custom voices must abide by these rules to maintain a high-quality ecosystem.
        </p>
      </section>

      <section>
        <h2>2. Originality and Effort</h2>
        <p>
          We encourage original creations. Mass-generating low-effort Personas or spamming the directory with slight variations of the same entity is prohibited and will result in restricted publishing rights.
        </p>
      </section>

      <section>
        <h2>3. Creator Monetization</h2>
        <p>
          For Creators eligible to monetize their AI assets (such as Premium Personas or API access tokens), payouts are subject to our platform commission structure and compliance with local tax laws. You may not monetize stolen AI configurations.
        </p>
      </section>
    </LegalPageLayout>
  );
}
