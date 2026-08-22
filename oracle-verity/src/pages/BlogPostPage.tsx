import React from 'react';
import samplePosts from '../sample/blogData';
import { useParams } from 'react-router-dom';

export function BlogPostPage() {
  const { slug } = useParams();
  const post = samplePosts.find(p => p.slug === slug);
  if (!post) return <div>Not found</div>;
  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>{post.title}</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>{post.excerpt}</p>
      <div style={{ marginTop: 18 }}>
        <p>This is placeholder content to demonstrate the blog. Replace with CMS or markdown files as needed.</p>
      </div>
    </div>
  );
}
