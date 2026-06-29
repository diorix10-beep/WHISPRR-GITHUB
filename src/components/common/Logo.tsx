export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4736E" />
          <stop offset="100%" stopColor="#C88B84" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#logo-bg)" />
      <path
        d="M20 40 C20 28, 30 20, 50 20 C70 20, 80 28, 80 40 C80 52, 70 58, 50 58 C44 58, 38 57.5, 34 57 L24 66 L27 55 C22 52, 20 47, 20 40Z"
        fill="white"
        fillOpacity="0.2"
      />
      <path
        d="M36 34 C39 30, 44 28, 49 30"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
      <path
        d="M36 42 C41 37, 48 35, 55 37"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <path
        d="M36 50 C43 45, 52 43, 62 45"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />
      <circle cx="32" cy="34" r="3.5" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
