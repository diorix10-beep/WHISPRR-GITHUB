# CHIMERA Engineering Constitution
Version 1.0

This document defines the permanent engineering, design, and product principles that govern every implementation throughout CHIMERA.

These rules are mandatory.

Whenever modifying the codebase, designing new interfaces, fixing bugs, or implementing features, these rules take priority over implementation convenience.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION I — PRODUCT PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 1 — Mobile & Desktop First (Mandatory)

Whenever making modifications, fixing bugs, adding features, refactoring existing code, designing new UI, or building any website or web application, you must ALWAYS design, implement, test, and polish BOTH desktop and mobile experiences simultaneously.

Desktop is NOT the default.

Mobile is NOT an afterthought.

Both platforms are first-class citizens.

Never:

• Ship desktop without mobile.
• Ship mobile without desktop.
• Hide features on mobile without an equivalent responsive experience.
• Delay mobile implementation.
• Reduce functionality on smaller devices.

Always guarantee:

• 100% feature parity.
• Responsive layouts.
• Excellent usability.
• Excellent performance.
• Excellent accessibility.
• Excellent visual quality.

A feature is NOT complete until both desktop and mobile meet the same quality standards.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 2 — Users Always Come First

Every decision must improve the user's experience.

Never optimize for developer convenience at the expense of usability.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 3 — Quality Over Speed

Shipping tomorrow is better than shipping something broken today.

Never sacrifice polish simply to release faster.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 4 — Content Comes First

The content is the product.

The interface exists to showcase content—not compete with it.

Reduce unnecessary visual noise.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 5 — Whitespace is a Feature

Whitespace is part of the design.

Never attempt to fill every available pixel.

Spacing creates clarity.

Breathing room creates elegance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION II — USER EXPERIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 6 — Honest Empty States

Never fabricate content.

If there are no:

• Characters
• Stories
• Worlds
• Personas
• Communities
• Chats

Display a beautiful empty state.

Never create fake community activity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 7 — Never Mislead Users

Never pretend content exists.

Never simulate popularity.

Never fake online users.

Never fake conversations.

Trust is more valuable than visual fullness.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 8 — Navigation Must Always Work

Primary navigation must NEVER produce:

• 404
• 500
• Missing page
• Route errors

If a section exists:

Open it.

If it's empty:

Show an empty state.

If it's temporarily unavailable:

Show a maintenance experience.

404 pages are only for invalid URLs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 9 — Progressive Disclosure

Show only what users need.

Avoid overwhelming users.

Advanced functionality should appear only when relevant.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 10 — Native Interactions First

Users should never need awkward workarounds.

Uploading an image should open:

• File picker
• Drag & drop
• Mobile photo library

Image URLs may exist only as an optional advanced feature.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION III — DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 11 — Visual Balance

Every screen should feel balanced.

Avoid crowded layouts.

Avoid oversized components.

Avoid tiny components.

Balance before density.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 12 — Workspace Separation

Navigation and workspace controls are different.

Navigation:

Discover
Characters
Chats
Personas
Creator Studio

Workspace:

Roleplay / Story
Search
Create
Theme
Profile

These groups should always remain visually distinct.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 13 — Consistent Color Identity

Every creative mode owns its visual identity.

Roleplay

Primary accent:
Red

Story

Primary accent:
Purple

Never mix identities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 14 — Consistent Components

Buttons should behave the same.

Cards should behave the same.

Dialogs should behave the same.

Spacing should behave the same.

Icons should behave the same.

Consistency builds familiarity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 15 — Simplicity Wins

If removing something improves clarity,

remove it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION IV — ENGINEERING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 16 — Never Expose Internal Errors

Users must NEVER see:

SQL errors

Database errors

Stack traces

Reference errors

Debug logs

API responses

Console messages

Internal exceptions

Show friendly messages instead.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 17 — Never Show Development Notifications

Production users should never see:

Green debug notifications

Red developer toasts

Deployment logs

Migration notices

Testing messages

Developer diagnostics

These belong only to developers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 18 — Production Means Production

Before deployment:

No TODO placeholders.

No demo data.

No lorem ipsum.

No fake users.

No unfinished developer components.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 19 — Build Responsively

Avoid oversized flex layouts.

Avoid stretching components unnecessarily.

Layouts should adapt naturally.

Optimize for readability before density.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 20 — Accessibility is Mandatory

Keyboard navigation.

Screen readers.

Focus states.

Contrast.

Touch targets.

Accessibility is never optional.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION V — PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 21 — Fast Feels Better

Every interaction should feel immediate.

Optimize perceived performance.

Avoid unnecessary loading.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 22 — Meaningful Loading States

Never show blank screens.

Every loading experience should reassure users.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 23 — Meaningful Error Recovery

Whenever possible, users should always be able to:

Retry

Refresh

Return

Continue working

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION VI — COMMUNITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 24 — Every Piece of Content Should Be Real

Characters belong to creators.

Stories belong to authors.

Worlds belong to builders.

Nothing should appear unless it actually exists.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 25 — Respect Creators

Creator identity should always be visible.

Credit creators.

Protect creators.

Celebrate creators.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION VII — DEVELOPMENT PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 26 — Preserve Existing Quality

New features must never degrade existing functionality.

Every improvement should leave the application better than before.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 27 — Fix Root Causes

Never patch symptoms.

Solve the underlying problem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 28 — Think Long-Term

Design systems that remain maintainable for years.

Avoid short-term hacks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 29 — Every Screen Should Feel Intentional

Nothing should exist "just because."

Every component must have a clear purpose.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 30 — CHIMERA Must Feel Premium

Every interaction should communicate craftsmanship.

The product should feel elegant, polished, trustworthy, and carefully designed.

Whenever uncertain between two implementations, choose the one that creates the better user experience.
