import { createHash } from "node:crypto";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { recordAudit } from "@/application/audit";
import { getEventStatus } from "@/domain/events/event-status";
import {
  IMPORT_LIMITS,
  importColumnHeader,
  parseImportRow,
  readImportHeader,
  type ImportCell,
  type ImportColumnKey,
  type ImportIssue,
} from "@/domain/events/event-import";
import { toCsv } from "@/domain/text/csv";
import { normalizeSearchText } from "@/domain/text/normalize";
import type { Database } from "@/infrastructure/db/client";
import {
  accessibilityFeatures,
  categories,
  eventImports,
  events,
  stores,
  venues,
} from "@/infrastructure/db/schema";
import { createEvent, publishEvent, updateEvent } from "./event-commands";
import { eventInputSchema, type ValidEventInput } from "./event-input";

/**
 * Spreadsheet import of events (B-94). Nothing is written before the administrator confirms; the
 * confirmation recomputes the preview from the staged cells and stops if it changed. Matching rules:
 * - a row with "Código" updates the event with that code (never matched by title), or creates it;
 * - a row without a code is skipped when an event with the same title, start and venue exists;
 * - only events, never venues, categories, stores, settings or permissions, are created or changed.
 */

export type ImportAction = "create" | "update" | "skip" | "reject";

export const IMPORT_ACTION_LABELS: Record<ImportAction, string> = {
  create: "Será criado",
  update: "Será atualizado",
  skip: "Ignorada",
  reject: "Rejeitada",
};

export interface ImportPreviewRow {
  line: number;
  action: ImportAction;
  code: string | null;
  title: string;
  startsAt: Date | null;
  venueName: string;
  publish: boolean;
  /** Event updated, or the existing event that made the row be skipped. */
  eventId: string | null;
  errors: ImportIssue[];
  warnings: ImportIssue[];
}

export interface ImportPreview {
  fileErrors: string[];
  fileWarnings: string[];
  rows: ImportPreviewRow[];
  counts: Record<ImportAction, number>;
  /** Changes when any row's outcome changes; the confirmation must match it. */
  fingerprint: string;
}

interface PlannedRow extends ImportPreviewRow {
  input: ValidEventInput | null;
}

/** How long a staged import can be confirmed, and kept before retention deletes it. */
const CONFIRM_WITHIN_MS = 24 * 60 * 60 * 1000;
export const EVENT_IMPORT_RETENTION_DAYS = 7;

const FIELD_COLUMNS: Partial<Record<string, ImportColumnKey>> = {
  title: "title",
  description: "description",
  startsAt: "startsAt",
  endsAt: "endsAt",
  venueId: "venue",
  locationDetail: "locationDetail",
  categoryId: "category",
  featureIds: "accessibility",
  storeIds: "stores",
  admissionInfo: "admissionInfo",
  capacityMode: "capacityMode",
  displayedCapacity: "displayedCapacity",
  ratingPeriodDays: "ratingPeriodDays",
};

const byName = <T extends { name: string }>(rows: T[]) =>
  new Map(rows.map((r) => [normalizeSearchText(r.name), r]));

async function loadReferences(db: Database) {
  const [venueRows, categoryRows, featureRows, storeRows] = await Promise.all([
    db.select({ id: venues.id, name: venues.name }).from(venues).where(eq(venues.active, true)),
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.active, true)),
    db.select({ id: accessibilityFeatures.id, name: accessibilityFeatures.name }).from(accessibilityFeatures),
    db.select({ id: stores.id, name: stores.name }).from(stores).where(eq(stores.active, true)),
  ]);
  return {
    venues: byName(venueRows),
    categories: byName(categoryRows),
    features: byName(featureRows),
    stores: byName(storeRows),
  };
}

const naturalKey = (title: string, startsAt: Date, venueId: string) =>
  `${normalizeSearchText(title)}|${startsAt.getTime()}|${venueId}`;

async function planImport(db: Database, sheet: ImportCell[][], now: Date) {
  if (sheet.length === 0)
    return { fileErrors: ["A planilha está vazia."], fileWarnings: [], rows: [] as PlannedRow[] };
  const header = readImportHeader(sheet[0]!);
  const dataRows = sheet.slice(1);
  const nonEmpty = dataRows.filter((r) => r.some((c) => c !== null && String(c).trim() !== ""));
  const fileErrors = [...header.errors];
  if (nonEmpty.length > IMPORT_LIMITS.maxRows)
    fileErrors.push(
      `A planilha tem ${nonEmpty.length} linhas de eventos; o máximo é ${IMPORT_LIMITS.maxRows}.`,
    );
  if (fileErrors.length === 0 && nonEmpty.length === 0)
    fileErrors.push("A planilha não tem linhas de eventos.");
  if (fileErrors.length > 0) return { fileErrors, fileWarnings: header.warnings, rows: [] as PlannedRow[] };

  const refs = await loadReferences(db);
  const existing = await db
    .select({
      id: events.id,
      title: events.title,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      endedAt: events.endedAt,
      venueId: events.venueId,
      importCode: events.importCode,
      publicationStatus: events.publicationStatus,
      bannerAlt: events.bannerAlt,
    })
    .from(events);
  const byCode = new Map(existing.filter((e) => e.importCode).map((e) => [e.importCode!, e]));
  const byKey = new Map(existing.map((e) => [naturalKey(e.title, e.startsAt, e.venueId), e]));
  const codeLines = new Map<string, number>();
  const keyLines = new Map<string, number>();

  const rows: PlannedRow[] = [];
  dataRows.forEach((cells, index) => {
    const parsed = parseImportRow(cells, header, index + 2);
    if (!parsed) return;
    const errors = [...parsed.errors];
    const warnings = [...parsed.warnings];
    const has = (key: ImportColumnKey) => errors.some((e) => e.column === importColumnHeader(key));
    const fail = (key: ImportColumnKey, message: string) => {
      if (!has(key)) errors.push({ column: importColumnHeader(key), message });
    };

    const venue = refs.venues.get(normalizeSearchText(parsed.names.venue));
    if (!parsed.names.venue) fail("venue", "Informe o espaço.");
    else if (!venue) fail("venue", `Espaço “${parsed.names.venue}” não está cadastrado ou está inativo.`);
    const category = refs.categories.get(normalizeSearchText(parsed.names.category));
    if (!parsed.names.category) fail("category", "Informe a categoria.");
    else if (!category)
      fail("category", `Categoria “${parsed.names.category}” não está cadastrada ou está inativa.`);
    const featureIds = parsed.names.features.flatMap((name) => {
      const feature = refs.features.get(normalizeSearchText(name));
      if (!feature) fail("accessibility", `Recurso “${name}” não está cadastrado.`);
      return feature ? [feature.id] : [];
    });
    const storeIds = parsed.names.stores.flatMap((name) => {
      const store = refs.stores.get(normalizeSearchText(name));
      if (!store) fail("stores", `Loja “${name}” não está cadastrada ou está inativa.`);
      return store ? [store.id] : [];
    });
    if (parsed.values.capacityMode === "unlimited" && parsed.values.displayedCapacity)
      warnings.push({
        column: importColumnHeader("displayedCapacity"),
        message: "Ignorada: só vale com “Ordem de chegada”.",
      });

    let input: ValidEventInput | null = null;
    const result = eventInputSchema.safeParse({
      ...parsed.values,
      displayedCapacity: parsed.values.capacityMode === "unlimited" ? "" : parsed.values.displayedCapacity,
      venueId: venue?.id ?? "",
      categoryId: category ? String(category.id) : "",
      featureIds,
      storeIds,
      bannerAlt: "",
      planId: "",
      experienceTemplateId: "",
    });
    if (result.success) input = result.data;
    else
      for (const issue of result.error.issues) {
        const key = FIELD_COLUMNS[String(issue.path[0])];
        if (key) fail(key, issue.message);
        else errors.push({ column: null, message: issue.message });
      }

    let action: ImportAction = "create";
    let eventId: string | null = null;
    const current = parsed.code ? byCode.get(parsed.code) : undefined;
    if (parsed.code) {
      const firstLine = codeLines.get(parsed.code);
      if (firstLine) fail("code", `Código repetido na planilha (linha ${firstLine}).`);
      else codeLines.set(parsed.code, parsed.line);
      if (current) {
        action = "update";
        eventId = current.id;
        const status = getEventStatus(current, now);
        if (!header.complete)
          fail(
            "code",
            "Para atualizar um evento pelo código, a planilha precisa ter todas as colunas do modelo.",
          );
        else if (status === "cancelled")
          fail("code", "Evento cancelado não pode ser alterado pela planilha.");
        else if (status === "ended") fail("code", "Evento encerrado não pode ser alterado pela planilha.");
        else if (status !== "draft" && !parsed.publish)
          warnings.push({
            column: importColumnHeader("publish"),
            message: "Continua publicado: a importação não despublica eventos.",
          });
      }
    }
    if (input && !current) {
      const key = naturalKey(input.title, input.startsAt, input.venueId);
      const same = byKey.get(key);
      const firstLine = keyLines.get(key);
      if (same) {
        action = "skip";
        eventId = same.id;
        warnings.push({
          column: null,
          message: "Já existe um evento com o mesmo título, início e espaço; nada foi alterado.",
        });
      } else if (firstLine) {
        action = "skip";
        warnings.push({
          column: null,
          message: `Repete a linha ${firstLine} (mesmo título, início e espaço).`,
        });
      } else keyLines.set(key, parsed.line);
    }
    if (input && action === "create" && input.startsAt < now)
      warnings.push({ column: importColumnHeader("startsAt"), message: "O início já passou." });
    if (errors.length > 0) action = "reject";
    if (action === "update" && input && current) input = { ...input, bannerAlt: current.bannerAlt ?? "" };

    rows.push({
      line: parsed.line,
      action,
      code: parsed.code,
      title: parsed.values.title,
      startsAt: input?.startsAt ?? null,
      venueName: venue?.name ?? parsed.names.venue,
      publish: parsed.publish,
      eventId,
      errors,
      warnings,
      input: action === "reject" ? null : input,
    });
  });
  return { fileErrors: [], fileWarnings: header.warnings, rows };
}

function summarize(plan: { fileErrors: string[]; fileWarnings: string[]; rows: PlannedRow[] }) {
  const counts = { create: 0, update: 0, skip: 0, reject: 0 };
  for (const row of plan.rows) counts[row.action]++;
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(plan.rows.map((r) => [r.line, r.action, r.eventId, r.code, r.publish])))
    .digest("hex");
  const rows: ImportPreviewRow[] = plan.rows.map((row) => {
    const { input, ...visible } = row;
    void input;
    return visible;
  });
  return { fileErrors: plan.fileErrors, fileWarnings: plan.fileWarnings, rows, counts, fingerprint };
}

export async function previewEventImport(
  db: Database,
  sheet: ImportCell[][],
  now = new Date(),
): Promise<ImportPreview> {
  return summarize(await planImport(db, sheet, now));
}

/** Keeps the sheet's cells (as text) until the administrator confirms; returns the import id. */
export async function stageEventImport(
  db: Database,
  userId: string,
  fileName: string,
  sheet: string[][],
): Promise<string> {
  const safeName = fileName.replace(/[^\p{L}\p{N} ._-]/gu, "_").slice(0, 120) || "planilha";
  const [row] = await db
    .insert(eventImports)
    .values({ createdBy: userId, fileName: safeName, rows: sheet })
    .returning({ id: eventImports.id });
  return row!.id;
}

export async function getEventImport(db: Database, id: string) {
  const [row] = await db.select().from(eventImports).where(eq(eventImports.id, id)).limit(1);
  return row ?? null;
}

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  rejected: number;
  eventIds: string[];
}

export type ConfirmImportResult =
  | { status: "confirmed"; summary: ImportSummary }
  | { status: "changed" | "not_found" | "already_confirmed" | "expired" | "nothing_to_import" };

export async function confirmEventImport(
  db: Database,
  userId: string,
  importId: string,
  fingerprint: string,
  now = new Date(),
): Promise<ConfirmImportResult> {
  const staged = await getEventImport(db, importId);
  if (!staged) return { status: "not_found" };
  if (staged.confirmedAt) return { status: "already_confirmed" };
  if (now.getTime() - staged.createdAt.getTime() > CONFIRM_WITHIN_MS) return { status: "expired" };
  const plan = await planImport(db, staged.rows, now);
  if (summarize(plan).fingerprint !== fingerprint) return { status: "changed" };
  const toWrite = plan.rows.filter((r) => r.input && (r.action === "create" || r.action === "update"));
  if (toWrite.length === 0) return { status: "nothing_to_import" };

  return db.transaction(async (tx) => {
    const t = tx as unknown as Database;
    const eventIds: string[] = [];
    for (const row of toWrite) {
      const input = row.input!;
      if (row.action === "create") {
        const id = await createEvent(t, userId, input, null);
        if (row.code) await t.update(events).set({ importCode: row.code }).where(eq(events.id, id));
        if (row.publish) await publishEvent(t, userId, id, now);
        eventIds.push(id);
      } else {
        const id = row.eventId!;
        await updateEvent(t, userId, id, input, null);
        const [current] = await t
          .select({ status: events.publicationStatus })
          .from(events)
          .where(eq(events.id, id));
        if (row.publish && current?.status === "draft") await publishEvent(t, userId, id, now);
        eventIds.push(id);
      }
    }
    const counts = { create: 0, update: 0, skip: 0, reject: 0 };
    for (const row of plan.rows) counts[row.action]++;
    const totals = {
      created: counts.create,
      updated: counts.update,
      skipped: counts.skip,
      rejected: counts.reject,
    };
    await t
      .update(eventImports)
      .set({ confirmedAt: now, summary: { ...totals, eventIds } })
      .where(eq(eventImports.id, importId));
    await recordAudit(t, {
      userId,
      action: "event.import",
      entity: "event_import",
      entityId: importId,
      details: totals,
    });
    return { status: "confirmed" as const, summary: { ...totals, eventIds } };
  });
}

/** CSV report of every row with problems, for Excel ("Linha;Situação;Coluna;Mensagem"). */
export function importErrorReport(preview: ImportPreview): string {
  const lines: (string | number)[][] = [["Linha", "Situação", "Coluna", "Mensagem"]];
  for (const message of preview.fileErrors) lines.push(["", "Arquivo", "", message]);
  for (const row of preview.rows) {
    for (const issue of row.errors) lines.push([row.line, "Rejeitada", issue.column ?? "", issue.message]);
    for (const issue of row.warnings) lines.push([row.line, "Aviso", issue.column ?? "", issue.message]);
  }
  return toCsv(lines);
}

/** Deletes a staged import that was not confirmed; returns whether something was discarded. */
export async function discardEventImport(db: Database, importId: string): Promise<boolean> {
  const deleted = await db
    .delete(eventImports)
    .where(and(eq(eventImports.id, importId), isNull(eventImports.confirmedAt)))
    .returning({ id: eventImports.id });
  return deleted.length > 0;
}

/** Titles of the events written by a confirmed import, for links on the summary. */
export async function listImportedEvents(db: Database, eventIds: string[]) {
  if (eventIds.length === 0) return [];
  return db
    .select({ id: events.id, title: events.title, status: events.publicationStatus })
    .from(events)
    .where(inArray(events.id, eventIds))
    .orderBy(events.startsAt);
}

/** Retention: staged imports older than 7 days are deleted (confirmed or not). */
export async function deleteOldEventImports(db: Database, before: Date): Promise<number> {
  const deleted = await db
    .delete(eventImports)
    .where(lt(eventImports.createdAt, before))
    .returning({ id: eventImports.id });
  return deleted.length;
}
