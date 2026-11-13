import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { BANNER_WIDTHS, bannerHeight, bannerVariantFileName } from "@/domain/media/banner-variants";

export const MAX_BANNER_BYTES = 5 * 1024 * 1024;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

export class BannerError extends Error {}

export interface ProcessedBanner {
  /** Name stored on the event (largest size). */
  fileName: string;
  /** Every size to save, largest first. */
  files: { fileName: string; width: number; content: Buffer }[];
}

/**
 * Validates the real image type (not the extension), applies EXIF orientation, strips metadata
 * (including GPS) and re-encodes as 16:9 WebP in each responsive width (docs/spec/06 §2 Upload).
 */
export async function processBanner(input: Buffer): Promise<ProcessedBanner> {
  if (input.byteLength === 0) throw new BannerError("Arquivo de imagem vazio.");
  if (input.byteLength > MAX_BANNER_BYTES) throw new BannerError("A imagem deve ter no máximo 5 MB.");
  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    throw new BannerError("Arquivo de imagem inválido.");
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) throw new BannerError("Envie uma imagem JPEG, PNG ou WebP.");

  const fileName = `${randomUUID()}.webp`;
  const files = await Promise.all(
    BANNER_WIDTHS.map(async (width) => ({
      fileName: bannerVariantFileName(fileName, width),
      width,
      content: await sharp(input)
        .rotate()
        .resize({ width, height: bannerHeight(width), fit: "cover", withoutEnlargement: false })
        .webp({ quality: 80 })
        .toBuffer(),
    })),
  );
  return { fileName, files };
}
