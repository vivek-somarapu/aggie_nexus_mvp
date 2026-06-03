// Shared types and constants for the AI Advisor agent.
// No server-only imports — safe to use in both client and server code.

export const PENDING_ACTION_PART_TYPE = 'data-pending-action' as const;

export type PendingSubmit = {
  status: 'pending_confirm';
  action: 'submit_deliverable';
  deliverable_id: string;
  deliverable_title: string;
  text_content: string;
  text_preview: string;
  team_id: string;
  summary: string;
};

export type PendingTraction = {
  status: 'pending_confirm';
  action: 'log_traction';
  metric_type: string;
  value: number;
  unit: string;
  notes: string;
  team_id: string;
  summary: string;
};

export type PendingAction = PendingSubmit | PendingTraction;
