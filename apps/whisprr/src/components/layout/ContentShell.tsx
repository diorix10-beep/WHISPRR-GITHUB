import { ReactNode } from 'react';

type ShellSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ContentShellProps {
  children: ReactNode;
  size?: ShellSize;
  className?: string;
}

const sizeClass: Record<ShellSize, string> = {
  xs: 'content-shell content-shell-xs',
  sm: 'content-shell content-shell-sm',
  md: 'content-shell content-shell-md',
  lg: 'content-shell content-shell-lg',
  xl: 'content-shell content-shell-xl',
};

/**
 * ContentShell — WHISPRR Layout Foundation v1.0
 *
 * The universal page content wrapper. Every authenticated page should
 * wrap its content in <ContentShell size="..."> to guarantee consistent
 * centering, max-width, and padding across the entire platform.
 *
 * Sizes map to CSS custom property tokens:
 *   xs → 480px  (narrow threads, dialogs)
 *   sm → 600px  (feed, whisper detail, notifications, bookmarks)
 *   md → 720px  (messages, communities list, settings)
 *   lg → 900px  (discover, profiles, community detail)
 *   xl → 1080px (founder panel, admin views)
 */
export function ContentShell({
  children,
  size = 'md',
  className = '',
}: ContentShellProps) {
  return (
    <div className={`${sizeClass[size]} ${className}`}>
      {children}
    </div>
  );
}
