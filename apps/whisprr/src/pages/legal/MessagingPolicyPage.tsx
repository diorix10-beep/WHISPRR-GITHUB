import { LegalPageLayout } from '../../components/legal/LegalPageLayout';

export default function MessagingPolicyPage() {
  return (
    <LegalPageLayout title="Messaging Policy" lastUpdated="July 15, 2026">
      <section>
        <h2>1. Private and Secure Communication</h2>
        <p>
          WHISPRR provides Private Messaging and Voice Rooms for intimate community interactions. We prioritize the security and privacy of these communications.
        </p>
      </section>

      <section>
        <h2>2. Anti-Spam Rules</h2>
        <p>
          You may not use Private Messages to send unsolicited promotions, mass broadcast messages, or spam. Accounts engaging in mass messaging may be subject to automated rate limits or permanent suspension.
        </p>
      </section>

      <section>
        <h2>3. Harassment in Direct Messages</h2>
        <p>
          Our harassment policies apply strictly to direct messages. If a user blocks you, attempting to circumvent the block through alternate accounts or group chats is a severe violation.
        </p>
      </section>

      <section>
        <h2>4. Voice Rooms and Real-Time Chat</h2>
        <p>
          Voice Rooms are live environments. While WHISPRR does not monitor live audio, users who are reported for abusive behavior in Voice Rooms will face suspension of their audio privileges. Room hosts are responsible for moderating their own spaces.
        </p>
      </section>
    </LegalPageLayout>
  );
}
