# WHISPRR & CHIMERA Ecosystem

## Product Identity

- **WHISPRR** = Social Platform — where creators discover, connect, and share.
- **CHIMERA** = Creative Platform — where creators build characters, worlds, stories, and roleplay.

See `apps/chimera/VISION.md` for the complete CHIMERA product vision and roadmap.

---


## Supabase Deployment Rule
**Don’t just modify the frontend or backend.** Every time a feature requires a database change, you must tell the user exactly what they need to do in Supabase before deploying it. Every feature must be considered complete only if the application code AND the required Supabase changes are included.

Whenever you create or modify a feature, you must check whether it requires changes to:
- SQL tables
- Columns
- Indexes
- Constraints
- Row Level Security (RLS)
- Storage buckets
- Storage policies
- Functions
- Triggers
- Views
- Authentication settings
- Environment variables
- Edge Functions
- Realtime configuration

If any database or Supabase configuration is required, do NOT assume it already exists.

Instead, after finishing the code, create a section in your response called:

### === REQUIRED SUPABASE ACTIONS ===

Inside this section include:
1. Why this database change is required.
2. The exact SQL migration the user should paste into the Supabase SQL Editor.
3. Any Storage bucket or Storage RLS policies that must be created or updated.
4. Any Authentication configuration changes.
5. Any Environment Variables that must be added.
6. Any manual steps inside the Supabase dashboard.
7. A checklist so the user can verify every required step before deploying.

Do not mark the task as complete until every required Supabase action has been documented.

The goal is to prevent runtime errors such as:
- new row violates row-level security policy
- permission denied
- relation does not exist
- column does not exist
- bucket not found
- storage upload denied
- foreign key violations
- authentication failures

Every feature should be fully deployable after following the provided Supabase instructions.

---

## Deployment Readiness Check
Before marking any feature as complete, run a Deployment Readiness Check for both WHISPRR and NEXA.

Verify:
- [ ] Frontend
- [ ] Backend
- [ ] Database schema
- [ ] SQL migrations
- [ ] RLS policies
- [ ] Storage
- [ ] Authentication
- [ ] Environment variables
- [ ] API routes
- [ ] Production build

If any item is missing, report it before deployment.

---

====================================================
WHISPRR × CHIMERA ENGINEERING CONSTITUTION
Version 1.0
====================================================

This document defines the engineering standards for the entire WHISPRR ecosystem.

These rules are mandatory.

Every future feature, page, database change, deployment, and architectural decision must follow these principles.

====================================================
RULE 1 — PRODUCTION FIRST
====================================================

A feature is never considered complete until it works correctly in Production.

Passing locally is not enough.

Every feature must successfully pass:

- Development
- Build
- Deployment
- Production
- Verification

====================================================
RULE 2 — DATABASE FIRST
====================================================

Before implementing any feature, determine whether it requires changes in Supabase.

This includes:

- Tables
- Columns
- Relationships
- Constraints
- Indexes
- Storage
- Storage Buckets
- RLS Policies
- Functions
- Triggers
- Views
- Authentication
- Environment Variables

If database changes are required, they must be documented before the task is marked complete.

====================================================
RULE 3 — REQUIRED SUPABASE ACTIONS
====================================================

Every completed feature must include a section called:

REQUIRED SUPABASE ACTIONS

This section must contain:

1. Why the database change is required.

2. SQL migration.

3. Storage bucket changes.

4. Storage RLS policies.

5. Authentication configuration.

6. Environment Variables.

7. Dashboard configuration.

8. Deployment checklist.

Never assume anything already exists.

====================================================
RULE 4 — ZERO SILENT ERRORS
====================================================

Never hide errors.

Users should receive friendly messages.

Developers should receive the exact technical error.

Never display generic messages like:

"Something went wrong."

Instead provide useful debugging information.

====================================================
RULE 5 — NEVER HARDCODE
====================================================

Never hardcode:

- IDs
- URLs
- API Keys
- Bucket names
- User IDs
- Secrets

Everything should come from configuration or environment variables.

====================================================
RULE 6 — SINGLE SOURCE OF TRUTH
====================================================

Every piece of data should exist only once.

Do not duplicate user information.

WHISPRR and CHIMERA should share the same backend whenever appropriate.

====================================================
RULE 7 — SECURITY FIRST
====================================================

Every new feature must verify:

- Authentication
- Authorization
- RLS
- Privacy
- Rate Limiting
- Secure API Access

Security is never optional.

====================================================
RULE 8 — NO PLACEHOLDER CODE
====================================================

Production must never contain:

TODO

FIXME

Temporary code

Mock implementations

Unused test code

====================================================
RULE 9 — FEATURE COMPLETION CHECKLIST
====================================================

A feature is complete only if all of the following are complete:

Frontend

Backend

Database

Authentication

Storage

RLS

Responsive Design

Desktop

Tablet

Mobile

Production Testing

====================================================
RULE 10 — EXPLAIN ARCHITECTURE
====================================================

Whenever an architectural decision is made, explain:

Why it was chosen.

Benefits.

Trade-offs.

Future scalability.

Never silently change architecture.

====================================================
RULE 11 — REGRESSION SAFETY
====================================================

A new feature must never break an existing feature.

Regression testing is mandatory before deployment.

====================================================
RULE 12 — PREMIUM USER EXPERIENCE
====================================================

If something feels unfinished or clunky, redesign it.

Do not settle for "good enough."

Every interaction should feel polished.

====================================================
RULE 13 — ECOSYSTEM THINKING
====================================================

Never build only for WHISPRR.

Never build only for NEXA.

Always consider the future ecosystem.

Every feature should ask:

Can WHISPRR use this?

Can CHIMERA use this?

Can future ecosystem applications reuse this?

====================================================
RULE 14 — DOCUMENT EVERYTHING
====================================================

Every system must include documentation for:

Architecture

Database

API

Dependencies

Configuration

Deployment

====================================================
RULE 15 — NEVER GUESS
====================================================

If required information is missing:

Stop.

Ask.

Do not invent behavior.

====================================================
RULE 16 — DEPLOYMENT READINESS
====================================================

Before every deployment verify:

✓ Build

✓ TypeScript

✓ Linting

✓ SQL Migration

✓ RLS Policies

✓ Storage

✓ Authentication

✓ Environment Variables

✓ Production Testing

✓ Desktop Testing

✓ Mobile Testing

Only deploy after every item passes.

====================================================
RULE 17 — TASK COMPLETION REPORT
====================================================

Every completed task must end with:

===========================
TASK STATUS
===========================

Completed:

Remaining Work:

Required Supabase Actions:

Required SQL:

Required Storage Changes:

Required Authentication Changes:

Required Environment Variables:

Required Vercel Actions:

Testing Instructions:

Production Ready:

YES / NO

Reason:

====================================================
RULE 18 — NO HIDDEN DEPENDENCIES
====================================================

If implementing a feature requires any manual action outside the codebase, it must be explicitly documented.

Never assume the developer knows what to configure.

====================================================
RULE 19 — FAIL FAST
====================================================

Detect configuration problems as early as possible.

Validate:

- Missing environment variables
- Missing database tables
- Missing buckets
- Missing RLS policies
- Missing authentication providers

Fail with clear error messages.

====================================================
RULE 20 — QUALITY OVER SPEED
====================================================

Never rush a feature at the expense of quality.

A delayed high-quality implementation is always preferable to a rushed unstable implementation.

====================================================
Rule 21 — Accessibility First
====================================================

Every page should work with:

- Keyboard navigation
- Screen readers
- Proper contrast
- Responsive layouts
- Large touch targets

====================================================
Rule 22 — Every Loading State Matters
====================================================

Never show a blank page.

Every request must have:

- Skeleton loading
- Progress indicator
- Friendly empty state
- Friendly error state

====================================================
Rule 23 — No Dead Ends
====================================================

Every page should answer:

“What can I do next?”

Never trap the user.

====================================================
Rule 24 — Recovery Before Failure
====================================================

Whenever possible:

Don’t just show an error.

Offer a way to recover.

Instead of:
Upload failed.

Say:
Upload failed.
Try again.
Choose another image.
Contact support.

====================================================
Rule 25 — Respect the User’s Time
====================================================

Never make users repeat work.

If they typed:

- a bio
- a character
- a world
- a profile

and something crashes…

Save a draft automatically whenever you can.

====================================================
Rule 26 — Never Lose User Data
====================================================

This one would actually be non-negotiable.

If a save fails:

Never throw away:

- messages
- personas
- worlds
- characters
- drafts

Keep them locally until they can be synchronized.

====================================================
Rule 27 — Explain Before Asking
====================================================

Never ask a user for permission without explaining why.

For example:

Instead of:
Allow microphone?

Say:
Allow microphone so your AI companion can hear your voice during conversations.

People are much more likely to understand and make an informed choice.

====================================================
RULE 28 — EVERY FEATURE MUST HAVE A PURPOSE
====================================================

Never build a feature simply because another platform has it.

Every feature must answer:

- Why does it exist?
- What problem does it solve?
- How does it improve the user experience?

If these questions cannot be answered clearly, the feature should not be built.

====================================================
RULE 29 — USER TRUST IS SACRED
====================================================

Never trick users.

Never manipulate users.

Never use deceptive UI.

Always be transparent about:

- AI behavior
- Privacy
- Data collection
- Moderation
- Billing
- Subscriptions

Trust is more valuable than short-term growth.

====================================================
RULE 30 — PRIVACY BY DEFAULT
====================================================

Every new feature must begin as private unless there is a clear reason otherwise.

Users should always control:

- visibility
- discoverability
- profile privacy
- AI memories
- conversations
- personas
- worlds

====================================================
RULE 31 — USER DATA BELONGS TO THE USER
====================================================

Users own the content they create.

Where technically possible, they should be able to:

- export it
- download it
- delete it
- manage it

No unnecessary lock-in.

====================================================
RULE 32 — NEVER PUNISH CURIOSITY
====================================================

Users should feel safe exploring the platform.

Mistakes should teach.

Not punish.

Always educate before enforcing whenever appropriate.

====================================================
RULE 33 — ONE CLICK TO SAFETY
====================================================

Users should always be able to quickly:

- Block
- Report
- Mute
- Leave
- Delete
- Exit

Safety actions should never be hidden.

====================================================
RULE 34 — PERFORMANCE IS A FEATURE
====================================================

Fast software feels intelligent.

Optimize:

- startup time
- scrolling
- search
- chat loading
- image loading
- navigation

Performance is part of the user experience.

====================================================
RULE 35 — DESIGN FOR FAILURE
====================================================

Assume:

Networks fail.

Servers fail.

Users lose internet.

Browsers crash.

Devices restart.

Every important workflow should recover gracefully.

====================================================
RULE 36 — EVERY BUTTON MUST DO SOMETHING
====================================================

Never ship buttons that:

- do nothing
- silently fail
- lead nowhere

Every interaction should provide meaningful feedback.

====================================================
RULE 37 — NO CONFUSING WORDS
====================================================

Interfaces should use language that ordinary people understand.

Avoid technical jargon whenever possible.

Use:

Upload Photo

instead of

Configure Asset.

====================================================
RULE 38 — THE USER SHOULD NEVER FEEL LOST
====================================================

Every screen should clearly answer:

Where am I?

What can I do?

What should I do next?

====================================================
RULE 39 — DELETE SHOULD NEVER MEAN DISASTER
====================================================

Before deleting important content:

Warn users.

Explain the consequences.

Allow recovery whenever possible.

====================================================
RULE 40 — RESPECT CREATORS
====================================================

Creators build the ecosystem.

Give them:

- analytics
- organization tools
- moderation tools
- publishing tools
- editing tools

Never make creators feel like second-class users.

====================================================
RULE 41 — EVERY AI SHOULD EXPLAIN ITSELF
====================================================

If an AI refuses, moderates, blocks or limits something,

provide a human-friendly explanation whenever possible.

Avoid mysterious AI behavior.

====================================================
RULE 42 — CONSISTENCY OVER CREATIVITY
====================================================

A familiar experience is usually better than an unpredictable one.

Buttons.

Menus.

Navigation.

Terminology.

Behavior.

Everything should remain consistent.

====================================================
RULE 43 — EVERY UPDATE SHOULD IMPROVE SOMETHING
====================================================

Never ship updates just to ship updates.

Every release should improve:

- quality
- stability
- security
- performance
- usability

====================================================
RULE 44 — THE PLATFORM SHOULD FEEL ALIVE
====================================================

Small details matter.

Celebrate achievements.

Welcome new users.

Animate thoughtfully.

Provide meaningful empty states.

The platform should feel alive without becoming distracting.

====================================================
RULE 45 — BUILD FOR THE NEXT TEN YEARS
====================================================

Whenever making an architectural decision,

choose the option that scales,

even if it requires a little more effort today.

Avoid short-term hacks that create long-term problems.

====================================================
RULE 46 — LOG EVERYTHING IMPORTANT
====================================================

Every important event should be logged for developers.

Examples:

- authentication failures
- payment failures
- upload failures
- API failures
- moderation actions
- database exceptions

Users see friendly messages.

Developers see detailed logs.

====================================================
RULE 47 — AUTOMATE REPETITIVE WORK
====================================================

If the same manual task appears repeatedly,

consider automating it.

Developers should spend time creating features,

not repeating configuration.

====================================================
RULE 48 — NEVER BREAK THE USER'S IMMERSION
====================================================

Especially inside CHIMERA.

Roleplay should feel uninterrupted.

Avoid technical interruptions,

confusing dialogs,

or unnecessary navigation.

====================================================
RULE 49 — EVERY FEATURE SHOULD HAVE AN EXIT STRATEGY
====================================================

Before releasing any feature,

ask:

How will users leave it?

How will users undo it?

How will users recover from mistakes?

====================================================
RULE 50 — LEAVE THE PLATFORM BETTER THAN YOU FOUND IT
====================================================

Every contribution,

every feature,

every bug fix,

every redesign,

should improve the ecosystem.

Never add complexity without adding value.

Leave WHISPRR and CHIMERA better than yesterday.

---

# WHISPRR & CHIMERA PRODUCT VISION & CREATOR WELLNESS CONSTITUTION

## Core Philosophy
WHISPRR and CHIMERA should feel like they were built by the same company. Users should naturally experience the same values throughout both platforms.
We are building products for creators, not products designed to maximize screen time. Our goal is to help people create, connect, collaborate and share while encouraging healthy and sustainable creativity.

## Shared Company Values
Every product decision should reflect these principles:
- Humans come first.
- Creativity before engagement.
- Community before dependency.
- Respect user autonomy.
- Encourage healthy digital habits.
- Build trust.
- Never use manipulative design patterns.

These principles should be reflected in every interaction rather than simply written in a policy.

## Product & Creator Wellness Integration
Do not implement "Creator Wellness" as a standalone feature. Instead, integrate this philosophy into the entire experience:
- Gentle break reminders
- Quiet hours
- Optional wellness settings
- Optional weekly creator summaries
- Optional wellness check-ins
- Healthy usage insights
These features must always remain optional. Never automatically ban users, force logouts, lock accounts, shame users, or manipulate users into staying online.

## Product Microcopy Guidelines
All platform messages should reflect our philosophy.
- **Instead of:** *You've reached your limit.*
  **Use:** *💜 You've been creating for a while. Your stories and your community will still be here after a short break.*
- **Instead of:** *Come back now!*
  **Use:** *Your community has been creating while you were away.*
- **Instead of:** *No content found.*
  **Use:** *Every creator starts with a first story.*

## Ecosystem Identity
- **CHIMERA (Creative Platform)**: Where creators create. Contains Character Builder, World Builder, Lorebooks, Story Editor, AI Roleplay, AI Writing Assistant, Creator Studio, and Publishing.
- **WHISPRR (Social Home)**: Where creations live and creators connect. Find communities, talk with other creators, publish stories, share characters/worlds/lorebooks, receive feedback, collaborate, follow and message other creators.

**Motto:**
> Create freely. Connect meaningfully. Take care of yourself.
> 💜 WHISPRR

**Key Distinction:**
> CHIMERA empowers creators to build AI roleplay experiences, worlds, and stories. WHISPRR empowers those creations to find a community.

## Decoupled Architecture Package Rule
As the decoupling progresses, no business logic or application-specific feature logic should ever be moved into the shared packages. Shared packages are reserved strictly for reusable ecosystem infrastructure:
- **`packages/ui`**: Atomic and layout visual components only (no features or app business logic).
- **`packages/types`**: TypeScript database and model interfaces representing Supabase tables.
- **`packages/auth`**: Authentication helpers and the shared Supabase client setup.
- **`packages/utils`**: Core generic helper logic (e.g. date formatting, string trimmers).

All application-specific features (e.g., Communities inside WHISPRR, Character/World Studio inside CHIMERA) must remain contained within their respective apps. Avoid coupling business features together in shared modules.

====================================================
RULE 51 — CENTRALIZED ECOSYSTEM AUTHENTICATION
====================================================

Authentication is centralized in WHISPRR and shared across the ecosystem via Supabase Auth.
- Every user account must originate in WHISPRR.
- WHISPRR is the ecosystem's sole identity provider.
- A WHISPRR account grants access to both WHISPRR and CHIMERA using the same credentials.
- CHIMERA must never create standalone user accounts or host registration flows.
- If a visitor without an account attempts to register from CHIMERA, they must be redirected to the WHISPRR registration flow. Once registration is complete, they can immediately sign in to CHIMERA using the same credentials.
- There must never be a "CHIMERA-only" account.

====================================================
WHISPRR DEVELOPMENT PRIORITIES ROADMAP
====================================================

## PRIORITY 1 — Finish the Core Platform (Highest Priority)
Stop adding new features for now. Focus on making WHISPRR completely usable from beginning to end. Complete and polish:
- Authentication
- Email Verification
- Password Reset
- Session Persistence
- Google Sign In
- Apple Sign In
- Feed
- Post Creation
- Comments
- Likes
- Creator Profiles
- Communities
- Messaging
- Notifications
Goal: A new user should be able to register, verify their email, create posts, join communities, send messages, receive notifications, and use the entire platform without encountering any bugs.

## PRIORITY 2 — Remove Every Remaining Part of the Old WHISPRR
WHISPRR is no longer based on interests or topics. Remove every remaining feature related to the old recommendation system. Delete everywhere in the project:
- Interests
- Topics
- Followed Topics
- Muted Topics
- Topic Categories
- Topic Recommendations
- Topic Filters
- Topic Search
- Topic Chips
- Interest Selection during onboarding
Replace the old philosophy with the new creator-first philosophy. Users should control their recommendations through their behavior and settings, not by selecting topics.

## PRIORITY 3 — Replace All Old Branding
Update the entire project to match the new WHISPRR identity. Replace:
- Old logo
- Old authentication artwork
- Old screenshots
- Old landing page
- Old colors where necessary
- Old slogan
Use: WHISPRR - The Home of Creators. Ensure branding is consistent across every page.

## PRIORITY 4 — Finalize WHISPRR ↔ CHIMERA Architecture
The authentication flow must follow these rules:
- WHISPRR Account grants access to both WHISPRR and CHIMERA.
- CHIMERA Account cannot access WHISPRR.
- Every WHISPRR account automatically has access to CHIMERA.
- CHIMERA does not create independent platform accounts.
- Users without a WHISPRR account must create one before using CHIMERA.
- WHISPRR remains the central identity provider for the ecosystem.

## PRIORITY 5 — Founder Dashboard
Finish the Founder Dashboard after the core platform is stable. The dashboard should become the internal operating center for WHISPRR.

## PRIORITY 6 — Rebuild the Public Website
Delete and redesign the existing public website. It still reflects the previous vision of WHISPRR. Rebuild it around the new identity:
- New landing page
- New philosophy
- New creator-focused messaging
- Updated features
- Updated roadmap
- Beta information
- Founder Journal
Everything should communicate that WHISPRR is the Home of Creators.

## PRIORITY 7 — Private Beta
Launch carefully. Start with approximately 10 testers. Fix bugs. Expand to around 25 testers. Fix bugs again. Expand to around 100 testers. Continue improving before considering a public launch.

## Features to Postpone
Do NOT prioritize these until after the core platform and beta are complete:
- AI Companion
- Character Memory
- AI Roleplay
- Voice Spaces
- Translation System
- Community Marketplace
- Community Events
- Creator Economy
- AI Characters Preview
The platform should first become stable before expanding into advanced features.

## Overall Execution Order
1. Finish the core platform.
2. Remove every remaining part of the old WHISPRR.
3. Apply the new branding everywhere.
4. Finalize the WHISPRR and CHIMERA architecture.
5. Complete the Founder Dashboard.
6. Rebuild the public website.
7. Launch the private beta.
8. Collect feedback.
9. Build advanced creator and AI features.
