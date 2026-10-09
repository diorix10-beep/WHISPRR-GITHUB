import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import CharacterPage from './pages/CharacterPage';
import AuthPage from './pages/AuthPage';
import GuardianPage from './pages/GuardianPage';
import ChatsPage from './pages/ChatsPage';
import ConversationPage from './pages/ConversationPage';
import CreateCharacterPage from './pages/CreateCharacterPage';
import MyCharactersPage from './pages/MyCharactersPage';
import ModelHousePage from './pages/ModelHousePage';
import PersonasPage from './pages/PersonasPage';
import LorebooksPage from './pages/LorebooksPage';
import LorebookEditorPage from './pages/LorebookEditorPage';
import PersonaEditorPage from './pages/PersonaEditorPage';
import LibraryPage from './pages/LibraryPage';
import StoryPage from './pages/StoryPage';
import ChapterReaderPage from './pages/ChapterReaderPage';
import WorkspacePage from './pages/WorkspacePage';
import NewStoryPage from './pages/NewStoryPage';
import StoryEditPage from './pages/StoryEditPage';
import ChapterEditorPage from './pages/ChapterEditorPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

// SHARDS and VELLUM keep the screens they had before.
const ShardsPage = lazy(() => import('./pages/ShardsPage'));
const VellumPage = lazy(() => import('./pages/VellumPage'));

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="font-serif text-5xl font-semibold">This page does not exist</h1>
      <p className="mt-4 text-lg text-chimera-mute">The link may be old, or the page may have moved.</p>
      <Link to="/" className="mt-8 inline-flex min-h-[48px] items-center rounded-full border border-chimera-gold/50 px-6 font-bold hover:bg-chimera-gold/10">Go home</Link>
    </div>
  );
}

const Loading = () => (
  <div className="grid min-h-[40vh] place-items-center" role="status" aria-label="Loading">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-300/30 border-t-violet-400" />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/characters/:id" element={<CharacterPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/guardian" element={<GuardianPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/shards" element={<ShardsPage />} />
            <Route path="/vellum" element={<VellumPage />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/chats/:id" element={<ConversationPage />} />
            <Route path="/create" element={<CreateCharacterPage />} />
            <Route path="/create/:id" element={<CreateCharacterPage />} />
            <Route path="/my-characters" element={<MyCharactersPage />} />
            <Route path="/models" element={<ModelHousePage />} />
            <Route path="/personas" element={<PersonasPage />} />
            <Route path="/personas/new" element={<PersonaEditorPage />} />
            <Route path="/personas/:id" element={<PersonaEditorPage />} />
            <Route path="/lorebooks" element={<LorebooksPage />} />
            <Route path="/lorebooks/:id" element={<LorebookEditorPage />} />
            {/* Reading stories needs a sign-in for now: the database only lets signed-in members read them. */}
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/stories/:id" element={<StoryPage />} />
            <Route path="/stories/:id/chapters/:chapterId" element={<ChapterReaderPage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="/stories/new" element={<NewStoryPage />} />
            <Route path="/stories/:id/edit" element={<StoryEditPage />} />
            <Route path="/stories/:id/chapters/:chapterId/edit" element={<ChapterEditorPage />} />
          </Route>

          <Route path="/write" element={<Navigate to="/workspace" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
