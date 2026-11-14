import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { recordAudit } from "@/application/audit";
import type { Audience, IndicatorKey, Objective, Weights } from "@/domain/intelligence/experience-catalog";
import type { Database } from "@/infrastructure/db/client";
import {
  adminUsers,
  events,
  pageViewDailyTotals,
  pageViewsDaily,
  planVenues,
  recommendationRuns,
  stores,
  venues,
} from "@/infrastructure/db/schema";
import { getExperienceTemplate, listExperienceTemplates } from "./experience-templates";
import { getPlan, type PlanView } from "./plans";

// ---------------------------------------------------------------------------------------------
// Engine contract agreed on issue #40. These types mirror `src/domain/intelligence/recommendation-engine.ts`
// (B-40, written in parallel); once it lands they become re-exports from there.
// ---------------------------------------------------------------------------------------------

export interface BriefInput {
  primaryObjective: Objective;
  secondaryObjectives: Objective[];
  audiences: Audience[];
  segmentIds: number[];
  budgetMin: number;
  budgetMax: number;
  periodStart: string;
  periodEnd: string;
  dailyWindowMinutes: number | null;
}

export interface VenueCandidate {
  id: string;
  name: string;
  areaSquareMeters: number | null;
  capacity: number | null;
  facilities: string[];
}

export interface TemplateCandidate {
  id: string;
  name: string;
  objectiveWeights: Weights<Objective>;
  audienceWeights: Weights<Audience>;
  segmentIds: number[];
  costMin: number;
  costMax: number;
  minAreaSquareMeters: number | null;
  minCapacity: number | null;
  facilities: string[];
  durationMinutes: number;
  indicators: IndicatorKey[];
  reviewStatus: "draft" | "reviewed";
  updatedAt: Date;
}

export interface TemplateHistory {
  templateId: string;
  comparableEvents: number;
  estimatedDevices: number;
  /** Relative performance, normalised to [-1, 1]. */
  adjustment: number;
}

export interface ScoringWeights {
  objective: number;
  audience: number;
  segment: number;
  history: number;
}

export interface RecommendationInput {
  brief: BriefInput;
  venues: VenueCandidate[];
  templates: TemplateCandidate[];
  history: TemplateHistory[];
  weights: ScoringWeights;
  rulesVersion: string;
  topN?: number;
}

export type Confidence = "low" | "medium" | "high";

export interface Recommendation {
  templateId: string;
  name: string;
  score: number;
  confidence: Confidence;
  reasons: string[];
  assumptions: string[];
  compatibleVenueIds: string[];
  matchedSegmentIds: number[];
  costMin: number;
  costMax: number;
  indicators: IndicatorKey[];
  historyApplied: boolean;
}

export interface EliminatedTemplate {
  templateId: string;
  name: string;
  reasons: string[];
}

export interface RecommendationResult {
  rulesVersion: string;
  weights: ScoringWeights;
  recommendations: Recommendation[];
  eliminated: EliminatedTemplate[];
}

/** The rules engine as this module needs it; the real one comes from B-40, tests pass a fake. */
export interface RecommendationEngine {
  rulesVersion: string;
  defaultWeights: ScoringWeights;
  recommend(input: RecommendationInput): RecommendationResult;
}

// ---------------------------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------------------------

function toBriefInput(plan: PlanView): BriefInput {
  return {
    primaryObjective: plan.primaryObjective,
    secondaryObjectives: plan.secondaryObjectives,
    audiences: plan.audiences,
    segmentIds: plan.segments.map((s) => s.id),
    budgetMin: plan.budgetMin,
    budgetMax: plan.budgetMax,
    periodStart: plan.periodStart,
    periodEnd: plan.periodEnd,
    dailyWindowMinutes: plan.dailyWindowMinutes,
  };
}

/** The brief's venues that are still active, by name. */
async function loadVenueCandidates(db: Database, planId: string): Promise<VenueCandidate[]> {
  return db
    .select({
      id: venues.id,
      name: venues.name,
      areaSquareMeters: venues.areaSquareMeters,
      capacity: venues.capacity,
      facilities: venues.facilities,
    })
    .from(planVenues)
    .innerJoin(venues, eq(venues.id, planVenues.venueId))
    .where(and(eq(planVenues.planId, planId), eq(venues.active, true)))
    .orderBy(venues.name);
}

async function loadTemplateCandidates(db: Database): Promise<TemplateCandidate[]> {
  return (await listExperienceTemplates(db)).map((t) => ({
    id: t.id,
    name: t.name,
    objectiveWeights: t.objectiveWeights,
    audienceWeights: t.audienceWeights,
    segmentIds: t.segments.map((s) => s.id),
    costMin: t.costMin,
    costMax: t.costMax,
    minAreaSquareMeters: t.minAreaSquareMeters,
    minCapacity: t.minCapacity,
    facilities: t.facilities,
    durationMinutes: t.durationMinutes,
    indicators: t.indicators,
    reviewStatus: t.reviewStatus,
    updatedAt: t.updatedAt,
  }));
}

const round4 = (value: number) => Math.round(value * 10_000) / 10_000;
const clamp = (value: number) => Math.min(1, Math.max(-1, value));

/**
 * Comparable history per catalog idea: published events created from it that have already ended,
 * with their estimated unique devices (sum of daily estimates, as on the dashboard). The adjustment
 * compares the idea's mean devices per event with the mean over every idea, clamped to [-1, 1].
 * Aggregates only; whether the history is enough to count is the engine's rule (P-INT-IA-4).
 */
export async function loadTemplateHistory(db: Database, now: Date): Promise<TemplateHistory[]> {
  const ended = await db
    .select({ id: events.id, templateId: events.experienceTemplateId })
    .from(events)
    .where(
      and(
        isNotNull(events.experienceTemplateId),
        eq(events.publicationStatus, "published"),
        sql`coalesce(${events.endedAt}, ${events.endsAt}) <= ${now.toISOString()}`,
      ),
    );
  if (ended.length === 0) return [];
  const eventIds = ended.map((e) => e.id);
  const [recent, aggregated] = await Promise.all([
    db
      .select({ eventId: pageViewsDaily.eventId, devices: sql<number>`count(*)::int` })
      .from(pageViewsDaily)
      .where(inArray(pageViewsDaily.eventId, eventIds))
      .groupBy(pageViewsDaily.eventId),
    db
      .select({
        eventId: pageViewDailyTotals.eventId,
        devices: sql<number>`coalesce(sum(${pageViewDailyTotals.devices}), 0)::int`,
      })
      .from(pageViewDailyTotals)
      .where(inArray(pageViewDailyTotals.eventId, eventIds))
      .groupBy(pageViewDailyTotals.eventId),
  ]);
  const devicesByEvent = new Map<string, number>();
  for (const row of [...recent, ...aggregated]) {
    devicesByEvent.set(row.eventId!, (devicesByEvent.get(row.eventId!) ?? 0) + row.devices);
  }

  const byTemplate = new Map<string, { events: number; devices: number }>();
  for (const { id, templateId } of ended) {
    const totals = byTemplate.get(templateId!) ?? { events: 0, devices: 0 };
    totals.events += 1;
    totals.devices += devicesByEvent.get(id) ?? 0;
    byTemplate.set(templateId!, totals);
  }
  const totalDevices = [...byTemplate.values()].reduce((sum, t) => sum + t.devices, 0);
  const overallMean = totalDevices / ended.length;
  const names = new Map(
    (await listExperienceTemplates(db, { includeInactive: true })).map((t) => [t.id, t.name]),
  );

  return [...byTemplate]
    .map(([templateId, t]) => ({
      templateId,
      comparableEvents: t.events,
      estimatedDevices: t.devices,
      adjustment: overallMean === 0 ? 0 : round4(clamp((t.devices / t.events - overallMean) / overallMean)),
    }))
    .sort(
      (a, b) =>
        (names.get(a.templateId) ?? "").localeCompare(names.get(b.templateId) ?? "", "pt-BR") ||
        a.templateId.localeCompare(b.templateId),
    );
}

/** Everything the engine needs for one brief, or null when the brief does not exist. */
export async function loadRecommendationInput(
  db: Database,
  planId: string,
  options: { weights: ScoringWeights; rulesVersion: string; now: Date },
): Promise<RecommendationInput | null> {
  const plan = await getPlan(db, planId);
  if (!plan) return null;
  const [venueCandidates, templates, history] = await Promise.all([
    loadVenueCandidates(db, planId),
    loadTemplateCandidates(db),
    loadTemplateHistory(db, options.now),
  ]);
  return {
    brief: toBriefInput(plan),
    venues: venueCandidates,
    templates,
    history,
    weights: options.weights,
    rulesVersion: options.rulesVersion,
  };
}

// ---------------------------------------------------------------------------------------------
// Runs (traceability, docs/spec/10 §3.5)
// ---------------------------------------------------------------------------------------------

export interface RecommendationRunSummary {
  id: string;
  planId: string;
  rulesVersion: string;
  createdAt: Date;
  /** Name of the staff member who generated it; null when that account was removed. */
  createdBy: string | null;
}

export interface RecommendationRunView extends RecommendationRunSummary {
  weights: ScoringWeights;
  /** The input exactly as stored (JSON): dates are ISO strings. */
  input: unknown;
  result: RecommendationResult;
}

/**
 * Runs the engine for a brief and records the run (input, rules version, weights and result) so it
 * can be reproduced and audited. Returns the run id, or null when the brief does not exist.
 */
export async function generateRecommendations(
  db: Database,
  command: { userId: string | null; planId: string; engine: RecommendationEngine; now?: Date },
): Promise<string | null> {
  const { userId, planId, engine, now = new Date() } = command;
  const input = await loadRecommendationInput(db, planId, {
    weights: engine.defaultWeights,
    rulesVersion: engine.rulesVersion,
    now,
  });
  if (!input) return null;
  const result = engine.recommend(input);
  const [run] = await db
    .insert(recommendationRuns)
    .values({
      planId,
      rulesVersion: result.rulesVersion,
      weights: { ...result.weights },
      input: JSON.parse(JSON.stringify(input)),
      result,
      createdBy: userId,
    })
    .returning({ id: recommendationRuns.id });
  await recordAudit(db, {
    userId,
    action: "recommendation.generated",
    entity: "plan",
    entityId: planId,
    details: { runId: run!.id, rulesVersion: result.rulesVersion },
  });
  return run!.id;
}

const runColumns = {
  id: recommendationRuns.id,
  planId: recommendationRuns.planId,
  rulesVersion: recommendationRuns.rulesVersion,
  createdAt: recommendationRuns.createdAt,
  createdBy: adminUsers.name,
};

/** Runs of a brief, newest first. */
export async function listRecommendationRuns(
  db: Database,
  planId: string,
): Promise<RecommendationRunSummary[]> {
  return db
    .select(runColumns)
    .from(recommendationRuns)
    .leftJoin(adminUsers, eq(adminUsers.id, recommendationRuns.createdBy))
    .where(eq(recommendationRuns.planId, planId))
    .orderBy(desc(recommendationRuns.createdAt), desc(sql`${recommendationRuns.id}`));
}

export async function getRecommendationRun(
  db: Database,
  runId: string,
): Promise<RecommendationRunView | null> {
  const [row] = await db
    .select({
      ...runColumns,
      weights: recommendationRuns.weights,
      input: recommendationRuns.input,
      result: recommendationRuns.result,
    })
    .from(recommendationRuns)
    .leftJoin(adminUsers, eq(adminUsers.id, recommendationRuns.createdBy))
    .where(eq(recommendationRuns.id, runId))
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    weights: row.weights as unknown as ScoringWeights,
    result: row.result as RecommendationResult,
  };
}

// ---------------------------------------------------------------------------------------------
// Event from an idea (docs/spec/10 §5)
// ---------------------------------------------------------------------------------------------

export interface IdeaEventDraft {
  plan: PlanView;
  template: { id: string; name: string };
  /** Prefilled values for the event form; dates are left to staff, within the brief's period. */
  values: {
    title: string;
    description: string;
    venueId: string;
    categoryId: string;
    storeIds: string[];
    planId: string;
    experienceTemplateId: string;
  };
}

/**
 * Prefills a new event from a chosen idea: its name, description and category, the venue chosen
 * (only if it belongs to the brief) and the brief's stores whose segment the idea serves.
 */
export async function getIdeaEventDraft(
  db: Database,
  query: { planId: string; templateId: string; venueId?: string | null },
): Promise<IdeaEventDraft | null> {
  const [plan, template] = await Promise.all([
    getPlan(db, query.planId),
    getExperienceTemplate(db, query.templateId),
  ]);
  if (!plan || !template) return null;
  const segmentIds = template.segments.map((s) => s.id);
  const planStoreIds = plan.stores.map((s) => s.id);
  const matchingStores =
    planStoreIds.length && segmentIds.length
      ? await db
          .select({ id: stores.id })
          .from(stores)
          .where(and(inArray(stores.id, planStoreIds), inArray(stores.segmentId, segmentIds)))
      : [];
  const matchingIds = new Set(matchingStores.map((s) => s.id));
  const venueId = plan.venues.some((v) => v.id === query.venueId) ? query.venueId! : "";
  return {
    plan,
    template: { id: template.id, name: template.name },
    values: {
      title: template.name,
      description: template.description,
      venueId,
      categoryId: template.categoryId ? String(template.categoryId) : "",
      storeIds: planStoreIds.filter((id) => matchingIds.has(id)),
      planId: plan.id,
      experienceTemplateId: template.id,
    },
  };
}
