import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useIsFounder } from '../../hooks/useIsFounder';
import { MODERATION_LIVE } from '../../lib/moderation';

export function AdminCrumbs({ last }: { last: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-sm font-bold tracking-[0.2em] text-chimera-gold">
      ADMIN <span aria-hidden="true">›</span> MODERATION <span aria-hidden="true">›</span>{' '}
      {last === 'REPORTS' ? <span aria-current="page">REPORTS</span> : <><Link to="/admin/moderation/reports" className="underline-offset-4 hover:underline">REPORTS</Link> <span aria-hidden="true">›</span> <span aria-current="page">{last}</span></>}
    </nav>
  );
}

/** Who may see the admin pages is decided by the database; this only avoids showing a page that would only say "no". */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { isFounder, loading } = useIsFounder();
  if (loading) return <p className="py-24 text-center text-chimera-mute">Checking access…</p>;
  if (!isFounder || !MODERATION_LIVE) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <ShieldAlert className="mx-auto text-chimera-gold" size={32} aria-hidden="true" />
        <h1 className="mt-3 font-serif text-4xl font-semibold">{isFounder ? 'Not available yet' : 'Page not found'}</h1>
        <p className="mt-3 text-chimera-mute">{isFounder ? 'Moderation reports are not switched on yet.' : 'This page does not exist, or you do not have access to it.'}</p>
        <Link to="/" className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Home</Link>
      </div>
    );
  }
  return <>{children}</>;
}

