import { backgroundCss, effectiveDim, type WallpaperSetting } from '../../lib/wallpaper';

/**
 * The chat background and the dark layer over it that keeps the text readable. It sits behind everything in its parent (which
 * must be `relative isolate`), takes no clicks and is hidden from screen readers.
 */
export function WallpaperLayer({ setting, imageUrl }: { setting: WallpaperSetting; imageUrl: string | null }) {
  const { choice } = setting;
  if (choice.kind === 'none') return null;
  const css = backgroundCss(choice);
  const picture = choice.kind === 'image';
  if (picture && !imageUrl) return null;
  if (!picture && !css) return null;
  const dim = effectiveDim(setting);
  return (
    <div aria-hidden="true" data-wallpaper={choice.kind} className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={picture ? { backgroundImage: `url("${imageUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: css ?? undefined }}>
      {dim > 0 && <div data-wallpaper-dim={dim} className="absolute inset-0" style={{ backgroundColor: `rgba(0, 0, 0, ${dim})` }} />}
    </div>
  );
}
