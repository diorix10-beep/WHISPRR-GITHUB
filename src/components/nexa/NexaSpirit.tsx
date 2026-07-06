import { useNexaSpirit } from '../../contexts/NexaSpiritContext';

interface NexaSpiritProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showProgress?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { img: 'w-8 h-8', ring: 32, stroke: 2.5, radius: 13 },
  md: { img: 'w-14 h-14', ring: 56, stroke: 3, radius: 24 },
  lg: { img: 'w-20 h-20', ring: 80, stroke: 3.5, radius: 35 },
};

export function NexaSpirit({ size = 'md', showLabel = false, showProgress = true, className = '' }: NexaSpiritProps) {
  const { spirit, loading, currentStage, nextStage, progressToNext } = useNexaSpirit();
  const dim = SIZE_MAP[size];

  if (loading || !spirit) {
    return (
      <div className={`${dim.img} rounded-full bg-warm-800/50 animate-pulse ${className}`} />
    );
  }

  const circumference = 2 * Math.PI * dim.radius;
  const dashOffset = circumference - (progressToNext / 100) * circumference;
  const isMaxStage = !nextStage;

  return (
    <div className={`group relative inline-flex flex-col items-center gap-1 ${className}`}>
      {/* Spirit Container with Progress Ring */}
      <div className="relative nexa-spirit-breathe">
        {/* SVG Progress Ring */}
        {showProgress && (
          <svg
            width={dim.ring}
            height={dim.ring}
            className="absolute inset-0 -rotate-90 z-10 pointer-events-none"
          >
            {/* Background ring */}
            <circle
              cx={dim.ring / 2}
              cy={dim.ring / 2}
              r={dim.radius}
              fill="none"
              stroke="rgba(220, 38, 38, 0.1)"
              strokeWidth={dim.stroke}
            />
            {/* Progress ring */}
            <circle
              cx={dim.ring / 2}
              cy={dim.ring / 2}
              r={dim.radius}
              fill="none"
              stroke={isMaxStage ? 'rgba(251, 191, 36, 0.7)' : 'rgba(220, 38, 38, 0.55)'}
              strokeWidth={dim.stroke}
              strokeDasharray={circumference}
              strokeDashoffset={isMaxStage ? 0 : dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
        )}

        {/* Spirit Image */}
        <img
          src={currentStage.image}
          alt={spirit.name || currentStage.name}
          className={`${dim.img} rounded-full object-cover border border-red-500/20 nexa-glow-red select-none relative z-0`}
        />

        {/* Orbiting particle */}
        <div className="absolute inset-0 nexa-spirit-orbit pointer-events-none z-20">
          <div
            className="absolute w-1 h-1 rounded-full bg-red-400/60"
            style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}
          />
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
            {spirit.name || currentStage.name}
          </p>
          {nextStage && (
            <p className="text-[8px] text-warm-500">
              {spirit.xp}/{nextStage.xpRequired} XP
            </p>
          )}
          {isMaxStage && (
            <p className="text-[8px] text-amber-400 font-semibold">
              ✦ Max Level
            </p>
          )}
        </div>
      )}

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        <div className="bg-warm-900 border border-warm-750 rounded-xl px-3 py-2 shadow-xl text-center whitespace-nowrap">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
            {spirit.name || currentStage.name}
          </p>
          <p className="text-[9px] text-warm-400 mt-0.5">
            {currentStage.description}
          </p>
          {nextStage && (
            <div className="mt-1.5 pt-1 border-t border-warm-800">
              <p className="text-[8px] text-warm-500">
                Next: <span className="text-warm-300">{nextStage.name}</span> — {nextStage.xpRequired - spirit.xp} XP to go
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
