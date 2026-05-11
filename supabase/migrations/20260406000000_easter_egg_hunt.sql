/**
 * AggieX Easter Egg Hunt 2026
 * Database migration: easter_egg_tokens table, easter_egg_hunt_2026 table,
 * RLS policies, and the atomic claim_egg() RPC function.
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

-- ─────────────────────────────────────────────
-- TABLE 1: easter_egg_tokens
-- Stores every physical egg's unique QR token and its claimed state.
-- ─────────────────────────────────────────────

create table easter_egg_tokens (
  id             uuid        primary key default gen_random_uuid(),
  token          text        unique not null,
  egg_type       text        not null check (egg_type in ('common', 'epic', 'legendary')),
  egg_number     integer     not null,
  is_claimed     boolean     not null default false,
  claimed_at     timestamptz,
  created_at     timestamptz not null default now(),
  unique (egg_type, egg_number)
);

create index idx_easter_egg_tokens_token on easter_egg_tokens(token);

alter table easter_egg_tokens enable row level security;

-- Any client may look up a token (needed for server-side validation on landing pages).
create policy "Allow public token lookup" on easter_egg_tokens
  for select using (true);

-- ─────────────────────────────────────────────
-- TABLE 2: easter_egg_hunt_2026
-- Stores the winner's details once they submit the claim form.
-- ─────────────────────────────────────────────

create table easter_egg_hunt_2026 (
  id                     uuid        primary key default gen_random_uuid(),
  token_id               uuid        references easter_egg_tokens(id) unique not null,
  egg_type               text        not null check (egg_type in ('common', 'epic', 'legendary')),
  egg_number             integer     not null,
  name                   text        not null,
  email                  text        not null,
  self_reported_found_at timestamptz,
  submitted_at           timestamptz not null default now()
);

alter table easter_egg_hunt_2026 enable row level security;

-- Anyone may submit a claim (gated by token validity in the RPC, not RLS alone).
create policy "Allow public claim insert" on easter_egg_hunt_2026
  for insert with check (true);

-- Public read allows the admin dashboard to query without a service-role key.
create policy "Allow public claim read" on easter_egg_hunt_2026
  for select using (true);

-- ─────────────────────────────────────────────
-- RPC: claim_egg()
-- Atomically validates the token and records the claim.
-- Uses SECURITY DEFINER so it runs with the table owner's privileges,
-- bypassing RLS to allow the FOR UPDATE lock and the UPDATE statement.
-- ─────────────────────────────────────────────

create or replace function claim_egg(
  p_token   text,
  p_name    text,
  p_email   text,
  p_found_at timestamptz
) returns jsonb language plpgsql security definer as $$
declare
  v_token_row easter_egg_tokens%rowtype;
begin
  -- Lock the row to prevent double-claims under concurrent requests.
  select * into v_token_row
    from easter_egg_tokens
    where token = p_token
    for update;

  if not found then
    return jsonb_build_object('error', 'invalid');
  end if;

  if v_token_row.is_claimed then
    return jsonb_build_object('error', 'claimed');
  end if;

  insert into easter_egg_hunt_2026
    (token_id, egg_type, egg_number, name, email, self_reported_found_at)
  values
    (v_token_row.id, v_token_row.egg_type, v_token_row.egg_number,
     p_name, p_email, p_found_at);

  update easter_egg_tokens
    set is_claimed = true, claimed_at = now()
    where id = v_token_row.id;

  return jsonb_build_object(
    'success',    true,
    'egg_type',   v_token_row.egg_type,
    'egg_number', v_token_row.egg_number
  );
end;
$$;
