// ============================================================
// ORACLE VERITY — PROJECT PANEL
// Right-side project ecosystem view
// ============================================================

import React, { useState } from 'react';
import { Plus, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { useProjectsStore } from '../../store/projects.store';
import { ProjectCard } from './ProjectCard';
import { Project } from '../../core/project-registry';
import { electronBridge } from '../../core/electron-bridge';

interface Props {
  lang: 'en' | 'fr';
  accentColor: string;
  compact?: boolean;
}

export function ProjectPanel({ lang, accentColor, compact }: Props) {
  const { projects, selectedProjectId, selectProject } = useProjectsStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingPathProjectId, setEditingPathProjectId] = useState<string | null>(null);
  const [tempPath, setTempPath] = useState('');
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en;

  const selected = projects.find(p => p.id === selectedProjectId);

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <span style={{
            fontFamily: 'var(--font-primary)', fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
          }}>
            {t('Projects', 'Projets')}
          </span>
          <span style={{
            fontSize: '10px', padding: '2px 7px', borderRadius: '99px',
            background: `${accentColor}15`, color: accentColor,
            fontFamily: 'var(--font-primary)', fontWeight: 600,
          }}>
            {projects.filter(p => p.status === 'active').length} {t('active', 'actifs')}
          </span>
        </div>
        {projects.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            lang={lang}
            compact
            onClick={() => selectProject(p.id === selectedProjectId ? null : p.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderOpen size={14} color={accentColor} />
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
            {t('Project Ecosystem', 'Écosystème Projets')}
          </span>
        </div>
        <span style={{
          fontSize: '11px', padding: '3px 10px', borderRadius: '99px',
          background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30`,
          fontFamily: 'var(--font-primary)', fontWeight: 600,
        }}>
          {projects.length} {t('projects', 'projets')}
        </span>
      </div>

      {/* Project list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {projects.map(project => (
            <div key={project.id}>
              <ProjectCard
                project={project}
                lang={lang}
                onClick={() => {
                  setExpanded(expanded === project.id ? null : project.id);
                  selectProject(project.id);
                }}
              />
              {/* Expanded detail */}
              {expanded === project.id && (
                <div style={{
                  marginTop: '6px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  animation: 'slide-up 0.2s cubic-bezier(0.4,0,0.2,1) forwards',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.6, marginBottom: '10px',
                  }}>
                    {project.description}
                  </p>
                  {/* All milestones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>
                      {t('All Milestones', 'Tous les Jalons')}
                    </span>
                    {project.milestones.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '14px', height: '14px', borderRadius: '4px', flexShrink: 0,
                          border: `1.5px solid ${m.completed ? project.color : 'rgba(255,255,255,0.15)'}`,
                          background: m.completed ? `${project.color}25` : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {m.completed && <span style={{ fontSize: '8px', color: project.color }}>✓</span>}
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-primary)', fontSize: '12px',
                          color: m.completed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
                          textDecoration: m.completed ? 'line-through' : 'none',
                          flex: 1,
                        }}>
                          {m.title}
                        </span>
                        {m.dueDate && !m.completed && (
                          <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                            {new Date(m.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '12px', marginBottom: '12px' }}>
                    {project.tags.map(tag => (
                      <span key={tag} style={{
                        fontFamily: 'var(--font-primary)', fontSize: '10px', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '99px',
                        background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Integrations (Local & GitHub) */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '6px' }}>
                      {t('Context Linking', 'Liaison de Contexte')}
                    </span>
                    
                    {/* Local Folder */}
                    <div style={{ marginBottom: '8px' }}>
                      {editingPathProjectId === project.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                          <input
                            type="text"
                            value={tempPath}
                            onChange={(e) => setTempPath(e.target.value)}
                            placeholder={t("Paste absolute folder path...", "Coller le chemin absolu...")}
                            autoFocus
                            style={{
                              flex: 1,
                              background: 'rgba(0,0,0,0.3)',
                              border: `1px solid ${accentColor}50`,
                              borderRadius: '6px',
                              padding: '5px 8px',
                              color: '#fff',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              outline: 'none',
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                useProjectsStore.getState().setProjectRootPath(project.id, tempPath.trim());
                                setEditingPathProjectId(null);
                              } else if (e.key === 'Escape') {
                                setEditingPathProjectId(null);
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              useProjectsStore.getState().setProjectRootPath(project.id, tempPath.trim());
                              setEditingPathProjectId(null);
                            }}
                            style={{
                              background: `${accentColor}20`,
                              border: `1px solid ${accentColor}40`,
                              borderRadius: '4px',
                              color: accentColor,
                              cursor: 'pointer',
                              padding: '4px 8px',
                              fontSize: '10px',
                              fontWeight: 600,
                              fontFamily: 'var(--font-primary)'
                            }}
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => setEditingPathProjectId(null)}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '4px',
                              color: 'rgba(255,255,255,0.4)',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              fontSize: '10px',
                              fontFamily: 'var(--font-primary)'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : project.rootPath ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span 
                            onClick={() => electronBridge.openPath(project.rootPath!)}
                            title={t("Click to open folder or copy path", "Cliquez pour ouvrir le dossier ou copier le chemin")}
                            style={{ 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: '10px', 
                              color: 'rgba(255,255,255,0.6)', 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              maxWidth: '160px',
                              cursor: 'pointer',
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                          >
                            📁 {project.rootPath}
                          </span>
                          <button onClick={async () => {
                            if (electronBridge.isAvailable) {
                              const path = await electronBridge.selectDirectory(project.rootPath);
                              if (path) useProjectsStore.getState().setProjectRootPath(project.id, path);
                            } else {
                              setEditingPathProjectId(project.id);
                              setTempPath(project.rootPath || '');
                            }
                          }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-primary)' }}>
                            {t('Change', 'Modifier')}
                          </button>
                        </div>
                      ) : (
                        <button onClick={async () => {
                          if (electronBridge.isAvailable) {
                            const path = await electronBridge.selectDirectory();
                            if (path) useProjectsStore.getState().setProjectRootPath(project.id, path);
                          } else {
                            setEditingPathProjectId(project.id);
                            setTempPath('');
                          }
                        }} style={{
                          width: '100%', padding: '6px', borderRadius: '6px',
                          background: `${accentColor}10`, border: `1px dashed ${accentColor}30`,
                          color: accentColor, fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.2s'
                        }} onMouseEnter={e => (e.currentTarget.style.background = `${accentColor}20`)} onMouseLeave={e => (e.currentTarget.style.background = `${accentColor}10`)}>
                          + {t('Link Local Folder', 'Lier un dossier local')}
                        </button>
                      )}
                    </div>

                    {/* GitHub Repo */}
                    <div>
                      {project.githubRepo ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                            🐙 {project.githubRepo}
                          </span>
                          <button onClick={() => {
                            const repo = prompt(t("Enter GitHub repo (owner/repo):", "Entrez le dépôt GitHub (owner/repo):"), project.githubRepo);
                            if (repo !== null) useProjectsStore.getState().setProjectGithubRepo(project.id, repo);
                          }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-primary)' }}>
                            {t('Change', 'Modifier')}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => {
                          const repo = prompt(t("Enter GitHub repo (owner/repo):", "Entrez le dépôt GitHub (owner/repo):"));
                          if (repo) useProjectsStore.getState().setProjectGithubRepo(project.id, repo);
                        }} style={{
                          width: '100%', padding: '6px', borderRadius: '6px',
                          background: `${accentColor}10`, border: `1px dashed ${accentColor}30`,
                          color: accentColor, fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.2s'
                        }} onMouseEnter={e => (e.currentTarget.style.background = `${accentColor}20`)} onMouseLeave={e => (e.currentTarget.style.background = `${accentColor}10`)}>
                          + {t('Link GitHub Repo', 'Lier un dépôt GitHub')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add project hint */}
        <button style={{
          width: '100%', marginTop: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '12px', borderRadius: '12px',
          background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)',
          cursor: 'pointer', color: 'rgba(255,255,255,0.25)',
          fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 600,
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}40`;
            (e.currentTarget as HTMLButtonElement).style.color = accentColor;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.25)';
          }}
        >
          <Plus size={14} />
          {t('Add Project', 'Ajouter un projet')}
        </button>
      </div>
    </div>
  );
}
