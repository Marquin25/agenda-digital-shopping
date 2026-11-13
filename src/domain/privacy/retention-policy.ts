import { addDaysToDateKey, toLocalDateKey } from "@/domain/time/time-zone";

/** Proposed retention (docs/spec/04 §Retenção; pending validation P-LGPD-3). */
export const DEVICE_METRICS_RETENTION_DAYS = 30;
export const AUDIT_LOG_RETENTION_DAYS = 365;

export interface RetentionCutoffs {
  /** Local date key: rows with device hashes from earlier days are aggregated and deleted. */
  deviceMetricsBefore: string;
  /** Audit entries created before this instant are deleted. */
  auditLogBefore: Date;
}

export function retentionCutoffs(now: Date): RetentionCutoffs {
  const today = toLocalDateKey(now);
  return {
    deviceMetricsBefore: addDaysToDateKey(today, -(DEVICE_METRICS_RETENTION_DAYS - 1)),
    auditLogBefore: new Date(now.getTime() - AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000),
  };
}
