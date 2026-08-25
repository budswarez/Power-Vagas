-- ============================================================
-- 002 — Audit triggers + Supabase Storage bucket for resumes
-- ============================================================

-- ── Generic audit trigger function ──────────────────────────
-- Logs INSERT / UPDATE / DELETE on any attached table.

create or replace function audit_trigger_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _actor_id   uuid;
  _actor_role text;
  _entity_id  text;
  _action     text;
  _meta       jsonb;
begin
  _actor_id   := auth.uid();
  _actor_role := (select role from profiles where id = _actor_id);

  -- Determine entity id (prefer 'id' column, fallback to composite key hint)
  if TG_OP = 'DELETE' then
    _entity_id := old.id::text;
    _meta      := to_jsonb(old);
  else
    _entity_id := new.id::text;
    _meta      := to_jsonb(new);
  end if;

  _action := lower(TG_TABLE_NAME || '_' || TG_OP);

  insert into audit_log (actor_id, actor_role, action, entity, entity_id, meta)
  values (_actor_id, _actor_role, _action, TG_TABLE_NAME, _entity_id, _meta);

  if TG_OP = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- ── Attach triggers ─────────────────────────────────────────

-- Jobs
drop trigger if exists audit_jobs on jobs;
create trigger audit_jobs
  after insert or update or delete on jobs
  for each row execute function audit_trigger_fn();

-- Applications
drop trigger if exists audit_applications on applications;
create trigger audit_applications
  after insert or update or delete on applications
  for each row execute function audit_trigger_fn();

-- Profiles
drop trigger if exists audit_profiles on profiles;
create trigger audit_profiles
  after insert or update or delete on profiles
  for each row execute function audit_trigger_fn();

-- Sectors
drop trigger if exists audit_sectors on sectors;
create trigger audit_sectors
  after insert or update or delete on sectors
  for each row execute function audit_trigger_fn();

-- Seniorities
drop trigger if exists audit_seniorities on seniorities;
create trigger audit_seniorities
  after insert or update or delete on seniorities
  for each row execute function audit_trigger_fn();

-- Contracts
drop trigger if exists audit_contracts on contracts;
create trigger audit_contracts
  after insert or update or delete on contracts
  for each row execute function audit_trigger_fn();

-- ── Supabase Storage: resumes bucket ────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880,  -- 5 MB
  array['application/pdf']
)
on conflict (id) do nothing;

-- Candidates can upload their own resume
create policy "resumes_candidate_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Candidates can read their own resume
create policy "resumes_candidate_read"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Candidates can update/delete their own resume
create policy "resumes_candidate_manage"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Staff (recruiter/admin) can read any resume
create policy "resumes_staff_read"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and auth_role() in ('recruiter', 'admin')
  );

-- Add resume_url column to candidate_profiles
alter table candidate_profiles
  add column if not exists resume_url text;
