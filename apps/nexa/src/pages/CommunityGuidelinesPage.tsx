import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 md:py-20">
        <div className="bg-white dark:bg-warm-900 rounded-3xl p-8 md:p-12 shadow-sm border border-warm-200 dark:border-warm-800">
          <div className="mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-warm-900 dark:text-white mb-6">Community Guidelines</h1>
            <p className="text-lg text-warm-600 dark:text-warm-400">
              Welcome to WHISPRR. Our mission is to foster a safe, creative, and respectful environment for everyone. 
              These guidelines define acceptable behavior on our platform.
            </p>
          </div>

          <div className="prose prose-warm dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-warm-900 dark:text-white mb-4">1. Respect Each Other</h2>
              <p className="mb-4">We do not tolerate harassment, bullying, or abusive behavior. This includes:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Direct threats of harm or violence.</li>
                <li>Targeted harassment or sustained bullying.</li>
                <li>Hate speech or discrimination based on race, ethnicity, religion, disability, age, nationality, sexual orientation, or gender identity.</li>
                <li>Doxxing or sharing another person's private information without consent.</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-warm-900 dark:text-white mb-4">2. Safe Content</h2>
              <p className="mb-4">To ensure WHISPRR remains a safe place, the following content is strictly prohibited:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Child Sexual Abuse Material (CSAM) or any content exploiting minors. We report all instances to the NCMEC.</li>
                <li>Non-consensual sexual content (NCSC) or deepfakes.</li>
                <li>Content that encourages or provides instructions on self-harm or suicide.</li>
                <li>Terrorist content or propaganda.</li>
                <li>Illegal goods, services, or activities.</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-warm-900 dark:text-white mb-4">3. AI & Roleplay Ethics</h2>
              <p className="mb-4">When using our AI tools (NEXA), the same rules apply. You may not:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Create AI characters designed to harass or mimic real people without their consent.</li>
                <li>Generate content that violates our core safety rules (e.g., CSAM, extreme non-consensual violence).</li>
                <li>Attempt to bypass or jailbreak our AI safety filters to generate harmful content.</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-warm-900 dark:text-white mb-4">4. Spam & Deception</h2>
              <p className="mb-4">Help keep our community authentic:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Do not engage in spam, phishing, or mass-messaging.</li>
                <li>Do not impersonate other users or public figures in a deceptive manner.</li>
                <li>Do not use bots or automated scripts to artificially inflate engagement or scrape platform data.</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-warm-900 dark:text-white mb-4">Enforcement</h2>
              <p className="mb-4">We review reports of violations and may take the following actions depending on the severity of the offense:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Warning:</strong> A notice explaining the violation and a reminder of our guidelines.</li>
                <li><strong>Feature Restriction:</strong> Temporary loss of specific features (e.g., inability to send messages).</li>
                <li><strong>Suspension:</strong> Temporary loss of access to your account.</li>
                <li><strong>Permanent Ban:</strong> Permanent removal from the WHISPRR and NEXA ecosystem.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-warm-900 dark:text-white mb-4">Reporting</h2>
              <p className="mb-4">
                If you see something that violates these guidelines, please report it using the in-app reporting tools. 
                Our team reviews all reports and takes appropriate action to keep our community safe.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
