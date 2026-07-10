import { LegalPageLayout } from '@whisprr/shared';

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files placed on your device when you visit WHISPRR. They help us remember your preferences, keep you logged in, and understand how you interact with our platform.
        </p>
      </section>

      <section>
        <h2>2. How We Use Cookies</h2>
        <p>
          We use cookies for several purposes:
        </p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for authentication, security, and basic platform functionality.</li>
          <li><strong>Performance & Analytics:</strong> To analyze traffic patterns and improve the speed and performance of WHISPRR.</li>
          <li><strong>Personalization:</strong> To remember your theme preferences (e.g., dark mode) and language settings.</li>
          <li><strong>Advertising:</strong> To deliver relevant advertisements and measure campaign effectiveness.</li>
        </ul>
      </section>

      <section>
        <h2>3. Managing Your Preferences</h2>
        <p>
          You can control your cookie preferences through your browser settings. Please note that disabling essential cookies may prevent you from logging into your WHISPRR account or accessing key features.
        </p>
      </section>
    </LegalPageLayout>
  );
}
