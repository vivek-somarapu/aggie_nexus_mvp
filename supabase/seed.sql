-- ============================================================
-- AggieX Accelerator Platform — Seed Data
-- Run after 20260509000001_accel_schema.sql
-- Idempotent: safe to re-run. Uses fixed UUIDs + ON CONFLICT DO NOTHING.
-- ============================================================

DO $$
DECLARE
  -- Fixed IDs for cross-reference stability across re-runs
  v_program_id  uuid := '00000001-acce-4000-a000-000000000001'::uuid;

  v_week1_id    uuid := '00000001-acce-4000-a001-000000000001'::uuid;
  v_week2_id    uuid := '00000001-acce-4000-a001-000000000002'::uuid;
  v_week3_id    uuid := '00000001-acce-4000-a001-000000000003'::uuid;
  v_week4_id    uuid := '00000001-acce-4000-a001-000000000004'::uuid;
  v_week5_id    uuid := '00000001-acce-4000-a001-000000000005'::uuid;
  v_week6_id    uuid := '00000001-acce-4000-a001-000000000006'::uuid;
  v_week7_id    uuid := '00000001-acce-4000-a001-000000000007'::uuid;
  v_week8_id    uuid := '00000001-acce-4000-a001-000000000008'::uuid;
  v_week9_id    uuid := '00000001-acce-4000-a001-000000000009'::uuid;
  v_week10_id   uuid := '00000001-acce-4000-a001-000000000010'::uuid;

BEGIN

-- ============================================================
-- PROGRAM
-- ============================================================

INSERT INTO accel_programs (
  id, name, cohort_year,
  start_date, end_date, official_close_date,
  is_active, max_teams
) VALUES (
  v_program_id,
  'AggieX Summer 2026',
  2026,
  '2026-06-01',
  '2026-08-07',
  '2026-08-10',
  true,
  8
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- WEEKS
-- Week dates: program runs Mon–Fri, June 1 – August 7, 2026.
-- Off days: Jun 19 (Juneteenth), Jul 3–4 (Independence Day).
-- Week 5 Crucible: Thursday Jul 2 (formal pitch day).
-- ============================================================

INSERT INTO accel_weeks (
  id, program_id, week_number, theme, intensity,
  start_date, end_date, demo_day_date,
  is_crucible, is_final_demo_day
) VALUES
  (
    v_week1_id, v_program_id, 1,
    'Founder Foundation & Business Fundamentals', 'medium',
    '2026-06-01', '2026-06-05', '2026-06-05',
    false, false
  ),
  (
    v_week2_id, v_program_id, 2,
    'Founder Psychology, MVP Scope & Market Deep Dive', 'high',
    '2026-06-08', '2026-06-12', '2026-06-12',
    false, false
  ),
  (
    v_week3_id, v_program_id, 3,
    'Sales Development, Customer Acquisition & Initial MVP Build', 'high',
    '2026-06-15', '2026-06-19', '2026-06-19',
    false, false
  ),
  (
    v_week4_id, v_program_id, 4,
    'Product Roadmap, Data Synthesis & Follow-On Markets', 'medium',
    '2026-06-22', '2026-06-26', '2026-06-26',
    false, false
  ),
  (
    v_week5_id, v_program_id, 5,
    'The Crucible — Mid-Program Review', 'high',
    '2026-06-29', '2026-07-03', '2026-07-02',
    true, false
  ),
  (
    v_week6_id, v_program_id, 6,
    'Systems Architecture & Workflow Automation', 'medium',
    '2026-07-07', '2026-07-11', '2026-07-11',
    false, false
  ),
  (
    v_week7_id, v_program_id, 7,
    'MVP Launch, Market Entry & Success Metrics', 'medium',
    '2026-07-14', '2026-07-18', '2026-07-18',
    false, false
  ),
  (
    v_week8_id, v_program_id, 8,
    'Investor Mapping, Financial Modeling & Capital Strategy', 'medium',
    '2026-07-21', '2026-07-25', '2026-07-25',
    false, false
  ),
  (
    v_week9_id, v_program_id, 9,
    'Pitch Mastery, Capital Leverage & Initial Investor Meetings', 'high',
    '2026-07-28', '2026-08-01', '2026-08-01',
    false, false
  ),
  (
    v_week10_id, v_program_id, 10,
    'Final Demo Day — Performance Under Capital Scrutiny', 'high',
    '2026-08-03', '2026-08-07', '2026-08-07',
    false, true
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DELIVERABLES
-- 54 total across 10 weeks. UNIQUE (week_id, title) ensures
-- re-runs are safe without fixed UUIDs.
-- ============================================================

-- Week 1 — Founder Foundation & Business Fundamentals
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week1_id, 'Program Commitment Agreement',
   'Signed commitment to program terms, IP policy, and participation expectations.',
   true, 'file', 1),
  (v_week1_id, 'Legal Checklist',
   'Verify entity formation status, IP ownership, founder agreements, and compliance basics.',
   true, 'file', 2),
  (v_week1_id, 'Business Plan v1',
   'Initial business plan: problem, solution, market, revenue model, and team.',
   true, 'file', 3),
  (v_week1_id, 'Market Map',
   'Visual map of the market landscape: competitors, adjacent players, and whitespace.',
   true, 'any', 4),
  (v_week1_id, 'ICP',
   'Ideal Customer Profile — the specific customer most likely to buy first.',
   true, 'text', 5),
  (v_week1_id, 'Beachhead Hypothesis',
   'Articulation of the smallest, most winnable customer segment targeted first.',
   true, 'text', 6),
  (v_week1_id, 'Summer Objectives',
   'Three to five measurable objectives the team commits to achieving by Demo Day.',
   true, 'text', 7)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 2 — Founder Psychology, MVP Scope & Market Deep Dive
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week2_id, 'Founder Psychology Reflection',
   'Personal assessment of founder mindset, limiting beliefs, and growth edges.',
   true, 'text', 1),
  (v_week2_id, 'MVP Scope Definition',
   'Single document defining the MVP: what it does, what it does not do, and why.',
   true, 'any', 2),
  (v_week2_id, 'Market Deep Dive Report',
   'Primary and secondary market research synthesized into a structured report.',
   true, 'file', 3),
  (v_week2_id, 'Outbound Sales Motion',
   'Documented outreach strategy: target list, messaging, channel, and cadence.',
   true, 'any', 4),
  (v_week2_id, 'Customer Pipeline',
   'Active prospect list with contact status, stage, and next action for each.',
   true, 'any', 5),
  (v_week2_id, 'Outreach Metrics',
   'Quantitative report: emails sent, replies, calls booked, conversion rates.',
   true, 'any', 6)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 3 — Sales Development, Customer Acquisition & Initial MVP Build
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week3_id, 'Initial MVP Build',
   'Working version of the MVP, however early. Must be demonstrable.',
   true, 'link', 1),
  (v_week3_id, 'CRM Pipeline',
   'Structured CRM export or screenshot showing all active deals and their status.',
   true, 'any', 2),
  (v_week3_id, 'Sales Motion Doc',
   'Updated and refined sales playbook based on Week 2 outreach learnings.',
   true, 'file', 3),
  (v_week3_id, 'Retention Metrics',
   'Early retention data: DAU/WAU, churn rate, or equivalent engagement indicators.',
   true, 'any', 4),
  (v_week3_id, 'Onboarding Workflow',
   'Documented user onboarding steps from signup to first value moment.',
   true, 'any', 5),
  (v_week3_id, 'MVP Dev Log',
   'Week-by-week build log: what was shipped, what was cut, and what was learned.',
   true, 'text', 6)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 4 — Product Roadmap, Data Synthesis & Follow-On Markets
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week4_id, 'Weeks 2–3 Data Synthesis Memo',
   'Structured memo synthesizing all customer, sales, and product data from Weeks 2–3.',
   true, 'file', 1),
  (v_week4_id, 'Follow-On Market Map',
   'Visual map of adjacent and follow-on markets the team can expand into post-beachhead.',
   true, 'any', 2),
  (v_week4_id, 'Adjacent Segment Analysis',
   'Analysis of two to three adjacent customer segments: size, reachability, and fit.',
   true, 'file', 3),
  (v_week4_id, 'Product Roadmap (6–12 mo)',
   'Prioritized product roadmap covering the next six to twelve months.',
   true, 'any', 4),
  (v_week4_id, 'Feature Prioritization Matrix',
   'Framework showing how features were evaluated and sequenced.',
   true, 'any', 5)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 5 — The Crucible — Mid-Program Review
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week5_id, 'First-Half Reflection Memo',
   'Honest self-assessment of Weeks 1–4: what worked, what did not, and why.',
   true, 'file', 1),
  (v_week5_id, 'Second-Half Objectives Plan',
   'Revised objectives and execution plan for Weeks 6–10 informed by Crucible feedback.',
   true, 'file', 2),
  (v_week5_id, 'Mid-Program Review Deck',
   'Five-minute pitch deck for the formal Crucible panel: problem, traction, roadmap, ask.',
   true, 'file', 3)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 6 — Systems Architecture & Workflow Automation
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week6_id, 'Clean Cap Table',
   'Current, accurate capitalization table showing all equity holders and percentages.',
   true, 'file', 1),
  (v_week6_id, 'Executed Founder Agreements',
   'Signed founder vesting agreements, IP assignments, and confidentiality agreements.',
   true, 'file', 2),
  (v_week6_id, 'Entity Confirmation',
   'Evidence of active entity formation: certificate of formation or equivalent.',
   true, 'file', 3),
  (v_week6_id, 'IP & Moat Strategy Memo',
   'Analysis of intellectual property assets and defensibility strategy.',
   true, 'file', 4),
  (v_week6_id, 'Systems Architecture Design',
   'Technical architecture diagram and narrative for the current product.',
   true, 'any', 5),
  (v_week6_id, 'Workflow Automation Plan',
   'Identified manual workflows, proposed automations, and implementation timeline.',
   true, 'any', 6),
  (v_week6_id, 'Operator Scaling Plan',
   'Plan for delivering the product at 10x current customer volume without proportional headcount.',
   true, 'file', 7)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 7 — MVP Launch, Market Entry & Success Metrics
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week7_id, 'Finalized MVP',
   'The version of the product being officially launched to the market this week.',
   true, 'link', 1),
  (v_week7_id, 'Market Launch Documentation',
   'Written record of launch activities: channels used, announcement copy, and timing.',
   true, 'file', 2),
  (v_week7_id, 'MVP Success Metrics Dashboard',
   'Live or exported dashboard showing key product metrics post-launch.',
   true, 'link', 3),
  (v_week7_id, 'Post-Launch Feedback Log',
   'Compiled user feedback from the first week after launch with categorized themes.',
   true, 'any', 4),
  (v_week7_id, 'Leadership Reflection Memo',
   'Personal reflection on what the launch revealed about the team and product.',
   true, 'text', 5)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 8 — Investor Mapping, Financial Modeling & Capital Strategy
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week8_id, 'Investor Target Map (20+)',
   'Curated list of twenty or more investors with thesis, stage focus, and warm path.',
   true, 'file', 1),
  (v_week8_id, 'VC-Ready Financial Model',
   'Three-year financial model with revenue, burn, and unit economics. Investor-ready formatting.',
   true, 'file', 2),
  (v_week8_id, 'Capital Deployment Strategy',
   'How the raise proceeds will be deployed by category and timeframe.',
   true, 'file', 3),
  (v_week8_id, 'Pro-Forma Cap Table',
   'Modeled cap table post-raise showing dilution for all current and new holders.',
   true, 'file', 4),
  (v_week8_id, 'Negotiation Brief',
   'Key terms the team will prioritize and concede in a seed round negotiation.',
   true, 'file', 5),
  (v_week8_id, 'Board Control Map',
   'Analysis of board composition, voting rights, and founder control mechanisms.',
   true, 'file', 6)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 9 — Pitch Mastery, Capital Leverage & Initial Investor Meetings
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week9_id, 'Pitch Repetition Log (5+ runs)',
   'Log of at least five pitch run-throughs with dates, audience, and feedback captured.',
   true, 'any', 1),
  (v_week9_id, 'Founder-to-Investor Language Guide',
   'Glossary of terms and reframes that translate founder vision into investor language.',
   true, 'file', 2),
  (v_week9_id, '3+ Confirmed Investor Meetings',
   'Calendar confirmations or emails confirming at least three investor meetings.',
   true, 'any', 3),
  (v_week9_id, 'Network Activation Log (10+ warm intros)',
   'Log of at least ten warm introductions requested or received for investor outreach.',
   true, 'any', 4),
  (v_week9_id, 'Institutional Founder Narrative',
   'Refined founder story specifically crafted for institutional investor audiences.',
   true, 'text', 5)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 10 — Final Demo Day — Performance Under Capital Scrutiny
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week10_id, 'Final Investor Deck',
   'Polished, final investor pitch deck used at Demo Day.',
   true, 'file', 1),
  (v_week10_id, 'One-Page Executive Brief',
   'Single-page company overview for investor distribution at Demo Day.',
   true, 'file', 2),
  (v_week10_id, 'Due Diligence Data Room',
   'Organized shared folder with all materials an investor would need for due diligence.',
   true, 'link', 3),
  (v_week10_id, 'Investor Follow-Up Strategy (72-hour plan)',
   'Written plan for the 72 hours post-Demo Day: who to follow up with, what to send, timeline.',
   true, 'file', 4)
ON CONFLICT (week_id, title) DO NOTHING;

-- ============================================================
-- CALENDAR EVENTS
-- UNIQUE (program_id, event_type, event_date) keeps re-runs safe.
-- ============================================================

-- Week start events (Mondays)
INSERT INTO accel_program_events (program_id, week_number, event_type, event_date, title, is_mandatory, visible_to) VALUES
  (v_program_id, 1,  'week_start', '2026-06-01', 'Week 1 Kickoff', true, 'all'),
  (v_program_id, 2,  'week_start', '2026-06-08', 'Week 2 Kickoff', true, 'all'),
  (v_program_id, 3,  'week_start', '2026-06-15', 'Week 3 Kickoff', true, 'all'),
  (v_program_id, 4,  'week_start', '2026-06-22', 'Week 4 Kickoff', true, 'all'),
  (v_program_id, 5,  'week_start', '2026-06-29', 'Week 5 Kickoff', true, 'all'),
  (v_program_id, 6,  'week_start', '2026-07-07', 'Week 6 Kickoff', true, 'all'),
  (v_program_id, 7,  'week_start', '2026-07-14', 'Week 7 Kickoff', true, 'all'),
  (v_program_id, 8,  'week_start', '2026-07-21', 'Week 8 Kickoff', true, 'all'),
  (v_program_id, 9,  'week_start', '2026-07-28', 'Week 9 Kickoff', true, 'all'),
  (v_program_id, 10, 'week_start', '2026-08-03', 'Week 10 Kickoff', true, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Week end events (Fridays)
INSERT INTO accel_program_events (program_id, week_number, event_type, event_date, title, is_mandatory, visible_to) VALUES
  (v_program_id, 1,  'week_end', '2026-06-05', 'End of Week 1',  false, 'all'),
  (v_program_id, 2,  'week_end', '2026-06-12', 'End of Week 2',  false, 'all'),
  (v_program_id, 3,  'week_end', '2026-06-19', 'End of Week 3',  false, 'all'),
  (v_program_id, 4,  'week_end', '2026-06-26', 'End of Week 4',  false, 'all'),
  (v_program_id, 5,  'week_end', '2026-07-03', 'End of Week 5',  false, 'all'),
  (v_program_id, 6,  'week_end', '2026-07-11', 'End of Week 6',  false, 'all'),
  (v_program_id, 7,  'week_end', '2026-07-18', 'End of Week 7',  false, 'all'),
  (v_program_id, 8,  'week_end', '2026-07-25', 'End of Week 8',  false, 'all'),
  (v_program_id, 9,  'week_end', '2026-08-01', 'End of Week 9',  false, 'all'),
  (v_program_id, 10, 'week_end', '2026-08-07', 'End of Week 10', false, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Friday Internal Demo Days — Weeks 1–4 and 6–9
-- (Week 5 is the Crucible on Thursday; Week 10 is Final Demo Day below)
INSERT INTO accel_program_events (program_id, week_number, event_type, event_date, title, is_mandatory, visible_to) VALUES
  (v_program_id, 1, 'demo_day', '2026-06-05', 'Week 1 Internal Demo Day', true, 'all'),
  (v_program_id, 2, 'demo_day', '2026-06-12', 'Week 2 Internal Demo Day', true, 'all'),
  (v_program_id, 3, 'demo_day', '2026-06-19', 'Week 3 Internal Demo Day', true, 'all'),
  (v_program_id, 4, 'demo_day', '2026-06-26', 'Week 4 Internal Demo Day', true, 'all'),
  (v_program_id, 6, 'demo_day', '2026-07-11', 'Week 6 Internal Demo Day', true, 'all'),
  (v_program_id, 7, 'demo_day', '2026-07-18', 'Week 7 Internal Demo Day', true, 'all'),
  (v_program_id, 8, 'demo_day', '2026-07-25', 'Week 8 Internal Demo Day', true, 'all'),
  (v_program_id, 9, 'demo_day', '2026-08-01', 'Week 9 Internal Demo Day', true, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- The Crucible — Thursday July 2, Week 5
INSERT INTO accel_program_events (
  program_id, week_number, event_type, event_date,
  title, description, is_mandatory, visible_to
) VALUES (
  v_program_id, 5, 'crucible', '2026-07-02',
  'The Crucible — Mid-Program Formal Review',
  'External panel review. 5-minute pitch followed by 15-minute adversarial Q&A per team. Determines second-half funding gate.',
  true, 'all'
) ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Final Demo Day — Friday August 7, Week 10
INSERT INTO accel_program_events (
  program_id, week_number, event_type, event_date,
  title, description, is_mandatory, visible_to
) VALUES (
  v_program_id, 10, 'final_demo_day', '2026-08-07',
  'Final Demo Day',
  'Public Demo Day for investors, Aggie Angel Network, and alumni founders.',
  true, 'all'
) ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Off days
INSERT INTO accel_program_events (program_id, week_number, event_type, event_date, title, description, is_mandatory, visible_to) VALUES
  (v_program_id, 3, 'off_day', '2026-06-19',
   'Juneteenth — No Program',
   'Federal holiday. No mandatory programming. Demo Day for Week 3 is rescheduled at program discretion.',
   false, 'all'),
  (v_program_id, 5, 'off_day', '2026-07-03',
   'Independence Day Observed — No Program',
   'Independence Day observed. No mandatory programming.',
   false, 'all'),
  (v_program_id, 5, 'off_day', '2026-07-04',
   'Independence Day — No Program',
   'Independence Day. No mandatory programming.',
   false, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Program close
INSERT INTO accel_program_events (
  program_id, event_type, event_date,
  title, description, is_mandatory, visible_to
) VALUES (
  v_program_id, 'program_close', '2026-08-10',
  'Official Program Close',
  'All deliverables locked. Funding disbursement process begins.',
  false, 'aggiex_team'
) ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Friday evening social events — one per week (placeholder, blank description)
INSERT INTO accel_program_events (program_id, week_number, event_type, event_date, title, is_mandatory, visible_to) VALUES
  (v_program_id, 1,  'social_event', '2026-06-05', 'Week 1 Friday Social',  false, 'all'),
  (v_program_id, 2,  'social_event', '2026-06-12', 'Week 2 Friday Social',  false, 'all'),
  (v_program_id, 3,  'social_event', '2026-06-19', 'Week 3 Friday Social',  false, 'all'),
  (v_program_id, 4,  'social_event', '2026-06-26', 'Week 4 Friday Social',  false, 'all'),
  (v_program_id, 5,  'social_event', '2026-07-03', 'Week 5 Friday Social',  false, 'all'),
  (v_program_id, 6,  'social_event', '2026-07-11', 'Week 6 Friday Social',  false, 'all'),
  (v_program_id, 7,  'social_event', '2026-07-18', 'Week 7 Friday Social',  false, 'all'),
  (v_program_id, 8,  'social_event', '2026-07-25', 'Week 8 Friday Social',  false, 'all'),
  (v_program_id, 9,  'social_event', '2026-08-01', 'Week 9 Friday Social',  false, 'all'),
  (v_program_id, 10, 'social_event', '2026-08-07', 'Week 10 Friday Social', false, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

END $$;
