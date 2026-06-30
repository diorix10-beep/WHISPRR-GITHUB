import React, { useEffect, useState } from 'react';
import { useProjectsStore } from '../store/projects.store';
import { useOracleStore } from '../store/oracle.store';
import { useSettingsStore } from '../store/settings.store';
import { ORACLE_MODES } from '../core/persona';
import { Github, GitPullRequest, GitCommit, AlertCircle, Loader2, Brain } from 'lucide-react';
import { fetchGithubContext, GithubContext } from '../core/github-api';
import { Project } from '../core/project-registry';
import { sendToOracle } from '../core/oracle-engine';

function ProjectGithubCard({ project, accentColor }: { project: Project, accentColor: string }) {
  const settings = useSettingsStore();
  const token = settings.githubToken;
  const [data, setData] = useState<GithubContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [intel, setIntel] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function load() {
      if (!project.githubRepo) return;
      setLoading(true);
      const ctx = await fetchGithubContext(project.githubRepo, token);
      setData(ctx);
      setLoading(false);
    }
    load();
  }, [project.githubRepo, token]);

  const commitsCount = data?.commits.length || 0;
  const prsCount = data?.issues.filter(i => i.url.includes('/pull/')).length || 0;
  const issuesCount = data?.issues.filter(i => !i.url.includes('/pull/')).length || 0;

  const handleAskIntel = async () => {
    if (!data) return;
    setAnalyzing(true);
    setIntel(null);
    
    try {
      const commitLog = data.commits.slice(0, 10).map(c => `- ${c.message} (${c.sha.substring(0, 7)})`).join('\n');
      
      const prompt = `[SYSTEM INTEL REQUEST]
You are acting as an Intelligence Analyst for Oracle Systems.
Analyze the following repository activity for the project: ${project.name} (${project.githubRepo}).

Project Context:
- Status: ${project.status}
- Description: ${project.description}
- Latest Milestone: ${project.milestones[project.milestones.length - 1]?.title || 'None'}

GitHub Stats:
- Open Issues: ${issuesCount}
- Open PRs: ${prsCount}
- Recent Commits: ${commitsCount}

Latest Commits:
${commitLog}

Based on this data, provide a structured intelligence report answering:
1. What is the current project status?
2. What has changed recently?
3. What risks do you identify?
4. What should we prioritize next?

Format your response clearly. Be analytical, concise, and professional.`;

      const { reply } = await sendToOracle(prompt, [], {
        groqKey: settings.groqKey || undefined,
        groqUrl: settings.groqUrl || undefined,
        mode: 'executive',
        lang: 'en'
      });
      
      setIntel(reply);
    } catch (e: any) {
      setIntel(`[ERROR]: Failed to analyze intelligence data.\n${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ 
      background: 'rgba(0,0,0,0.2)', border: `1px solid ${accentColor}30`, 
      borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'white', fontWeight: 600 }}>{project.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: accentColor, opacity: 0.8 }}>{project.githubRepo}</div>
        </div>
        <span style={{ 
          fontSize: '10px', padding: '4px 8px', borderRadius: '99px', 
          background: project.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
          color: project.status === 'active' ? '#4ade80' : '#fbbf24', border: `1px solid ${project.status === 'active' ? '#4ade80' : '#fbbf24'}40`
        }}>
          {project.status.toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', minHeight: '60px' }}>
        {loading ? (
          <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
            <Loader2 size={16} className="spin" color={accentColor} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <GitCommit size={16} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: '14px', color: 'white', fontWeight: 600 }}>{commitsCount}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Commits</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={16} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: '14px', color: 'white', fontWeight: 600 }}>{issuesCount}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Issues</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <GitPullRequest size={16} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: '14px', color: 'white', fontWeight: 600 }}>{prsCount}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>PRs</span>
            </div>
          </>
        )}
      </div>

      {data && data.commits.length > 0 && (
        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Activity</div>
          {data.commits.slice(0, 2).map((c, i) => (
             <div key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <span style={{ color: accentColor }}>[{c.sha}]</span> {c.message}
             </div>
          ))}
        </div>
      )}

      <button 
        onClick={handleAskIntel}
        disabled={analyzing || !data}
        style={{ 
        marginTop: 'auto', width: '100%', padding: '8px', borderRadius: '8px', 
        background: analyzing ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', 
        border: 'none', color: analyzing ? 'rgba(255,255,255,0.4)' : 'white', cursor: analyzing || !data ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 600,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
      }}>
        {analyzing ? <Loader2 size={14} className="spin" /> : <Brain size={14} color={accentColor} />}
        {analyzing ? 'Analyzing intel...' : 'Ask Oracle for intel'}
      </button>

      {intel && (
        <div style={{
          marginTop: '12px', padding: '16px', background: 'rgba(0,0,0,0.4)',
          borderRadius: '12px', border: `1px solid ${accentColor}40`,
          borderLeft: `3px solid ${accentColor}`,
          maxHeight: '300px', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
            <Brain size={14} color={accentColor} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Oracle Intelligence Report
            </span>
          </div>
          <div style={{ 
            fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6,
            fontFamily: 'var(--font-primary)', whiteSpace: 'pre-wrap'
          }}>
            {intel}
          </div>
        </div>
      )}
    </div>
  );
}

export function GithubPage() {
  const { mode, lang } = useOracleStore();
  const accentColor = ORACLE_MODES[mode].accentColor;
  const projects = useProjectsStore(s => s.projects).filter(p => p.githubRepo);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Github size={24} color={accentColor} />
          {lang === 'fr' ? 'Intelligence GitHub' : 'GitHub Intelligence'}
        </h2>
        <p style={{ fontFamily: 'var(--font-primary)', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
          Real-time repository tracking and activity monitoring.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {projects.map(p => (
          <ProjectGithubCard key={p.id} project={p} accentColor={accentColor} />
        ))}
      </div>
    </div>
  );
}
