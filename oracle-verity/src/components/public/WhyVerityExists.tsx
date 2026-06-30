import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Heart, Brain, Layers, Settings, Sprout } from 'lucide-react';

export function WhyVerityExists() {
  const navigate = useNavigate();
  const cards = [
    {
      icon: <Users size={24} color="#c9a84c" />,
      color: '#c9a84c',
      title: 'A Family, Not Just AI',
      familyRoute: '/family/oracle',
      description: 'Oracle guides. Athena researches. Iris builds. Aegis protects. Atlas strategizes. Each member has a role, a personality, and a purpose. Together they operate as one intelligence ecosystem.'
    },
    {
      icon: <Heart size={24} color="#f472b6" />,
      color: '#f472b6',
      familyRoute: '/family/whisprr',
      title: 'Built Around Relationships',
      description: 'The Verity Family is designed to feel familiar. Not a list of tools. Not a collection of bots. A connected family of digital companions that work together while remaining unique individuals.'
    },
    {
      icon: <Brain size={24} color="#8b5cf6" />,
      color: '#8b5cf6',
      familyRoute: '/family/iris',
      title: 'Memory That Matters',
      description: 'Conversations should not restart every day. The family remembers projects, preferences, goals, and context so every interaction builds on the last.'
    },
    {
      icon: <Layers size={24} color="#3b82f6" />,
      color: '#3b82f6',
      familyRoute: '/family/atlas',
      title: 'Intelligence Across Every Project',
      description: 'Whether you’re building a startup, managing a community, creating content, writing code, or planning your future, the Verity Family adapts to support your journey.'
    },
    {
      icon: <Settings size={24} color="#22d3ee" />,
      color: '#22d3ee',
      familyRoute: '/family/athena',
      title: 'Your Ecosystem, Your Rules',
      description: 'Choose which family members participate. Customize personalities. Customize voices. Customize workflows. Build the ecosystem that works best for you.'
    },
    {
      icon: <Sprout size={24} color="#22c55e" />,
      color: '#22c55e',
      familyRoute: '/family/aegis',
      title: 'Always Growing',
      description: 'The ecosystem is never stagnant. New family members can be introduced over time, evolving alongside your needs.'
    }
  ];

  return (
    <section style={{
      background: '#050508',
      color: '#fff',
      padding: '100px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow Effects */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Header section */}
        <div style={{ textAlign: 'center', marginBottom: '80px', maxWidth: '800px', margin: '0 auto 80px' }}>
          <div style={{ 
            fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.2em', 
            color: '#c9a84c', marginBottom: '20px', textTransform: 'uppercase',
            display: 'inline-block', borderBottom: '1px solid #c9a84c40', paddingBottom: '8px'
          }}>
            The Purpose
          </div>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', fontSize: '56px', fontWeight: 700, 
            lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Why Verity Exists
          </h2>
          <p style={{ 
            fontFamily: 'var(--font-primary)', fontSize: '20px', color: 'rgba(255,255,255,0.6)', 
            lineHeight: 1.6, fontWeight: 300 
          }}>
            Moving beyond sterile tools and disconnected bots. We are building a living ecosystem of digital companions that evolve alongside you.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {cards.map((card, idx) => (
            <div 
              key={idx}
              className="verity-card"
              onClick={() => card.familyRoute && navigate(card.familyRoute)}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '24px',
                padding: '40px 32px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: card.familyRoute ? 'pointer' : 'default',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = `${card.color}40`;
                e.currentTarget.style.boxShadow = `0 20px 40px ${card.color}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Dynamic Top Glow */}
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '100px', height: '2px', background: `linear-gradient(90deg, transparent, ${card.color}, transparent)`,
                opacity: 0.5
              }} />

              {/* Icon Container */}
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: `${card.color}15`, border: `1px solid ${card.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '24px'
              }}>
                {card.icon}
              </div>

              {/* Content */}
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600,
                color: 'white', marginBottom: '16px', letterSpacing: '-0.01em'
              }}>
                {card.title}
              </h3>
              <p style={{
                fontFamily: 'var(--font-primary)', fontSize: '15px', color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.7
              }}>
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
