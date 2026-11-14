/** Banner widths, largest first. The stored banner name is the largest file; smaller ones are suffixed. */
export const BANNER_WIDTHS = [1200, 600] as const;
export type BannerWidth = (typeof BANNER_WIDTHS)[number];
/** 16:9, rounded to whole pixels. */
export const bannerHeight = (width: BannerWidth) => Math.round((width * 9) / 16);

const LARGEST = BANNER_WIDTHS[0];

export function bannerVariantFileName(baseFileName: string, width: BannerWidth): string {
  return width === LARGEST ? baseFileName : baseFileName.replace(/\.webp$/, `-${width}.webp`);
}

export function bannerFileNames(baseFileName: string): string[] {
  return BANNER_WIDTHS.map((width) => bannerVariantFileName(baseFileName, width));
}

/** Variant name → stored (largest) name. Banners uploaded before variants existed only have that file. */
export function originalBannerFileName(fileName: string): string {
  const suffixes = BANNER_WIDTHS.filter((w) => w !== LARGEST).join("|");
  return fileName.replace(new RegExp(`-(${suffixes})\\.webp$`), ".webp");
}

/** Unreferenced files younger than this are kept: an upload may still be in progress (B-57). */
export const ORPHAN_BANNER_GRACE_MS = 24 * 60 * 60 * 1000;

/** Names of stored banner files that no event references and that are older than the grace period. */
export function orphanBannerFiles(
  files: ReadonlyArray<{ name: string; modifiedAt: Date }>,
  referencedBanners: ReadonlyArray<string>,
  now: Date,
): string[] {
  const referenced = new Set(referencedBanners);
  const graceStart = now.getTime() - ORPHAN_BANNER_GRACE_MS;
  return files
    .filter((file) => file.modifiedAt.getTime() < graceStart)
    .filter((file) => !referenced.has(originalBannerFileName(file.name)))
    .map((file) => file.name);
}
