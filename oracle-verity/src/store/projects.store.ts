// ============================================================
// ORACLE VERITY — PROJECTS STORE (Zustand 5)
// ============================================================

import { create } from 'zustand';
import { Project, DEFAULT_PROJECTS, Milestone } from '../core/project-registry';

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;

  addProject: (p: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  updateProgress: (projectId: string, progress: number) => void;
  setProjectRootPath: (projectId: string, path: string) => void;
  setProjectGithubRepo: (projectId: string, repoSlug: string) => void;
  setMilestones: (projectId: string, milestones: Milestone[]) => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: DEFAULT_PROJECTS,
  selectedProjectId: null,

  addProject: (p) =>
    set((s) => ({ projects: [...s.projects, p] })),

  updateProject: (id, updates) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      selectedProjectId: s.selectedProjectId === id ? null : s.selectedProjectId,
    })),

  selectProject: (id) => set({ selectedProjectId: id }),

  toggleMilestone: (projectId, milestoneId) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              milestones: p.milestones.map((m) =>
                m.id === milestoneId ? { ...m, completed: !m.completed } : m
              ),
            }
          : p
      ),
    })),

  updateProgress: (projectId, progress) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, progress } : p
      ),
    })),

  setProjectRootPath: (projectId, path) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, rootPath: path } : p
      ),
    })),

  setProjectGithubRepo: (projectId, repoSlug) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, githubRepo: repoSlug } : p
      ),
    })),

  setMilestones: (projectId, milestones) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              milestones,
              progress: milestones.length
                ? Math.round((milestones.filter((m) => m.completed).length / milestones.length) * 100)
                : 0,
            }
          : p
      ),
    })),
}));
