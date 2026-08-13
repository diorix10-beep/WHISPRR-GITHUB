# Chimera Extraction & Architecture Plan

## 1. Identification of Chimera Assets

### 1.1 Components
**Chimera-Specific Components (in `apps/chimera` and mixed)**
- `apps/chimera/src/components/chimera/*` (AI characters, chats, personas)
- `apps/chimera/src/components/layout/ChimeraLayout.tsx`
- `packages/shared/src/ui/common/ChimeraPlaceholderPage.tsx`
- `apps/whisprr/src/components/modals/ChimeraPromoModal.tsx`

**Assets to Remove from Chimera per Requirements**
- Any Oracle-related route, component, branding, documentation, and dependency.
- E.g., `OracleAssistantPage`, `/oracle`, `/help`.

**Duplicated Components (currently in both `apps/whisprr` and `apps/chimera`)**
- Auth components (`AuthPage`, `ResetPasswordPage`, `OnboardingPage`)
- Legal components (`TermsPage`, `PrivacyPage`, `CookiePolicyPage`, etc.)
- Base layout elements, common UI (`Logo`, `ErrorBoundary`, `ReloadPrompt`).

### 1.2 Routes
**Chimera Standalone Routes**
- `/` -> `AiCharactersPage`
- `/create` -> `AiCharacterCreator`
- `/chats` -> `ChimeraChatsPage`
- `/personas` -> `PersonasPage`
- `/profile` -> `ProfilePage`
- `/worlds`, `/plots`, `/lorebooks`, `/models`, `/creator-profiles`, `/collections` -> Placeholder pages

### 1.3 Database Tables & Columns
- `chimera_spirits`: The user's digital companion.
- `ai_characters`: The bots/characters created for roleplay.
- `personas`: User roleplay identities.

**Scalable Access Management (Replacing `profiles.access_level`)**
Instead of using `profiles.access_level`, we will create a dedicated `user_products` or `entitlements` join table:
```sql
CREATE TABLE public.user_entitlements (
  user_id uuid REFERENCES auth.users(id),
  product_id text NOT NULL, -- e.g., 'whisprr', 'chimera', 'maisonfx'
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
```
This allows a single authenticated user to belong to multiple products simultaneously without altering the `profiles` schema.

### 1.4 APIs / RPCs
- `create_ai_character`: Supabase RPC for bot creation.
- `handle_default_persona`: Trigger function for managing default personas.

### 1.5 Dependencies
- Shared Auth: `@supabase/supabase-js` will remain shared, centralized in `packages/shared`.
- React, React Router DOM, Vite, TailwindCSS
- Workbox, Discord.js, Lucide React.

---

## 2. Proposed Architecture for Separation

To maintain WHISPRR fully functional while extracting Chimera into its own modular feature with minimal duplication, we should transition to a stricter Monorepo configuration.

### Phase 1: Establish Shared Workspace Layers
We currently have `packages/shared` which is underutilized. We should split shared concerns logically (within `packages/shared` or new packages):
1. **Core / State**:
   - Supabase client initialization (Shared Authentication).
   - Shared React Contexts (`AuthContext`, `ThemeContext`, `ToastContext`).
   - Routing guards (`ProtectedRoute`, `PublicOnlyRoute`).
2. **UI / Components**:
   - Foundational components (`Button`, `Inputs`, `Modals`, `ErrorBoundary`).
   - Unified Legal and Policy pages (Terms, Privacy) customized via a "product" prop.
   - Auth UI components.

### Phase 2: App-Specific Refactoring
- **`apps/chimera`**: Will act as an isolated single-page application (SPA). It will import auth flows, core styling, and layout scaffolds from the shared package, injecting its own Chimera routing and context. It will be completely stripped of Oracle integration.
- **`apps/whisprr`**: Will focus purely on the social feed, community, and human-to-human messaging features.
- **`packages/shared`**: Remove Chimera-specific placeholders and place them directly in `apps/chimera`.

### Phase 3: Database Isolation
- **Shared Schemas**: Both apps rely on `auth.users` and `public.profiles`. The `profiles` table handles base user state.
- **Domain-Specific Schemas**: Keep Chimera-specific tables (`ai_characters`, `personas`, `chimera_spirits`) strictly decoupled from Whisprr tables.
- **Access Control**: RLS policies will reference the new `user_entitlements` table instead of `profiles.access_level`.

### Phase 4: Final Architecture Diagram

```
+-------------------------------------------------------------+
|                      Monorepo Root                          |
|                                                             |
|  +--------------------+    +-----------------------------+  |
|  |  packages/shared   |    |    Supabase / Database      |  |
|  |--------------------|    |-----------------------------|  |
|  | - Auth Context     |<---| - auth.users                |  |
|  | - UI Kit (Buttons, |    | - public.profiles           |  |
|  |   Modals)          |    | - public.user_entitlements  |  |
|  | - Auth Pages       |    +-----------------------------+  |
|  | - Legal Pages      |                   ^                 |
|  +--------------------+                   |                 |
|         ^         ^                       |                 |
|         |         |                       |                 |
|  +------|---------|-----------------------|-------------+   |
|  |      |         |                       |             |   |
|  |      v         v                       v             |   |
|  |  +---------------+               +---------------+   |   |
|  |  | apps/whisprr  |               | apps/chimera  |   |   |
|  |  |---------------|               |---------------|   |   |
|  |  | - Feed        |               | - Bots        |   |   |
|  |  | - Communities |               | - Roleplay    |   |   |
|  |  | - Messages    |               | - Personas    |   |   |
|  |  +---------------+               +---------------+   |   |
|  |      Domain:                         Domain:         |   |
|  |    Human Social                     AI Studio        |   |
|  +------------------------------------------------------+   |
+-------------------------------------------------------------+
```
