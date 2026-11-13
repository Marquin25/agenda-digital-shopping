import { describe, expect, it } from "vitest";
import { isLikelyBot, resolveTrafficSource } from "@/domain/metrics/traffic-source";

describe("resolveTrafficSource", () => {
  it("uses the channel from utm_source and the promo code from utm_campaign", () => {
    expect(resolveTrafficSource({ utmSource: "instagram", utmCampaign: "ig-nov" }, null)).toEqual({
      channel: "instagram",
      promoCode: "ig-nov",
      fromCurrentPage: true,
    });
  });

  it("accepts the Portuguese channel names used in printed links", () => {
    expect(resolveTrafficSource({ utmSource: "qr-cartaz", utmCampaign: null }, null).channel).toBe(
      "qr_poster",
    );
  });

  it("classifies unknown sources as 'other'", () => {
    expect(resolveTrafficSource({ utmSource: "newsletter", utmCampaign: null }, null).channel).toBe("other");
  });

  it("keeps the visit's first source when a later page has no campaign parameters", () => {
    expect(resolveTrafficSource({ utmSource: null, utmCampaign: null }, "wifi|k7f2")).toEqual({
      channel: "wifi",
      promoCode: "k7f2",
      fromCurrentPage: false,
    });
  });

  it("is 'direct' with no parameters and no visit source", () => {
    expect(resolveTrafficSource({ utmSource: null, utmCampaign: null }, null).channel).toBe("direct");
  });

  it("ignores a tampered visit cookie", () => {
    expect(resolveTrafficSource({ utmSource: null, utmCampaign: null }, "<x>|y").channel).toBe("direct");
  });
});

describe("isLikelyBot", () => {
  it("flags link-preview fetchers", () => {
    expect(isLikelyBot("WhatsApp/2.23.20.0")).toBe(true);
    expect(isLikelyBot("facebookexternalhit/1.1")).toBe(true);
  });

  it("does not flag a mobile browser", () => {
    expect(
      isLikelyBot(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
  });

  it("treats a missing user agent as a bot", () => {
    expect(isLikelyBot(null)).toBe(true);
  });
});
