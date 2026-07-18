import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ChimeraProject, CreatorStats } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: ChimeraProject[];
  stats: CreatorStats | null;
  loading: boolean;
  activeProject: ChimeraProject | null;
  setActiveProject: (project: ChimeraProject | null) => void;
  fetchProjects: () => Promise<void>;
  createProject: (data: Partial<ChimeraProject>) => Promise<ChimeraProject | null>;
  updateProject: (id: string, updates: Partial<ChimeraProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  refreshStats: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ChimeraProject[]>([]);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<ChimeraProject | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chimera_projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects((data as ChimeraProject[]) || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chimera_creator_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setStats(data as CreatorStats | null);
    } catch (err) {
      console.error('Error fetching creator stats:', err);
    }
  }, [user]);

  const createProject = useCallback(async (data: Partial<ChimeraProject>): Promise<ChimeraProject | null> => {
    if (!user) return null;
    try {
      const { data: created, error } = await supabase
        .from('chimera_projects')
        .insert({
          user_id: user.id,
          name: data.name || 'Untitled Project',
          description: data.description || '',
          project_type: data.project_type || 'character',
          cover_url: data.cover_url || null,
          settings: data.settings || {},
        })
        .select()
        .single();

      if (error) throw error;
      const project = created as ChimeraProject;
      setProjects(prev => [project, ...prev]);
      return project;
    } catch (err) {
      console.error('Error creating project:', err);
      return null;
    }
  }, [user]);

  const updateProject = useCallback(async (id: string, updates: Partial<ChimeraProject>) => {
    try {
      const { error } = await supabase
        .from('chimera_projects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      if (activeProject?.id === id) {
        setActiveProject(prev => prev ? { ...prev, ...updates } : prev);
      }
    } catch (err) {
      console.error('Error updating project:', err);
    }
  }, [activeProject]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('chimera_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProject?.id === id) setActiveProject(null);
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  }, [activeProject]);

  const archiveProject = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('chimera_projects')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProject?.id === id) setActiveProject(null);
    } catch (err) {
      console.error('Error archiving project:', err);
    }
  }, [activeProject]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      refreshStats();
    } else {
      setProjects([]);
      setStats(null);
      setLoading(false);
    }
  }, [user, fetchProjects, refreshStats]);

  return (
    <ProjectContext.Provider value={{
      projects,
      stats,
      loading,
      activeProject,
      setActiveProject,
      fetchProjects,
      createProject,
      updateProject,
      deleteProject,
      archiveProject,
      refreshStats,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
