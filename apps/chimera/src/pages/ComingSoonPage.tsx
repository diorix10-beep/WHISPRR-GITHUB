import { Link } from 'react-router-dom';

interface ComingSoonPageProps {
  title: string;
  description: string;
}

/** An honest placeholder for parts of CHIMERA that are planned but not built yet. */
export default function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">COMING NEXT</p>
      <h1 className="font-serif text-5xl font-semibold leading-tight">{title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-violet-100/85">{description}</p>
      <Link to="/discover" className="mt-8 inline-flex min-h-[48px] items-center rounded-full border border-chimera-gold/50 px-6 font-bold hover:bg-chimera-gold/10">Browse characters</Link>
    </div>
  );
}
