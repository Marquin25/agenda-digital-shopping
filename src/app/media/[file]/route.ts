import { originalBannerFileName } from "@/domain/media/banner-variants";
import { getConfig } from "@/infrastructure/config";
import { LocalFileStorage } from "@/infrastructure/storage/file-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-z0-9-]+\.webp$/.test(file)) return new Response("Not found", { status: 404 });
  const storage = new LocalFileStorage(getConfig().uploadDir);
  // Banners stored before responsive sizes existed only have the original file.
  const content = (await storage.read(file)) ?? (await storage.read(originalBannerFileName(file)));
  if (!content) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(content), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
