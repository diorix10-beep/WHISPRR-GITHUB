import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { UnreadMessagesProvider } from './contexts/UnreadMessagesContext';
import { ToastProvider } from './contexts/ToastContext';
import { InterestProvider } from './contexts/InterestContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { NexaLayout } from './components/layout/NexaLayout';
import { NexaPlaceholderPage } from './components/common/NexaPlaceholderPage';
import { Logo } from './components/common/Logo';

const OracleAssistantPage = lazy(() => import('./pages/OracleAssistantPage'));

const NexaChatsPage       = lazy(() => import('./pages/NexaChatsPage'));

const AuthPage           = lazy(() => import('./pages/AuthPage'));
const OnboardingPage     = lazy(() => import('./pages/OnboardingPage'));
const FeedPage           = lazy(() => import('./pages/FeedPage'));
const DiscoverPage       = lazy(() => import('./pages/DiscoverPage'));
const MessagesPage       = lazy(() => import('./pages/MessagesPage'));
const ConversationPage   = lazy(() => import('./pages/ConversationPage'));
const ProfilePage        = lazy(() => import('./pages/ProfilePage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const NotificationsPage  = lazy(() => import('./pages/NotificationsPage'));
const CommunitiesPage    = lazy(() => import('./pages/CommunitiesPage'));
const CommunityDetailPage = lazy(() => import('./pages/CommunityDetailPage'));
const WhisperDetailPage  = lazy(() => import('./pages/WhisperDetailPage'));
const VoiceRoomsPage     = lazy(() => import('./pages/VoiceRoomsPage'));
const GroupChatPage      = lazy(() => import('./pages/GroupChatPage'));
const PrivacyPage        = lazy(() => import('./pages/PrivacyPage'));
const TermsPage          = lazy(() => import('./pages/TermsPage'));
const TrustPage          = lazy(() => import('./pages/TrustPage'));
const FeedbackDashboard  = lazy(() => import('./pages/FeedbackDashboard'));
const FounderPanel       = lazy(() => import('./pages/FounderPanel'));
const MaintenancePage   = lazy(() => import('./pages/MaintenancePage'));
const BuildingPage      = lazy(() => import('./pages/BuildingPage'));
const LandingPage       = lazy(() => import('./pages/LandingPage'));
const CommunityProgramPage = lazy(() => import('./pages/CommunityProgramPage'));
const CareersPage          = lazy(() => import('./pages/CareersPage'));
const AiCharactersPage = lazy(() => import('./pages/AiCharactersPage'));
const AiCharacterCreator = lazy(() => import('./pages/AiCharacterCreator'));


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
  const { user, profile, loading, systemSettings } = useAuth();

  const isMaintenanceActive = false; // Maintenance mode deactivated

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
    const isBypass = isFounderBypass || isAdminBypass || isBetaBypass;

    if (!isBypass) {
      const path = window.location.pathname;
      const isAuthRoute = path === '/auth';
      const isPublicRoute = ['/', '/about', '/building', '/privacy', '/terms', '/trust'].includes(path);

      const allowAuth = systemSettings?.allow_auth !== false;
      const allowPublic = systemSettings?.allow_public !== false;

      // Allow auth route if permitted
      if (isAuthRoute && allowAuth) {
        return (
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth"    element={<AuthPage />} />
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
            <MaintenancePage settings={systemSettings} />
          </Suspense>
        );
      }
    }
  }

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/auth"    element={<AuthPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms"   element={<TermsPage />} />
          <Route path="/trust"   element={<TrustPage />} />
          <Route path="/building" element={<BuildingPage />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (!profile?.onboarding_complete) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*"           element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* NEXA Standalone Platform (Crimson/Roleplay branded navigation) */}
        <Route element={<NexaLayout />}>
          <Route path="/nexa"                          element={<AiCharactersPage />} />
          <Route path="/nexa/create"                   element={<AiCharacterCreator />} />
          <Route path="/nexa/chats"                    element={<NexaChatsPage />} />
          <Route path="/nexa/worlds"                   element={<NexaPlaceholderPage title="My Worlds" description="Create and manage rich lore-filled environments, cities, and maps." />} />
          <Route path="/nexa/plots"                    element={<NexaPlaceholderPage title="Create Plot" description="Define structured plotlines, story beats, and branching scenarios." />} />
          <Route path="/nexa/lorebooks"                element={<NexaPlaceholderPage title="Lorebooks" description="Upload, edit, and organize custom knowledge books for context injections." />} />
          <Route path="/nexa/models"                   element={<NexaPlaceholderPage title="AI Models" description="Select from specialized roleplay fine-tunes and toggle parameters." />} />
          <Route path="/nexa/creator-profiles"         element={<NexaPlaceholderPage title="Creator Profiles" description="Browse top NEXA authors, follow creators, and check stats." />} />
          <Route path="/nexa/collections"              element={<NexaPlaceholderPage title="Collections" description="Gather matching characters, plots, and worlds into public collections." />} />
        </Route>

        {/* WHISPRR Platform (Purple/Social branded navigation) */}
        <Route element={<AppLayout />}>
          <Route path="/"                              element={<FeedPage />} />
          <Route path="/discover"                      element={<DiscoverPage />} />
          <Route path="/messages"                      element={<MessagesPage />} />
          <Route path="/messages/:conversationId"      element={<ConversationPage />} />
          <Route path="/group-chat"                    element={<GroupChatPage />} />
          <Route path="/profile"                       element={<ProfilePage />} />
          <Route path="/profile/:username"             element={<ProfilePage />} />
          <Route path="/settings"                      element={<SettingsPage />} />
          <Route path="/notifications"                 element={<NotificationsPage />} />
          <Route path="/communities"                   element={<CommunitiesPage />} />
          <Route path="/communities/:communityId"      element={<CommunityDetailPage />} />
          <Route path="/community-program"             element={<CommunityProgramPage />} />
          <Route path="/careers"                       element={<CareersPage />} />
          <Route path="/whisper/:id"                   element={<WhisperDetailPage />} />
          <Route path="/voice-rooms"                   element={<VoiceRoomsPage />} />
          <Route path="/voice-rooms/:roomId"           element={<VoiceRoomsPage />} />
          <Route path="/privacy"                       element={<PrivacyPage />} />
          <Route path="/terms"                         element={<TermsPage />} />
          <Route path="/trust"                         element={<TrustPage />} />
          <Route path="/feedback"                      element={<FeedbackDashboard />} />
          <Route path="/about"                         element={<LandingPage />} />
          <Route path="/building"                      element={<BuildingPage />} />
          <Route path="/oracle"                        element={<OracleAssistantPage />} />
          <Route path="/help"                          element={<OracleAssistantPage />} />
          {profile?.role === 'founder' && (
            <Route path="/founder"                     element={<FounderPanel />} />
          )}
          <Route path="*"                              element={<Navigate to="/" replace />} />
        </Route>
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
