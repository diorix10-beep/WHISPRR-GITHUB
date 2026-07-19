import { useEffect, useRef, useMemo } from 'react';

const HERO_IMAGE =
  'https://images.pexels.com/photos/4670617/pexels-photo-4670617.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&fit=crop';

export function AuthHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    let raf = 0;
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        image.style.transform = `scale(1.08) translate(${x * -12}px, ${y * -12}px)`;
      });
    };
    const handleLeave = () => {
      cancelAnimationFrame(raf);
      image.style.transform = '';
    };

    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', handleLeave);
    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const size = 2 + Math.random() * 4;
        return {
          id: i,
          left: Math.random() * 100,
          size,
          duration: 14 + Math.random() * 12,
          delay: Math.random() * 10,
          drift: (Math.random() - 0.5) * 60,
          opacity: 0.15 + Math.random() * 0.25,
        };
      }),
    [],
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden hidden lg:block hero-fade-in"
    >
      {/* Ken Burns image layer */}
      <div
        ref={imageRef}
        className="absolute inset-0 ken-burns will-change-transform"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 0.4s ease-out',
        }}
      />

      {/* Dark overlay 28% */}
      <div className="absolute inset-0 bg-black/28" />

      {/* Warm gradient blend at edges */}
      <div className="absolute inset-0 bg-gradient-to-r from-warm-950/60 via-transparent to-warm-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-warm-950/70 via-transparent to-warm-950/30" />

      {/* Soft light bloom */}
      <div
        className="absolute top-[20%] left-[30%] w-[50%] h-[50%] rounded-full light-bloom will-change-transform pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(212,115,110,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="auth-particle"
          style={
            {
              left: `${p.left}%`,
              '--p-size': `${p.size}px`,
              '--p-duration': `${p.duration}s`,
              '--p-delay': `${p.delay}s`,
              '--p-drift': `${p.drift}px`,
              '--p-opacity': p.opacity,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Hero text overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-10 xl:p-14 pointer-events-none">
        <div className="max-w-md">
          <p className="auth-text-rise auth-text-rise-delay-3 font-serif text-2xl xl:text-3xl text-white/95 leading-snug drop-shadow-lg">
            Every story begins
            <br />
            with a spark of imagination.
          </p>
          <div className="auth-text-rise auth-text-rise-delay-4 mt-4 flex items-center gap-2">
            <div className="h-px w-10 bg-primary-400/60" />
            <span className="text-xs uppercase tracking-[0.2em] text-white/50 font-medium">
              CHIMERA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
