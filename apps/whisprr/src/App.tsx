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
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute';
import { Logo } from './components/common/Logo';
import { ReloadPrompt } from './components/common/ReloadPrompt';

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
const RestrictedPage       = lazy(() => import('./pages/RestrictedPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function IndexRoute() {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/feed" replace />;
  }
  return <LandingPage />;
}


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

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<IndexRoute />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/trust" element={<TrustPage />} />
        <Route path="/building" element={<BuildingPage />} />
        <Route path="/restricted" element={<RestrictedPage />} />

        {/* Public Only (Login/Signup) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* WHISPRR Platform */}
          <Route element={<AppLayout />}>
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:conversationId" element={<ConversationPage />} />
            <Route path="/group-chat" element={<GroupChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/communities/:communityId" element={<CommunityDetailPage />} />
            <Route path="/community-program" element={<CommunityProgramPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/whisper/:id" element={<WhisperDetailPage />} />
            <Route path="/voice-rooms" element={<VoiceRoomsPage />} />
            <Route path="/voice-rooms/:roomId" element={<VoiceRoomsPage />} />
            <Route path="/feedback" element={<FeedbackDashboard />} />
            {profile?.role === 'founder' && (
              <Route path="/founder" element={<FounderPanel />} />
            )}
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
