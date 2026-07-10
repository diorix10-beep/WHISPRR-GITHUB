interface ChimeraPlaceholderPageProps {
  title: string;
  description: string;
}

export function ChimeraPlaceholderPage({ title, description }: ChimeraPlaceholderPageProps) {

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-950/40 via-warm-900 to-warm-950 p-8 lg:p-12 border border-red-500/10 shadow-2xl flex flex-col items-center text-center gap-6">
        <div>
          <span className="text-red-400 font-semibold text-xs tracking-wider uppercase bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
            CHIMERA Roleplay Studio
          </span>
          <h1 className="text-3xl lg:text-4xl font-serif font-bold text-warm-50 mt-4 mb-3 leading-tight">
            {title}
          </h1>
          <p className="text-warm-400 max-w-lg text-sm lg:text-base leading-relaxed">
            {description}
          </p>
        </div>

        <div className="w-full max-w-md border-t border-warm-800 my-2 pt-6">
          <div className="p-4 rounded-2xl bg-warm-950/40 border border-warm-850 flex flex-col gap-2">
            <h3 className="font-semibold text-warm-200 text-sm">Features in Development:</h3>
            <ul className="text-xs text-warm-400 text-left space-y-1.5 list-disc pl-5">
              <li>High-fidelity roleplay memory synthesis (CHIMERA Adaptive Memory)</li>
              <li>Multi-character plot generation templates</li>
              <li>Global lorebook imports & dynamic context window injection</li>
              <li>Interactive world map triggers and relationship meters</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
