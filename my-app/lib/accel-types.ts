// TypeScript types for the AggieX Accelerator Platform.
// These mirror the SQL schema in 20260509000001_accel_schema.sql exactly.
// Import from this file at all call sites — do not re-declare inline.

// ============================================================
// ENUM LITERALS
// ============================================================

export type AccelRole = 'founder' | 'aggiex_team' | 'mce_staff' | 'mentor';

export type AccelIntensity = 'low' | 'medium' | 'high';

export type AccelEntityType = 'llc' | 'c_corp' | 's_corp' | 'none' | 'other';

export type AccelCrucibleOutcome = 'accelerate' | 'refine' | 'restructure';

export type AccelSubmissionStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'needs_revision'
  | 'flagged';

export type AccelExpectedFormat = 'file' | 'text' | 'link' | 'any';

export type AccelSubmissionFileType = 'pdf' | 'docx' | 'image' | 'link' | 'other';

export type AccelMeetingFileType = 'image' | 'pdf' | 'other';

export type AccelMetricType =
  | 'revenue'
  | 'users'
  | 'lois'
  | 'pilots'
  | 'retention'
  | 'churn'
  | 'other';

export type AccelMentorTier = 'operational' | 'domain' | 'capital';

export type AccelAssessmentType = 'weekly' | 'crucible' | 'demo_day';

export type AccelMeetingType =
  | 'mentor_session'
  | 'demo_day'
  | 'one_on_one'
  | 'crucible'
  | 'speaker_session'
  | 'other';

export type AccelCurriculumFileType =
  | 'pdf'
  | 'docx'
  | 'video_link'
  | 'external_link'
  | 'other';

export type AccelAccessLevel = 'all' | 'founders_only' | 'aggiex_internal';

export type AccelEventType =
  | 'week_start'
  | 'week_end'
  | 'demo_day'
  | 'crucible'
  | 'speaker_day'
  | 'mentor_day'
  | 'off_day'
  | 'one_on_one'
  | 'social_event'
  | 'final_demo_day'
  | 'program_close';

export type AccelVisibleTo = 'all' | 'aggiex_team' | 'founders' | 'mentors';

export type AccelFundingStatus = 'on_track' | 'paused' | 'probation' | 'exited';

export type AccelReviewVisibility = 'team' | 'internal';

// ============================================================
// TABLE ROW TYPES
// Field names match SQL column names exactly.
// ============================================================

export interface AccelProgram {
  id: string;
  name: string;
  cohort_year: number;
  start_date: string;
  end_date: string;
  official_close_date: string;
  is_active: boolean;
  max_teams: number;
  created_by: string | null;
  created_at: string;
}

export interface AccelTeam {
  id: string;
  program_id: string;
  name: string;
  industry_vertical: string | null;
  venture_stage: string | null;
  entity_type: AccelEntityType;
  tamu_ip_flag: boolean;
  beachhead_market: string | null;
  website: string | null;
  pitch_deck_url: string | null;
  crucible_outcome: AccelCrucibleOutcome | null;
  crucible_reviewed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccelProfile {
  id: string;
  role: AccelRole;
  full_name: string;
  email: string;
  team_id: string | null;
  invited_by: string | null;
  invite_accepted_at: string | null;
  onboarding_completed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccelFounder {
  id: string;
  team_id: string;
  user_id: string;
  full_name: string;
  email: string;
  role_title: string | null;
  equity_pct: number | null;
  tamu_college: string | null;
  major: string | null;
  classification: string | null;
  expected_grad: string | null;
  linkedin_url: string | null;
  is_primary_contact: boolean;
  created_at: string;
}

export interface AccelWeek {
  id: string;
  program_id: string;
  week_number: number;
  theme: string;
  intensity: AccelIntensity;
  start_date: string;
  end_date: string;
  demo_day_date: string | null;
  is_crucible: boolean;
  is_final_demo_day: boolean;
  is_unlocked: boolean;
  unlocked_at: string | null;
  unlocked_by: string | null;
  created_at: string;
}

export interface AccelDeliverable {
  id: string;
  week_id: string;
  title: string;
  description: string | null;
  is_required: boolean;
  expected_format: AccelExpectedFormat;
  sort_order: number;
  created_at: string;
}

export interface AccelSubmission {
  id: string;
  deliverable_id: string;
  team_id: string;
  version: number;
  status: AccelSubmissionStatus;
  submitted_at: string | null;
  submitted_by: string | null;
  text_content: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccelSubmissionFile {
  id: string;
  submission_id: string;
  file_name: string;
  file_url: string;
  file_type: AccelSubmissionFileType;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface AccelReview {
  id: string;
  submission_id: string;
  reviewer_id: string;
  score: number | null;
  comments: string | null;
  visibility: AccelReviewVisibility;
  created_at: string;
  updated_at: string;
}

export interface AccelTractionEntry {
  id: string;
  team_id: string;
  week_id: string | null;
  entry_date: string;
  metric_type: AccelMetricType;
  value: number;
  unit: string;
  notes: string | null;
  source_evidence_url: string | null;
  logged_by: string;
  created_at: string;
}

export interface AccelDailyReport {
  id: string;
  team_id: string;
  author_id: string;
  report_date: string;
  win: string;
  blocker: string;
  metrics_snapshot: Record<string, unknown> | null;
  submitted_at: string;
}

export interface AccelMentorAssignment {
  id: string;
  mentor_id: string;
  team_id: string;
  tier: AccelMentorTier;
  assigned_weeks: number[] | null;
  commitment_signed: boolean;
  commitment_signed_at: string | null;
  notes: string | null;
  assigned_by: string | null;
  created_at: string;
}

export interface AccelMentorAssessment {
  id: string;
  mentor_id: string;
  team_id: string;
  week_id: string;
  assessment_type: AccelAssessmentType;
  scores: Record<string, number> | null;
  qualitative_notes: string | null;
  strengths: string | null;
  gaps: string | null;
  recommended_action: AccelCrucibleOutcome | null;
  is_visible_to_team: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccelMeetingRecord {
  id: string;
  team_id: string;
  week_id: string | null;
  meeting_type: AccelMeetingType;
  meeting_date: string;
  duration_minutes: number | null;
  attendees: string[] | null;
  notes: string | null;
  action_items: string[] | null;
  logged_by: string;
  created_at: string;
  updated_at: string;
}

export interface AccelMeetingFile {
  id: string;
  meeting_record_id: string;
  file_name: string;
  file_url: string;
  file_type: AccelMeetingFileType;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface AccelCurriculumFile {
  id: string;
  week_id: string | null;
  program_id: string;
  uploader_id: string;
  title: string;
  description: string | null;
  file_type: AccelCurriculumFileType;
  file_url: string;
  access_level: AccelAccessLevel;
  is_active: boolean;
  uploaded_at: string;
}

export interface AccelProgramEvent {
  id: string;
  program_id: string;
  week_number: number | null;
  event_type: AccelEventType;
  event_date: string;
  title: string;
  description: string | null;
  is_mandatory: boolean;
  visible_to: AccelVisibleTo;
  created_by: string | null;
  created_at: string;
}

export interface AccelMilestoneFunding {
  id: string;
  team_id: string;
  program_id: string;
  total_award: number;
  amount_unlocked: number;
  amount_pending: number;
  funding_status: AccelFundingStatus;
  crucible_gate_passed: boolean;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface AccelNotification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

// ============================================================
// VIEW TYPES
// Enriched types used in UI — combine multiple tables.
// ============================================================

// Deliverable + current team's submission status
export interface DeliverableWithSubmission extends AccelDeliverable {
  submission: AccelSubmission | null;
}

// Team with current funding state for the aggiex_team dashboard
export interface TeamWithFunding extends AccelTeam {
  funding: AccelMilestoneFunding | null;
  founder_count: number;
}

// Weekly snapshot for the aggiex_team Friday dashboard
export interface WeeklyTeamSnapshot {
  team: AccelTeam;
  submitted_count: number;
  total_deliverables: number;
  has_flagged: boolean;
  mentor_assessment_submitted: boolean;
  latest_traction: AccelTractionEntry | null;
  funding_status: AccelFundingStatus | null;
}

// ============================================================
// CONSTANTS
// Use these everywhere — no bare string comparisons in the UI.
// ============================================================

export const ACCEL_ROLES: Record<AccelRole, string> = {
  founder: 'Founder',
  aggiex_team: 'AggieX Team',
  mce_staff: 'MCE Staff',
  mentor: 'Mentor',
};

export const SUBMISSION_STATUS_LABELS: Record<AccelSubmissionStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  needs_revision: 'Needs Revision',
  flagged: 'Flagged',
};

export const FUNDING_STATUS_LABELS: Record<AccelFundingStatus, string> = {
  on_track: 'On Track',
  paused: 'Paused',
  probation: 'Probation',
  exited: 'Exited',
};

export const CRUCIBLE_OUTCOME_LABELS: Record<AccelCrucibleOutcome, string> = {
  accelerate: 'Accelerate',
  refine: 'Refine',
  restructure: 'Restructure',
};

export const MENTOR_TIER_LABELS: Record<AccelMentorTier, string> = {
  operational: 'Operational',
  domain: 'Domain',
  capital: 'Capital',
};

// Roles that have platform-wide read access
export const PRIVILEGED_ROLES: AccelRole[] = ['aggiex_team', 'mce_staff'];

// Roles that can manage users, cohort config, and funding
export const ADMIN_ROLES: AccelRole[] = ['aggiex_team'];

// Supabase Storage bucket for all accelerator files
export const ACCEL_STORAGE_BUCKET = 'accelerator';

export const ACCEL_STORAGE_PATHS = {
  curriculum: 'curriculum',
  submissions: 'submissions',
  meetings: 'meetings',
} as const;

// Program ID for AggieX Summer 2026 — matches seed.sql
export const AGGIEX_2026_PROGRAM_ID = '00000001-acce-4000-a000-000000000001';
