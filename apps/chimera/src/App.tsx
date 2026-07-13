import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { UnreadMessagesProvider } from './contexts/UnreadMessagesContext';
import { ToastProvider } from './contexts/ToastContext';
import { InterestProvider } from './contexts/InterestContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ChimeraLayout } from './components/layout/ChimeraLayout';
import { ChimeraPlaceholderPage } from './components/common/ChimeraPlaceholderPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute';
import { Logo } from './components/common/Logo';
import { ReloadPrompt } from './components/common/ReloadPrompt';

const OracleAssistantPage = lazy(() => import('./pages/OracleAssistantPage'));

const ChimeraChatsPage       = lazy(() => import('./pages/ChimeraChatsPage'));

const AuthPage           = lazy(() => import('./pages/AuthPage'));
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'));
const OnboardingPage     = lazy(() => import('./pages/OnboardingPage'));
const ConversationPage   = lazy(() => import('./pages/ConversationPage'));
const AiCharactersPage = lazy(() => import('./pages/AiCharactersPage'));

// Legal & Policy Pages
const TermsPage                = lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPage              = lazy(() => import('./pages/legal/PrivacyPage'));
const AiSafetyPolicyPage       = lazy(() => import('./pages/legal/AiSafetyPolicyPage'));
const ResponsibleAiPolicyPage  = lazy(() => import('./pages/legal/ResponsibleAiPolicyPage'));
const PersonaPolicyPage        = lazy(() => import('./pages/legal/PersonaPolicyPage'));
const AiCreatorPolicyPage      = lazy(() => import('./pages/legal/AiCreatorPolicyPage'));
const ModelUsagePolicyPage     = lazy(() => import('./pages/legal/ModelUsagePolicyPage'));
const PromptPolicyPage         = lazy(() => import('./pages/legal/PromptPolicyPage'));
const MemoryPolicyPage         = lazy(() => import('./pages/legal/MemoryPolicyPage'));
const CookiePolicyPage         = lazy(() => import('./pages/legal/CookiePolicyPage'));

// Moderation & Flow Pages
const LegalAcceptancePage   = lazy(() => import('./pages/LegalAcceptancePage'));
const ModerationNoticePage  = lazy(() => import('./pages/ModerationNoticePage'));
const SuspendedPage         = lazy(() => import('./pages/SuspendedPage'));


const TrustPage             = lazy(() => import('./pages/TrustPage'));
const AiCharacterCreator = lazy(() => import('./pages/AiCharacterCreator'));
const PersonasPage = lazy(() => import('./pages/PersonasPage'));
const PersonaEditorPage = lazy(() => import('./pages/PersonaEditorPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-300 border-t-primary-500 mx-auto mb-3" />
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
          <p className="text-warm-600 dark:text-warm-400 font-serif text-lg">WHISPRR</p>
        </div>
      </div>
    );
  }

  // Maintenance Bypass check
  if (isMaintenanceActive) {
    const role = profile?.role || 'user';
    const isFounderBypass = role === 'founder' && systemSettings?.bypass_founder !== false;
    const isAdminBypass = role === 'admin' && systemSettings?.bypass_admin !== false;
    const isBetaBypass = role === 'moderator' && systemSettings?.bypass_beta === true; // moderators as beta testers
    const isUserBypass = profile?.username === 'nyny59';
    const isBypass = isFounderBypass || isAdminBypass || isBetaBypass || isUserBypass;

    if (!isBypass) {
      const path = window.location.pathname;
      const isAuthRoute = path === '/auth';
      const isResetPasswordRoute = path === '/reset-password';
      const isPublicRoute = ['/', '/about', '/building', '/privacy', '/terms', '/trust'].includes(path);

      const allowAuth = systemSettings?.allow_auth !== false;
      const allowPublic = systemSettings?.allow_public !== false;

      // Allow auth route if permitted
      if ((isAuthRoute || isResetPasswordRoute) && allowAuth) {
        return (
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth"    element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms"   element={<TermsPage />} />
              <Route path="/trust"   element={<TrustPage />} />
              <Route path="*"        element={<Navigate to="/auth" replace />} />
            </Routes>
          </Suspense>
        );
      }

      // Allow public pages if permitted
      if (isPublicRoute && allowPublic) {
        // Continue to normal rendering flow (will render LandingPage or BuildingPage below)
      } else {
        return (
          <Suspense fallback={<PageLoader />}>
            <div className="min-h-screen flex items-center justify-center bg-warm-950 text-white flex-col text-center p-8">
              <h1 className="text-3xl font-bold mb-4">Under Maintenance</h1>
              <p className="text-warm-400">CHIMERA is currently undergoing scheduled maintenance. Please check back soon.</p>
            </div>
          </Suspense>
        );
      }
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
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

        {/* Public Only (Login/Signup) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/legal-acceptance" element={<LegalAcceptancePage />} />
          <Route path="/moderation-notice" element={<ModerationNoticePage />} />
          <Route path="/suspended" element={<SuspendedPage />} />

          {/* CHIMERA Standalone Platform */}
          <Route element={<ChimeraLayout />}>
            <Route path="/" element={<AiCharactersPage />} />
            <Route path="/create" element={<AiCharacterCreator />} />
            <Route path="/chats" element={<ChimeraChatsPage />} />
            <Route path="/chat/:id" element={<ConversationPage />} />
            <Route path="/oracle" element={<OracleAssistantPage />} />
            <Route path="/help" element={<OracleAssistantPage />} />
            <Route path="/personas" element={<PersonasPage />} />
            <Route path="/personas/new" element={<PersonaEditorPage />} />
            <Route path="/personas/:id/edit" element={<PersonaEditorPage />} />
            <Route path="/personas/:id" element={<PersonaEditorPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/worlds" element={<ChimeraPlaceholderPage title="My Worlds" description="Create and manage rich lore-filled environments, cities, and maps." />} />
            <Route path="/plots" element={<ChimeraPlaceholderPage title="Create Plot" description="Define structured plotlines, story beats, and branching scenarios." />} />
            <Route path="/lorebooks" element={<ChimeraPlaceholderPage title="Lorebooks" description="Upload, edit, and organize custom knowledge books for context injections." />} />
            <Route path="/models" element={<ChimeraPlaceholderPage title="AI Models" description="Select from specialized roleplay fine-tunes and toggle parameters." />} />
            <Route path="/creator-profiles" element={<ChimeraPlaceholderPage title="Creator Profiles" description="Browse top CHIMERA authors, follow creators, and check stats." />} />
            <Route path="/collections" element={<ChimeraPlaceholderPage title="Collections" description="Gather matching characters, plots, and worlds into public collections." />} />
          </Route>
        </Route>

        {/* Catch-all 404 Route */}
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
              <NotificationsProvider>
                <UnreadMessagesProvider>
                  <InterestProvider>
                    <ReloadPrompt />
                    <AppLoader />
                  </InterestProvider>
                </UnreadMessagesProvider>
              </NotificationsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
