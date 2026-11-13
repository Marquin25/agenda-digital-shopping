export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  url: string;
  startsAt: Date;
  endsAt: Date;
  /** Incremented on every edit so calendar apps replace the previous copy. */
  sequence: number;
  cancelled: boolean;
}

const MAX_OCTETS = 75;

function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Folds a content line at 75 octets without splitting multi-byte characters (RFC 5545 §3.1). */
function foldLine(line: string): string {
  const chunks: string[] = [];
  let current = "";
  let limit = MAX_OCTETS;
  for (const char of line) {
    if (Buffer.byteLength(current + char, "utf8") > limit) {
      chunks.push(current);
      current = "";
      limit = MAX_OCTETS - 1; // continuation lines start with a space
    }
    current += char;
  }
  chunks.push(current);
  return chunks.join("\r\n ");
}

export function buildIcs(event: CalendarEvent, options: { domain: string; now: Date }): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Conecta Shopping//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    `METHOD:PUBLISH`,
    "BEGIN:VEVENT",
    `UID:event-${event.id}@${options.domain}`,
    `DTSTAMP:${formatUtc(options.now)}`,
    `DTSTART:${formatUtc(event.startsAt)}`,
    `DTEND:${formatUtc(event.endsAt)}`,
    `SEQUENCE:${event.sequence}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    `URL:${event.url}`,
    `STATUS:${event.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Unofficial Google Calendar template link (no official documentation; secondary option, docs/research). */
export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatUtc(event.startsAt)}/${formatUtc(event.endsAt)}`,
    details: `${event.description}\n\n${event.url}`,
    location: event.location,
    ctz: "America/Sao_Paulo",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
