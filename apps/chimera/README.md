# CHIMERA (rebuilt)

CHIMERA is being rebuilt from scratch with two modes: **roleplay** and **storytelling**.
The previous app is still in git history (for example on `codex/chimera-phases1-6-release`).

## What exists now (step 1)

- Home, Discover (search and categories), character page, sign in / sign up.
- Ratings on every character. **Mature and NSFW are hidden unless the member confirmed they are 18+ (or is verified) and opted in**
  (`supabase/migrations/20261006120000_chimera_age_verification_gate.sql`, `useAdultContentAccess`).
- Guardian's Library: shows age status, the "I am 18 or older" confirmation and the adult toggle. **Age verification is not connected to a provider yet**, so nobody is *verified*; a confirmation is only a declaration.
- Terms and Privacy are **drafts** (see "Legal pages" below).

## Legal pages (`/terms`, `/privacy`)

- **Draft, for legal review.** Both pages show a "DRAFT, NOT YET IN FORCE" notice, say they are not legal advice and have not been
  reviewed by a lawyer, and mark every missing detail (**TODO**) and every drafted choice that needs approval (**To confirm**).
  Do not remove the notice until a lawyer has reviewed the text and the markers are gone.
- **Where the text lives:** `src/legal/terms.ts` and `src/legal/privacy.ts` are plain data (sections of paragraphs, lists, notes and
  cards), rendered by `src/components/legal/LegalDocumentView.tsx`. Inline markup: `**bold**`, `[text](/path)`, `{{TODO:KEY}}`,
  `{{CONFIRM:reason}}`.
- **Missing facts** (legal entity, contacts, governing law, payment provider, retention periods, creator payout rules, and so on) are
  registered once in `src/legal/placeholders.ts`. Set a key's `value` and every place that uses it is filled in.
  `docs/legal/OPEN_QUESTIONS.md` lists every open question, where it is used, and what the product does that the text depends on;
  regenerate it with `npm run legal:questions`.
- **Only what the code establishes is stated as fact.** `tests/legal-documents.test.mjs` checks that every topic requested is covered,
  that no placeholder is invented, and that the text still matches the code: a new use of cookies or browser storage, a tracking library,
  or a new external service called by the server fails the test until the Privacy Policy is updated.
- **Not done on purpose:** `CURRENT_LEGAL_VERSION` (the version saved at sign-up) was not changed, because a draft must not be recorded as
  accepted. Bump it when the final text is published. There is no mechanism yet to make existing members accept a new version.

## Roleplay (step 2)

- **Begin a scene** on a character page creates a one-to-one scene (`create_chimera_scene`) and opens `/chats/:id`.
  The character's own greeting opens it. `/chats` lists your scenes.
- Write as **Say**, **Act** (wrapped in `*asterisks*`) or **OOC** (wrapped in `(OOC: ...)`). **Regenerate** replaces the latest reply
  and keeps the old one in `response_versions`. A failed reply shows **Try again** and never sends your line twice.
- **Memory**: each scene has an editable memory (`save_chimera_scene_canon`) that is sent to the character every turn, in front of
  the last 32 messages (28,000 characters). Older messages are not summarised yet, so anything that must last belongs in Memory.
- **Guided Story Path** (turning points, +10 SHARDS once) is carried over from the previous CHIMERA.
- Server: `api/ai-chat.ts` (Gemini 2.5 Flash) with the prompt in `api/_lib/roleplayPrompt.ts`. It checks membership, applies the
  adult-content gate before any model call, uses the request-protection reservation (rate limits, no double charge on retry),
  and returns sanitized errors. `api/roleplay-turning-point.ts` has the same gate.
- Not in this step: personas picker, group scenes, branches, character memories, images, voice, character creation.
  Persona text is used if the member already has a default persona from before.

## Creating characters (step 2b)

- **Create** in the roleplay menu opens `/create`; `/my-characters` lists your characters; `/create/:id` edits one (owner only).
- Saved through `save_ai_character_soul`. On edit, every field the form does not show is sent back unchanged, so characters made
  with the old creator lose nothing.
- **Form layout** (inspired by the usual character-creator pattern, written in our own words): picture, character name, optional chat
  name, tagline, bio, then three foldable sections: *Character settings* (category, tag chips, content rating, visibility), *Character
  definition* (personality, an optional *Full definition*, scenario, opening message, example dialogue, and a folded *More guidance*: speech style, lore, phrases to
  avoid, notes for the AI) and *Character preview*. Create stays disabled until a name, a personality and an opening message exist, and
  the page says which is missing. Only fields that really reach the chat prompt are offered (the unused `suggested_persona_name` is not).
- **Name and chat name.** The editor refuses to open ("Character not found") if the profile name cannot be read, because it would otherwise show the nickname as the name and overwrite it on save. The card name is the profile's display name; `chat_name` is the nickname used in chats and by the AI (it
  defaults to the name). Cards (Discover, character page, My characters) read the display name in a second query and fall back to
  `chat_name` if it cannot be read. A V3 card's `nickname` imports as the chat name.
- **No visible limits.** Nothing shows "n / max" and long writing is accepted: the database has no length checks, and the form only
  shows a rough token size (about four characters per token, an estimate). There is **one real ceiling**: everything written for the AI
  is sent with every reply, and the chat refuses a request once the whole prompt passes 100,000 characters, so a definition above
  `MAX_DEFINITION_CHARACTERS` (60,000, the bio excluded) could never answer. *Full definition* is saved as `system_character_definition`, which the chat prompt already renders as "Detailed Character Definition" right after the personality (no migration). The count follows what the chat really sends: the opening message counts twice (system prompt and opening turn), and fields kept from older versions of the character (`system_definition`, `system_character_definition`, `rp_definition`, `example_conversations`) count too. Saving above it explains how many tokens to cut, without
  printing the number, and the preview warns well before. Short fields stay short because cards show them (names 100, tagline 200;
  tags up to ten). The Bio has **no limit**: the AI never reads it and the database column is plain `text`. Discover never downloads the Bio (cards show the tagline only), so a very long Bio cannot slow the grid. On the profile page a tagline
  stays in the header and a long Bio is folded under "About this character". Not enforced in the database: a direct call can still store a longer text, which the chat would then refuse.
- **Picture.** JPG, PNG or WebP up to 5 MB, uploaded to the existing public `profile-photos` bucket under the member's own folder
  (`<user id>/character-avatars/…`), so no migration is needed. It is optional. **There is no image moderation yet**, and the bucket is
  public to anyone with the address: acceptable while public publishing is founder-only, to be revisited before it opens.
- Content rating: General, or Mature for members who confirmed they are 18+ and have adult content on (otherwise Mature is shown but locked, with a link to the Guardian's Library). An existing adult rating is kept on save; General can be chosen at any time while adult content is on. A card marked adult can be imported only by a member who may use Mature, and arrives as Mature.
- New characters are **General** unless Mature is chosen. Visibility: **private** (default), **unlisted** (link only) or **public**.
- **Public publishing is founder-only during the beta** (`profiles.role = 'founder'`). It is enforced in the database by
  `supabase/migrations/20261009000000_chimera_character_publication_guard.sql`, so a member cannot bypass the form with a direct
  update. **Apply that migration before relying on it.** Until then only the form (not the database) blocks members from choosing Public.
- A trigger on `ai_characters` now refuses a new Mature or NSFW rating from a member who is not eligible. Still a known gap: explicit text under a General rating is not detected at creation.

## Personas (who you are in a scene)

- **Personas** (`/personas`, `/personas/new`, `/personas/:id`): name, pronouns, age, gender, occupation, about, personality, appearance,
  backstory and a default persona. They are private: the `is_public` flag is never set from the app.
- **Begin a scene** shows a **Play as** picker (the default persona is preselected, or "Myself, no persona") and sets it on the new scene
  with `set_chimera_scene_persona`. In the scene, a **Playing as** switch is available only **before the first message**: the server and
  the database scope the history and memory by persona, so switching later would make the character forget who you were.
- The server sends the persona's details to the character (this already existed in `api/ai-chat.ts`).
- **Safety:** `api/ai-chat.ts` refuses a Mature or NSFW scene when the persona's age clearly says under 18 (digits, number words,
  "minor", "teen"). An empty or unclear age is not refused; the prompt's safety boundaries still apply. The persona form warns about it.
- Not in this version: public / shared personas, persona avatars, a persona-specific greeting.

## Storytelling (step 3, first version)

- **Writer's Desk** (`/workspace`): your stories. **New story** (`/stories/new`), **story manager** (`/stories/:id/edit`: details,
  add / delete chapters, delete story) and the **chapter editor** (`/stories/:id/chapters/:chapterId/edit`).
- **The editor never loses text.** Every keystroke is kept on the device (`draftJournal`); the server save runs 1.5 s after the last
  keystroke and also when leaving the page. It writes only if the chapter has not changed elsewhere (`updated_at` check): on a conflict
  it stops, tells the writer and overwrites nothing. A save failure keeps the text and retries on the next change. Text left on the
  device by a crashed tab is offered back (Restore / Discard). Publish and unpublish save first.
- **Reading needs a sign-in for now**: the database only lets signed-in members read `stories` and `story_chapters`, so the reader pages are behind the sign-in.
  Opening them to visitors needs narrow `anon` SELECT policies (a security decision for the owner and Codex).
- **Reading:** `/library` (public stories that have a published chapter, search and genre), `/stories/:id` (published chapters; the
  author also sees drafts) and `/stories/:id/chapters/:chapterId`. Chapter text is rendered as plain text.
- **Public publishing is founder-only during the beta**, enforced by
  `supabase/migrations/20261009010000_chimera_story_publication_guard.sql`. Stories have **no content rating** yet, so a public story
  cannot be filtered for minors. The `stories.visibility` column **defaults to public**: the new pages always send an explicit value,
  and the trigger also blocks inserts that forget it. **Apply that migration before relying on it.**
- Not in this version: the AI co-author (will use VELLUM and only suggest), scene illustrations, comments and votes, worlds,
  choose-your-own-adventure branches, collaborators, a story word count.

## Scene tools (chat)

The **Scene** button in a chat opens the tools. Everything here is private to the player.

- **Name this scene:** a custom title (`conversations.name`, up to 80 characters) shown in the chat and in Your scenes, with the
  character's name beneath. Empty means the character's name.
- **Reply length:** Short, Medium (default) or Long. It is an instruction in the prompt; Long also raises the output budget.
- **Words to avoid:** up to 500 characters, sent to the model as a "do not use" line. It adds to the creator's own banned words.
- **Pinned messages:** up to 8, using the pin under each message. Pins outside the recent window are sent in front of the model
  (600 characters each, 3000 in total), with the same persona scope as the history. Pins inside the window are not repeated.
- **Start over:** creates a new scene with the same character (same title and persona, optionally the same memory notes, same length
  and words). The old scene is kept as it was. Pins are not carried over.
- **Delete scene:** after a confirmation, removes the scene, its messages and its memory for good.

Settings live in `chimera_scene_settings` (migration `20261009020000_chimera_scene_settings.sql`): one row per scene and player, only
readable and writable by that player while they are a member. `api/ai-chat.ts` reads it with the player's own session and, if it cannot
be read (for example before the migration is applied), answers with the defaults. Apply the migration before or after the deploy; both work.

## Automatic memory (suggested by the story, approved by you)

Beyond the notes you write yourself in **Memory**, the story can suggest long-term memories.

- Every few messages (once the player has written 8 new ones since the last look, and only on the 8th, 12th, 16th… message) the chat
  page calls `api/chimera-memory.ts`. The database decides whether there is anything to look at (`claim_chimera_memory_window`):
  suggestions switched off, fewer than 8 new messages, or 10 suggestions already waiting all end the call at once, with no model call.
- When there is a window, Gemini reads up to the last 40 messages (the newest reply is left out because it can still be regenerated) and
  proposes at most 5 short facts, each citing the lines it comes from. The server keeps only facts of a sane length, with real sources,
  that the player does not already have. They are stored with the existing `propose_chimera_memory` as **proposed**.
- **Nothing is used by the character until the player keeps it** (`approve_chimera_memory`): for this scene, or for every scene with that
  character. Each suggestion can be reworded or dismissed. Approved memories are private, scoped to the player's persona, and are sent to the
  character in a capped block (24 facts, about 3000 characters) after the scene canon. The canon wins if they disagree.
- The window is claimed once even if two requests arrive together, and handed back if the provider call fails. If the model answers
  with nothing usable, the window stays read, so there is no endless retry.
- Mature / NSFW scenes follow the same adult-access rule as the chat. The extraction prompt keeps sexual content out of the facts and
  never records anything sexual involving a minor.
- The switch **Suggest things to remember** is in Scene tools (on by default, per scene).

Migration `20261009030000_chimera_auto_memory.sql` adds two columns to `chimera_scene_settings` (`auto_memory`, `memory_cursor_at`) and the two
functions above. Apply it **before** the deploy: the screen reads the settings with `select *`, so it still works without the columns,
but suggestions do nothing until they exist.

## Guardian's Library: age settings (temporary confirmation, real check later)

There is no age-check provider yet (`AGE_VERIFICATION_LIVE = false`; Yoti is planned). Until there is, a member can say **"I am 18 years old or
older"** in the Guardian's Library. That is a **declaration, not a verification**: it is stored as `age_verification_status =
'self_attested_adult'` (with `adult_attested_at` and `adult_attestation_version`), never as `verified_adult`, and the provider columns
(`age_verified_at`, `age_verification_provider`, `age_verification_reference`) stay empty. The page labels it "18+ confirmed by you".

- **Who can see Mature / NSFW:** only an account whose status is `verified_adult` or `self_attested_adult` AND that switched adult content on
  (the opt-in is a separate step). Everyone else sees General only. The database enforces it (RLS, `get_my_adult_content_access`, the server gate).
- **Writing the status:** members cannot write any age column (guard trigger). Only `attest_my_adult_status()` / `withdraw_my_adult_attestation()`
  (as the signed-in member) and `set_age_verification()` (service role, for Yoti) change it. A verified account is never downgraded by the member.
- **Giving a character a Mature rating** needs the same eligibility plus the opt-in (trigger on `ai_characters`). Keeping an existing rating,
  or moving to General, is always allowed by the trigger. The creator form offers General and Mature. Mature characters are hidden from
  everyone, their creator included, while adult content is off, so to edit one (even to move it to General) the creator turns adult content
  back on first: the confirmation is one tick, and there is deliberately no owner-only read path around the age gate.
- **When Yoti goes live:** change `chimera_private.adult_status_allows` to accept only `verified_adult` (one function decides every rule), set
  `AGE_VERIFICATION_LIVE = true`, and decide whether to reset `self_attested_adult` accounts to `unverified` (the guard then switches their
  adult content off). `ADULT_CONFIRMATION_LIVE` only controls whether the screens offer the confirmation.
- Migration: `supabase/migrations/20261009060000_chimera_adult_self_attestation.sql`. Tests: `tests/adult-self-attestation.test.mjs`.

## Lorebooks (roleplay only)

A lorebook holds what characters should know about their world. It is modelled on the "scripts" of Janitor AI (lorebook type only): a list, a creation
form with a colour and a **message depth**, an editor with entries, import and export of JSON, and the characters it is assigned to.

**Pages** (all private to the member): `/lorebooks` (cards with colour, entry and character counts and depth; search; sort; New lorebook; Import JSON),
`/lorebooks/new` (name, colour among 11, description, message depth 1 to 10, default 3) and `/lorebooks/:id` (the same settings, then entries: name,
keywords, text, *Always send* with a lock, *Active*, *Match capitals exactly*, priority, an optional per-entry message depth; search and sort (priority, name,
as written); Add entry, Import JSON (adds to this lorebook), Export JSON; and the member's characters to tick, with their pictures). Entries are shown
30 at a time, so a lorebook of hundreds stays light.

**Database.** The tables `lorebooks`, `lorebook_entries` and `lorebook_characters` already existed with their row-level security (the owner manages them,
links need a character the member created). `supabase/migrations/20261009070000_chimera_lorebook_depth_theme.sql` only adds three columns with defaults:
`lorebooks.scan_depth` (1 to 10, default 3), `lorebooks.theme` (the 11 colour ids, default purple) and `lorebook_entries.scan_depth` (optional override).
**Apply it before the pages that write them go live.** The reads use all columns, so a lorebook without them still opens and works with the defaults.
`20261009080000_chimera_lorebook_reply_budget.sql` adds one more: `lorebooks.reply_budget` (1,000 to 40,000, default 8,000, the size every lorebook had until now).
Same rule: apply it before this version's pages go live, because saving a lorebook writes it.

- **Private by default.** The pages create lorebooks with `visibility = 'private'` (the table's own default is `public`, so it is always set).
  Existing lorebooks keep whatever visibility they have. There is no sharing or discovery of lorebooks yet.
- **At reply time** (`api/ai-chat.ts`, `api/_lib/lorebook.ts`): the server reads, with the server key, the entries of lorebooks that are linked to the
  character **and owned by the character's creator** (so it also works for people chatting with the character, who cannot read the private lorebook).
  An entry is sent when one of its keywords appears in the last *depth* messages (the entry's own number, else its lorebook's, else 3), or when it is
  *Always send*. Chosen by priority (higher first), then the creator's order. The lorebook's *size per reply* (1,000 to 40,000 characters, 8,000 by default, set on the
  lorebook page; the largest one among a character's lorebooks counts) is the most lorebook text that goes with one reply, and one entry is cut at 20,000 or at
  that size if smaller (the full text stays saved), so a big lorebook cannot crowd out the character or the story. A bigger size lets long entries through whole
  but costs more tokens on every reply (about 4 characters per token); the editor shows what the *Always send* entries already take. Entries are read in pages, highest priority first, up to
  2,000 per character. It is added to the prompt as `## Lorebook`, after the world and before the player. A failed read, or a failed page, means no lorebook,
  never a failed reply and never half a lorebook. It runs after the adult-content check, so a locked character never gets that far.
- **JSON** (`src/lib/lorebookJson.ts`). Import reads a character card's `character_book` (V2), a SillyTavern world (entries keyed by number) or a bare list of
  entries, under the different names sites use (`keys`/`key`/`keywords`, `name`/`comment`/`title`, `constant`, `enabled`/`disable`, `priority`/`order`,
  `scan_depth`/`depth`/`message_depth`, also inside `extensions`). Entries without text are left out and an entry with no keyword uses its name; the preview says
  so before anything is saved. Export writes a `character_book` object that this page reads back. Limits: 10 MB, 2,000 entries, no prototype keys read.
  I could not check Janitor AI's own export, so the reader is deliberately tolerant; a file it cannot read gets a plain message and changes nothing.
- **From a long text.** Under the creator's *Full definition* a button "Turn it into a lorebook" cuts the text into entries (`src/lib/lorebookSplit.ts`,
  `src/components/characters/LorebookConverter.tsx`). The writer picks how the text is organised (detected: `#` lines, Episode/Chapter/Part lines, CAPITALS lines,
  numbered lines, or cut by size only, each with its entry count), then reviews every entry: name, keywords (taken from the heading, or from the most repeated
  names in the text), *Always send* (the short introduction starts on), remove. Entries are at most 2,400 characters (long sections become "Title (1)", "(2)"…),
  and no text is lost (a test checks it on a 650,000-character codex). Nothing is saved before Create; the lorebook is made private in one go (a failure
  deletes what was made and keeps the text); the field is then emptied and the lorebook is linked to the character (at once when editing, when saving when new).
- **Left out on purpose.** Janitor's "Advanced" scripts (custom JavaScript, which would run member code), test chat, history, publishing, tags and the
  lorebook picture. Matching is plain keyword search (no regular expressions, no recursion between entries). Importing a card's `character_book` while importing
  the character is not built yet (the character importer still lists it as left out; the JSON import above takes the same data). Like the rest of a character's
  definition, a lorebook can be coaxed out of the AI by someone who chats with the character. A lorebook has no content rating: explicit entries linked to a
  General character are not detected (same gap as explicit text in a General character).

## Model House (which AI writes the replies)

`/models` lists the models CHIMERA offers and lets a member pick their own. The list lives in one file, `src/lib/chatModels.ts`
(shared by the page and the chat route); `api/_lib/modelProviders.ts` talks to the providers (Gemini with `GEMINI_API_KEY_SERVER`,
everything else through OpenRouter with `OPENROUTER_API_KEY`).

- The chat route picks the model like this: the **member's choice** (`chimera_user_preferences.default_ai_model`), then the character's
  `ai_model`, then SUPERNOVA (`gemini-3.1-flash-lite`). A stored value is never trusted: it must be in the catalog, `available`, and `free`.
- **Gemini 2.5 Flash is retired on 2026-10-20** (the OpenRouter catalog lists that expiry for the whole 2.5 family). SUPERNOVA moved to
  Gemini 3.1 Flash Lite; members who saved the old id keep SUPERNOVA through `aliases`. `fallbackApiModels` lists older models to try if
  Google answers "model not found" (404, or a 400/403 saying the model is retired or unsupported); any other failure stops at once and
  never falls back. Memory suggestions and turning points use the same default engine and fallback (`geminiGenerate`), and no longer send a
  `thinkingConfig`, which is not valid for every model. `thinkingHeadroom` adds output tokens for models that think before answering.
- **Today only SUPERNOVA is usable.** AURELIA and NIVALIS are shown as "Coming soon" (they come from the old site).
- **Paid models in testing (testers only).** PULSAR (DeepSeek V4.1 Flash, 3 SHARDS), QUANTUM (Mistral Large 4, 5), HELIOS (Gemini 3.8 Flash, 7)
  and ECLIPSE (Claude Sonnet 5.5, 18) are in the catalog with `testersOnly: true`: they are listed and usable **only** by members in
  `chimera_model_testers` (migration `20261009050000_chimera_model_testers.sql`; rows are added by hand in the SQL editor, members cannot
  add themselves). Everyone else sees only SUPERNOVA, and a saved or recommended paid model is ignored for them. The route reads the
  member's own row with their session; a missing table or failed read means "not a tester". To open a model to everyone, remove
  `testersOnly` from its entry. Prices are about twice the provider's cost for a typical reply (10k tokens in, about 1.5k out including a
  little reasoning) at the best pack price (about 0.42 cent per SHARD); **none of this has been run against OpenRouter yet**, which is what
  the test phase is for. Reasoning is kept minimal (`reasoningEffort`): Gemini 3.8 Flash and Claude Sonnet 5.5 cannot turn it off, and hidden
  reasoning tokens are billed by the provider, so check the real cost per reply on OpenRouter's activity page before opening them up.
- **Paying with SHARDS.** A `tier: 'shards'` model is usable only when it is `available` **and** has a
  `shardsCost` (a whole number, 1 to 10 000, per reply); without a valid price it stays unusable, so a model can never be free by
  mistake. Only the player's own choice can select a paid model: a creator's recommended `ai_model` is honoured only if free.
  - The route calls `charge_chimera_reply` **after** the request is reserved and checked, and **before** the model is called. It takes
    the price from `shards_wallets` in one transaction, writes a `creative_spend` ledger line, and stores one row in
    `chimera_private.shards_charges` keyed by the request id. Repeating the same request finds the open charge and takes nothing more.
  - Not enough SHARDS: the route answers **402** before calling the model, and nothing is taken.
  - No reply delivered (model error, timeout, bad output): the route calls `refund_chimera_reply` (a `refund` ledger line, once). It
    refunds nothing for a reply that was saved, and nothing to a request another attempt has taken over (lease check).
  - If the server stops between charging and refunding, the next charge for that member first returns every charge whose request
    ended without a reply (`failed`, expired, or gone). A member who never chats again is not swept: reconcile from
    `chimera_private.shards_charges where state = 'charged'` joined to `ai_requests`.
  - A regeneration is a new model call and costs the price again. Free models never touch the wallet.
  - The three functions are for the service role only. Members still cannot write to the wallet or ledger (row-level security gives
    them read access to their own rows only).
  - Code: `supabase/migrations/20261009040000_chimera_reply_billing.sql`, `api/_lib/replyBilling.ts`, tests in
    `tests/reply-billing.test.mjs` and `tests/chat-models.test.mjs`.
  - To switch a paid model on: set its `shardsCost`, make sure the provider key is set in Vercel, set `status: 'available'`.
    Checkout (buying SHARDS) is a separate matter: see the Stripe note below.
- An `uncensored` model would only ever be used in a scene the member is verified and opted in for. None exist; the decision is to add
  none before age verification and a content check at character creation.
- If a chosen model's provider key is missing the route answers 503 naming the model and pointing to the Model House, **before** any
  capacity is reserved. It never silently swaps to another model. The reservation fingerprint includes the model id.
- To add a model: add an entry to `CHAT_MODELS` with the provider's own id, set `OPENROUTER_API_KEY` in Vercel (production **and** preview),
  and set `status: 'available'`. The page offers a choice as soon as two models are usable.
- No database change: this reuses `chimera_user_preferences.default_ai_model` and `ai_characters.ai_model`.

## Importing a character card

On **Create** (not when editing), **Choose a card file** reads a character card made elsewhere: the Tavern / SillyTavern V1, V2 and V3
formats, as a `.json` file or as a `.png` with the card embedded (`chara` or `ccv3`). It happens in the browser (`src/lib/characterImport.ts`);
the file is never uploaded, and importing only **fills the form**. Nothing is saved until the person reads it through and presses Create,
and it starts private like any new character.

- Mapping: name, first message, scenario, example dialogue and tags come across; the card's `description` and `personality` become
  Personality; the creator's notes become About. `{{char}}` becomes the name, `{{user}}` becomes "you" in spoken text or "the player" in
  descriptions, `{{// comments}}` are removed. Fields over CHIMERA's limits are cut at a sentence end and reported.
- **Not imported, and said so on screen:** custom system / post-history instructions (they often try to switch off safety rules; CHIMERA
  uses its own), lorebooks, alternate openings, and the picture (characters have no avatar upload yet).
- Everything imports as **SFW**: Mature / NSFW still wait for age verification. A card that says it is adult content (an `NSFW` / `18+` /
  `explicit`-style tag, or `NSFW` / `18+` in the creator's notes unless they say "SFW") is **refused**, because relabelling it SFW would
  hand its explicit text to anyone the character is shared with. This only reads what the card says about itself: nothing here scans the
  text itself, the same as typing a character by hand, so a checked adult rating at creation is still a gap for a later step.
- `{{char}}` is the V3 `nickname` when the card has one, otherwise the name that is actually saved.
- Cards cannot be larger than 10 MB. A bad file gives a readable message and leaves the form alone; if the form already has text, the
  person is asked before it is replaced.

## SHARDS and VELLUM: unchanged from the previous CHIMERA

These files were copied as they were (only two unused imports/variables removed from `DailyBonusModal` for lint):

- Screens: `src/pages/ShardsPage.tsx`, `src/pages/VellumPage.tsx`
- Dialogs: `src/components/common/{ShardsHubModal,GiftShardsModal,DailyBonusModal,ShardCrystalImage}.tsx`,
  `src/components/creator/CreatorTipModal.tsx`, `src/components/writers/SceneIllustrationModal.tsx`
- API: `api/create-shards-checkout.ts`, `api/stripe-webhook.ts`, `api/generate-scene-illustration.ts`,
  `api/illustration-status.ts`, `api/_lib/{requestProtection,illustrationResult}.ts`, `src/lib/rpcRecord.ts`
- Wallet balances and `chimera-shards-changed` / `chimera-vellum-changed` events: in `src/contexts/AuthContext.tsx`
- Header reserve chip (SHARDS in Roleplay, VELLUM in Storytelling): `src/components/layout/AppLayout.tsx`
- Database: the existing wallet, ledger and purchase migrations in `supabase/migrations/` (not changed)
- Notes: `docs/18-SHARD-TOKEN-SYSTEM.md`

Checkout still uses Stripe, exactly as before. Stripe does not accept businesses in Senegal, so a SHARDS purchase
needs a Stripe account from a supported country, or a different payment provider, before it can go live.

## Deploying to Vercel

The Vercel project `chimera` uses root directory `apps/chimera` (build `npm run build`, output `dist`; see `vercel.json`).
Before the first production deploy:

1. **Apply the database migration** `supabase/migrations/20261006120000_chimera_age_verification_gate.sql` to the production
   Supabase project. It resets every self-declared adult setting to off.
2. **Set the environment variables** in Vercel (Production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `CHIMERA_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GEMINI_API_KEY_SERVER`.
   The two `VITE_` values are baked in at build time, so redeploy after changing them.
3. **Check the production branch** (Vercel > Project > Settings > Git) and merge into it.
4. **Rollback:** Vercel > Deployments > a previous deployment > "Instant Rollback" restores the old site at once.

`public/sw.js` retires the service worker of the previous CHIMERA (it was a PWA), so returning visitors do not keep
seeing the old site from their cache. Keep it for a few weeks after the switch.

## Next

Age verification through a provider, then more chat features.

## Commands

```bash
npm run dev:chimera:local      # from the repository root
npm run typecheck:chimera
npm run build:chimera
npm run lint --workspace=chimera
```

Environment variables are listed in the root `.env.example`.
