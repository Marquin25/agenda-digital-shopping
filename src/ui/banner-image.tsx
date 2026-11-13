import { BANNER_WIDTHS, bannerHeight, bannerVariantFileName } from "@/domain/media/banner-variants";

export function bannerUrl(fileName: string): string {
  return `/media/${fileName}`;
}

/** Responsive event banner: the browser picks the smallest file that fits (saves mobile data). */
export function BannerImage({
  fileName,
  alt,
  className,
  sizes,
  lazy = false,
}: {
  fileName: string;
  alt: string;
  className: string;
  /** CSS `sizes` hint describing the rendered width. */
  sizes: string;
  lazy?: boolean;
}) {
  const [largest] = BANNER_WIDTHS;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- banners are pre-resized WebP served locally
    <img
      className={className}
      src={bannerUrl(fileName)}
      srcSet={BANNER_WIDTHS.map((w) => `${bannerUrl(bannerVariantFileName(fileName, w))} ${w}w`).join(", ")}
      sizes={sizes}
      alt={alt}
      width={largest}
      height={bannerHeight(largest)}
      loading={lazy ? "lazy" : undefined}
    />
  );
}
