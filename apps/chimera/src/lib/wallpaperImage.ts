/**
 * Choosing a picture as a chat background. The picture never leaves the device: it is checked, made smaller, stripped of camera
 * details (place, date, device) by being redrawn, and kept in the browser. Checks come before any decoding, so a file that only
 * pretends to be a picture, or a small file that would unpack into an enormous image, is refused before it can cost memory.
 */

export const MAX_FILE_BYTES = 8 * 1024 * 1024;
/** Decoded size limit: a phone photo is 12 to 48 megapixels; browsers on phones cannot draw much more than 16. */
export const MAX_PIXELS = 16_000_000;
export const MAX_SIDE = 12_000;
/** The longest side of the stored picture. A chat background does not need more, and it keeps the stored size small. */
export const STORED_LONG_SIDE = 1_920;
export const STORED_QUALITY = 0.82;

export type ImageKind = 'png' | 'jpeg' | 'webp';

export class WallpaperImageError extends Error {}

/** The kind of picture these first bytes are, from the bytes themselves (a file's name and declared type can say anything). */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'webp';
  return null;
}

const be32 = (b: Uint8Array, i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const le24 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);

/** The width and height written in the file's header, or null when they cannot be read. Never decodes the picture. */
export function readImageSize(bytes: Uint8Array, kind: ImageKind): { width: number; height: number } | null {
  if (kind === 'png') {
    // 8-byte signature, then the IHDR chunk: length, "IHDR", width, height.
    if (bytes.length < 24 || bytes[12] !== 0x49 || bytes[13] !== 0x48 || bytes[14] !== 0x44 || bytes[15] !== 0x52) return null;
    return { width: be32(bytes, 16), height: be32(bytes, 20) };
  }
  if (kind === 'jpeg') {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = bytes[i + 1];
      if (marker === 0xff) {
        i += 1;
        continue;
      }
      // Markers with no length: standalone ones.
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      const length = (bytes[i + 2] << 8) | bytes[i + 3];
      // Start-of-frame markers carry the size (not DHT 0xC4, JPG 0xC8 or DAC 0xCC).
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: (bytes[i + 5] << 8) | bytes[i + 6], width: (bytes[i + 7] << 8) | bytes[i + 8] };
      }
      if (length < 2) return null;
      i += 2 + length;
    }
    return null;
  }
  // WebP: lossy (VP8 ), lossless (VP8L) or extended (VP8X), after the 12-byte RIFF header.
  if (bytes.length < 30) return null;
  const tag = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (tag === 'VP8X') return { width: le24(bytes, 24) + 1, height: le24(bytes, 27) + 1 };
  if (tag === 'VP8L') {
    if (bytes[20] !== 0x2f) return null;
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (tag === 'VP8 ') {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
    return { width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff };
  }
  return null;
}

/**
 * Says what is wrong with a file before anything is decoded, or returns the kind of picture it is.
 * Messages are written for the person choosing the file.
 */
export function checkImageBytes(bytes: Uint8Array, fileSize: number): ImageKind {
  if (fileSize <= 0 || bytes.length === 0) throw new WallpaperImageError('This file is empty.');
  if (fileSize > MAX_FILE_BYTES) throw new WallpaperImageError('This picture is larger than 8 MB. Please choose a smaller one.');
  const kind = sniffImage(bytes);
  if (!kind) throw new WallpaperImageError('Please choose a JPG, PNG or WebP picture.');
  const size = readImageSize(bytes, kind);
  if (!size || size.width < 1 || size.height < 1) throw new WallpaperImageError('This picture could not be read.');
  if (size.width > MAX_SIDE || size.height > MAX_SIDE || size.width * size.height > MAX_PIXELS) {
    throw new WallpaperImageError('This picture is too large in pixels (the limit is 16 megapixels). Please choose a smaller one.');
  }
  return kind;
}

/** How bright the brighter parts of a picture are: the 95th percentile of the pixels' relative luminance (0 to 1). */
export function brightPartOf(rgba: Uint8ClampedArray | Uint8Array): number {
  const levels: number[] = [];
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    // A see-through pixel is drawn on the dark page, so it counts as dark.
    const alpha = rgba[i + 3] / 255;
    levels.push((0.2126 * f(rgba[i]) + 0.7152 * f(rgba[i + 1]) + 0.0722 * f(rgba[i + 2])) * alpha);
  }
  if (levels.length === 0) return 0;
  levels.sort((a, b) => a - b);
  return levels[Math.min(levels.length - 1, Math.floor(levels.length * 0.95))];
}

export interface ProcessedImage {
  /** The stored picture: smaller, redrawn as a JPEG, with no camera details. */
  blob: Blob;
  width: number;
  height: number;
  /** See `brightPartOf`. */
  luminance: number;
}

function load(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new WallpaperImageError('This picture could not be opened.'));
    };
    image.src = url;
  });
}

/** Checks the file, then makes the stored version of it. Throws `WallpaperImageError` with a readable message. */
export async function processWallpaperFile(file: File): Promise<ProcessedImage> {
  const head = new Uint8Array(await file.slice(0, 64 * 1024).arrayBuffer());
  checkImageBytes(head, file.size);
  const image = await load(file);
  const scale = Math.min(1, STORED_LONG_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new WallpaperImageError('This browser cannot prepare pictures.');
  // JPEG has no see-through: draw on the page's own dark colour first.
  context.fillStyle = '#07060d';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  const small = document.createElement('canvas');
  small.width = 48;
  small.height = 48;
  const smallContext = small.getContext('2d');
  if (!smallContext) throw new WallpaperImageError('This browser cannot prepare pictures.');
  smallContext.drawImage(canvas, 0, 0, 48, 48);
  const luminance = brightPartOf(smallContext.getImageData(0, 0, 48, 48).data);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', STORED_QUALITY));
  if (!blob) throw new WallpaperImageError('This picture could not be prepared.');
  return { blob, width, height, luminance };
}
