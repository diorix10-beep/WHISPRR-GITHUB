import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ChimeraLayout } from './components/layout/ChimeraLayout';
import { ChimeraPlaceholderPage } from './components/common/ChimeraPlaceholderPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute';
import { Logo } from './components/common/Logo';
import { ReloadPrompt } from './components/common/ReloadPrompt';

// ── Auth & Onboarding ──────────────────────────────────────
const AuthPage          = lazy(() => import('./pages/AuthPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const OnboardingPage    = lazy(() => import('./pages/OnboardingPage'));

// ── Legal & Moderation ─────────────────────────────────────
const LegalAcceptancePage  = lazy(() => import('./pages/LegalAcceptancePage'));
const ModerationNoticePage = lazy(() => import('./pages/ModerationNoticePage'));
const SuspendedPage        = lazy(() => import('./pages/SuspendedPage'));
const TermsPage            = lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPage          = lazy(() => import('./pages/legal/PrivacyPage'));
const AiSafetyPolicyPage       = lazy(() => import('./pages/legal/AiSafetyPolicyPage'));
const ResponsibleAiPolicyPage  = lazy(() => import('./pages/legal/ResponsibleAiPolicyPage'));
const PersonaPolicyPage        = lazy(() => import('./pages/legal/PersonaPolicyPage'));
const AiCreatorPolicyPage      = lazy(() => import('./pages/legal/AiCreatorPolicyPage'));
const ModelUsagePolicyPage     = lazy(() => import('./pages/legal/ModelUsagePolicyPage'));
const PromptPolicyPage         = lazy(() => import('./pages/legal/PromptPolicyPage'));
const MemoryPolicyPage         = lazy(() => import('./pages/legal/MemoryPolicyPage'));
const CookiePolicyPage         = lazy(() => import('./pages/legal/CookiePolicyPage'));
const TrustPage                = lazy(() => import('./pages/TrustPage'));

// ── Dashboard ──────────────────────────────────────────────
const CreatorDashboardPage = lazy(() => import('./pages/CreatorDashboardPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));

// ── Creator Studio ─────────────────────────────────────────
const CreatorStudioPage = lazy(() => import('./pages/CreatorStudioPage'));

// ── Characters Module ──────────────────────────────────────
const CharactersPage     = lazy(() => import('./pages/CharactersPage'));
const AiCharacterCreator = lazy(() => import('./pages/AiCharacterCreator'));

// ── Worlds Module ──────────────────────────────────────────
const WorldsPage        = lazy(() => import('./pages/WorldsPage'));
const WorldBuilderPage  = lazy(() => import('./pages/WorldBuilderPage'));

// ── Lorebooks Module ───────────────────────────────────────
const LorebooksPage       = lazy(() => import('./pages/LorebooksPage'));
const LorebookEditorPage  = lazy(() => import('./pages/LorebookEditorPage'));

// ── Stories Module ─────────────────────────────────────────
const WritersDeskPage   = lazy(() => import('./pages/WritersDeskPage'));
const StoryReaderPage   = lazy(() => import('./pages/StoryReaderPage'));
const ChapterReaderPage = lazy(() => import('./pages/ChapterReaderPage'));
const ChapterEditorPage = lazy(() => import('./pages/ChapterEditorPage'));
const MemoryManagerPage = lazy(() => import('./pages/MemoryManagerPage'));

// ── Conversations Module ───────────────────────────────────
const ChimeraChatsPage  = lazy(() => import('./pages/ChimeraChatsPage'));
const ConversationPage  = lazy(() => import('./pages/ConversationPage'));
const ModelsPage        = lazy(() => import('./pages/ModelsPage'));

// ── Personas ───────────────────────────────────────────────
const PersonasPage      = lazy(() => import('./pages/PersonasPage'));
const PersonaEditorPage = lazy(() => import('./pages/PersonaEditorPage'));

// ── Profile & Settings ─────────────────────────────────────
const ProfilePage  = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// ── Not Found ──────────────────────────────────────────────
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));


function PageLoader() {
  return (
    <div className="h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-300 border-t-red-500 mx-auto mb-3" />
        <p className="text-warm-500 text-sm">Loading…</p>
      </div>
    </div>
  );
}

function AppLoader() {
  const { profile, loading, systemSettings } = useAuth();

  const isMaintenanceActive = systemSettings?.enabled === true;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-900">
        <div className="text-center flex flex-col items-center gap-4">
          <Logo size={56} className="animate-pulse" />
          <p className="text-warm-600 dark:text-warm-400 font-serif text-lg">CHIMERA</p>
        </div>
      </div>
    );
  }

  // Maintenance mode
  if (isMaintenanceActive) {
    const role = profile?.role || 'user';
    const isFounderBypass = role === 'founder' && systemSettings?.bypass_founder !== false;
    const isAdminBypass = role === 'admin' && systemSettings?.bypass_admin !== false;
    const isBetaBypass = role === 'moderator' && systemSettings?.bypass_beta === true;
    const isUserBypass = profile?.username === 'nyny59';
    const isBypass = isFounderBypass || isAdminBypass || isBetaBypass || isUserBypass;

    if (!isBypass) {
      const path = window.location.pathname;
      const isAuthRoute = path === '/auth' || path === '/reset-password';

      if (isAuthRoute && systemSettings?.allow_auth !== false) {
        return (
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/trust" element={<TrustPage />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </Suspense>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-warm-950 text-white flex-col text-center p-8">
          <h1 className="text-3xl font-bold mb-4">Under Maintenance</h1>
          <p className="text-warm-400">CHIMERA is currently undergoing scheduled maintenance. Please check back soon.</p>
        </div>
      );
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public Routes ─────────────────────────────────── */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/trust" element={<TrustPage />} />
        <Route path="/ai-safety-policy" element={<AiSafetyPolicyPage />} />
        <Route path="/responsible-ai-policy" element={<ResponsibleAiPolicyPage />} />
        <Route path="/persona-policy" element={<PersonaPolicyPage />} />
        <Route path="/ai-creator-policy" element={<AiCreatorPolicyPage />} />
        <Route path="/model-usage-policy" element={<ModelUsagePolicyPage />} />
        <Route path="/prompt-policy" element={<PromptPolicyPage />} />
        <Route path="/memory-policy" element={<MemoryPolicyPage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />

        {/* ── Auth (Public Only) ────────────────────────────── */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ── Protected Platform ────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/legal-acceptance" element={<LegalAcceptancePage />} />
          <Route path="/moderation-notice" element={<ModerationNoticePage />} />
          <Route path="/suspended" element={<SuspendedPage />} />

          {/* ── CHIMERA Platform (with Layout) ────────────── */}
          <Route element={<ChimeraLayout />}>

            {/* Dashboard redirect & Discover Feed */}
            <Route path="/dashboard" element={<Navigate to="/discover" replace />} />
            <Route path="/" element={<DiscoverPage />} />
            <Route path="/discover" element={<DiscoverPage />} />

            {/* Characters Module */}
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/characters/new" element={<AiCharacterCreator />} />
            <Route path="/characters/:id" element={<AiCharacterCreator />} />
            <Route path="/characters/:id/edit" element={<AiCharacterCreator />} />

            {/* Worlds Module */}
            <Route path="/worlds" element={<WorldsPage />} />
            <Route path="/worlds/new" element={<WorldsPage />} />
            <Route path="/worlds/:id" element={<WorldBuilderPage />} />

            {/* Lorebooks Module */}
            <Route path="/lorebooks" element={<LorebooksPage />} />
            <Route path="/lorebooks/:id" element={<LorebookEditorPage />} />

            {/* Stories Module */}
            <Route path="/stories" element={<WritersDeskPage />} />
            <Route path="/stories/new" element={<WritersDeskPage />} />
            <Route path="/stories/:id" element={<StoryReaderPage />} />
            <Route path="/stories/:storyId/chapter/:chapterNumber" element={<ChapterReaderPage />} />
            <Route path="/stories/:storyId/edit/chapter/:chapterId" element={<ChapterEditorPage />} />

            {/* AI Models Module */}
            <Route path="/models" element={<ModelsPage />} />

            {/* Conversations Module */}
            <Route path="/conversations" element={<ChimeraChatsPage />} />
            <Route path="/conversations/:id" element={<ConversationPage />} />
            {/* Legacy routes redirect */}
            <Route path="/chats" element={<Navigate to="/conversations" replace />} />
            <Route path="/chat/:id" element={<Navigate to="/conversations/:id" replace />} />

            {/* Memory Module */}
            <Route path="/memory" element={<MemoryManagerPage />} />

            {/* Voices Module */}
            <Route path="/voices" element={<ChimeraPlaceholderPage title="Voice Library" description="Browse, preview, and assign voices to your characters. Configure narration and dialogue voices." />} />

            {/* Media / Image Studio */}
            <Route path="/media" element={<ChimeraPlaceholderPage title="Image Studio" description="Generate avatars, expressions, outfits, scenes, and location art for your characters and worlds." />} />

            {/* Creator Studio (unified workspace) */}
            <Route path="/studio" element={<CreatorStudioPage />} />

            {/* Personas */}
            <Route path="/personas" element={<PersonasPage />} />
            <Route path="/personas/new" element={<PersonaEditorPage />} />
            <Route path="/personas/:id/edit" element={<PersonaEditorPage />} />
            <Route path="/personas/:id" element={<PersonaEditorPage />} />

            {/* Profile & Settings */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Legacy routes redirect */}
            <Route path="/roleplay" element={<Navigate to="/characters" replace />} />
            <Route path="/create" element={<Navigate to="/characters/new" replace />} />
            <Route path="/write" element={<Navigate to="/stories" replace />} />
            <Route path="/library" element={<Navigate to="/stories" replace />} />
          </Route>
        </Route>

        {/* ── Catch-all 404 ────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <ProjectProvider>
                <ReloadPrompt />
                <AppLoader />
              </ProjectProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
