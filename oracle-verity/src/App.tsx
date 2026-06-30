// ============================================================
// ORACLE VERITY — MAIN APP COMPONENT
// ============================================================

import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { WebLayout } from './components/layout/WebLayout';
import { DashboardPage } from './pages/DashboardPage';
import { SupportPage } from './pages/SupportPage';
import { TelegramPage } from './pages/TelegramPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { GithubPage } from './pages/GithubPage';
import { ProfilePage } from './pages/ProfilePage';
import { TerminalPage } from './pages/TerminalPage';
import { CompanionWorkspacePage } from './pages/CompanionWorkspacePage';
import { FamilyProfilePage } from './pages/FamilyProfilePage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<WebLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="workspace/:companionId" element={<CompanionWorkspacePage />} />
          <Route path="family/:memberId" element={<FamilyProfilePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="github" element={<GithubPage />} />
          <Route path="terminal" element={<TerminalPage />} />
          <Route path="telegram" element={<TelegramPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
