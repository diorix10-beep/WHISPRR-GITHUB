import React from 'react';
import samplePosts from '../sample/blogData';

export function ResourcesPage() {
  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>Resources</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>Insights, guides, and case studies.</p>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {samplePosts.map(p => (
          <a key={p.slug} href={`#/blog/${p.slug}`} style={{ display: 'block', padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)', color: 'white', textDecoration: 'none' }}>
            <div style={{ fontWeight: 700 }}>{p.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{p.excerpt}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
