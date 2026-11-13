import { afterAll, describe, expect, it } from "vitest";
import { createAdminUser } from "@/application/auth/admin-auth";
import { getDashboardSummary } from "@/application/metrics/dashboard";
import { AGENDA_TARGET, deleteDeviceData, recordPageView, recordPromoLinkHit } from "@/application/metrics/record-metrics";
import { createPromoLink, resolvePromoRedirect, setPromoLinkActive } from "@/application/promo/promo-links";
import { createTestDb } from "./test-db";

describe("metrics and promo links", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  const userId = await createAdminUser(db, null, {
    name: "Editor",
    email: "editor@example.test",
    role: "editor",
    temporaryPassword: "senha-de-teste-longa",
  });
  const period = { from: "2026-11-01", to: "2026-11-30" };
  afterAll(() => connection.close());

  const view = (deviceHash: string, day = "2026-11-18", channel: "instagram" | "direct" = "instagram") => ({
    targetKey: AGENDA_TARGET,
    eventId: null,
    day,
    deviceHash,
    channel,
    promoCode: null,
  });

  it("counts reloads as measured page loads but one estimated visitor per device and day", async () => {
    await recordPageView(db, view("device-a"));
    await recordPageView(db, view("device-a"));
    await recordPageView(db, view("device-b", "2026-11-18", "direct"));
    await recordPageView(db, view("device-a", "2026-11-19"));
    const summary = await getDashboardSummary(db, period);
    expect(summary.agendaVisitors).toEqual({ quality: "estimated", value: 3 });
    expect(summary.agendaPageLoads).toEqual({ quality: "measured", value: 4 });
    expect(summary.sources).toEqual([
      { channel: "instagram", devices: 2 },
      { channel: "direct", devices: 1 },
    ]);
  });

  it("reports pending indicators as unavailable instead of zero", async () => {
    const summary = await getDashboardSummary(db, period);
    expect(summary.interested.quality).toBe("unavailable");
    expect(summary.checkIns.quality).toBe("unavailable");
    expect(summary.sales.quality).toBe("unavailable");
  });

  it("deletes the data of one device only", async () => {
    expect(await deleteDeviceData(db, "device-a")).toBe(2);
    const summary = await getDashboardSummary(db, period);
    expect(summary.agendaVisitors).toEqual({ quality: "estimated", value: 1 });
  });

  it("redirects promo links to the agenda with campaign parameters and counts hits", async () => {
    const { id, code } = await createPromoLink(db, userId, {
      channel: "qr_poster",
      description: "Cartaz entrada A",
      agendaQuery: "categoria=infantil&evil=<x>",
    });
    expect(code).toMatch(/^[a-z2-9]{6}$/);
    const redirect = await resolvePromoRedirect(db, code);
    expect(redirect?.location).toBe(`/?categoria=infantil&utm_source=qr_poster&utm_medium=promo_link&utm_campaign=${code}`);
    await recordPromoLinkHit(db, id, "2026-11-18");
    await recordPromoLinkHit(db, id, "2026-11-18");
    const summary = await getDashboardSummary(db, period);
    expect(summary.promoLinks.find((l) => l.code === code)?.hits).toBe(2);
  });

  it("stops resolving deactivated links", async () => {
    const { id, code } = await createPromoLink(db, userId, { channel: "instagram", description: "Bio" });
    await setPromoLinkActive(db, userId, id, false);
    expect(await resolvePromoRedirect(db, code)).toBeNull();
  });
});
