When making any decision, always choose the implementation that provides the best long-term experience for the user—not the easiest implementation for the developer or AI agent.

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION VIII — AI & ROLEPLAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 31 — AI Should Empower Creativity

AI exists to enhance human creativity, never replace it.

CHIMERA is a creative platform first.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 32 — Modes Must Feel Different

Switching between Roleplay and Story should feel like entering a different creative workspace.

Different identity.

Different colors.

Different atmosphere.

Same design language.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 33 — Characters Are Living Identities

Characters are not chatbots.

Each character should feel like a persistent identity with memories, personality, relationships, preferences, and history.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 34 — Worlds Come Before Conversations

Characters become richer when they belong to worlds.

Always prioritize connections between:

Worlds

Characters

Stories

Lore

Relationships

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 35 — Personas Belong to Users

Personas represent the user.

They are never the AI.

AI characters respond to personas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION IX — STORYTELLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 36 — Stories Are Sacred

Never reduce storytelling into simple chat messages.

Respect pacing.

Structure.

Narrative.

Emotion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 37 — Every Story Has Ownership

Every published story should clearly display:

Author

Publication date

Updates

Series

Status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 38 — Writing Must Feel Comfortable

Provide distraction-free writing.

Avoid unnecessary UI.

Prioritize typography and readability.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 39 — Worlds Should Be Discoverable

Worlds deserve the same importance as Characters and Stories.

They should never feel secondary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION X — DESIGN CONSISTENCY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 40 — One Design Language

Every page should feel like it belongs to the same application.

Avoid isolated design decisions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 41 — Predictable Interactions

Buttons should always behave consistently.

Search behaves consistently.

Cards behave consistently.

Dialogs behave consistently.

Never surprise users.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 42 — Motion Has Purpose

Animations should communicate state.

Never animate simply because you can.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 43 — Responsive Doesn't Mean Smaller

Responsive design means redesigning intelligently.

Not shrinking desktop interfaces.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION XI — PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 44 — Every Millisecond Matters

Optimize perceived speed.

Avoid unnecessary waiting.

Cache intelligently.

Load progressively.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 45 — Background Work Stays Invisible

Synchronization,

Caching,

Database updates,

Deployment refreshes,

should happen quietly whenever possible.

Users should not notice technical operations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION XII — SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 46 — Privacy By Default

Protect user data.

Collect only what is necessary.

Respect creator ownership.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 47 — Fail Gracefully

When something fails,

users should always understand:

what happened,

what they can do next,

and how to recover.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION XIII — ENGINEERING EXCELLENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 48 — No Temporary Hacks

Quick fixes become permanent problems.

Implement proper solutions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 49 — Every Commit Improves CHIMERA

No commit should reduce quality.

Leave the codebase cleaner than you found it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 50 — Think Like a Product Owner

Every implementation should answer:

Does this improve the user experience?

Does this respect the design system?

Does this scale?

Would I proudly ship this?

If the answer is no,

rethink the implementation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 51 — The CHIMERA Standard

Every feature must meet four equally important standards before it is considered complete.

1. Beautiful

Elegant, balanced, and visually consistent.

2. Functional

Reliable, intuitive, and bug-free.

3. Responsive

Exceptional on desktop, tablet, and mobile.

4. Delightful

Leaves users with the feeling that every detail was intentionally crafted.

If a feature satisfies only three of these four standards, it is not finished.

Perfection is not the goal.

Craftsmanship is.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION XIV — IMAGES & CREATOR IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 52 — Universal Image Upload System

Every object in CHIMERA or WHISPRR that requires an image must use the same universal image upload component.

This includes, but is not limited to:

• User profile pictures
• Character avatars
• Persona avatars
• Story covers
• World covers
• Collection covers
• Community icons
• Creator profile banners
• Organization logos
• Group icons
• Future image-based content

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Users should NEVER be required to:

• Search the internet for an image.
• Copy an image URL.
• Paste an image URL.
• Understand what an image URL is.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every image upload should provide:

• Click to Upload
• Drag & Drop
• Mobile Photo Picker
• Camera Support (mobile devices)
• Instant Preview
• Crop
• Zoom
• Reposition
• Replace Image
• Remove Image

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The upload experience must remain identical everywhere.

The same interaction.

The same animations.

The same cropping interface.

The same quality.

Users should immediately recognize how image uploads work regardless of where they are in the ecosystem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Storage

Images should automatically upload to the storage provider.

Image URLs should be generated and managed internally.

Users should never interact with raw image URLs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Design Principle

Image uploads should feel effortless.

The platform handles the technology.

The user simply chooses an image and continues creating.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Consistency Rule

There must only be ONE universal image upload component shared across the entire CHIMERA ecosystem.

Do not create multiple upload experiences for different features.

Every upload should feel familiar, predictable, and consistent.
