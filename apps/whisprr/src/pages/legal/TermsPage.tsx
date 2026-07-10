import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Welcome to WHISPRR</h2>
        <p>
          WHISPRR is a premium social platform designed for human connection, community building, and creative expression. By accessing or using WHISPRR ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Platform Eligibility</h2>
        <p>
          WHISPRR is strictly for adults. You must be at least 18 years old to create an account, access the platform, or view content. By registering, you represent and warrant that you meet this age requirement. Accounts found belonging to minors will be terminated immediately.
        </p>
      </section>

      <section>
        <h2>3. Acceptable Use and Community Behavior</h2>
        <p>
          We expect our users to treat each other with respect. The following behaviors are strictly prohibited:
        </p>
        <ul>
          <li><strong>Harassment & Bullying:</strong> Targeting individuals for sustained harassment, doxxing, or coordinating attacks.</li>
          <li><strong>Hate Speech:</strong> Promoting violence, inciting hatred, or using slurs based on race, ethnicity, religion, disability, or sexual orientation.</li>
          <li><strong>Spam & Manipulation:</strong> Using automated scripts, fake accounts, or misleading tactics to artificially inflate engagement or disrupt conversations.</li>
          <li><strong>Impersonation:</strong> Pretending to be another person, brand, or entity in a deceptive manner.</li>
          <li><strong>Illegal Activities:</strong> Using the platform to plan, promote, or engage in any illegal acts.</li>
        </ul>
      </section>

      <section>
        <h2>4. User Responsibilities</h2>
        <p>
          You are responsible for maintaining the security of your account credentials. You agree that any activity occurring under your account is your responsibility. You must provide accurate registration information and keep it updated.
        </p>
      </section>

      <section>
        <h2>5. Creator Responsibilities</h2>
        <p>
          Creators who monetize their presence on WHISPRR must adhere to our Creator Policy. You must ensure that all content you offer for sale or subscription complies with our community standards and that you possess the necessary rights and permissions for such content.
        </p>
      </section>

      <section>
        <h2>6. Copyright and Intellectual Property</h2>
        <p>
          You retain ownership of the original content you post on WHISPRR. By posting, you grant WHISPRR a non-exclusive license to display, distribute, and promote your content within the ecosystem. You must not post content that infringes on the intellectual property rights of others.
        </p>
      </section>

      <section>
        <h2>7. Platform Enforcement & Suspension</h2>
        <p>
          WHISPRR employs automated systems and human moderators to enforce these Terms. We reserve the right to remove content, issue warnings, suspend features, or permanently terminate accounts that violate our rules. Severe violations, such as child exploitation or credible threats of violence, will result in immediate termination and reporting to law enforcement.
        </p>
      </section>

      <section>
        <h2>8. Future Features</h2>
        <p>
          As WHISPRR expands to include Voice AI, Team Workspaces, API Access, and Premium Marketplaces, these Terms will govern your use of those new features. We reserve the right to update these terms as the ecosystem evolves.
        </p>
      </section>
    </LegalPageLayout>
  );
}
