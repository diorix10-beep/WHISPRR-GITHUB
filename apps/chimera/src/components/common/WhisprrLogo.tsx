export function WhisprrLogo({
  size = 40,
  wordmark = false,
  className = '',
}: {
  size?: number;
  wordmark?: boolean;
  className?: string;
}) {
  const imgSrc = wordmark ? '/whisprr_logo_full.png' : '/whisprr_icon.png';
  const width = wordmark ? size * 2.8 : size;

  return (
    <img
      src={imgSrc}
      alt="WHISPRR Logo"
      width={width}
      height={size}
      className={`object-contain inline-block select-none ${className}`}
      style={{ height: `${size}px`, width: wordmark ? 'auto' : `${size}px` }}
    />
  );
}
