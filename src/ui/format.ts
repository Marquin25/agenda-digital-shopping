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
const longDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: MALL_TIME_ZONE,
  day: "numeric",
  month: "long",
});
const dayMonth = new Intl.DateTimeFormat("pt-BR", {
  timeZone: MALL_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
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
/** "Sexta-feira, 13 de novembro": only the first letter is capitalised, as in Portuguese. */
export const formatDayHeading = (d: Date) => {
  const text = dayHeading.format(d);
  return text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);
};
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

const sameLocalDay = (a: Date, b: Date) => toLocalDateKey(a) === toLocalDateKey(b);

/** Date line of the event page: "Sexta-feira, 13 de novembro" or "13 de novembro a 15 de novembro". */
export function formatEventDate(startsAt: Date, endsAt: Date): string {
  if (sameLocalDay(startsAt, endsAt)) return formatDayHeading(startsAt);
  return `${longDate.format(startsAt)} a ${longDate.format(endsAt)}`;
}

/** Time line of the event page: "19:00 às 21:00", with the dates when the event spans days. */
export function formatEventTime(startsAt: Date, endsAt: Date): string {
  if (sameLocalDay(startsAt, endsAt)) return `${formatTime(startsAt)} às ${formatTime(endsAt)}`;
  return `Das ${formatTime(startsAt)} de ${dayMonth.format(startsAt)} às ${formatTime(endsAt)} de ${dayMonth.format(endsAt)}`;
}

const reais = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** Informed cost range: "R$ 3.000 a R$ 8.000", or a single value when both ends match. */
export function formatCostRange(min: number, max: number): string {
  return min === max ? reais.format(min) : `${reais.format(min)} a ${reais.format(max)}`;
}

/** "45 min", "2 h" or "1 h 30 min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
