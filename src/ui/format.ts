import { MALL_TIME_ZONE, toLocalDateKey } from "@/domain/time/time-zone";

const dayHeading = new Intl.DateTimeFormat("pt-BR", {
  timeZone: MALL_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const shortDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: MALL_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});
const time = new Intl.DateTimeFormat("pt-BR", {
  timeZone: MALL_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const dateTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: MALL_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatTime = (d: Date) => time.format(d);
export const formatDateTime = (d: Date) => dateTime.format(d);
export const formatDayHeading = (d: Date) => dayHeading.format(d);
export const formatNumber = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

/** "sáb., 22 de nov. · 19:00–21:00", or two dates when the event spans days. */
export function formatEventWhen(startsAt: Date, endsAt: Date): string {
  if (toLocalDateKey(startsAt) === toLocalDateKey(endsAt)) {
    return `${shortDate.format(startsAt)} · ${formatTime(startsAt)}–${formatTime(endsAt)}`;
  }
  return `${shortDate.format(startsAt)}, ${formatTime(startsAt)} até ${shortDate.format(endsAt)}, ${formatTime(endsAt)}`;
}

export function formatVenue(venue: { name: string; floor: string }, detail: string): string {
  return [venue.floor, venue.name, detail].filter(Boolean).join(" · ");
}
