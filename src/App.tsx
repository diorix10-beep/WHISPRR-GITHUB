import { Wrench } from 'lucide-react';

const MAINTENANCE_MODE = true;

function MaintenancePage() {
  return (
    <div className="min-h-screen bg-warm-900 flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warm-800 border border-warm-700 mb-8">
          <Wrench className="w-9 h-9 text-primary-400 animate-pulse" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-warm-100 mb-4 tracking-tight">
          We'll Be Right Back
        </h1>

        <p className="text-warm-400 text-lg leading-relaxed mb-8">
          WHISPRR is currently undergoing scheduled maintenance to bring you an even better experience. We appreciate your patience.
        </p>

        <div className="inline-flex items-center gap-2 bg-warm-800/60 border border-warm-700/50 rounded-full px-5 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <span className="text-warm-300 text-sm font-medium">Maintenance in progress</span>
        </div>

        <p className="text-warm-500 text-sm mt-8">
          Follow us for updates. We'll be back shortly.
        </p>
      </div>
    </div>
  );
}

// --- Full app code (commented out during maintenance) ---
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ToastProvider } from './contexts/ToastContext';
import { InterestProvider } from './contexts/InterestContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { Logo } from './components/common/Logo';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ConversationPage = lazy(() => import('./pages/ConversationPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage'));
const CommunityDetailPage = lazy(() => import('./pages/CommunityDetailPage'));
const WhisperDetailPage = lazy(() => import('./pages/WhisperDetailPage'));
const VoiceRoomsPage = lazy(() => import('./pages/VoiceRoomsPage'));
const GroupChatPage = lazy(() => import('./pages/GroupChatPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

function PageLoader() {
  return (
    <div className="h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-300 border-t-primary-500 mx-auto mb-3" />
        <p className="text-warm-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function AppLoader() {
  const { user, profile, loading } = useAuth();

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

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (!profile?.onboarding_complete) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<ConversationPage />} />
          <Route path="/group-chat" element={<GroupChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/communities/:communityId" element={<CommunityDetailPage />} />
          <Route path="/whisper/:id" element={<WhisperDetailPage />} />
          <Route path="/voice-rooms" element={<VoiceRoomsPage />} />
          <Route path="/voice-rooms/:roomId" element={<VoiceRoomsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

function FullApp() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationsProvider>
                <InterestProvider>
                  <AppLoader />
                </InterestProvider>
              </NotificationsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function App() {
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }
  return <FullApp />;
}

export default App;
