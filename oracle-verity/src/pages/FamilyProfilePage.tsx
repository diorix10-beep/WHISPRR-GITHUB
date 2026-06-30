import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, Activity, Shield, Star,
  Search, Map, Heart, Code, Network, ChevronRight, Users
} from 'lucide-react';
import { getMemberById, FAMILY_ROSTER, FamilyMember } from '../core/family-roster';
import { useOracleStore } from '../store/oracle.store';

const ICON_MAP: Record<string, React.ReactNode> = {
  oracle:   <Star   size={28} />,
  anthony:  <Code   size={28} />,
  iris:     <Network size={28} />,
  athena:   <Search size={28} />,
  atlas:    <Map    size={28} />,
  aegis:    <Shield size={28} />,
  whisprr:  <Heart  size={28} />,
};

export function FamilyProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const store = useOracleStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'relationships'>('profile');

  const member = getMemberById(memberId || '');

  if (!member) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'rgba(255,255,255,0.5)' }}>
          Family member not found.
        </div>
        <button onClick={() => navigate('/')} style={backBtnStyle}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const { color } = member;

  const handleChatClick = () => {
    store.setActiveCompanion(member.id);
    if (member.id === 'oracle') {
      navigate('/');
      if (!store.showChat) store.toggleChat();
    } else {
      navigate(`/workspace/${member.id}`);
    }
  };

  const handleRelationshipClick = (relId: string) => {
    navigate(`/family/${relId}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>

      {/* Ambient Glow Header */}
      <div style={{
        position: 'relative',
        background: `radial-gradient(ellipse at top, ${color}18 0%, transparent 60%)`,
        borderRadius: '24px',
        border: `1px solid ${color}20`,
        padding: '40px',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
          backgroundSize: '32px 32px', pointerEvents: 'none', borderRadius: '24px'
        }} />

        {/* Back Button */}
        <button onClick={() => navigate('/')} style={backBtnStyle}>
          <ArrowLeft size={16} />
          <span>The Family</span>
        </button>

        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', marginTop: '24px', position: 'relative', zIndex: 1 }}>
          {/* Avatar */}
          <div style={{
            width: '96px', height: '96px', borderRadius: '28px', flexShrink: 0,
            border: `2px solid ${color}50`,
            overflow: 'hidden',
            boxShadow: `0 0 40px ${color}30`
          }}>
            <img
              src={member.avatar}
              alt={member.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* Name & Title */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px', color: color,
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px'
            }}>
              {member.title} • Verity Family
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '44px', fontWeight: 700,
              color: 'white', lineHeight: 1.05, margin: 0, letterSpacing: '-0.02em'
            }}>
              {member.name}
            </h1>
            <div style={{
              fontFamily: 'var(--font-primary)', fontSize: '16px',
              color: 'rgba(255,255,255,0.5)', marginTop: '6px'
            }}>
              {member.role}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            <button
              onClick={handleChatClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '12px',
                background: color, border: 'none',
                color: '#000', fontFamily: 'var(--font-primary)',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: `0 0 20px ${color}40`
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <MessageSquare size={16} />
              Talk to {member.name}
            </button>
          </div>
        </div>

        {/* Live Activity */}
        <div style={{
          marginTop: '24px', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 16px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${color}15`, position: 'relative', zIndex: 1, width: 'fit-content'
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ color: '#22c55e', marginRight: '8px' }}>ONLINE</span>
            {member.activities[0]}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {(['profile', 'relationships'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 600,
              transition: 'all 0.2s', textTransform: 'capitalize',
              background: activeTab === tab ? color : 'transparent',
              color: activeTab === tab ? '#000' : 'rgba(255,255,255,0.5)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* Left: Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card color={color} title="About">
              <p style={{ fontFamily: 'var(--font-primary)', fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
                {member.bio}
              </p>
            </Card>

            <Card color={color} title="Voice Profile">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: `${color}15`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Activity size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: '4px' }}>
                    ElevenLabs Voice — {member.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                    {member.voiceDesc}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card color={color} title="Domains">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {member.domain.map(d => (
                  <div key={d} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: '8px', background: `${color}08`,
                    border: `1px solid ${color}15`
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{d}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card color={color} title="Personality Traits">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {member.traits.map(t => (
                  <span key={t} style={{
                    padding: '5px 12px', borderRadius: '99px',
                    background: `${color}15`, border: `1px solid ${color}30`,
                    fontFamily: 'var(--font-primary)', fontSize: '12px',
                    color: color, fontWeight: 600
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'relationships' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px'
          }}>
            {member.name}'s bonds with the family
          </div>
          {member.relationships.map(rel => {
            const related = getMemberById(rel.id)!;
            return (
              <div
                key={rel.id}
                onClick={() => handleRelationshipClick(rel.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '20px', borderRadius: '16px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${related.color}20`,
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${related.color}08`;
                  e.currentTarget.style.borderColor = `${related.color}40`;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = `${related.color}20`;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
                  border: `1px solid ${related.color}40`,
                  overflow: 'hidden'
                }}>
                  <img
                    src={related.avatar}
                    alt={related.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'white' }}>
                      {related.name}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '2px 8px',
                      borderRadius: '99px', background: `${related.color}15`, color: related.color,
                      letterSpacing: '0.05em'
                    }}>
                      {related.title}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                    {rel.bond}
                  </div>
                </div>
                <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom CTA: Explore the family */}
      <div style={{ marginTop: '32px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Users size={12} /> Explore the full family
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {FAMILY_ROSTER.filter(m => m.id !== member.id).map(m => (
            <button
              key={m.id}
              onClick={() => navigate(`/family/${m.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px 6px 6px', borderRadius: '10px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${m.color}25`,
                color: 'white', fontFamily: 'var(--font-primary)', fontSize: '13px',
                fontWeight: 500, transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${m.color}12`;
                e.currentTarget.style.borderColor = `${m.color}50`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = `${m.color}25`;
              }}
            >
              <img
                src={m.avatar}
                alt={m.name}
                style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${m.color}30` }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {m.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function Card({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden'
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
        color: color, letterSpacing: '0.1em', textTransform: 'uppercase'
      }}>
        {title}
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)',
  fontFamily: 'var(--font-primary)', fontSize: '13px', cursor: 'pointer',
  transition: 'all 0.2s'
};
