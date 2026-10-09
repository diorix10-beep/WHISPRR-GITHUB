// Texts posted by setup_chimera_server.mjs into the channels it creates. Edit freely: nothing here is posted
// anywhere else, and nothing is posted into a channel that already existed.
// Written to match what CHIMERA is today. Only list facts that are true; do not add dates or promises.

export const SITE = 'https://www.chimera.it.com';

export const RULES = {
  title: 'Server rules',
  description: [
    '**CHIMERA is for adults. This server is 18+.** If you are under 18, please do not join. Staff will remove anyone who says or shows that they are under 18.',
    '',
    '**1. Be kind.** No harassment, hate, threats or targeting of people. Disagree with ideas, not with people.',
    '**2. Nothing sexual or explicit, anywhere.** This server has no age-restricted channels. This includes text, images, links and "just a joke".',
    '**3. Never sexualise minors, or characters who are or look like minors.** This includes age regression and "she is actually 1000 years old". It is an instant ban, and we report it where the law or Discord requires it.',
    '**4. Keep private things private.** No sharing other people\'s personal information, private messages or private chats without their permission.',
    '**5. No spam, scams or ads.** No unrequested promotion, invites to other servers, or links that ask for logins or payments.',
    '**6. Credit and respect creators.** Share your own characters and stories. If you built on someone\'s work, say so. Do not post work you do not have the right to share.',
    '**7. Protect your account.** CHIMERA staff will never ask for your password. Never post passwords, payment details or access codes.',
    '**8. Use the right channel.** Bugs go in the bug forum, ideas in the ideas channel.',
    '**9. Staff decisions.** If you disagree with a moderator, message another moderator politely. Do not argue in public channels.',
    '',
    'CHIMERA characters are AI. Please do not treat anything an AI says as advice, and if you are going through something hard, reach out to someone you trust or a local support service. We are a community, not a crisis service.',
    '',
    'Staff may warn, time out or remove anyone who breaks these rules. By staying here you agree to them.',
  ].join('\n'),
};

export const WELCOME = {
  title: 'Welcome to CHIMERA',
  description: [
    'CHIMERA is a place to **roleplay with AI characters** and to **write stories** with AI help. It is in early development, so things change and your feedback matters.',
    '',
    `**Start here:** ${SITE}`,
    '',
    '**On this server**',
    '• Read the rules in <#RULES> first. This server is 18+.',
    '• Introduce yourself, share characters and stories, and tell us what works and what does not.',
    '• Found a bug? Use the bug forum. Have an idea? Use the ideas channel.',
    '',
    'We are glad you are here.',
  ].join('\n'),
};

export const FAQ = {
  title: 'Frequently asked questions',
  description: [
    '**What is CHIMERA?**',
    'A site for roleplay with AI characters and for storytelling with AI help.',
    '',
    '**Who can use it?** Adults only (18+).',
    '',
    '**Is it free?** You can chat for free with the default engine, SUPERNOVA. Some other engines in the Model House are still in testing; when they open, they will use SHARDS, CHIMERA\'s in-app reserve.',
    '',
    '**Can I choose which AI writes my replies?** Yes, in the Model House on the site. More choices will appear over time.',
    '',
    '**Is there adult (Mature) content?** Not yet. It will only ever be for members whose age has been verified, and age verification is not open yet (the Guardian\'s Library page shows "coming soon"). Until then CHIMERA shows General content only, and this server stays free of explicit content either way.',
    '',
    '**Does the AI remember our scene?** CHIMERA can suggest memories from your scene, and you approve what is kept. You can also pin messages and set reply length and banned words per scene.',
    '',
    '**Can I import a character from elsewhere?** Yes, character cards in the common Tavern format (.png or .json) can be imported on the Create page. Cards marked as adult content are not imported yet.',
    '',
    '**I found a bug.** Please post it in the bug forum: what you did, what you expected, what happened.',
  ].join('\n'),
};

export const LINKS = {
  title: 'Official links',
  description: [`• CHIMERA: ${SITE}`, '', 'Anything not listed here is not official. Staff will never DM you asking for your password or payment details.'].join('\n'),
};
