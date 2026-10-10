# CHIMERA / WHISPRR

> **CHIMERA is being rebuilt from scratch on this branch**, keeping its two modes:
> **storytelling** and **roleplay**. SHARDS and VELLUM are carried over unchanged.
> See `apps/chimera/README.md` for what exists now and what comes next.
> WHISPRR, `packages/shared` and the Supabase migrations are untouched. The previous
> CHIMERA code is still available in git history, for example on the branch
> `codex/chimera-phases1-6-release`.

This repository contains the active development workspace for CHIMERA and
WHISPRR.

CHIMERA is Dior's official realm network for AI characters, roleplay,
storytelling, worldbuilding, personas, lorebooks, and creator-led fiction.

WHISPRR is a separate social and creator-oriented product in the same broader
ecosystem. Do not assume changes for one product automatically apply to the
other.

## Current public status

CHIMERA is in early realm access.

Some parts of the roleplay website are already playable, while other systems are
still experimental or in active development. The public portal is designed to be
honest about that:

- the official web realm is available at https://www.chimera.it.com;
- the PWA can be installed where supported by the browser;
- the source-available developer preview can be run locally by advanced users;
- production data, secrets, and official service credentials are not included in
  this repository.

## Join CHIMERA and contribute

We welcome contributors from all backgrounds. CHIMERA is built around creativity,
collaboration, and human-led storytelling. We are especially interested in people
who enjoy building creative technology, improving user experiences, and exploring
responsible AI-assisted development.

You do not need a computer science degree, years of professional experience, or
expert knowledge of every framework. Beginners, students, self-taught developers,
designers, testers, AI enthusiasts, writers, and creative technologists are all
welcome.

### Ways to contribute

- front-end development and UI polishing
- bug fixes and reliability improvements
- accessibility work and usability improvements
- QA testing and issue reporting
- documentation and contributor onboarding
- AI feature exploration and prompt design
- storytelling, worldbuilding, and roleplay experience improvements
- developer experience and project tooling improvements

### Beginner-friendly contributions

We especially encourage contributions such as:

- documentation updates
- simple UI fixes
- accessibility improvements
- basic tests
- small bug fixes
- onboarding and setup improvements
- issue triage and community feedback

### Current collaboration model

CHIMERA is currently in an early community development phase. Collaboration is:

- international
- remote
- voluntary
- flexible in availability
- primarily conducted in English

This project is source-available and contributor-friendly, but it is not
currently licensed as OSI-approved open source. Brand, official assets, and
official product identity remain protected.

### AI-assisted development

CHIMERA welcomes responsible AI-assisted development. Contributors may use tools
such as Copilot, ChatGPT, Cursor, Claude, and similar assistants for learning,
exploration, scaffolding, debugging, and documentation.

However, contributors remain responsible for:

- understanding the code they submit
- reviewing AI-generated output
- testing changes before submission
- protecting secrets and credentials
- avoiding unsafe or unverified code

### How to start

1. Review the project and current issues.
2. Choose a task that matches your skill level.
3. Fork the repository and create a focused branch.
4. Keep changes small and easy to review.
5. Test your work where possible.
6. Open a pull request with a clear summary.
7. Participate respectfully in code review and feedback.

### Community values

We value:

- creativity
- collaboration
- respect
- transparency
- accessibility
- learning
- responsible AI use
- human-centered design

If you're interested in helping build CHIMERA, we would be happy to hear from you.
Please start by checking the repository issues, proposing a small improvement, or
asking a clear question in the project communication channels.

## Run CHIMERA locally

Prerequisites:

- Node.js and npm;
- Docker for local Supabase;
- local `.env` values configured from `.env.example`;
- model provider keys for AI replies, if you want live AI generation locally.

```bash
git clone https://github.com/diorix10-beep/WHISPRR-GITHUB.git
cd WHISPRR-GITHUB
npm install
cp .env.example .env
npm run supabase:local:start
npm run dev:chimera:local
```

Then open the local CHIMERA dev server shown by Vite, usually:

```text
http://127.0.0.1:5174
```

## Useful scripts

```bash
npm run dev:chimera:local
npm run typecheck:chimera
npm run build:chimera
npm run supabase:local:start
npm run supabase:local:stop
npm run supabase:local:status
```

## License and brand

CHIMERA is source-available for learning, local development, and contribution.
It is not currently licensed as OSI-approved open source.

See:

- [LICENSE](./LICENSE)
- [BRAND.md](./BRAND.md)

The CHIMERA name, logo, official realms, official characters, official lore,
official economy, and brand identity remain protected. Forks and local builds
must not pretend to be Official CHIMERA.

## Security

Never commit `.env` files, API keys, Supabase service-role keys, model provider
keys, payment credentials, or production database dumps.

Production Supabase, payment, analytics, and deployment systems are separate
from local development.
