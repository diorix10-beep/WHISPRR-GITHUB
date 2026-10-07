import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(124,77,187,0.28),transparent_50%)]" />

      <section className="relative mx-auto flex max-w-7xl flex-wrap items-center gap-14 px-5 pb-10 pt-16 sm:px-8">
        <div className="min-w-0 flex-[1_1_520px]">
          <p className="mb-5 text-sm font-bold tracking-[0.26em] text-chimera-gold">AI ROLEPLAY &amp; STORYTELLING</p>
          <h1 className="font-serif text-6xl font-semibold leading-[1.02] sm:text-8xl">
            Meet a character.
            <span className="block text-chimera-gold">Make the story yours.</span>
          </h1>
          <p className="mt-7 max-w-xl text-xl leading-relaxed text-violet-100/85">
            Play scenes with fictional AI characters, or write long stories with an AI co-author. Same characters, same worlds, same memory in both.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/discover" className="inline-flex min-h-[52px] items-center rounded-full bg-chimera-gold px-7 text-base font-bold text-[#1a1208] hover:brightness-110">Browse characters</Link>
            <Link to="/auth" className="inline-flex min-h-[52px] items-center rounded-full border border-chimera-gold/50 px-7 text-base font-bold hover:bg-chimera-gold/10">Create a free account</Link>
          </div>
          <p className="mt-5 text-sm text-chimera-mute">CHIMERA is in early development. Some parts are still being built.</p>
        </div>

        <div className="min-w-0 max-w-lg flex-[1_1_380px] rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-7 shadow-2xl shadow-black/50">
          <p className="text-xs font-bold tracking-[0.22em] text-chimera-gold">YOUR FIRST SCENE</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">Pick a character, set the scene.</h2>
          <p className="mt-3 leading-relaxed text-violet-100/80">Every character comes with an opening scene, a personality and a clear rating, so you know what you are walking into.</p>
          <Link to="/discover" className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 text-sm font-bold hover:bg-chimera-gold/10">See who is waiting</Link>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <h2 className="mb-7 font-serif text-5xl font-semibold">Two ways to play</h2>
        <div className="grid gap-7 md:grid-cols-2">
          <article className="rounded-[22px] border border-chimera-gold/20 border-t-[3px] border-t-chimera-rose bg-chimera-panel p-8">
            <p className="text-xs font-bold tracking-[0.22em] text-chimera-rose">ROLEPLAY</p>
            <h3 className="mb-4 mt-2 font-serif text-4xl font-semibold">Step into a scene</h3>
            <ul className="list-disc space-y-2 pl-5 text-lg leading-relaxed text-violet-100/85">
              <li>Scenes that remember what happened</li>
              <li>Narrate, act, or step out of character</li>
              <li>Branch a moment, or regenerate a reply</li>
            </ul>
          </article>
          <article className="rounded-[22px] border border-chimera-gold/20 border-t-[3px] border-t-chimera-blue bg-chimera-panel p-8">
            <p className="text-xs font-bold tracking-[0.22em] text-chimera-blue">STORYTELLING</p>
            <h3 className="mb-4 mt-2 font-serif text-4xl font-semibold">Write the long form</h3>
            <ul className="list-disc space-y-2 pl-5 text-lg leading-relaxed text-violet-100/85">
              <li>Chapters, outlines and an autosaved draft</li>
              <li>An AI co-author that suggests, never takes over</li>
              <li>Lorebooks and worlds shared with roleplay</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pb-10 pt-6 sm:px-8">
        <div className="grid gap-7 md:grid-cols-3">
          <div>
            <h3 className="mb-2 font-serif text-2xl font-semibold text-chimera-gold">A rating on every story</h3>
            <p className="leading-relaxed text-violet-100/80">General, Mature or Adult, always visible before you start.</p>
          </div>
          <div>
            <h3 className="mb-2 font-serif text-2xl font-semibold text-chimera-gold">Adults only, verified</h3>
            <p className="leading-relaxed text-violet-100/80">Mature and Adult content stays locked until your age is verified.</p>
          </div>
          <div>
            <h3 className="mb-2 font-serif text-2xl font-semibold text-chimera-gold">You control memory</h3>
            <p className="leading-relaxed text-violet-100/80">See what a scene remembers. Edit it, or delete it, any time.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
