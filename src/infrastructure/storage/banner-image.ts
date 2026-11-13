import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const MAX_BANNER_BYTES = 5 * 1024 * 1024;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

export class BannerError extends Error {}

/**
 * Validates the real image type (not the extension), applies EXIF orientation, strips metadata
 * (including GPS) and re-encodes as a 1200px-wide WebP (docs/spec/06 §2 Upload).
 */
export async function processBanner(input: Buffer): Promise<{ fileName: string; content: Buffer }> {
  if (input.byteLength === 0) throw new BannerError("Arquivo de imagem vazio.");
  if (input.byteLength > MAX_BANNER_BYTES) throw new BannerError("A imagem deve ter no máximo 5 MB.");
  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    throw new BannerError("Arquivo de imagem inválido.");
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) throw new BannerError("Envie uma imagem JPEG, PNG ou WebP.");
  const content = await sharp(input)
    .rotate()
    .resize({ width: 1200, height: 675, fit: "cover", withoutEnlargement: false })
    .webp({ quality: 80 })
    .toBuffer();
  return { fileName: `${randomUUID()}.webp`, content };
}
