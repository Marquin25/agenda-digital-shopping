import { getConfig } from "@/infrastructure/config";
import { LocalFileStorage } from "@/infrastructure/storage/file-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-z0-9-]+\.webp$/.test(file)) return new Response("Not found", { status: 404 });
  const content = await new LocalFileStorage(getConfig().uploadDir).read(file);
  if (!content) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(content), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
