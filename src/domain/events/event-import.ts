import { normalizeSearchText } from "@/domain/text/normalize";

/**
 * Spreadsheet import of events (B-94): template columns and the pure parsing of one row. Names
 * (venue, category, accessibility, stores) are resolved later against the database; nothing here
 * touches it. Dates are wall-clock times in the mall's time zone.
 */

export type ImportCell = string | number | boolean | Date | null;

/** Limits checked on the server before and while reading the file. */
export const IMPORT_LIMITS = { maxBytes: 1_000_000, maxRows: 500 } as const;

export type ImportColumnKey =
  | "code"
  | "title"
  | "description"
  | "startsAt"
  | "endsAt"
  | "venue"
  | "locationDetail"
  | "category"
  | "accessibility"
  | "stores"
  | "admissionInfo"
  | "capacityMode"
  | "displayedCapacity"
  | "ratingPeriodDays"
  | "publish";

export interface ImportColumn {
  key: ImportColumnKey;
  header: string;
  required: boolean;
  /** Accepted values, shown on the import page and in the docs. */
  format: string;
  example: string;
}

export const IMPORT_COLUMNS: readonly ImportColumn[] = [
  {
    key: "code",
    header: "Código",
    required: false,
    format: "Letras, números, ponto, hífen ou sublinhado (até 64). Identifica o evento para atualizações.",
    example: "NATAL-2026-01",
  },
  {
    key: "title",
    header: "Título",
    required: true,
    format: "3 a 120 caracteres.",
    example: "Oficina de Natal",
  },
  {
    key: "description",
    header: "Descrição",
    required: true,
    format: "10 a 5.000 caracteres.",
    example: "Oficina de enfeites para crianças de 4 a 10 anos.",
  },
  {
    key: "startsAt",
    header: "Início",
    required: true,
    format: "dd/mm/aaaa hh:mm (horário de Brasília) ou célula de data e hora do Excel.",
    example: "20/12/2026 15:00",
  },
  {
    key: "endsAt",
    header: "Término",
    required: true,
    format: "Mesmo formato do início; precisa ser depois dele.",
    example: "20/12/2026 17:00",
  },
  {
    key: "venue",
    header: "Espaço",
    required: true,
    format: "Nome de um espaço ativo já cadastrado.",
    example: "Praça Central",
  },
  {
    key: "locationDetail",
    header: "Detalhe do local",
    required: false,
    format: "Até 200 caracteres.",
    example: "Perto da fonte",
  },
  {
    key: "category",
    header: "Categoria",
    required: true,
    format: "Nome de uma categoria ativa.",
    example: "Infantil",
  },
  {
    key: "accessibility",
    header: "Acessibilidade",
    required: false,
    format: "Recursos cadastrados, separados por ponto e vírgula.",
    example: "Intérprete de Libras; Rampa de acesso",
  },
  {
    key: "stores",
    header: "Lojas",
    required: false,
    format: "Lojas ativas cadastradas, separadas por ponto e vírgula.",
    example: "Livraria Leitura",
  },
  {
    key: "admissionInfo",
    header: "Entrada",
    required: false,
    format: "Até 300 caracteres.",
    example: "Gratuita, por ordem de chegada",
  },
  {
    key: "capacityMode",
    header: "Vagas",
    required: false,
    format: "“Livre” (padrão) ou “Ordem de chegada”. Não existe reserva.",
    example: "Ordem de chegada",
  },
  {
    key: "displayedCapacity",
    header: "Vagas exibidas",
    required: false,
    format: "Número de 1 a 100.000; só com “Ordem de chegada”.",
    example: "30",
  },
  {
    key: "ratingPeriodDays",
    header: "Dias para avaliar",
    required: false,
    format: "1 a 30 (padrão 7).",
    example: "7",
  },
  {
    key: "publish",
    header: "Publicar",
    required: false,
    format: "“Sim” publica ao confirmar; vazio ou “Não” deixa como rascunho.",
    example: "Sim",
  },
];

/** Columns that look like images: banners are never downloaded from a spreadsheet. */
const BANNER_HEADERS = new Set(["banner", "imagem", "foto", "url da imagem", "texto alternativo"]);

const normalizeHeader = (value: ImportCell) => normalizeSearchText(cellText(value));
const COLUMN_BY_HEADER = new Map(IMPORT_COLUMNS.map((c) => [normalizeHeader(c.header), c]));

export interface ImportHeader {
  columns: Map<ImportColumnKey, number>;
  /** Every template column is present (required to update existing events). */
  complete: boolean;
  errors: string[];
  warnings: string[];
}

export function readImportHeader(row: readonly ImportCell[]): ImportHeader {
  const columns = new Map<ImportColumnKey, number>();
  const errors: string[] = [];
  const warnings: string[] = [];
  row.forEach((cell, index) => {
    const label = cellText(cell);
    if (!label) return;
    const column = COLUMN_BY_HEADER.get(normalizeHeader(cell));
    if (!column) {
      warnings.push(
        BANNER_HEADERS.has(normalizeHeader(cell))
          ? `A coluna “${label}” foi ignorada: banners não são importados; envie a imagem na tela do evento.`
          : `A coluna “${label}” foi ignorada: não faz parte do modelo.`,
      );
      return;
    }
    if (columns.has(column.key)) errors.push(`A coluna “${column.header}” aparece mais de uma vez.`);
    else columns.set(column.key, index);
  });
  for (const column of IMPORT_COLUMNS)
    if (column.required && !columns.has(column.key))
      errors.push(`Falta a coluna obrigatória “${column.header}”.`);
  return {
    columns,
    complete: columns.size === IMPORT_COLUMNS.length,
    errors: [...new Set(errors)],
    warnings,
  };
}

/** Text of a cell for free-text fields. */
export function cellText(value: ImportCell | undefined): string {
  if (value == null) return "";
  if (value instanceof Date) return toWallClock(value) ?? "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value).trim();
}

const pad = (n: number) => String(n).padStart(2, "0");

function wallClock(year: number, month: number, day: number, hour: number, minute: number): string | null {
  if (hour > 23 || minute > 59) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day)
    return null;
  if (year < 2000 || year > 2100) return null;
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** Excel stores dates without a time zone; the reader returns them with the wall-clock time in UTC fields. */
function toWallClock(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  return wallClock(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  );
}

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;
const BRAZILIAN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T]+(\d{1,2}):(\d{2})(?::\d{2})?$/;
const ISO = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;
const SERIAL = /^\d{5}(\.\d+)?$/;

/** "YYYY-MM-DDTHH:mm" in mall time, or null when the cell is not a complete, real date and time. */
export function parseLocalDateTimeCell(value: ImportCell): string | null {
  if (value instanceof Date) return toWallClock(value);
  if (typeof value === "number" || (typeof value === "string" && SERIAL.test(value.trim()))) {
    const serial = Number(value);
    if (!Number.isFinite(serial) || serial < 36526 || serial > 73051) return null; // 2000–2100
    const minutes = Math.round(serial * 24 * 60);
    return toWallClock(new Date(EXCEL_EPOCH_MS + (minutes / (24 * 60)) * DAY_MS));
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  const br = BRAZILIAN.exec(text);
  if (br) return wallClock(Number(br[3]), Number(br[2]), Number(br[1]), Number(br[4]), Number(br[5]));
  const iso = ISO.exec(text);
  if (iso) return wallClock(Number(iso[1]), Number(iso[2]), Number(iso[3]), Number(iso[4]), Number(iso[5]));
  return null;
}

const YES = new Set(["sim", "s", "yes", "y", "x", "true", "1", "verdadeiro"]);
const NO = new Set(["", "nao", "n", "no", "false", "0", "falso"]);
const UNLIMITED = new Set(["", "livre", "ilimitada", "ilimitado", "sem limite"]);
const FIRST_COME = new Set(["ordem de chegada", "por ordem de chegada", "limitada", "limitadas"]);
const CODE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export interface ImportIssue {
  /** Template header of the column, or null for the whole row. */
  column: string | null;
  message: string;
}

export interface ParsedImportRow {
  /** Spreadsheet line number (the header is line 1). */
  line: number;
  /** Upper-case code, or null when the row has none. */
  code: string | null;
  publish: boolean;
  /** Form values for the event schema (dates as "YYYY-MM-DDTHH:mm" in mall time). */
  values: {
    title: string;
    description: string;
    startsAt: string;
    endsAt: string;
    locationDetail: string;
    admissionInfo: string;
    capacityMode: "unlimited" | "first_come";
    displayedCapacity: string;
    ratingPeriodDays: string;
  };
  /** Names to resolve against the registered venues, categories, features and stores. */
  names: { venue: string; category: string; features: string[]; stores: string[] };
  errors: ImportIssue[];
  warnings: ImportIssue[];
}

const headerOf = (key: ImportColumnKey) => IMPORT_COLUMNS.find((c) => c.key === key)!.header;
const splitList = (text: string) =>
  text
    .split(/[;,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Parses one data row; returns null for a fully empty row (skipped without counting). */
export function parseImportRow(
  row: readonly ImportCell[],
  header: ImportHeader,
  line: number,
): ParsedImportRow | null {
  const raw = (key: ImportColumnKey): ImportCell => {
    const index = header.columns.get(key);
    return index === undefined ? null : (row[index] ?? null);
  };
  const text = (key: ImportColumnKey) => cellText(raw(key));
  if ([...header.columns.values()].every((index) => cellText(row[index] ?? null) === "")) return null;

  const errors: ImportIssue[] = [];
  const error = (key: ImportColumnKey, message: string) => errors.push({ column: headerOf(key), message });

  const rawCode = text("code");
  if (rawCode && !CODE.test(rawCode))
    error("code", "Use só letras, números, ponto, hífen ou sublinhado (até 64).");

  const date = (key: "startsAt" | "endsAt") => {
    const parsed = parseLocalDateTimeCell(raw(key));
    if (parsed) return parsed;
    error(key, text(key) ? "Data e hora inválidas. Use dd/mm/aaaa hh:mm." : "Informe a data e a hora.");
    return "";
  };
  const startsAt = date("startsAt");
  const endsAt = date("endsAt");

  const capacity = normalizeSearchText(text("capacityMode"));
  let capacityMode: "unlimited" | "first_come" = "unlimited";
  if (FIRST_COME.has(capacity)) capacityMode = "first_come";
  else if (!UNLIMITED.has(capacity)) error("capacityMode", "Use “Livre” ou “Ordem de chegada”.");

  const publishText = normalizeSearchText(text("publish"));
  const publish = YES.has(publishText);
  if (!publish && !NO.has(publishText)) error("publish", "Use “Sim” ou “Não”.");

  return {
    line,
    code: rawCode && CODE.test(rawCode) ? rawCode.toUpperCase() : null,
    publish,
    values: {
      title: text("title"),
      description: text("description"),
      startsAt,
      endsAt,
      locationDetail: text("locationDetail"),
      admissionInfo: text("admissionInfo"),
      capacityMode,
      displayedCapacity: text("displayedCapacity"),
      ratingPeriodDays: text("ratingPeriodDays"),
    },
    names: {
      venue: text("venue"),
      category: text("category"),
      features: splitList(text("accessibility")),
      stores: splitList(text("stores")),
    },
    errors,
    warnings: [],
  };
}

export { headerOf as importColumnHeader };
