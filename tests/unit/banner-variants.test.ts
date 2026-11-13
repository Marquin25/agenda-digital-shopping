import { describe, expect, it } from "vitest";
import {
  bannerFileNames,
  bannerVariantFileName,
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
});
