import { addDaysToDateKey, toLocalDateKey } from "@/domain/time/time-zone";

/** Proposed retention (docs/spec/04 §Retenção; pending validation P-LGPD-3). */
export const DEVICE_METRICS_RETENTION_DAYS = 30;
export const AUDIT_LOG_RETENTION_DAYS = 365;
/** Ratings keep the device hash for 90 days after the event, and score, tags and comment for 2 years. */
export const RATING_DEVICE_RETENTION_DAYS = 90;
export const RATING_RETENTION_DAYS = 730;
/** "Tenho interesse" marks keep the device hash until 90 days after the event; then only the total stays. */
export const INTEREST_DEVICE_RETENTION_DAYS = 90;
/** Suggestions keep the device hash for 30 days after sending, and the text for 2 years. */
export const SUGGESTION_DEVICE_RETENTION_DAYS = 30;
export const SUGGESTION_RETENTION_DAYS = 730;

export interface RetentionCutoffs {
  /** Local date key: rows with device hashes from earlier days are aggregated and deleted. */
  deviceMetricsBefore: string;
  /** Audit entries created before this instant are deleted. */
  auditLogBefore: Date;
  /** Ratings of events that ended before this instant lose their device hash. */
  ratingDeviceEventEndedBefore: Date;
  /** Interests of events that ended before this instant are folded into totals and deleted. */
  interestEventEndedBefore: Date;
  /** Ratings created before this instant are deleted. */
  ratingsBefore: Date;
  /** Suggestions sent before this instant lose their device hash. */
  suggestionDeviceBefore: Date;
  /** Suggestions sent before this instant are deleted. */
  suggestionsBefore: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function retentionCutoffs(now: Date): RetentionCutoffs {
  const today = toLocalDateKey(now);
  return {
    deviceMetricsBefore: addDaysToDateKey(today, -(DEVICE_METRICS_RETENTION_DAYS - 1)),
    auditLogBefore: new Date(now.getTime() - AUDIT_LOG_RETENTION_DAYS * DAY_MS),
    ratingDeviceEventEndedBefore: new Date(now.getTime() - RATING_DEVICE_RETENTION_DAYS * DAY_MS),
    interestEventEndedBefore: new Date(now.getTime() - INTEREST_DEVICE_RETENTION_DAYS * DAY_MS),
    ratingsBefore: new Date(now.getTime() - RATING_RETENTION_DAYS * DAY_MS),
    suggestionDeviceBefore: new Date(now.getTime() - SUGGESTION_DEVICE_RETENTION_DAYS * DAY_MS),
    suggestionsBefore: new Date(now.getTime() - SUGGESTION_RETENTION_DAYS * DAY_MS),
  };
}
