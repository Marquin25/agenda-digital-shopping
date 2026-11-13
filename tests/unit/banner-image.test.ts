import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { BannerError, processBanner } from "@/infrastructure/storage/banner-image";

describe("processBanner", () => {
  it("re-encodes a PNG as a 1200x675 WebP without metadata", async () => {
    const png = await sharp({ create: { width: 800, height: 600, channels: 3, background: "#17304f" } })
      .png()
      .withMetadata({ exif: { IFD0: { Copyright: "secret-location" } } })
      .toBuffer();
    const { fileName, content } = await processBanner(png);
    expect(fileName).toMatch(/^[0-9a-f-]+\.webp$/);
    const meta = await sharp(content).metadata();
    expect([meta.format, meta.width, meta.height, meta.exif]).toEqual(["webp", 1200, 675, undefined]);
  });

  it("rejects a non-image file even with an image extension", async () => {
    await expect(
      processBanner(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>")),
    ).rejects.toBeInstanceOf(BannerError);
  });
});
