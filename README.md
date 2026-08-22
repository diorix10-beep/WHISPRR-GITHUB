# CHIMERA / WHISPRR

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
