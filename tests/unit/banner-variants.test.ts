import { describe, expect, it } from "vitest";
import {
  bannerFileNames,
  bannerVariantFileName,
  ORPHAN_BANNER_GRACE_MS,
  orphanBannerFiles,
  originalBannerFileName,
} from "@/domain/media/banner-variants";

describe("banner variants", () => {
  const base = "3f2a9c1e-0000-4000-8000-000000000001.webp";

  it("keeps the stored name for the largest size and suffixes the smaller ones", () => {
    expect(bannerVariantFileName(base, 1200)).toBe(base);
    expect(bannerVariantFileName(base, 600)).toBe("3f2a9c1e-0000-4000-8000-000000000001-600.webp");
  });

  it("lists every file of a banner, so replacing it removes them all", () => {
    expect(bannerFileNames(base)).toEqual([base, "3f2a9c1e-0000-4000-8000-000000000001-600.webp"]);
  });

  it("maps a variant back to the original (fallback for banners stored before variants existed)", () => {
    expect(originalBannerFileName("3f2a9c1e-0000-4000-8000-000000000001-600.webp")).toBe(base);
    expect(originalBannerFileName(base)).toBe(base);
  });

  it("finds unreferenced banner files older than the grace period", () => {
    const now = new Date("2026-11-13T12:00:00Z");
    const old = new Date(now.getTime() - ORPHAN_BANNER_GRACE_MS - 1);
    const recent = new Date(now.getTime() - ORPHAN_BANNER_GRACE_MS + 1);
    const files = [
      { name: "used.webp", modifiedAt: old },
      { name: "used-600.webp", modifiedAt: old },
      { name: "orphan.webp", modifiedAt: old },
      { name: "orphan-600.webp", modifiedAt: old },
      { name: "uploading.webp", modifiedAt: recent },
    ];
    expect(orphanBannerFiles(files, ["used.webp"], now)).toEqual(["orphan.webp", "orphan-600.webp"]);
  });

  it("keeps a 24-hour grace period so an upload in progress is never collected", () => {
    expect(ORPHAN_BANNER_GRACE_MS).toBe(24 * 60 * 60 * 1000);
  });
});
