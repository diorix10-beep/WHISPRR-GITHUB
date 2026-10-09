import type { LegalDocument } from './types';

export const TERMS: LegalDocument = {
  title: 'Terms of Service',
  summary: [
    '**The short version.** This is not the legal text; the sections below are. It is here to help you read them.',
    'CHIMERA is for adults (18 and over). You own what you create. You let us store and show it so the service works. AI characters are fictional and AI can be wrong. SHARDS and VELLUM are in-app credits you spend: they are not money, cannot be cashed out and cannot be sent to other people. We can remove content and close accounts that break the rules. Some things in these Terms are not decided yet and are marked clearly.',
  ],
  sections: [
    {
      id: 'who-we-are',
      title: '1. Who we are and what these Terms are',
      blocks: [
        'These Terms of Service ("Terms") are an agreement between you and {{TODO:ENTITY_NAME}} ({{TODO:ENTITY_REGISTRATION}}), which operates CHIMERA, the service available at www.chimera.it.com ("CHIMERA", "we", "us"). Our address is {{TODO:REGISTERED_ADDRESS}}.',
        'By creating an account or using CHIMERA you agree to these Terms and to our [Privacy Policy](/privacy). If you do not agree, please do not use CHIMERA.',
        'CHIMERA is in early development. Features change, and some parts described here are planned but not available yet. Where that is the case, we say so.',
      ],
    },
    {
      id: 'eligibility',
      title: '2. Who can use CHIMERA (age)',
      blocks: [
        '**CHIMERA is only for adults.** You must be at least 18 years old to create an account or use the service. When you sign up, you confirm that you are 18 or older.',
        { note: 'The age of adulthood is higher than 18 in a few places. If that applies to you, you must also be an adult under the law that applies to you. {{CONFIRM:Confirm whether you want to state a higher minimum age in any country}}' },
        'We may ask you to prove your age. Adult-rated ("Mature") content is not available yet. When it opens, it will be limited to members whose age has been verified through an age-verification service ({{TODO:AGE_VERIFICATION_PROVIDER}}). Until then, CHIMERA shows General content only.',
        'If we learn that someone under 18 is using CHIMERA, we will close the account. If you believe a child is using the service, please tell us at {{TODO:CONTACT_EMAIL_REPORTS}}.',
      ],
    },
    {
      id: 'accounts',
      title: '3. Your account and its security',
      blocks: [
        'You create an account with an e-mail address and a password, and you must confirm your e-mail address. Give us accurate information and keep it up to date.',
        'You are responsible for your account and for what happens through it. Keep your password private, use one that is hard to guess, and tell us quickly at {{TODO:CONTACT_EMAIL_SUPPORT}} if you think someone else has accessed your account. We cannot be responsible for losses caused by someone using your account because you did not keep your login details safe, unless the law says otherwise.',
        { list: [
          'One person should use one account. {{CONFIRM:Confirm whether multiple accounts per person are allowed}}',
          'Do not sell, rent, share or transfer your account.',
          'Do not use bots, scrapers or other automated tools to access CHIMERA, except as we expressly allow.',
          'Do not try to get around limits, safeguards or checks, including age checks, rate limits, content filters and payment protections.',
        ] },
        'CHIMERA does not show your e-mail address to other members.',
      ],
    },
    {
      id: 'service',
      title: '4. What CHIMERA offers',
      blocks: [
        'CHIMERA has two creative spaces, plus an area for age settings:',
        { list: [
          '**Roleplay.** You play scenes with fictional AI characters that you or other members create. You can create characters, set up personas (who you play as), pin messages, set response length and banned words for a scene, and approve memories that the story suggests. In the Model House you choose which AI model writes the replies. Some models are free, some are paid with SHARDS, and some are in testing and only available to selected members.',
          '**Storytelling.** You write stories and chapters with an AI co-author. You can ask for scene illustrations, which cost VELLUM.',
          '**Guardian\'s Library.** Where you confirm that you are 18 or older and choose whether Mature and Adult stories are shown to you. For now this is your own declaration: we do not check it. A real age check is planned.',
        ] },
        'We may add, change, limit or remove features, models, prices and limits at any time, including to protect the service or to follow the law. We will try to give notice of significant changes that affect what you have paid for.',
      ],
    },
    {
      id: 'ai',
      title: '5. AI characters and AI-generated content',
      blocks: [
        'Characters on CHIMERA are fictional. They are not real people, they do not have feelings, and what they say is generated by AI models, which are run by third-party providers. Your messages, and the details needed to write a reply, are sent to those providers to produce it (see the [Privacy Policy](/privacy)).',
        { list: [
          '**AI can be wrong, strange or upsetting.** It may say things that are false, inconsistent, offensive or inappropriate, even with the safeguards we use. It may also state things about real people or events that are not true.',
          '**It is not advice.** Do not rely on a character or the AI for medical, legal, financial, psychological or safety decisions.',
          '**Take care of yourself.** If a roleplay becomes distressing, stop and take a break. If you are in crisis or in danger, contact local emergency services or someone you trust. CHIMERA is not a crisis service.',
          '**You are responsible for how you use what the AI writes.** We cannot promise that AI output is original, or free of other people\'s rights, and similar output may be produced for other members.',
          '**You stay in control of memory.** The story may suggest memories from your scenes; nothing is kept as a memory until you approve it.',
        ] },
        'We apply our own safety rules to AI replies, but no filter is perfect. Please use the tools in the service, or contact us, if you see something that breaks our rules.',
      ],
    },
    {
      id: 'your-content',
      title: '6. Your content and who owns it',
      blocks: [
        '"Your content" means what you create or upload: characters (including their pictures and definitions), personas, stories and chapters, lorebooks and worlds, scene settings, your messages in roleplay, and anything else you add.',
        '**You keep ownership of your content.** CHIMERA does not take ownership of your characters, stories, worlds, roleplays or other creations. We only receive the licence described in the next section, so that the service can work.',
        '**AI-generated replies.** As between you and us, we do not claim ownership of the replies the AI writes for you in your scenes. Some countries do not give copyright to material generated by AI, so we cannot promise that anyone owns it. {{CONFIRM:Confirm this position on ownership of AI output}}',
        { list: [
          'You promise that you have the right to add what you add, and that it does not break the law or anyone else\'s rights.',
          'Only import a character card that you made or that you have permission to use. Do not base a character on a real person without that person\'s permission.',
          'Other members\' characters, stories and worlds belong to them. You may use a character that is shared with you in your own scenes as the service allows, but you may not copy, redistribute or sell its definition outside CHIMERA. {{CONFIRM:Confirm the rules for copying other members\' characters}}',
        ] },
      ],
    },
    {
      id: 'licence',
      title: '7. The licence you give us',
      blocks: [
        'To run CHIMERA we need your permission to handle your content. You give us a worldwide, non-exclusive, royalty-free licence to host, store, copy, process, adapt (for example resize a picture or format text), display and transmit your content, **only as needed to**: provide and secure the service; show your content to the people you choose; send the relevant parts to AI providers to produce replies, memory suggestions, story paths and illustrations at your request; keep backups; and comply with the law.',
        { list: [
          '**Private** content is visible to you. **Unlisted** characters can be used by anyone who has the link. **Public** characters can be found by everyone. (Public publishing is currently limited to the CHIMERA founder during the beta.) When you share a character, you let others chat with it and see its definition as the service shows it.',
          'You can delete your content. The licence then ends, except for copies that must remain for a short time in backups, copies we must keep for the law or to resolve disputes, and content that others have already received in their own scenes.',
          'We do not use your content to train our own AI models, and we do not publish or promote your content without your permission. {{CONFIRM:Confirm that you want to commit to these two statements}} The AI providers we use have their own terms; see the [Privacy Policy](/privacy).',
          'If you send us ideas or feedback, we may use them freely, without owing you anything.',
        ] },
      ],
    },
    {
      id: 'acceptable-use',
      title: '8. Rules: what you must not do',
      blocks: [
        'CHIMERA is a place for fiction. Dark themes can be part of fiction, but the following are never allowed, in your messages, characters, stories, pictures, names or anywhere else:',
        { list: [
          '**Sexual content involving anyone under 18, or any character who is or appears to be under 18**, including through "age regression" or by claiming the character is secretly older. {{CONFIRM:Confirm that this rule covers age-regression framing}} We report this where the law requires.',
          'Sexual or explicit content in General-rated material, or any content that does not match its rating.',
          'Sexual or degrading content about a real person, or realistic fake images or voices of real people, without their consent.',
          'Content that sexualises or encourages non-consensual acts. {{CONFIRM:Decide your policy on non-consensual themes in fiction; this draft prohibits them}}',
          'Harassment, bullying, threats, hate or discrimination against people or groups, and doxxing or sharing private information about others.',
          'Encouraging or helping someone to harm themselves or others, including self-harm and suicide.',
          'Terrorism, violent extremism, or instructions to cause serious harm, such as weapons or dangerous substances.',
          'Anything illegal, including fraud, scams, selling illegal goods or services, and money laundering.',
          'Spam, unwanted advertising, malware, attempts to break or overload the service, and attempts to access other people\'s data.',
          'Infringing someone else\'s copyright, trademark or other rights, or impersonating a person or organisation to deceive others.',
          'Abusing SHARDS or VELLUM: exploiting bugs, creating accounts to collect welcome credits, using stolen payment methods, or selling or trading credits or accounts.',
          'Trying to extract, copy or reverse-engineer the service, its models or its safety rules, other than as the law allows.',
        ] },
        'These rules are a draft policy for the owner to confirm. They apply together with the law that applies to you.',
      ],
    },
    {
      id: 'ratings',
      title: '9. Content ratings and adult content',
      blocks: [
        'Characters and stories carry a rating. General content is for everyone. Mature and Adult content is hidden unless you have confirmed in the Guardian\'s Library that you are 18 or older and have chosen to see it. For now that confirmation is your own declaration, which we do not check, and you must only give it if it is true. When we add a real age check, we may ask you to complete it to keep seeing Mature and Adult content.',
        'You must rate what you publish honestly. We may change a rating, hide content or remove it if it does not match. Adult material may never be shown to people under 18, and never involves anyone under 18.',
      ],
    },
    {
      id: 'moderation',
      title: '10. Reports, moderation and enforcement',
      blocks: [
        '**Reporting.** In-app reporting is not available yet. Until it is, please report content or behaviour that breaks these Terms to {{TODO:CONTACT_EMAIL_REPORTS}}. Include a link and what is wrong.',
        '**Review.** We may review content when it is reported, when we need to keep the service and people safe, to investigate a breach of these Terms, or when the law requires. Your private scenes are not read routinely. {{CONFIRM:Confirm that moderators will not routinely read private scenes}} We may use automated tools as well as people.',
        '**What we may do.** Depending on how serious or repeated a breach is, we may warn you, remove or hide content, change a rating, limit features, suspend your account, or close it. We may act immediately, and without warning, for serious harm, illegal content or risk to others, and we may report to the authorities where the law requires or allows.',
        '**Appeals.** If you think we got it wrong, you can ask us to review the decision: {{TODO:APPEALS_PROCESS}}.',
      ],
    },
    {
      id: 'ending',
      title: '11. Ending your account',
      blocks: [
        'You can stop using CHIMERA at any time. To close your account and ask for your data to be deleted, write to {{TODO:CONTACT_EMAIL_PRIVACY}}; there is no self-service deletion screen yet. The [Privacy Policy](/privacy) explains what happens to your data.',
        'We may suspend or close your account if you break these Terms, if we must for legal reasons, or if the service or a feature is discontinued.',
        'What happens to unused SHARDS and VELLUM when an account closes: {{TODO:CLOSURE_BALANCE}}. If we close your account for breaking the rules, you may lose them. {{CONFIRM:Confirm}}',
        'Sections that by their nature should continue (for example ownership, licences that must continue as explained above, payment obligations, disclaimers, liability and disputes) continue after your account ends.',
      ],
    },
    {
      id: 'virtual-currencies',
      title: '12. SHARDS and VELLUM',
      blocks: [
        '**SHARDS** are credits for Roleplay. **VELLUM** are credits for Storytelling. Together we call them "credits".',
        { list: [
          '**They are virtual and spend-only.** You use them to pay for features inside CHIMERA. For example, SHARDS pay for replies from paid AI models, and VELLUM pays for scene illustrations.',
          '**They are not money.** Credits have no cash value. Buying them does not open a bank account, a deposit account, a wallet that earns interest, or any other financial account with us or with anyone else. They are not electronic money, a security or a cryptocurrency. {{CONFIRM:Have a lawyer confirm how your country regulates virtual credits and stored value}}',
          '**You cannot redeem them for cash.** You cannot withdraw, exchange or cash out credits you bought or earned, and you cannot convert SHARDS into VELLUM or the other way round. Each stays in its own space.',
          '**They cannot be given or sold.** Credits cannot be transferred to another member, traded, or sold on or off CHIMERA. Any attempt may lead to the credits being cancelled and the account closed.',
          '**They are a licence, not property.** You receive a limited right to use credits inside CHIMERA under these Terms.',
        ] },
        '**How you get them.** New accounts receive a one-time welcome credit of SHARDS, and VELLUM is granted once when a member enters Storytelling. You can earn SHARDS by choosing a path at a story turning point in Roleplay, within the daily limits shown in the app. You can buy SHARDS in packs: the price of each pack is shown before you pay. We may change what is offered, the number of credits in a pack, bonuses and prices. VELLUM cannot be bought at the moment. {{CONFIRM:Confirm whether VELLUM will ever be sold}}',
        '**How you spend them.** Each paid feature shows its price in credits before you use it. For a paid AI model, the SHARDS are taken when a reply starts, and are given back if no reply reaches you. Asking for a new version of a reply is a new reply and costs again. A scene illustration takes its VELLUM when it starts and gives it back if the picture cannot be made.',
        '**Expiry.** The welcome VELLUM never expires. For SHARDS: {{TODO:CREDIT_EXPIRY}}.',
        '**Mistakes and abuse.** We may correct errors in your balance, and cancel credits obtained by fraud, by exploiting a bug, or in breach of these Terms.',
        '**If we change or end a feature or the service.** {{TODO:CLOSURE_BALANCE}}',
      ],
    },
    {
      id: 'subscriptions',
      title: '13. Subscriptions and other paid features',
      blocks: [
        'CHIMERA does not offer subscriptions today. A "Patron" membership is mentioned in the product as not live yet, and it is not available.',
        'If we introduce a subscription, we will show its price, billing period, renewal, trial and cancellation terms before you pay ({{TODO:SUBSCRIPTION_TERMS}}), and these Terms will be updated.',
      ],
    },
    {
      id: 'payments',
      title: '14. Payments, fees, taxes, refunds and chargebacks',
      blocks: [
        '**Payment providers.** Payments are handled by third-party payment providers. At present, packs of SHARDS are paid through Stripe Checkout. The provider or providers we will use in production: {{TODO:PAYMENT_PROVIDER}}. The seller of record is {{TODO:MERCHANT_OF_RECORD}}. The provider\'s terms and privacy notice apply to the payment. We do not receive or store your full card number: the provider collects it. We keep a record of your order and the credits delivered.',
        '**Prices and fees.** The price shown at checkout is what you pay, in the currency shown (currently US dollars). Payment-processing fees and CHIMERA\'s platform fees are included in our prices and are not added for you at checkout. {{CONFIRM:Confirm}}',
        '**Taxes.** {{TODO:TAX_TREATMENT}}',
        '**Delivery.** Credits are added to your account after the payment is confirmed. If a delivery fails, we retry it; you are not charged twice for the same order.',
        '**Refunds.** {{TODO:REFUND_POLICY}} Our draft position: purchases are final once credits have been delivered, except where the law gives you a right to a refund, or where a payment was taken in error or twice. {{CONFIRM:Confirm the refund position}} This does not affect your legal rights.',
        '**Chargebacks.** Please contact us before disputing a payment with your bank or card issuer. If you open a chargeback or payment dispute, we may suspend your account, cancel the related credits, and recover what the dispute cost us, as the law allows.',
      ],
    },
    {
      id: 'creator-support',
      title: '15. Supporting creators',
      blocks: [
        'Tipping creators and gifting SHARDS are not available today: SHARDS cannot be transferred (see section 12), and the product says so where tips and gifts would appear.',
        'If we introduce a way to support creators, we will describe it before it launches, and these Terms will be updated. Support given through such a feature would not be paid with SHARDS or VELLUM, and would not be refundable except as the law requires or as we state then. {{CONFIRM:Confirm}}',
      ],
    },
    {
      id: 'creator-earnings',
      title: '16. Creator Earnings and payouts (planned, not available yet)',
      blocks: [
        { note: 'Creator Earnings do not exist in CHIMERA today and nobody can currently be paid. This section sets out how it is planned to work, so that the rules are clear before any money is involved. Everything marked below still has to be decided.' },
        { list: [
          '**A separate balance.** Creator Earnings would be a separate balance for eligible creators. It is different from SHARDS and VELLUM: it cannot be bought, and your own SHARDS and VELLUM can never be turned into Creator Earnings or paid out.',
          '**Eligibility.** {{TODO:CREATOR_ELIGIBILITY}} At minimum, a creator must be an adult, comply with these Terms, and complete identity and tax checks.',
          '**What creates earnings.** {{TODO:CREATOR_EARNINGS_SOURCES}}',
          '**Our fee and payment fees.** CHIMERA would keep {{TODO:PLATFORM_FEE}}. Payment-processing fees and payout fees would be {{CONFIRM:Decide who pays processing and payout fees}}.',
          '**Payouts.** Payouts would be sent by {{TODO:PAYOUT_PROVIDER}} once the balance reaches the minimum, on the schedule and in the currency set out here: {{TODO:PAYOUT_TERMS}}. Available in: {{TODO:SUPPORTED_REGIONS}}.',
          '**Checks.** Before a payout we may require identity checks and tax information ({{TODO:CREATOR_TAX_KYC}}). Without them, we may hold the balance.',
          '**Holds and reversals.** We may hold, reduce or cancel earnings that come from fraud, a payment that is refunded or charged back, or a breach of these Terms.',
          '**Taxes.** Creators are responsible for the taxes on what they receive. We may be required to report payments to tax authorities.',
        ] },
      ],
    },
    {
      id: 'third-parties',
      title: '17. Third-party services',
      blocks: [
        'CHIMERA relies on other companies, for example for hosting, the database and sign-in, AI models, payments and (later) age verification. Their own terms apply when you use their parts of the service, and we are not responsible for what they do on their own, to the extent the law allows. See the [Privacy Policy](/privacy) for the list.',
      ],
    },
    {
      id: 'ip-complaints',
      title: '18. Copyright and other intellectual-property complaints',
      blocks: [
        'If you believe content on CHIMERA infringes your copyright or other rights, write to {{TODO:IP_AGENT}} with: who you are; what the protected work is; where the content is (a link); a statement that you believe in good faith that the use is not allowed; a statement that the information is accurate and that you are the owner or authorised to act for the owner; and your signature. {{CONFIRM:Have a lawyer check the notice requirements for your jurisdiction}}',
        'If we remove your content because of a complaint and you think that is a mistake, you can send us a reply explaining why, and we will review it. We may close the accounts of people who repeatedly infringe.',
      ],
    },
    {
      id: 'our-rights',
      title: '19. Our rights in CHIMERA',
      blocks: [
        'CHIMERA, its name, logo, design, software and the characters, text and images we create ourselves belong to us or our licensors. We give you a personal, limited, non-exclusive, non-transferable licence to use the service under these Terms. You may not copy, sell or exploit any part of it except as these Terms or the law allow.',
      ],
    },
    {
      id: 'disclaimers',
      title: '20. Disclaimers',
      blocks: [
        'CHIMERA is provided "as is" and "as available", and is in early development. To the extent the law allows, we do not promise that it will always be available, error-free or secure, that AI output will be accurate or suitable, or that content will never be lost. Keep your own copy of anything that matters to you.',
        'Nothing in these Terms limits rights that the law gives you as a consumer and that cannot be limited.',
      ],
    },
    {
      id: 'liability',
      title: '21. Limit of liability',
      blocks: [
        'To the extent the law allows, we are not liable for indirect or consequential loss (such as lost profits or lost data), and our total liability to you for any claim about the service is limited to {{TODO:LIABILITY_CAP}}.',
        'Nothing excludes or limits liability that cannot be excluded or limited by law, such as liability for fraud, or for death or personal injury caused by negligence. {{CONFIRM:Have a lawyer review this section for your jurisdiction}}',
      ],
    },
    {
      id: 'indemnity',
      title: '22. If your content causes a claim',
      blocks: [
        'If a third party makes a claim against us because of your content or your breach of these Terms, you agree to help us deal with it and to cover our reasonable losses, to the extent the law allows. {{CONFIRM:Indemnities are restricted for consumers in many places; have a lawyer decide whether to keep this}}',
      ],
    },
    {
      id: 'changes',
      title: '23. Changes to the service and to these Terms',
      blocks: [
        'We may change these Terms, for example when features, laws or our business change. For significant changes, we will notify you in the service or by e-mail at least 30 days before they take effect, unless a change is needed sooner for legal or safety reasons. {{CONFIRM:Confirm the notice period}} If you keep using CHIMERA after a change takes effect, you accept the new Terms. If you do not agree, you can stop using the service and close your account.',
        'When you sign up, the version of the Terms you accepted is saved with your account. The version in force is the one shown on this page.',
      ],
    },
    {
      id: 'law',
      title: '24. Governing law and disputes',
      blocks: [
        { note: 'This section needs a legal decision from the owner. It is deliberately not filled in: which law and courts apply depends on where the operator is established and where members live.' },
        'These Terms are governed by {{TODO:GOVERNING_LAW}}. Disputes will be brought to {{TODO:DISPUTE_FORUM}}. Arbitration and class-action rules: {{TODO:DISPUTE_PROCESS_DECISION}}.',
        'Before starting a formal dispute, please contact us at {{TODO:CONTACT_EMAIL_LEGAL}} and give us a chance to put things right. If you are a consumer, you keep any rights you have under the mandatory consumer laws of the country where you live, including the right to bring a claim in your local courts.',
      ],
    },
    {
      id: 'general',
      title: '25. The rest',
      blocks: [
        { list: [
          '**Whole agreement.** These Terms and the Privacy Policy are the whole agreement between you and us about CHIMERA.',
          '**If part is invalid.** If a part of these Terms is found unenforceable, the rest still applies.',
          '**No waiver.** If we do not enforce a right straight away, we do not give it up.',
          '**Transfers.** You may not transfer your rights under these Terms. We may transfer ours as part of a reorganisation, merger or sale of CHIMERA.',
          '**Events beyond our control.** We are not responsible for failures caused by events we cannot reasonably control.',
          '**Language.** These Terms are written in English. If a translation differs, the English text applies unless the law says otherwise.',
        ] },
      ],
    },
    {
      id: 'contact',
      title: '26. Contact',
      blocks: [
        'Questions about these Terms: {{TODO:CONTACT_EMAIL_SUPPORT}}. Legal notices: {{TODO:CONTACT_EMAIL_LEGAL}}. Reports of abuse: {{TODO:CONTACT_EMAIL_REPORTS}}. Postal address: {{TODO:REGISTERED_ADDRESS}}.',
      ],
    },
  ],
};
