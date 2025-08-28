-- Migration: Better Verification System
-- Date: 2025-08-26
-- Description: Fixes the verification system to be more robust and easier to use.

-- === 0) USERS: add global role column =======================================
alter table public.users
  add column if not exists role text not null
    default 'user'
    check (role in ('user','admin','manager'));  -- 'manager' allowed if you want, but per-org managers are controlled below

-- (Optional) If you previously had is_manager, keep it for now; plan to deprecate.

-- === 1) ORGANIZATIONS =======================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,                         -- keep unique for simplicity
  description text,
  website_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === 2) ORG MANAGERS (who can verify for an org) ============================
create table if not exists public.organization_managers (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (org_id, user_id)
);
create index if not exists idx_org_managers_user on public.organization_managers(user_id);

-- === 3) VERIFIED ORG MEMBERS (users that are verified with an org) =========
create table if not exists public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  verified_by uuid references public.users(id),       -- manager/admin who approved
  verified_at timestamptz default now(),
  primary key (org_id, user_id)
);
create index if not exists idx_org_members_user on public.organization_members(user_id);

-- === 4) USER → ORG CLAIMS ===================================================
create table if not exists public.organization_affiliation_claims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  created_at timestamptz default now(),
  decided_by uuid references public.users(id),
  decided_at timestamptz,
  decision_note text
);
-- Prevent multiple pendings for same (user, org)
create unique index if not exists uq_pending_user_org_claim
  on public.organization_affiliation_claims(org_id, user_id)
  where status = 'pending';
create index if not exists idx_org_aff_claims_org_pending
  on public.organization_affiliation_claims(org_id)
  where status = 'pending';

-- === 5) PROJECT → ORG CLAIMS ===============================================
create table if not exists public.project_organization_claims (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  submitted_by uuid not null references public.users(id),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  created_at timestamptz default now(),
  decided_by uuid references public.users(id),
  decided_at timestamptz,
  decision_note text
);
-- Prevent multiple pendings for same (project, org)
create unique index if not exists uq_pending_project_org_claim
  on public.project_organization_claims(project_id, org_id)
  where status = 'pending';
create index if not exists idx_proj_org_claims_org_pending
  on public.project_organization_claims(org_id)
  where status = 'pending';

-- === 6) VERIFIED PROJECT ↔ ORG LINKS =======================================
create table if not exists public.project_organizations (
  project_id uuid not null references public.projects(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  verified_by uuid references public.users(id),
  verified_at timestamptz default now(),
  primary key (project_id, org_id)
);

-- === 7) RLS HELPERS (Supabase-friendly) ====================================
-- Assumes auth.uid() == public.users.id
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

create or replace function public.is_org_manager(p_org uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from public.organization_managers m
    where m.org_id = p_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_participant(p_project uuid) returns boolean
language sql stable as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project and (p.owner_id = auth.uid())
  )
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = p_project and pm.user_id = auth.uid()
  );
$$;

-- === 8) ENABLE RLS (you can refine policies later) ==========================
alter table public.organization_managers            enable row level security;
alter table public.organization_members             enable row level security;
alter table public.organization_affiliation_claims  enable row level security;
alter table public.project_organization_claims      enable row level security;
alter table public.project_organizations            enable row level security;
alter table public.organizations                    enable row level security;

-- Minimal policies:

-- organizations: everyone can read; admins manage
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='organizations' and policyname='orgs_select_all'
  ) then
    create policy orgs_select_all on public.organizations for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='organizations' and policyname='orgs_admin_all'
  ) then
    create policy orgs_admin_all on public.organizations for all using (public.is_admin()) with check (public.is_admin());
  end if;
end$$;

-- organization_managers: admins all; managers can read their rows
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='organization_managers' and policyname='orgmgr_admin_all'
  ) then
    create policy orgmgr_admin_all on public.organization_managers for all
      using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='organization_managers' and policyname='orgmgr_read_self'
  ) then
    create policy orgmgr_read_self on public.organization_managers for select
      using (user_id = auth.uid() or public.is_admin());
  end if;
end$$;

-- organization_members: admins all; managers manage for their orgs; users can read their own
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='organization_members' and policyname='orgmem_admin_all'
  ) then
    create policy orgmem_admin_all on public.organization_members for all
      using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='organization_members' and policyname='orgmem_mgr_scope'
  ) then
    create policy orgmem_mgr_scope on public.organization_members for all
      using (public.is_org_manager(org_id) or public.is_admin())
      with check (public.is_org_manager(org_id) or public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='organization_members' and policyname='orgmem_user_read_self'
  ) then
    create policy orgmem_user_read_self on public.organization_members for select
      using (user_id = auth.uid() or public.is_admin());
  end if;
end$$;

-- organization_affiliation_claims: users manage their own; managers/admins for their orgs
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='organization_affiliation_claims' and policyname='oac_user_insert'
  ) then
    create policy oac_user_insert on public.organization_affiliation_claims for insert
      with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='organization_affiliation_claims' and policyname='oac_user_read_self'
  ) then
    create policy oac_user_read_self on public.organization_affiliation_claims for select
      using (user_id = auth.uid() or public.is_org_manager(org_id) or public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='organization_affiliation_claims' and policyname='oac_mgr_update'
  ) then
    create policy oac_mgr_update on public.organization_affiliation_claims for update
      using (public.is_org_manager(org_id) or public.is_admin())
      with check (public.is_org_manager(org_id) or public.is_admin());
  end if;
end$$;

-- project_organization_claims: project owner/member can insert; managers/admins can read/update for their orgs
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='project_organization_claims' and policyname='poc_insert_participant'
  ) then
    create policy poc_insert_participant on public.project_organization_claims for insert
      with check (submitted_by = auth.uid() and public.is_project_participant(project_id));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='project_organization_claims' and policyname='poc_read_scope'
  ) then
    create policy poc_read_scope on public.project_organization_claims for select
      using (
        submitted_by = auth.uid()
        or public.is_project_participant(project_id)
        or public.is_org_manager(org_id)
        or public.is_admin()
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='project_organization_claims' and policyname='poc_mgr_update'
  ) then
    create policy poc_mgr_update on public.project_organization_claims for update
      using (public.is_org_manager(org_id) or public.is_admin())
      with check (public.is_org_manager(org_id) or public.is_admin());
  end if;
end$$;

-- project_organizations: admins all; managers manage for their orgs; participants read their projects
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='project_organizations' and policyname='po_admin_all'
  ) then
    create policy po_admin_all on public.project_organizations for all
      using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='project_organizations' and policyname='po_mgr_scope'
  ) then
    create policy po_mgr_scope on public.project_organizations for all
      using (public.is_org_manager(org_id) or public.is_admin())
      with check (public.is_org_manager(org_id) or public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='project_organizations' and policyname='po_project_read'
  ) then
    create policy po_project_read on public.project_organizations for select
      using (public.is_project_participant(project_id) or public.is_admin());
  end if;
end$$;

-- === 9) Convenience queries (for your dashboards) ===========================
-- Is current user an admin?
--   select public.is_admin();

-- Orgs I manage:
--   select o.* from public.organizations o
--   join public.organization_managers m on m.org_id = o.id
--   where m.user_id = auth.uid();

-- Pending claims for my orgs (users):
--   select c.* from public.organization_affiliation_claims c
--   where public.is_org_manager(c.org_id) and c.status = 'pending';

-- Pending claims for my orgs (projects):
--   select c.* from public.project_organization_claims c
--   where public.is_org_manager(c.org_id) and c.status = 'pending';

-- All organizations a user is a member of
-- SELECT o.* 
-- FROM public.organizations o
-- JOIN public.organization_members m ON m.org_id = o.id
-- WHERE m.user_id = auth.uid();
