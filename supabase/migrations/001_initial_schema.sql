-- ============================================================
-- Power Vagas — initial schema
-- Run via: supabase db push
-- ============================================================

-- ── Lookup tables ───────────────────────────────────────────

create table if not exists sectors (
  id    text primary key,
  label text not null,
  created_at timestamptz default now()
);

create table if not exists seniorities (
  id    text primary key,
  label text not null,
  "order" integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists contracts (
  id    text primary key,
  label text not null,
  created_at timestamptz default now()
);

-- ── Profiles (extends auth.users) ───────────────────────────

create table if not exists profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  role       text not null check (role in ('admin', 'recruiter', 'candidate')),
  name       text not null,
  email      text not null,
  avatar     text,
  phone      text,
  department text,
  job_title  text,
  active     boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Candidate extended data ─────────────────────────────────

create table if not exists candidate_profiles (
  id           uuid references profiles(id) on delete cascade primary key,
  role_title   text,
  location     text,
  seniority    text,
  years_exp    integer default 0,
  availability text,
  summary      text,
  skills       text[] default '{}',
  linkedin     text,
  github       text,
  portfolio    text,
  instagram    text,
  twitter      text,
  behance      text,
  updated_at   timestamptz default now()
);

create table if not exists education (
  id           uuid default gen_random_uuid() primary key,
  candidate_id uuid references candidate_profiles(id) on delete cascade,
  school       text not null,
  degree       text not null,
  year         text,
  created_at   timestamptz default now()
);

create table if not exists experiences (
  id           uuid default gen_random_uuid() primary key,
  candidate_id uuid references candidate_profiles(id) on delete cascade,
  company      text not null,
  role         text not null,
  period       text,
  summary      text,
  sort_order   integer default 0,
  created_at   timestamptz default now()
);

-- ── Jobs ────────────────────────────────────────────────────

create table if not exists jobs (
  id           text primary key default 'j-' || substr(md5(random()::text), 1, 6),
  title        text not null,
  description  text,
  requirements text[]  default '{}',
  nice_to_have text[]  default '{}',
  benefits     text[]  default '{}',
  skills       text[]  default '{}',
  sector_id    text references sectors(id),
  modality     text check (modality in ('Presencial', 'Híbrido', 'Remoto')),
  seniority    text,
  contract_id  text references contracts(id),
  location     text,
  salary_min   integer,
  salary_max   integer,
  department   text,
  status       text default 'active' check (status in ('active', 'paused', 'closed')),
  recruiter_id uuid references profiles(id),
  published_at date default current_date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists jobs_sector_idx   on jobs(sector_id);
create index if not exists jobs_status_idx   on jobs(status);
create index if not exists jobs_recruiter_idx on jobs(recruiter_id);

-- ── Applications ─────────────────────────────────────────────

create table if not exists applications (
  id           text primary key default 'a-' || substr(md5(random()::text), 1, 6),
  job_id       text references jobs(id) on delete cascade,
  candidate_id uuid references profiles(id) on delete cascade,
  stage        text default 'screening'
               check (stage in ('screening', 'interview', 'offer', 'hired', 'rejected')),
  note         text,
  applied_at   date default current_date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(job_id, candidate_id)
);

create index if not exists applications_job_idx  on applications(job_id);
create index if not exists applications_cand_idx on applications(candidate_id);

-- ── Saved jobs ───────────────────────────────────────────────

create table if not exists saved_jobs (
  candidate_id uuid references profiles(id) on delete cascade,
  job_id       text references jobs(id) on delete cascade,
  saved_at     timestamptz default now(),
  primary key (candidate_id, job_id)
);

-- ── Audit log ────────────────────────────────────────────────

create table if not exists audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references profiles(id),
  actor_role text,
  action     text not null,
  entity     text,
  entity_id  text,
  meta       jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- Helper: get current user role (used in RLS)
-- ============================================================

create or replace function auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

-- ============================================================
-- Trigger: auto-create profile on auth.users insert
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, role, name, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'candidate'),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 2))
  )
  on conflict (id) do nothing;

  -- also create empty candidate_profile when role is candidate
  if coalesce(new.raw_user_meta_data->>'role', 'candidate') = 'candidate' then
    insert into candidate_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table sectors           enable row level security;
alter table seniorities        enable row level security;
alter table contracts          enable row level security;
alter table profiles           enable row level security;
alter table candidate_profiles enable row level security;
alter table education          enable row level security;
alter table experiences        enable row level security;
alter table jobs               enable row level security;
alter table applications       enable row level security;
alter table saved_jobs         enable row level security;
alter table audit_log          enable row level security;

-- Lookup tables: public read, admin write
create policy "sectors_read"   on sectors           for select using (true);
create policy "sectors_admin"  on sectors           for all    using (auth_role() = 'admin');
create policy "senio_read"     on seniorities        for select using (true);
create policy "senio_admin"    on seniorities        for all    using (auth_role() = 'admin');
create policy "contracts_read" on contracts          for select using (true);
create policy "contracts_admin" on contracts         for all    using (auth_role() = 'admin');

-- Profiles: own + staff read
create policy "profiles_own"       on profiles for select using (id = auth.uid());
create policy "profiles_staff_r"   on profiles for select using (auth_role() in ('recruiter', 'admin'));
create policy "profiles_own_upd"   on profiles for update using (id = auth.uid());
create policy "profiles_admin_all" on profiles for all    using (auth_role() = 'admin');

-- Candidate profiles
create policy "cand_profile_own"   on candidate_profiles for all    using (id = auth.uid());
create policy "cand_profile_staff" on candidate_profiles for select using (auth_role() in ('recruiter', 'admin'));

create policy "edu_own"   on education for all    using (candidate_id = auth.uid());
create policy "edu_staff" on education for select using (auth_role() in ('recruiter', 'admin'));

create policy "exp_own"   on experiences for all    using (candidate_id = auth.uid());
create policy "exp_staff" on experiences for select using (auth_role() in ('recruiter', 'admin'));

-- Jobs: public read active, staff manage
create policy "jobs_public_read"  on jobs for select using (status = 'active');
create policy "jobs_staff_read"   on jobs for select using (auth_role() in ('recruiter', 'admin'));
create policy "jobs_recruiter_ins" on jobs for insert with check (auth_role() in ('recruiter', 'admin'));
create policy "jobs_recruiter_upd" on jobs for update
  using (recruiter_id = auth.uid() or auth_role() = 'admin');
create policy "jobs_admin_del"    on jobs for delete using (auth_role() = 'admin');

-- Applications
create policy "apps_cand_own"   on applications for select using (candidate_id = auth.uid());
create policy "apps_cand_ins"   on applications for insert with check (candidate_id = auth.uid());
create policy "apps_staff_read" on applications for select using (auth_role() in ('recruiter', 'admin'));
create policy "apps_staff_upd"  on applications for update using (auth_role() in ('recruiter', 'admin'));

-- Saved jobs
create policy "saved_own" on saved_jobs for all using (candidate_id = auth.uid());

-- Audit
create policy "audit_admin" on audit_log for select using (auth_role() = 'admin');
create policy "audit_ins"   on audit_log for insert with check (auth_role() in ('recruiter', 'admin'));
