// ─── Client-side image compression ──────────────────────────────
// Resizes large screenshots to max 1600px wide + JPEG 0.85 quality.
// Keeps base64 payloads well under Gemini's ~4MB inline limit.

export interface CompressResult {
  dataUrl: string;
  base64: string;
  mimeType: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  opts: { maxDimension?: number; quality?: number; forceJpeg?: boolean } = {}
): Promise<CompressResult> {
  const maxDimension = opts.maxDimension ?? 1600;
  const quality = opts.quality ?? 0.85;
  const forceJpeg = opts.forceJpeg !== false;

  const originalBytes = file.size;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  const longest = Math.max(width, height);
  if (longest > maxDimension) {
    const scale = maxDimension / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      dataUrl,
      base64: dataUrl.replace(/^data:image\/\w+;base64,/, ''),
      mimeType: file.type || 'image/png',
      originalBytes,
      compressedBytes: originalBytes,
      width: img.width,
      height: img.height,
    };
  }

  if (forceJpeg) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const outMime = forceJpeg ? 'image/jpeg' : (file.type || 'image/png');
  const compressedDataUrl = canvas.toDataURL(outMime, quality);
  const compressedBase64 = compressedDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const compressedBytes = Math.round((compressedBase64.length * 3) / 4);

  return {
    dataUrl: compressedDataUrl,
    base64: compressedBase64,
    mimeType: outMime,
    originalBytes,
    compressedBytes,
    width,
    height,
  };
}
