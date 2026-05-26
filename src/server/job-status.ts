/**
 * Authoritative job status vocabulary.
 *
 * User-controlled statuses can be set via the API.
 * System-controlled statuses are managed exclusively by the pipeline.
 *
 * Semantics note: `applied` means the user submitted a candidacy/application
 * for the job. Portuguese UI/copy MUST use "candidatado" or "candidatura
 * enviada", never "aplicado".
 */

export const USER_CONTROLLED_STATUSES = [
  'new',
  'saved',
  'discarded',
  'applied',
  'ignored',
  'interviewing',
  'offer',
  'ghosted'
] as const;

export const SYSTEM_CONTROLLED_STATUSES = ['notified', 'rejected'] as const;

export const ALL_JOB_STATUSES = [
  ...USER_CONTROLLED_STATUSES,
  ...SYSTEM_CONTROLLED_STATUSES
] as const;

export type UserControlledStatus = (typeof USER_CONTROLLED_STATUSES)[number];
export type SystemControlledStatus = (typeof SYSTEM_CONTROLLED_STATUSES)[number];
export type JobStatus = (typeof ALL_JOB_STATUSES)[number];

export function isUserControlledStatus(status: string): status is UserControlledStatus {
  return (USER_CONTROLLED_STATUSES as readonly string[]).includes(status);
}

export function isSystemControlledStatus(status: string): status is SystemControlledStatus {
  return (SYSTEM_CONTROLLED_STATUSES as readonly string[]).includes(status);
}

export function isValidJobStatus(status: string): status is JobStatus {
  return (ALL_JOB_STATUSES as readonly string[]).includes(status);
}
