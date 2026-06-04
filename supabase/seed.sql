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
  '2026-05-26',
  '2026-08-07',
  '2026-08-10',
  true,
  8
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- WEEKS
-- W1: May 26–29 (Tue–Fri; Memorial Day May 25 off)
-- W2: June 1–5
-- W3: June 8–12
-- W4: June 15–18 (Juneteenth June 19 off; demo Thu June 18)
-- W5: June 22–26 (The Crucible; pitch Thu June 25)
-- W6: June 29–July 2 (Independence Day Jul 3–4 off; demo Thu July 2)
-- W7: July 6–10
-- W8: July 13–17
-- Break: July 20–24 (no accel_weeks row; represented in events only)
-- W9: July 27–31
-- W10: August 3–7 (Final Demo Day Fri Aug 7)
-- ============================================================

INSERT INTO accel_weeks (
  id, program_id, week_number, theme, intensity,
  start_date, end_date, demo_day_date,
  is_crucible, is_final_demo_day
) VALUES
  (
    v_week1_id, v_program_id, 1,
    'Founder Foundation and Business Fundamentals', 'medium',
    '2026-05-26', '2026-05-29', '2026-05-29',
    false, false
  ),
  (
    v_week2_id, v_program_id, 2,
    'Founder Psychology, MVP Scope, and Market Deep Dive', 'high',
    '2026-06-01', '2026-06-05', '2026-06-05',
    false, false
  ),
  (
    v_week3_id, v_program_id, 3,
    'Sales Development, Customer Acquisition, and Initial MVP Build', 'high',
    '2026-06-08', '2026-06-12', '2026-06-12',
    false, false
  ),
  (
    v_week4_id, v_program_id, 4,
    'Product Roadmap and Follow-On Markets', 'medium',
    '2026-06-15', '2026-06-18', '2026-06-18',
    false, false
  ),
  (
    v_week5_id, v_program_id, 5,
    'The Crucible', 'high',
    '2026-06-22', '2026-06-26', '2026-06-25',
    true, false
  ),
  (
    v_week6_id, v_program_id, 6,
    'Defensibility Architecture and Structural Hardening', 'medium',
    '2026-06-29', '2026-07-02', '2026-07-02',
    false, false
  ),
  (
    v_week7_id, v_program_id, 7,
    'MVP Launch, Market Entry, and Success Metrics', 'medium',
    '2026-07-06', '2026-07-10', '2026-07-10',
    false, false
  ),
  (
    v_week8_id, v_program_id, 8,
    'Investor Mapping, Financial Modeling, and Capital Strategy', 'medium',
    '2026-07-13', '2026-07-17', '2026-07-17',
    false, false
  ),
  (
    v_week9_id, v_program_id, 9,
    'Pitch Mastery, Capital Leverage, and Initial Investor Meetings', 'high',
    '2026-07-27', '2026-07-31', '2026-07-31',
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

-- Week 1 — Founder Foundation and Business Fundamentals
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week1_id, 'Program Commitment Agreement',
   'Signed commitment to program terms, IP policy, participation expectations, accountability consequences, and AggieX milestone funding rules.',
   true, 'file', 1),
  (v_week1_id, 'Legal and Structural Checklist',
   'Entity structure confirmed, IP assignment complete, cap table drafted, and compliance basics verified with the program attorney.',
   true, 'file', 2),
  (v_week1_id, 'Mentor Match Confirmation',
   'Confirmation of Operational Mentor assignment with first session scheduled.',
   true, 'text', 3),
  (v_week1_id, 'Business Plan v1',
   'Initial business plan covering market opportunity, business model, product roadmap, and team.',
   true, 'file', 4),
  (v_week1_id, 'Market Map',
   'Visual map of the market landscape: competitors, adjacent players, and whitespace.',
   true, 'any', 5),
  (v_week1_id, 'Summer Objectives and Deliverables Plan',
   'Three to five measurable objectives the team commits to achieving by Demo Day, with delivery milestones for each.',
   true, 'text', 6),
  (v_week1_id, 'ICP',
   'Ideal Customer Profile — who the beachhead customer is, their specific pain, and why they buy.',
   true, 'text', 7),
  (v_week1_id, 'Beachhead Segment Hypothesis',
   'The smallest, most winnable customer segment: acquisition channel, conversion pathway, and retention risk.',
   true, 'text', 8)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 2 — Founder Psychology, MVP Scope, and Market Deep Dive
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week2_id, 'Founder Psychology Reflection',
   'Personal assessment of founder strengths, blindspots, and decision-making style under pressure.',
   true, 'text', 1),
  (v_week2_id, 'MVP Scope Definition',
   'Single document defining the MVP: core use case, what is in v1, and what is explicitly out.',
   true, 'any', 2),
  (v_week2_id, 'Market Deep Dive Report',
   'Findings from market-specific domain mentor sessions synthesized into a structured report.',
   true, 'file', 3),
  (v_week2_id, 'Outbound Sales Motion',
   'Documented outreach strategy: target list, messaging, channel, cadence — tested directly with beachhead customers.',
   true, 'any', 4),
  (v_week2_id, 'Customer Pipeline',
   'Active prospect list with contact status, stage, and next action for each.',
   true, 'any', 5),
  (v_week2_id, 'Pilot-to-Paid Conversion Strategy',
   'Documented path from pilot or free engagement to paying customer, including pricing rationale.',
   true, 'text', 6),
  (v_week2_id, 'Outreach Metrics',
   'Quantitative report: response rate, meeting conversion rate, and commitment rate.',
   true, 'any', 7)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 3 — Sales Development, Customer Acquisition, and Initial MVP Build
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week3_id, 'Sales Playbook',
   'Documented and repeatable sales process built from Week 2 outreach learnings.',
   true, 'file', 1),
  (v_week3_id, 'Active Customer Pipeline',
   'CRM or structured pipeline with conversion metrics, retention indicators, and deal status.',
   true, 'any', 2),
  (v_week3_id, 'Initial MVP Build Progress Report',
   'Working state of the MVP with scope discipline evidence: what shipped, what was cut, and why.',
   true, 'any', 3),
  (v_week3_id, 'Founder-to-Team Sales Transition Plan',
   'Plan for transitioning founder-led sales to a repeatable team-executed motion.',
   true, 'text', 4),
  (v_week3_id, 'Retention and Onboarding Logic',
   'Documented onboarding steps from signup to first value moment, plus early retention data.',
   true, 'any', 5),
  (v_week3_id, 'Outreach Metrics Update',
   'Updated outreach metrics from Week 3: response rate, meeting conversion, commitment rate.',
   true, 'any', 6)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 4 — Product Roadmap and Follow-On Markets
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week4_id, 'Data Synthesis Report',
   'Structured analysis of all acquisition, rejection, retention, and MVP data from Weeks 2–3: what is working, what is not, and what must change.',
   true, 'file', 1),
  (v_week4_id, 'Adjacent Segment Map',
   'Map of adjacent customer segments with expansion hypothesis grounded in Weeks 2–3 data.',
   true, 'any', 2),
  (v_week4_id, 'Feature-vs-Platform Roadmap Decision',
   'Documented rationale for whether to build features on the current product or expand to a platform.',
   true, 'text', 3),
  (v_week4_id, '6–12 Month Product Roadmap',
   'Prioritized product roadmap for the next six to twelve months grounded in market feedback.',
   true, 'any', 4),
  (v_week4_id, 'Crucible Readiness Assessment',
   'Self-assessment of readiness for the Crucible panel: traction evidence, strategic clarity, known gaps.',
   true, 'text', 5)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 5 — The Crucible
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week5_id, 'First-Half Reflection Memo',
   'Honest self-assessment of Weeks 1–4: what worked, what did not, and key pivots made.',
   true, 'file', 1),
  (v_week5_id, 'Second-Half Objectives and Deliverables Plan',
   'Revised objectives and execution plan for Weeks 6–10 informed by Crucible panel feedback.',
   true, 'file', 2),
  (v_week5_id, 'Mid-Program Review Deck',
   'Five-minute pitch for the external panel: beachhead definition, acquisition metrics, sales systemization, retention indicators, product roadmap, and AggieX milestone capital deployment thesis.',
   true, 'file', 3),
  (v_week5_id, 'Weakness Identification Memo',
   'Generated by the mentor panel during adversarial Q&A: strategic gaps, credibility risks, data weaknesses, and pivot triggers.',
   true, 'file', 4)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 6 — Defensibility Architecture and Structural Hardening
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week6_id, 'Clean Capitalization Table',
   'Current, accurate cap table showing equity split rationale, vesting schedules, option pool plan, and no unassigned equity.',
   true, 'file', 1),
  (v_week6_id, 'Executed Founder Agreements',
   'Signed IP assignment, confidentiality, and vesting enforcement agreements for all founders.',
   true, 'file', 2),
  (v_week6_id, 'Entity Confirmation',
   'Evidence of active entity formation: Delaware C-Corp or justified alternative, TAMU IP compliance if applicable.',
   true, 'file', 3),
  (v_week6_id, 'IP and Moat Strategy Memo',
   'Analysis of what is protected, what is not, and how IP assets support the expansion pathway.',
   true, 'file', 4),
  (v_week6_id, 'Systems Architecture Design',
   'Documented technical and operational infrastructure map for the current product.',
   true, 'any', 5),
  (v_week6_id, 'Workflow Automation Plan',
   'High-leverage manual processes identified, agentic AI implementation strategy, and automation timeline.',
   true, 'any', 6),
  (v_week6_id, 'Operator Scaling Plan',
   'Time allocation audit, delegation map, next two hires, and decision bottlenecks for scaling to 10x customer volume.',
   true, 'file', 7)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 7 — MVP Launch, Market Entry, and Success Metrics
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week7_id, 'Finalized MVP',
   'All critical features shipped and tested. Launch-ready and tied to beachhead ICP.',
   true, 'link', 1),
  (v_week7_id, 'Market Launch Documentation',
   'Written record of launch activities: announcement copy, channels used, outreach executed, and go-live evidence.',
   true, 'file', 2),
  (v_week7_id, 'MVP Success Metrics Dashboard',
   'Live or exported dashboard showing active usage, adoption metrics, churn indicators, and early feedback loop.',
   true, 'link', 3),
  (v_week7_id, 'Technical Scalability Plan',
   'Infrastructure stress points, iteration priorities, and bottlenecks that capital would resolve.',
   true, 'text', 4),
  (v_week7_id, 'Leadership Reflection Memo',
   'What the founder must evolve into over the next 12 months and the identified leadership skill gap.',
   true, 'text', 5)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 8 — Investor Mapping, Financial Modeling, and Capital Strategy
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week8_id, 'Investor Target Map (20+ Investors)',
   'Curated list of 20+ investors with thesis alignment, check size range, introduction pathway, and prioritized outreach sequence.',
   true, 'file', 1),
  (v_week8_id, 'VC-Ready Financial Model',
   'Revenue assumptions with documented rationale, 18–24 month runway projection, and key driver sensitivity analysis.',
   true, 'file', 2),
  (v_week8_id, 'Capital Deployment Strategy',
   'Target raise amount and the specific expansion bottlenecks AggieX milestone capital and outside investment removes.',
   true, 'file', 3),
  (v_week8_id, 'Pro-Forma Capitalization Table',
   'Post-Seed equity breakdown, option pool modeling, and dilution impact for all holders.',
   true, 'file', 4),
  (v_week8_id, 'Negotiation Brief',
   'Target valuation with comparable benchmarks and red-line term sheet priorities.',
   true, 'file', 5)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 9 — Pitch Mastery, Capital Leverage, and Initial Investor Meetings
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week9_id, 'Pitch Repetition Log (5+ Runs)',
   'Log of at least five full pitch run-throughs with dates, audience, and feedback captured.',
   true, 'any', 1),
  (v_week9_id, 'Founder-to-Investor Language Translation Guide',
   'Technical and founder terms mapped to investor equivalents; common objections and practiced responses.',
   true, 'file', 2),
  (v_week9_id, 'Confirmed Initial Investor Meetings (3+)',
   'Calendar confirmations or emails confirming at least three investor meetings.',
   true, 'any', 3),
  (v_week9_id, 'Founder Narrative (Institutional Version)',
   'Category definition, market inevitability, why this team wins, and why now — crafted for institutional investor audiences.',
   true, 'text', 4),
  (v_week9_id, 'Investor Target List (20+ Investors)',
   'Refined investor list with thesis alignment and Aggie Network introduction pathways activated.',
   true, 'any', 5),
  (v_week9_id, 'Network Activation Log',
   'Aggie Network contacts engaged and warm introductions deployed for investor outreach.',
   true, 'any', 6)
ON CONFLICT (week_id, title) DO NOTHING;

-- Week 10 — Final Demo Day — Performance Under Capital Scrutiny
INSERT INTO accel_deliverables (week_id, title, description, is_required, expected_format, sort_order) VALUES
  (v_week10_id, 'Final Investor Deck',
   'Polished pitch deck used at Final Demo Day: domination evidence, expansion roadmap, and AggieX milestone capital deployment thesis.',
   true, 'file', 1),
  (v_week10_id, 'One-Page Executive Brief',
   'Single-page company overview immediately distributable to investors at Demo Day.',
   true, 'file', 2),
  (v_week10_id, 'Due Diligence Data Room',
   'Organized shared folder with cap table, financial model, legal docs, traction metrics, and roadmap.',
   true, 'link', 3),
  (v_week10_id, 'Investor Follow-Up Strategy (72-Hour Plan)',
   'Written plan for the 72 hours post-Demo Day: who to follow up with, what to send, and timeline.',
   true, 'file', 4)
ON CONFLICT (week_id, title) DO NOTHING;

-- ============================================================
-- CALENDAR EVENTS
-- UNIQUE (program_id, event_type, event_date) keeps re-runs safe.
-- ============================================================

-- Week kickoffs
INSERT INTO accel_program_events (program_id, week_number, event_type, event_date, title, is_mandatory, visible_to) VALUES
  (v_program_id, 1,  'week_start', '2026-05-26', 'Week 1 Kickoff', true, 'all'),
  (v_program_id, 2,  'week_start', '2026-06-01', 'Week 2 Kickoff', true, 'all'),
  (v_program_id, 3,  'week_start', '2026-06-08', 'Week 3 Kickoff', true, 'all'),
  (v_program_id, 4,  'week_start', '2026-06-15', 'Week 4 Kickoff', true, 'all'),
  (v_program_id, 5,  'week_start', '2026-06-22', 'Week 5 Kickoff', true, 'all'),
  (v_program_id, 6,  'week_start', '2026-06-29', 'Week 6 Kickoff', true, 'all'),
  (v_program_id, 7,  'week_start', '2026-07-06', 'Week 7 Kickoff', true, 'all'),
  (v_program_id, 8,  'week_start', '2026-07-13', 'Week 8 Kickoff', true, 'all'),
  (v_program_id, 9,  'week_start', '2026-07-27', 'Week 9 Kickoff', true, 'all'),
  (v_program_id, 10, 'week_start', '2026-08-03', 'Week 10 Kickoff', true, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Week end events (last active program day of each week)
INSERT INTO accel_program_events (program_id, week_number, event_type, event_date, title, is_mandatory, visible_to) VALUES
  (v_program_id, 1,  'week_end', '2026-05-29', 'End of Week 1',  false, 'all'),
  (v_program_id, 2,  'week_end', '2026-06-05', 'End of Week 2',  false, 'all'),
  (v_program_id, 3,  'week_end', '2026-06-12', 'End of Week 3',  false, 'all'),
  (v_program_id, 4,  'week_end', '2026-06-18', 'End of Week 4',  false, 'all'),
  (v_program_id, 5,  'week_end', '2026-06-26', 'End of Week 5',  false, 'all'),
  (v_program_id, 6,  'week_end', '2026-07-02', 'End of Week 6',  false, 'all'),
  (v_program_id, 7,  'week_end', '2026-07-10', 'End of Week 7',  false, 'all'),
  (v_program_id, 8,  'week_end', '2026-07-17', 'End of Week 8',  false, 'all'),
  (v_program_id, 9,  'week_end', '2026-07-31', 'End of Week 9',  false, 'all'),
  (v_program_id, 10, 'week_end', '2026-08-07', 'End of Week 10', false, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Internal demo days
-- W4 demo moves to Thursday June 18 (Juneteenth June 19 off)
-- W6 demo moves to Thursday July 2 (Independence Day Jul 3–4 off)
INSERT INTO accel_program_events (program_id, week_number, event_type, event_date, title, is_mandatory, visible_to) VALUES
  (v_program_id, 1, 'demo_day', '2026-05-29', 'Week 1 Internal Demo Day', true, 'all'),
  (v_program_id, 2, 'demo_day', '2026-06-05', 'Week 2 Internal Demo Day', true, 'all'),
  (v_program_id, 3, 'demo_day', '2026-06-12', 'Week 3 Internal Demo Day', true, 'all'),
  (v_program_id, 4, 'demo_day', '2026-06-18', 'Week 4 Internal Demo Day', true, 'all'),
  (v_program_id, 6, 'demo_day', '2026-07-02', 'Week 6 Internal Demo Day', true, 'all'),
  (v_program_id, 7, 'demo_day', '2026-07-10', 'Week 7 Internal Demo Day', true, 'all'),
  (v_program_id, 8, 'demo_day', '2026-07-17', 'Week 8 Internal Demo Day', true, 'all'),
  (v_program_id, 9, 'demo_day', '2026-07-31', 'Week 9 Internal Demo Day', true, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- The Crucible — Thursday June 25, Week 5
INSERT INTO accel_program_events (
  program_id, week_number, event_type, event_date,
  title, description, is_mandatory, visible_to
) VALUES (
  v_program_id, 5, 'crucible', '2026-06-25',
  'The Crucible — Mid-Program Formal Review',
  'External panel review. 5-minute pitch followed by 15-minute adversarial Q&A per team. Outcomes: Accelerate, Refine, or Restructure. AggieX milestone capital for the second half is contingent on credible progress demonstrated here.',
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
  (v_program_id, 4, 'off_day', '2026-06-19',
   'Juneteenth — No Program',
   'Federal holiday. No mandatory programming. Week 4 demo day moves to Thursday June 18.',
   false, 'all'),
  (v_program_id, 6, 'off_day', '2026-07-03',
   'Independence Day Observed — No Program',
   'Independence Day observed. No mandatory programming. Week 6 demo day moves to Thursday July 2.',
   false, 'all'),
  (v_program_id, 6, 'off_day', '2026-07-04',
   'Independence Day — No Program',
   'Independence Day. No mandatory programming.',
   false, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Program break — July 20–24 (between W8 and W9; no sessions, no deliverables)
INSERT INTO accel_program_events (program_id, week_number, event_type, event_date, title, description, is_mandatory, visible_to) VALUES
  (v_program_id, null, 'off_day', '2026-07-20',
   'Program Break — Week of July 20',
   'No mandatory programming July 20–24. Teams prepare independently for Pitch Mastery week.',
   false, 'all'),
  (v_program_id, null, 'off_day', '2026-07-24',
   'Program Break Ends',
   'Break ends. Week 9 begins Monday July 27.',
   false, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Program close
INSERT INTO accel_program_events (
  program_id, event_type, event_date,
  title, description, is_mandatory, visible_to
) VALUES (
  v_program_id, 'program_close', '2026-08-10',
  'Official Program Close',
  'All deliverables locked. AggieX milestone funding disbursement process begins.',
  false, 'aggiex_team'
) ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

-- Social events (Weeks 1–5, 7–10; Week 6 falls on holiday; break week has none)
INSERT INTO accel_program_events (program_id, week_number, event_type, event_date, title, is_mandatory, visible_to) VALUES
  (v_program_id, 1,  'social_event', '2026-05-29', 'Week 1 Friday Social',   false, 'all'),
  (v_program_id, 2,  'social_event', '2026-06-05', 'Week 2 Friday Social',   false, 'all'),
  (v_program_id, 3,  'social_event', '2026-06-12', 'Week 3 Friday Social',   false, 'all'),
  (v_program_id, 4,  'social_event', '2026-06-18', 'Week 4 Thursday Social', false, 'all'),
  (v_program_id, 5,  'social_event', '2026-06-26', 'Week 5 Friday Social',   false, 'all'),
  (v_program_id, 7,  'social_event', '2026-07-10', 'Week 7 Friday Social',   false, 'all'),
  (v_program_id, 8,  'social_event', '2026-07-17', 'Week 8 Friday Social',   false, 'all'),
  (v_program_id, 9,  'social_event', '2026-07-31', 'Week 9 Friday Social',   false, 'all'),
  (v_program_id, 10, 'social_event', '2026-08-07', 'Week 10 Friday Social',  false, 'all')
ON CONFLICT (program_id, event_type, event_date) DO NOTHING;

END $$;
