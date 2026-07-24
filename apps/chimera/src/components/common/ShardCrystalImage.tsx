interface ShardCrystalImageProps {
  className?: string;
  size?: number; // size in pixels, e.g., 24, 36, 48, 96
  showGlow?: boolean;
}

export function ShardCrystalImage({ className = '', size = 32, showGlow = true }: ShardCrystalImageProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {showGlow && (
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-blue-600/40 via-cyan-400/40 to-indigo-500/40 rounded-full blur-md animate-pulse pointer-events-none"
          style={{ transform: 'scale(1.25)' }}
        />
      )}
      <img
        src="/images/shard_crystal.png"
        alt="Sapphire Shard"
        style={{ width: `${size}px`, height: `${size}px` }}
        className="object-contain drop-shadow-[0_0_14px_rgba(37,99,235,0.85)] relative z-10 select-none pointer-events-none transform transition-transform hover:scale-110"
      />
    </div>
  );
}
