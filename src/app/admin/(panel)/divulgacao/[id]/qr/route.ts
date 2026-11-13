import QRCode from "qrcode";
import { getPromoLink, promoLinkUrl } from "@/application/promo/promo-links";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { getCurrentAdmin } from "@/infrastructure/web/admin-session";

/** Promo QR codes are generated locally (no external service) and encode the /r/{code} link. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.mustChangePassword) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const row = await getPromoLink(await getDb(), id);
  if (!row) return new Response("Not found", { status: 404 });

  const url = promoLinkUrl(getConfig().publicBaseUrl, row.link.code);
  const search = new URL(request.url).searchParams;
  const options = { errorCorrectionLevel: "M" as const, margin: 2, width: 1024 };
  const fileName = `qr-divulgacao-${row.link.code}`;
  if (search.get("formato") === "png") {
    const png = await QRCode.toBuffer(url, { ...options, type: "png" });
    return new Response(new Uint8Array(png), {
      headers: {
        "content-type": "image/png",
        "content-disposition": `attachment; filename="${fileName}.png"`,
      },
    });
  }
  const svg = await QRCode.toString(url, { ...options, type: "svg" });
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
      ...(search.get("download") ? { "content-disposition": `attachment; filename="${fileName}.svg"` } : {}),
    },
  });
}
