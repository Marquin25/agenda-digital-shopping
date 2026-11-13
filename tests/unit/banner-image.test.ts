import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { BannerError, processBanner } from "@/infrastructure/storage/banner-image";

describe("processBanner", () => {
  it("re-encodes a PNG as 16:9 WebP files (1200 and 600 px wide) without metadata", async () => {
    const png = await sharp({ create: { width: 800, height: 600, channels: 3, background: "#17304f" } })
      .png()
      .withMetadata({ exif: { IFD0: { Copyright: "secret-location" } } })
      .toBuffer();
    const { fileName, files } = await processBanner(png);
    expect(fileName).toMatch(/^[0-9a-f-]+\.webp$/);
    const sizes = await Promise.all(
      files.map(async (file) => {
        const meta = await sharp(file.content).metadata();
        return [file.fileName, meta.format, meta.width, meta.height, meta.exif];
      }),
    );
    expect(sizes).toEqual([
      [fileName, "webp", 1200, 675, undefined],
      [fileName.replace(/\.webp$/, "-600.webp"), "webp", 600, 338, undefined],
    ]);
  });

  it("rejects a non-image file even with an image extension", async () => {
    await expect(
      processBanner(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>")),
    ).rejects.toBeInstanceOf(BannerError);
  });
});
