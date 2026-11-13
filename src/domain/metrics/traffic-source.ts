export const TRAFFIC_CHANNELS = [
  "instagram",
  "wifi",
  "qr_poster",
  "qr_kiosk",
  "digital_signage",
  "direct_link",
  "other",
  "direct",
] as const;
export type TrafficChannel = (typeof TRAFFIC_CHANNELS)[number];

/** Channels an editor can choose for a promo link ("direct" is only the absence of a source). */
export const PROMO_CHANNELS = TRAFFIC_CHANNELS.filter((c) => c !== "direct") as Exclude<
  TrafficChannel,
  "direct"
>[];
export type PromoChannel = (typeof PROMO_CHANNELS)[number];

export const TRAFFIC_CHANNEL_LABELS: Record<TrafficChannel, string> = {
  instagram: "Instagram / redes sociais",
  wifi: "Portal Wi-Fi",
  qr_poster: "QR em cartaz",
  qr_kiosk: "QR em totem",
  digital_signage: "Painel digital",
  direct_link: "Link direto",
  other: "Outro",
  direct: "Direto (sem origem)",
};

/** Accepts both code names and the Portuguese slugs used in printed material. */
const SOURCE_ALIASES: Record<string, PromoChannel> = {
  instagram: "instagram",
  wifi: "wifi",
  "wi-fi": "wifi",
  qr_poster: "qr_poster",
  "qr-cartaz": "qr_poster",
  qr_kiosk: "qr_kiosk",
  "qr-totem": "qr_kiosk",
  digital_signage: "digital_signage",
  painel: "digital_signage",
  direct_link: "direct_link",
  "link-direto": "direct_link",
  other: "other",
};

const PROMO_CODE = /^[a-z0-9-]{1,32}$/;

export interface CampaignParams {
  utmSource: string | null;
  utmCampaign: string | null;
}

export interface ResolvedSource {
  channel: TrafficChannel;
  promoCode: string | null;
  /** True when the source came from this page's parameters (and should start the visit's source). */
  fromCurrentPage: boolean;
}

function toChannel(value: string): PromoChannel {
  return SOURCE_ALIASES[value.toLowerCase()] ?? "other";
}

function toPromoCode(value: string | null | undefined): string | null {
  return value && PROMO_CODE.test(value) ? value : null;
}

/** Serialised visit source kept in a session cookie: "<channel>|<promoCode>". */
export function serializeVisitSource(source: ResolvedSource): string {
  return `${source.channel}|${source.promoCode ?? ""}`;
}

/**
 * The origin of a visit is the campaign source of its first page (docs/spec/03 §3).
 * Later pages without parameters inherit it from the visit cookie.
 */
export function resolveTrafficSource(params: CampaignParams, visitCookie: string | null): ResolvedSource {
  if (params.utmSource) {
    return {
      channel: toChannel(params.utmSource),
      promoCode: toPromoCode(params.utmCampaign),
      fromCurrentPage: true,
    };
  }
  if (visitCookie) {
    const [channel, code] = visitCookie.split("|");
    if (channel && (TRAFFIC_CHANNELS as readonly string[]).includes(channel)) {
      return { channel: channel as TrafficChannel, promoCode: toPromoCode(code), fromCurrentPage: false };
    }
  }
  return { channel: "direct", promoCode: null, fromCurrentPage: false };
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp|telegram|slack|discord|embedly|preview|lighthouse|pingdom|curl|wget|python-requests|httpclient/i;

/** Heuristic only: link previews and crawlers must not inflate views (docs/spec/03 §4). */
export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}
