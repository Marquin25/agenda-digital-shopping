/** All local times in the product are in the mall's time zone (docs/spec/01 RNF09). */
export const MALL_TIME_ZONE = "America/Sao_Paulo";

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: MALL_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function localParts(instant: Date) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Offset of the mall time zone from UTC at a given instant, in milliseconds. */
function offsetAt(instant: Date): number {
  const p = localParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Converts a `datetime-local` value ("YYYY-MM-DDTHH:mm") entered in mall time to a UTC instant. */
export function localDateTimeToUtc(value: string): Date {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) throw new Error(`Invalid local date-time: ${value}`);
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number];
  const naiveUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle instants close to an offset change.
  let result = naiveUtc - offsetAt(new Date(naiveUtc));
  result = naiveUtc - offsetAt(new Date(result));
  return new Date(result);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date ("YYYY-MM-DD") of an instant in mall time. */
export function toLocalDateKey(instant: Date): string {
  const p = localParts(instant);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Value for an `<input type="datetime-local">` showing the instant in mall time. */
export function toLocalDateTimeInput(instant: Date): string {
  const p = localParts(instant);
  return `${toLocalDateKey(instant)}T${pad(p.hour)}:${pad(p.minute)}`;
}

function parseDateKey(key: string): [number, number, number] {
  const match = DATE_KEY.exec(key);
  if (!match) throw new Error(`Invalid date key: ${key}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isDateKey(value: string): boolean {
  return DATE_KEY.test(value) && addDaysToDateKey(value, 0) === value;
}

export function addDaysToDateKey(key: string, days: number): string {
  const [y, m, d] = parseDateKey(key);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Day of week of a calendar date, 0 = Sunday. */
export function weekdayOf(key: string): number {
  const [y, m, d] = parseDateKey(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** UTC instant of local midnight at the start of the given calendar date. */
export function startOfLocalDay(key: string): Date {
  return localDateTimeToUtc(`${key}T00:00`);
}
