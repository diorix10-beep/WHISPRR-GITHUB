import type { LegalDocument } from './types';

export const PRIVACY: LegalDocument = {
  title: 'Privacy Policy',
  summary: [
    '**The short version.** This is not the legal text; the sections below are. It is here to help you read them.',
    'We collect what we need to run your account, your scenes and stories, and your purchases. What you write in a roleplay is sent to AI providers so a reply can be written. We do not sell your data, and CHIMERA does not use advertising or analytics trackers. You can ask us to correct or delete your data. Some things are not decided yet and are marked clearly.',
  ],
  sections: [
    {
      id: 'who',
      title: '1. Who is responsible for your data',
      blocks: [
        'This policy explains how {{TODO:ENTITY_NAME}} ({{TODO:ENTITY_REGISTRATION}}, "CHIMERA", "we", "us") handles personal data when you use CHIMERA at www.chimera.it.com. We decide why and how your data is used, which makes us the "controller" under laws such as the GDPR. Our address is {{TODO:REGISTERED_ADDRESS}}.',
        'Privacy questions and requests: {{TODO:CONTACT_EMAIL_PRIVACY}}. EU/UK representative, if one is required: {{TODO:EU_UK_REPRESENTATIVE}}.',
        { note: 'CHIMERA\'s accounts and data are stored in the same Supabase project that also holds data of the WHISPRR service. {{CONFIRM:Confirm whether CHIMERA and WHISPRR share accounts, and whether this policy should say so}}' },
      ],
    },
    {
      id: 'data',
      title: '2. The data we collect and why',
      blocks: [
        'We list each kind of data, where it comes from, and why we use it. The retention periods are in section 7.',
        { table: {
          head: ['Data', 'What it includes', 'Why we use it'],
          rows: [
            ['**Account and sign-in**', 'Your e-mail address; your password (kept by our sign-in provider in a protected, hashed form, never readable by us); sign-in sessions; whether your e-mail is confirmed; which version of the Terms you accepted at sign-up (saved with your account).', 'To create and secure your account, sign you in, and keep a record of which Terms you accepted.'],
            ['**Profile**', 'A profile record is created with your account. It can hold a display name, a username and optional details such as a picture. CHIMERA does not currently ask you for these, show them to other members, or have a screen to edit them. Some older accounts, created before CHIMERA\'s current sign-up, have a name that was set from the first part of the e-mail address (before the "@"). {{CONFIRM:The profile table also has fields inherited from WHISPRR; confirm which exist and whether to describe them}}', 'To identify your account inside the service.'],
            ['**What you create**', 'Characters (name, description, personality, scenario, opening message, examples, tags, pictures you upload), personas (who you play as, which can include details such as age, gender, pronouns and appearance that you choose to write), stories and chapters, lorebooks and worlds, and the settings and preferences you choose (default AI model, theme, scene settings, banned words, content settings).', 'To store your creations, show them to the people you choose, and make the service work as you set it up.'],
            ['**Roleplay and storytelling data**', 'Your messages and the AI replies in your scenes, scene titles, pinned messages, your likes and dislikes of a character\'s replies (only you can see them, and they are not sent to AI providers), memories (suggested by the story and approved by you), turning points, drafts and chapters. When you edit a message, the new text replaces the old one. When you delete a message, it disappears from your scene, from what the AI is sent and from new chats started from the scene, but the record stays in our database. {{CONFIRM:Decide how long deleted messages are kept, and whether they should be erased for good after a delay}}', 'To run your scenes and stories, continue them later, and give you the memory and tools you use.'],
            ['**AI processing data**', 'The parts of your scene that are sent to AI providers to write a reply: the character\'s definition, your persona, recent messages, approved memories, pinned lines, your scene settings. Also the text you provide for memory suggestions, story paths, the writing assistant and scene illustrations. For each AI request we also keep a technical record (who asked, which feature, when, a hash that identifies the request, and the reply, so that a retried request does not run twice) and counters used to limit abuse.', 'To produce the replies, suggestions and pictures you ask for, to avoid charging you twice, and to keep the service safe from overuse.'],
            ['**Payments and credits**', 'Purchase orders (pack, amount, currency, status, dates, and the identifiers of the checkout and payment at the payment provider), and the ledger of your SHARDS and VELLUM: every welcome credit, purchase, reward, spend (including which model wrote a reply), and refund. We do not receive or store your full card number: the payment provider collects it.', 'To deliver what you buy, show your balance and history, prevent fraud, give refunds, and meet accounting and tax duties.'],
            ['**Creator payout information (planned)**', 'Not collected today, because creator payouts do not exist yet. If they launch, we expect to handle identity and tax details and payout account details, mostly through the payout provider ({{TODO:PAYOUT_PROVIDER}}).', 'To pay creators and meet tax and anti-fraud rules.'],
            ['**Age information**', 'At sign-up you confirm that you are 18 or older. In the Guardian\'s Library you can also confirm it again to see Mature and Adult content; we record that you did, when, and which version of the confirmation you saw. This is your own declaration and is not checked. Our database also has fields for a verified age status, the time, the provider and a reference, for when real age verification opens ({{TODO:AGE_VERIFICATION_PROVIDER}}). Age verification is not live yet.', 'To keep CHIMERA adults-only and to keep adult content for members who confirmed (and later, verified) that they are adults.'],
            ['**Device, technical and security data**', 'Your IP address, browser and device type, and timestamps, which our hosting, database and sign-in providers record in the normal course of serving the site, plus error and abuse-prevention records and rate-limit counters. {{CONFIRM:Confirm with each provider exactly which technical logs they keep}}', 'To deliver the site, fix problems, protect against attacks and abuse, and limit overuse.'],
            ['**Reports, moderation and support**', 'When you report a message: a copy of that message and a few messages around it, the reason you chose, what you wrote about it, and the time. Our moderators then add a status, notes and a log of what they did. We do not copy the rest of your conversation. A report never punishes anyone automatically. Also: reports about other content or members, and messages you send us.', 'To keep the community safe, enforce the Terms, and help you. Only our moderators can read reports, and only you can see that you filed one.'],
          ],
        } },
        'We do not knowingly collect other kinds of data, and we ask you not to put sensitive details (for example health information, government identifiers or financial details) into characters, personas or messages. What you write in a roleplay is stored as you wrote it.',
      ],
    },
    {
      id: 'ai',
      title: '3. AI providers and your roleplay',
      blocks: [
        'CHIMERA does not run its own AI models. To write a reply, the relevant parts of your scene (see section 2) are sent to an AI provider, which returns the reply. We currently use:',
        { list: [
          '**Google** (the Gemini API) for the default model, for memory suggestions, for story paths and for scene illustrations.',
          '**OpenRouter**, which passes requests to the company that makes the model you choose in the Model House (for example DeepSeek, Mistral AI, Google or Anthropic). These models are in testing and only available to selected members for now.',
        ] },
        'These providers handle data under their own terms. Whether they keep prompts and replies, and whether they use them to improve their models, depends on those terms and on the settings of the account CHIMERA holds with them: {{TODO:AI_PROVIDER_SETTINGS}}. CHIMERA does not train its own models on your content.',
        'Only the data needed for your request is sent. Your e-mail address, your profile name and your payment information are not sent to AI providers. The AI sees the persona name you choose for a scene, or "Player" if you have none.',
      ],
    },
    {
      id: 'legal-bases',
      title: '4. Our legal reasons for using your data (EU, UK and similar laws)',
      blocks: [
        'Where laws like the GDPR apply, we rely on:',
        { list: [
          '**Contract:** to provide the service you asked for: your account, scenes, stories, purchases and credits.',
          '**Legitimate interests:** to keep the service secure, prevent fraud and abuse, enforce the Terms, fix problems and improve the service, in ways that respect your rights.',
          '**Legal obligation:** to keep accounting records, answer lawful requests, and report illegal content where the law requires.',
          '**Consent:** where we ask for it, for example before processing sensitive data for age verification, if the provider needs it. You can withdraw consent at any time.',
        ] },
        '{{CONFIRM:A lawyer should confirm the legal basis for each purpose before this policy is final}}',
      ],
    },
    {
      id: 'sharing',
      title: '5. Who receives your data',
      blocks: [
        'We do not sell your personal data, and we do not share it for advertising. {{CONFIRM:Confirm this statement}} We share it with:',
        { table: {
          head: ['Who', 'What they do for us', 'Data involved'],
          rows: [
            ['**Supabase**', 'Database, sign-in (authentication) and file storage. Our project is hosted in the EU (Ireland).', 'Everything stored in your account, including pictures you upload.'],
            ['**Vercel**', 'Hosting of the website and the server functions that call AI providers and payments.', 'Requests to the site; technical logs.'],
            ['**Google**', 'AI replies, suggestions, story paths and illustrations (Gemini).', 'The parts of your scene needed for the request.'],
            ['**OpenRouter and model companies**', 'AI replies from other models.', 'The parts of your scene needed for the request.'],
            ['**Stripe** (currently integrated) {{TODO:PAYMENT_PROVIDER}}', 'Taking payments for SHARDS packs.', 'Order details; the provider collects your payment details itself.'],
            ['**E-mail delivery** ({{TODO:EMAIL_PROVIDER}})', 'Sending account e-mails such as the confirmation link.', 'Your e-mail address.'],
            ['**Resend** (only if switched on)', 'Sending our administrators a short alert when a report is filed.', 'The administrators\' e-mail addresses, and the category of the report, its time and a link. Never the reported message, the conversation or your name.'],
            ['**Age verification provider (planned)**', 'Checking that you are an adult.', 'To be decided.'],
            ['**Payout provider (planned)**', 'Paying creators.', 'To be decided.'],
          ],
        } },
        'Other members see only what you choose to share: for example, a public character, with its definition and picture. We may also share data when the law or a valid legal request requires, to protect people from serious harm, to enforce our Terms, or in a reorganisation, merger or sale of CHIMERA (in which case this policy continues to protect your data).',
      ],
    },
    {
      id: 'transfers',
      title: '6. Transfers outside your country',
      blocks: [
        'Our database is in the EU (Ireland), but our other providers, and you, may be elsewhere (for example the United States). Your data may therefore be processed in countries whose data-protection laws differ from yours. Where the law requires safeguards for such transfers, we use: {{TODO:TRANSFER_MECHANISM}}.',
      ],
    },
    {
      id: 'retention',
      title: '7. How long we keep data',
      blocks: [
        'We keep data only as long as we need it for the reasons above or as the law requires. The periods below still need to be decided; each is marked.',
        { table: {
          head: ['Data', 'How long'],
          rows: [
            ['Account and profile', 'While your account exists. After deletion: {{TODO:RETENTION_ACCOUNT}}.'],
            ['Scenes, messages, characters, stories', 'While your account exists, or until you delete them. After deletion: {{TODO:RETENTION_MESSAGES}}.'],
            ['Technical and AI request records', '{{TODO:RETENTION_LOGS}}'],
            ['Purchase orders and the credits ledger', '{{TODO:RETENTION_PAYMENTS}} (accounting and tax law may require us to keep them even after you delete your account).'],
            ['Reports and moderation records', '{{TODO:RETENTION_MODERATION}}'],
            ['Backups', '{{TODO:RETENTION_BACKUPS}}'],
          ],
        } },
      ],
    },
    {
      id: 'deletion',
      title: '8. Deleting your account and data',
      blocks: [
        'There is no self-service delete button yet. To close your account and have your data deleted, write to {{TODO:CONTACT_EMAIL_PRIVACY}} from the e-mail address of your account. We record the request, check that it is you, and complete it within {{TODO:DELETION_TIMELINE}}.',
        'Deletion removes your profile, your creations and your scenes, except what we must keep (for example payment records, section 7) or what others already hold (for example a public character that someone used in their own scenes). Unused SHARDS and VELLUM are handled as the Terms say. Backups are overwritten as they expire.',
        'You can also delete many of your own characters, scenes and stories yourself in the service.',
      ],
    },
    {
      id: 'rights',
      title: '9. Your rights',
      blocks: [
        'Depending on where you live, you may have the right to:',
        { list: [
          '**Access** the personal data we hold about you, and get a copy ({{TODO:EXPORT_PROCESS}}). There is no self-service export yet.',
          '**Correct** data that is wrong. You can change your profile and your creations in the service, or ask us.',
          '**Delete** your data (section 8).',
          '**Object to or restrict** some uses, for example uses based on our legitimate interests.',
          '**Take your data** in a portable form, where the law gives you that right.',
          '**Withdraw consent** where we rely on it.',
          '**Complain** to a data-protection authority: in the EU, the authority of your country; in the UK, the Information Commissioner\'s Office; elsewhere, the authority of your country or state. For the operator\'s own country: {{TODO:LOCAL_LAW}}.',
        ] },
        '**US state laws.** If you live in a US state with a privacy law (for example California), you may have the right to know, access, correct and delete your data, and to opt out of sale or sharing for advertising. We do not sell your data or share it for advertising. {{CONFIRM:Confirm}} We will not treat you worse for using these rights.',
        'To use a right, write to {{TODO:CONTACT_EMAIL_PRIVACY}}. We may need to confirm your identity first.',
      ],
    },
    {
      id: 'cookies',
      title: '10. Cookies and local storage',
      blocks: [
        'CHIMERA does not use advertising or analytics cookies or trackers, and does not load third-party fonts or scripts for tracking. {{CONFIRM:Confirm this stays true before publishing; it reflects the code at the date of this draft}} It stores a few things on your device that the service needs:',
        { table: {
          head: ['What', 'Where', 'Why'],
          rows: [
            ['Your sign-in session', 'Browser local storage (set by the sign-in library)', 'To keep you signed in. Without it you cannot use the account.'],
            ['Your last space (Roleplay or Storytelling)', 'Browser local storage, key "chimera-mode"', 'To reopen the space you used.'],
            ['Story drafts and retry markers', 'Browser local storage', 'To keep unsaved writing safe and to avoid running a paid action twice.'],
            ['Whether the chat management panel stays open (on a computer)', 'Browser local storage, key "chimera.chat.panel.open"', 'To reopen the panel as you left it.'],
            ['How you like chats to look (text size, spacing, alignment, bubbles, typeface, narration and dialogue style)', 'Browser local storage, key "chimera.chat.look"', 'To show your chats the way you chose, on this device.'],
            ['Your chat background (a ready-made one, a colour, or a picture you choose)', 'Browser local storage, key "chimera.chat.wallpaper", and, for a picture, the browser\'s own database (IndexedDB, name "chimera-local")', 'To show your chats with the background you chose, on this device. A picture you choose is never uploaded: it is resized and stripped of its camera details, and kept only in your browser.'],
            ['A temporary checkout reference', 'Browser session storage, cleared when you close the tab', 'To avoid creating a second order if you retry a purchase.'],
          ],
        } },
        'When you pay, you are sent to the payment provider\'s own page, which may set its own cookies under its own policy. You can clear this storage in your browser at any time: you will be signed out and local drafts will be lost. Because we only use storage that is needed to provide what you asked for, we do not show a cookie banner. {{CONFIRM:A lawyer should confirm whether a banner is needed in the EU and UK, in particular for the saved space preference}}',
      ],
    },
    {
      id: 'security',
      title: '11. How we protect your data',
      blocks: [
        'What we do today:',
        { list: [
          'The site is served over an encrypted connection (HTTPS).',
          'Sign-in is handled by a specialist provider, and passwords are stored in a protected, hashed form.',
          'The database uses row-level security, so members can only read and change what the rules allow, such as their own account data. Balances and ledgers can only be changed by our servers, not by your browser.',
          'Our server keys are kept on the server and are never sent to your browser.',
          'We limit how often an account can use AI features, and we check that you are part of a scene before using it.',
        ] },
        'No system is perfectly secure, and we cannot promise it. If a data breach affects you, we will tell you and the authorities as the law requires. To report a security problem, write to {{TODO:CONTACT_EMAIL_PRIVACY}}.',
      ],
    },
    {
      id: 'children',
      title: '12. Children',
      blocks: [
        'CHIMERA is for adults only (18 and over) and is not directed at children. We do not knowingly collect personal data from anyone under 18. If we learn that we have, we will close the account and delete the data. If you think a child uses CHIMERA, please write to {{TODO:CONTACT_EMAIL_PRIVACY}}.',
      ],
    },
    {
      id: 'links',
      title: '13. Other websites',
      blocks: [
        'CHIMERA may link to other sites, such as the payment provider\'s page. We do not control them and they have their own privacy notices.',
      ],
    },
    {
      id: 'changes',
      title: '14. Changes to this policy',
      blocks: [
        'We may update this policy, for example when features or providers change. For significant changes we will tell you in the service or by e-mail before they take effect. The date of the current version is at the top of this page.',
      ],
    },
    {
      id: 'contact',
      title: '15. Contact',
      blocks: [
        'Privacy: {{TODO:CONTACT_EMAIL_PRIVACY}}. General questions: {{TODO:CONTACT_EMAIL_SUPPORT}}. Postal address: {{TODO:REGISTERED_ADDRESS}}.',
      ],
    },
  ],
};
