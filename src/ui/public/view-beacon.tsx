"use client";

import { useEffect } from "react";

/**
 * Reports one page view after the page loads. Running in the browser keeps link-preview
 * fetchers and most crawlers out of the counts (docs/spec/03 §3).
 */
export function ViewBeacon({ target, eventId }: { target: "agenda" | "event"; eventId?: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const body = JSON.stringify({
      target,
      eventId: eventId ?? null,
      utmSource: params.get("utm_source"),
      utmCampaign: params.get("utm_campaign"),
    });
    fetch("/api/metrics/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* metrics must never break the page */
    });
  }, [target, eventId]);
  return null;
}
