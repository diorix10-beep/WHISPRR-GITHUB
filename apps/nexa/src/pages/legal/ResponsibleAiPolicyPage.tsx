import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function ResponsibleAiPolicyPage() {
  return (
    <LegalPageLayout title="Responsible AI Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Ethical AI Development</h2>
        <p>
          NEXA is committed to the ethical development and deployment of artificial intelligence. We believe AI should augment human creativity, not replace it, and we strive to mitigate biases in our systems.
        </p>
      </section>

      <section>
        <h2>2. Transparency</h2>
        <p>
          We aim to be transparent about when you are interacting with an AI versus a human. Personas published on NEXA are clearly labeled as artificial entities. Users should not attempt to deceive others by passing off AI-generated interactions as human without disclosure.
        </p>
      </section>

      <section>
        <h2>3. Misinformation and Deepfakes</h2>
        <p>
          Using NEXA tools to generate synthetic media (voice, image, or text) of real individuals without their consent for the purpose of spreading misinformation, defamation, or political manipulation is a violation of our ethical standards.
        </p>
      </section>
    </LegalPageLayout>
  );
}
