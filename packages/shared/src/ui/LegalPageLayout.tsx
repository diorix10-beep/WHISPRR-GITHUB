import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="page-container pb-32 sm:pb-24 px-4 sm:px-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-warm-600 dark:text-warm-400 hover:text-primary-500 mb-6 mt-8 transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-warm-900 dark:text-warm-50 mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-sm font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
          Last updated: {lastUpdated}
        </p>
      </div>

      <div className="prose prose-warm dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-h2:text-2xl prose-h2:text-warm-900 dark:prose-h2:text-warm-50 prose-p:text-warm-700 dark:prose-p:text-warm-300 prose-p:leading-relaxed prose-a:text-primary-500 hover:prose-a:text-primary-600 space-y-8">
        {children}
      </div>
    </div>
  );
}
