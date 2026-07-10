import { LegalPageLayout } from '@whisprr/shared';

export default function AdvertisingPolicyPage() {
  return (
    <LegalPageLayout title="Advertising Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Transparent Advertising</h2>
        <p>
          Advertisements on WHISPRR must be clearly identifiable as sponsored content. We strive to integrate ads seamlessly without deceiving our users.
        </p>
      </section>

      <section>
        <h2>2. Prohibited Ad Content</h2>
        <p>
          We do not allow advertisements that promote illegal products, discriminatory practices, deceptive financial schemes, or unsafe supplements. All ad creatives must adhere to our Community Guidelines.
        </p>
      </section>

      <section>
        <h2>3. Data Usage in Ads</h2>
        <p>
          We use platform engagement data to serve relevant ads. We do not sell your personal data to third-party advertisers. Users have the right to opt-out of personalized ad targeting in their Account Settings.
        </p>
      </section>
      
      <section>
        <h2>4. Creator Promotions</h2>
        <p>
          Creators who post sponsored content or brand deals on their WHISPRR feed must clearly disclose the partnership using our built-in sponsorship tools, in accordance with local advertising laws.
        </p>
      </section>
    </LegalPageLayout>
  );
}
