// ============================================================
// ORACLE VERITY — PROJECT CARD
// ============================================================

import React from 'react';
import { Project, getHealthColor, getHealthLabel, getStatusLabel } from '../../core/project-registry';

interface Props {
  project: Project;
  lang: 'en' | 'fr';
  onClick?: () => void;
  compact?: boolean;
}

export function ProjectCard({ project, lang, onClick, compact }: Props) {
  const completedMilestones = project.milestones.filter((m) => m.completed).length;
  const totalMilestones = project.milestones.length;
  const healthColor = getHealthColor(project.health);

  if (compact) {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={(e) => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: `${project.color}20`,
            border: `1px solid ${project.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          {project.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-primary)' }}>
            {project.name}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px', fontFamily: 'var(--font-primary)' }}>
            {project.phase}
          </div>
        </div>
        {/* Progress ring */}
        <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0 }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
            <circle
              cx="14" cy="14" r="11"
              fill="none"
              stroke={project.color}
              strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 11}`}
              strokeDashoffset={`${2 * Math.PI * 11 * (1 - project.progress / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 14 14)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', fontWeight: 700, color: project.color,
          }}>
            {project.progress}%
          </div>
        </div>
        {/* Health dot */}
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: healthColor, flexShrink: 0 }} />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(255,255,255,0.07)`,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = 'rgba(255,255,255,0.05)';
          el.style.borderColor = `${project.color}40`;
          el.style.boxShadow = `0 0 24px ${project.color}15`;
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = 'rgba(255,255,255,0.03)';
        el.style.borderColor = 'rgba(255,255,255,0.07)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Header bar */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${project.color}, ${project.color}60)` }} />

      <div style={{ padding: '16px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
          <div
            style={{
              width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
              background: `${project.color}18`, border: `1px solid ${project.color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}
          >
            {project.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: '15px', fontWeight: 800, color: 'rgba(255,255,255,0.95)' }}>
                {project.name}
              </span>
              <span
                style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
                  padding: '2px 7px', borderRadius: '99px',
                  background: `${healthColor}15`, color: healthColor, border: `1px solid ${healthColor}30`,
                  fontFamily: 'var(--font-primary)',
                }}
              >
                {getHealthLabel(project.health, lang)}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontFamily: 'var(--font-primary)' }}>
              {project.phase}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: '12px', fontFamily: 'var(--font-primary)', fontStyle: 'italic' }}>
          "{project.tagline}"
        </p>

        {/* Progress bar */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-primary)' }}>
              {lang === 'fr' ? 'Progression' : 'Progress'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: project.color, fontFamily: 'var(--font-primary)' }}>
              {project.progress}%
            </span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
            <div
              style={{
                height: '100%', borderRadius: '2px',
                background: `linear-gradient(90deg, ${project.color}, ${project.color}80)`,
                width: `${project.progress}%`,
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: `0 0 8px ${project.color}60`,
              }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {project.milestones.slice(0, 3).map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div
                style={{
                  width: '14px', height: '14px', borderRadius: '4px', flexShrink: 0,
                  border: `1.5px solid ${m.completed ? project.color : 'rgba(255,255,255,0.15)'}`,
                  background: m.completed ? `${project.color}30` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {m.completed && <span style={{ fontSize: '8px', color: project.color }}>✓</span>}
              </div>
              <span style={{
                fontSize: '11px', fontFamily: 'var(--font-primary)',
                color: m.completed ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.75)',
                textDecoration: m.completed ? 'line-through' : 'none',
              }}>
                {m.title}
              </span>
              {m.dueDate && !m.completed && (
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginLeft: 'auto', fontFamily: 'var(--font-primary)' }}>
                  {new Date(m.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
