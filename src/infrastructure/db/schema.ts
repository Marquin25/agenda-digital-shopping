import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const id = () =>
  uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const accessibilityFeatures = pgTable("accessibility_features", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
});

export const adminUsers = pgTable("admin_users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["administrator", "editor", "analyst"] }).notNull(),
  active: boolean("active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const adminSessions = pgTable(
  "admin_sessions",
  {
    /** SHA-256 of the session token; the token itself only lives in the cookie. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("admin_sessions_user_idx").on(t.userId)],
);

export const venues = pgTable("venues", {
  id: id(),
  name: text("name").notNull(),
  floor: text("floor").notNull().default(""),
  reference: text("reference").notNull().default(""),
  areaSquareMeters: integer("area_square_meters"),
  capacity: integer("capacity"),
  facilities: text("facilities").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const events = pgTable(
  "events",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    searchText: text("search_text").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id),
    locationDetail: text("location_detail").notNull().default(""),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    bannerPath: text("banner_path"),
    bannerAlt: text("banner_alt"),
    admissionInfo: text("admission_info").notNull().default(""),
    /** "reservation" is intentionally absent until reservations are approved (docs/spec/03 §6). */
    capacityMode: text("capacity_mode", { enum: ["unlimited", "first_come"] })
      .notNull()
      .default("unlimited"),
    displayedCapacity: integer("displayed_capacity"),
    publicationStatus: text("publication_status", { enum: ["draft", "published", "cancelled"] })
      .notNull()
      .default("draft"),
    icsSequence: integer("ics_sequence").notNull().default(0),
    /** Days the post-event rating stays open after the end (docs/spec/03 §8; 1–30, default 7). */
    ratingPeriodDays: integer("rating_period_days").notNull().default(7),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    /** Planning brief and catalog idea the event came from (docs/spec/10 §5); null for other events. */
    planId: uuid("plan_id").references((): AnyPgColumn => plans.id, { onDelete: "set null" }),
    experienceTemplateId: uuid("experience_template_id").references(
      (): AnyPgColumn => experienceTemplates.id,
      { onDelete: "set null" },
    ),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("events_starts_at_idx").on(t.startsAt),
    index("events_status_idx").on(t.publicationStatus),
    index("events_experience_template_idx").on(t.experienceTemplateId),
    check("events_rating_period_days_range", sql`${t.ratingPeriodDays} between 1 and 30`),
  ],
);

export const eventAccessibilityFeatures = pgTable(
  "event_accessibility_features",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    featureId: integer("feature_id")
      .notNull()
      .references(() => accessibilityFeatures.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.featureId] })],
);

/** Commercial segment (moda, alimentação…). `slug` is a stable key so renamed defaults are not re-created. */
export const segments = pgTable("segments", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Participating store. Business data only: never names or contacts of people (docs/spec/04). */
export const stores = pgTable(
  "stores",
  {
    id: id(),
    name: text("name").notNull(),
    segmentId: integer("segment_id")
      .notNull()
      .references(() => segments.id),
    floor: text("floor").notNull().default(""),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("stores_segment_idx").on(t.segmentId)],
);

export const eventStores = pgTable(
  "event_stores",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.storeId] }), index("event_stores_store_idx").on(t.storeId)],
);

/** Catalog of event ideas used by the rules-based recommendations (docs/spec/10 §2.2). */
export const experienceTemplates = pgTable("experience_templates", {
  id: id(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  /** Objective key → weight 1–3; zero weights are not stored. */
  objectiveWeights: jsonb("objective_weights").$type<Record<string, number>>().notNull().default({}),
  /** Target audience key → weight 1–3; zero weights are not stored. */
  audienceWeights: jsonb("audience_weights").$type<Record<string, number>>().notNull().default({}),
  /** Cost range informed by staff, in whole reais. */
  costMin: integer("cost_min").notNull(),
  costMax: integer("cost_max").notNull(),
  minAreaSquareMeters: integer("min_area_square_meters"),
  minCapacity: integer("min_capacity"),
  facilities: text("facilities").array().notNull().default([]),
  durationMinutes: integer("duration_minutes").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  indicators: text("indicators").array().notNull().default([]),
  /** "draft" = draft for review; "reviewed" = checked by the mall. */
  reviewStatus: text("review_status", { enum: ["draft", "reviewed"] })
    .notNull()
    .default("draft"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const experienceTemplateSegments = pgTable(
  "experience_template_segments",
  {
    templateId: uuid("template_id")
      .notNull()
      .references(() => experienceTemplates.id, { onDelete: "cascade" }),
    segmentId: integer("segment_id")
      .notNull()
      .references(() => segments.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.templateId, t.segmentId] }),
    index("experience_template_segments_segment_idx").on(t.segmentId),
  ],
);

/** Planning brief written by staff (docs/spec/10 §2.1); the audience describes a target, not visitors. */
export const plans = pgTable("plans", {
  id: id(),
  title: text("title").notNull(),
  primaryObjective: text("primary_objective").notNull(),
  secondaryObjectives: text("secondary_objectives").array().notNull().default([]),
  audiences: text("audiences").array().notNull().default([]),
  interests: text("interests").array().notNull().default([]),
  /** Budget range in whole reais. */
  budgetMin: integer("budget_min").notNull(),
  budgetMax: integer("budget_max").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  /** 0 = Sunday … 6 = Saturday; empty = any day. */
  preferredWeekdays: integer("preferred_weekdays").array().notNull().default([]),
  /** Daily time range "HH:MM" in the mall time zone; both null = no limit. */
  timeFrom: text("time_from"),
  timeTo: text("time_to"),
  archived: boolean("archived").notNull().default(false),
  createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const planSegments = pgTable(
  "plan_segments",
  {
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    segmentId: integer("segment_id")
      .notNull()
      .references(() => segments.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.planId, t.segmentId] })],
);

export const planStores = pgTable(
  "plan_stores",
  {
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.planId, t.storeId] })],
);

export const planVenues = pgTable(
  "plan_venues",
  {
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.planId, t.venueId] })],
);

/**
 * One run of the recommendation engine for a brief (docs/spec/10 §3.5): the exact input, rules version,
 * weights and result, so a run can be reproduced and audited later. Aggregates only, no visitor data.
 */
export const recommendationRuns = pgTable(
  "recommendation_runs",
  {
    id: id(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    rulesVersion: text("rules_version").notNull(),
    weights: jsonb("weights").$type<Record<string, number>>().notNull(),
    input: jsonb("input").$type<unknown>().notNull(),
    result: jsonb("result").$type<unknown>().notNull(),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("recommendation_runs_plan_idx").on(t.planId, t.createdAt)],
);

export const promoLinks = pgTable("promo_links", {
  id: id(),
  code: text("code").notNull().unique(),
  channel: text("channel", {
    enum: ["instagram", "wifi", "qr_poster", "qr_kiosk", "digital_signage", "direct_link", "other"],
  }).notNull(),
  description: text("description").notNull(),
  /** Null means the link points at the agenda (optionally with filters). */
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  agendaQuery: text("agenda_query").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

/** Measured: every redirect through a promo link, per day. */
export const promoLinkHitsDaily = pgTable(
  "promo_link_hits_daily",
  {
    promoLinkId: uuid("promo_link_id")
      .notNull()
      .references(() => promoLinks.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    hits: integer("hits").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.promoLinkId, t.day] })],
);

/** Estimated: one row per device, page and local day (deduplication). Pseudonymised; subject to retention. */
export const pageViewsDaily = pgTable(
  "page_views_daily",
  {
    targetKey: text("target_key").notNull(),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    deviceHash: text("device_hash").notNull(),
    channel: text("channel").notNull(),
    promoCode: text("promo_code"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("page_views_daily_unique").on(t.targetKey, t.day, t.deviceHash),
    index("page_views_daily_day_idx").on(t.day),
  ],
);

/** Measured: raw page loads (including reloads) per page, day and channel. No device data. */
export const pageViewsRawDaily = pgTable(
  "page_views_raw_daily",
  {
    targetKey: text("target_key").notNull(),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    channel: text("channel").notNull(),
    views: integer("views").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.targetKey, t.day, t.channel] })],
);

/** Long-term estimated unique views per page, day and channel, aggregated from expired `page_views_daily` rows. */
export const pageViewDailyTotals = pgTable(
  "page_view_daily_totals",
  {
    targetKey: text("target_key").notNull(),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    channel: text("channel").notNull(),
    devices: integer("devices").notNull(),
  },
  (t) => [primaryKey({ columns: [t.targetKey, t.day, t.channel] })],
);

/** Estimated: one row per device, event, action and local day (share, add to calendar). Pseudonymised. */
export const engagementDaily = pgTable(
  "engagement_daily",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    deviceHash: text("device_hash").notNull(),
    action: text("action").notNull(),
    day: date("day").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("engagement_daily_unique").on(t.eventId, t.deviceHash, t.action, t.day),
    index("engagement_daily_day_idx").on(t.day),
  ],
);

/** Long-term engagement counts aggregated from expired `engagement_daily` rows. No device data. */
export const engagementDailyTotals = pgTable(
  "engagement_daily_totals",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    day: date("day").notNull(),
    devices: integer("devices").notNull(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.action, t.day] })],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

/**
 * Post-event ratings (B-26). One per device and event; the device hash is cleared by retention 90 days
 * after the event ends, and ratings are deleted after 2 years (docs/spec/04 §Retenção, proposal).
 * Only staff can read them, never with the device hash (docs/spec/06 §4).
 */
export const eventRatings = pgTable(
  "event_ratings",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    deviceHash: text("device_hash"),
    score: integer("score").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    comment: text("comment"),
    /** Always false until check-in exists (B-30/B-31, pending P-PROD-1). */
    withCheckIn: boolean("with_check_in").notNull().default(false),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    check("event_ratings_score_range", sql`${t.score} between 1 and 5`),
    uniqueIndex("event_ratings_event_device_unique").on(t.eventId, t.deviceHash),
    index("event_ratings_event_idx").on(t.eventId, t.createdAt),
  ],
);

/**
 * "Tenho interesse" (B-20): one row per device and event while the interest is on; turning it off
 * deletes the row. Interest is not a reservation and not attendance (docs/spec/03 §6). 90 days after the
 * event ends the rows are folded into `event_interest_totals` and deleted (docs/spec/04 §Retenção).
 */
export const eventInterests = pgTable(
  "event_interests",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    deviceHash: text("device_hash").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.deviceHash] })],
);

/** Interest counts kept after retention deleted the device rows. No device data. */
export const eventInterestTotals = pgTable("event_interest_totals", {
  eventId: uuid("event_id")
    .primaryKey()
    .references(() => events.id, { onDelete: "cascade" }),
  devices: integer("devices").notNull(),
  frozenAt: timestamp("frozen_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Suggestions wall (B-29): only staff read it. The device hash (used only for the 3-per-day limit and
 * "Apagar meus dados") is cleared 30 days after sending; the text is deleted after 2 years
 * (docs/spec/04 §Retenção, proposal pending P-LGPD).
 */
export const suggestions = pgTable(
  "suggestions",
  {
    id: id(),
    text: text("text").notNull(),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    deviceHash: text("device_hash"),
    status: text("status", { enum: ["new", "read", "archived"] })
      .notNull()
      .default("new"),
    createdAt: createdAt(),
  },
  (t) => [
    check("suggestions_text_length", sql`char_length(${t.text}) between 1 and 500`),
    check("suggestions_status_valid", sql`${t.status} in ('new', 'read', 'archived')`),
    index("suggestions_status_created_idx").on(t.status, t.createdAt),
    index("suggestions_device_idx").on(t.deviceHash),
  ],
);
