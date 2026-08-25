import { supabase } from '../lib/supabase.js'
import { MOCK_RECRUITERS, MOCK_SECTORS, MOCK_SENIORITIES, MOCK_CONTRACTS } from '../data/mock.js'

// ── Recruiters ────────────────────────────────────────────────

export async function listRecruiters() {
  if (!supabase) return MOCK_RECRUITERS

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'recruiter')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(dbProfileToRecruiter)
}

export async function createRecruiter({ name, email, phone, role: jobTitle, department }) {
  if (!supabase) throw new Error('Supabase not configured')

  // Create auth user with recruiter role; Supabase sends invite email
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role: 'recruiter', name, job_title: jobTitle, department, phone },
  })
  if (error) throw error
  return data
}

export async function updateRecruiter(id, updates) {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('profiles')
    .update({
      name:       updates.name,
      job_title:  updates.role,
      department: updates.department,
      phone:      updates.phone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function toggleRecruiter(id, active) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('profiles').update({ active }).eq('id', id)
  if (error) throw error
}

export async function deleteRecruiter(id) {
  if (!supabase) throw new Error('Supabase not configured')
  // Deleting from auth.users cascades to profiles via FK
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) throw error
}

// ── Sectors ───────────────────────────────────────────────────

export async function listSectors() {
  if (!supabase) return MOCK_SECTORS
  const { data, error } = await supabase.from('sectors').select('*').order('label')
  if (error) throw error
  return data
}

export async function createSector(label) {
  if (!supabase) throw new Error('Supabase not configured')
  const id = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const { data, error } = await supabase.from('sectors').insert({ id, label }).select().single()
  if (error) throw error
  return data
}

export async function updateSector(id, label) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('sectors').update({ label }).eq('id', id)
  if (error) throw error
}

export async function deleteSector(id) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('sectors').delete().eq('id', id)
  if (error) throw error
}

// ── Seniorities ───────────────────────────────────────────────

export async function listSeniorities() {
  if (!supabase) return MOCK_SENIORITIES
  const { data, error } = await supabase.from('seniorities').select('*').order('"order"')
  if (error) throw error
  return data
}

export async function createSeniority(label) {
  if (!supabase) throw new Error('Supabase not configured')
  const id = label.toLowerCase().replace(/\s+/g, '-')
  const { data: existing } = await supabase.from('seniorities').select('order').order('"order"', { ascending: false }).limit(1)
  const order = (existing?.[0]?.order ?? 0) + 1
  const { data, error } = await supabase.from('seniorities').insert({ id, label, order }).select().single()
  if (error) throw error
  return data
}

export async function updateSeniority(id, label) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('seniorities').update({ label }).eq('id', id)
  if (error) throw error
}

export async function deleteSeniority(id) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('seniorities').delete().eq('id', id)
  if (error) throw error
}

// ── Contracts ─────────────────────────────────────────────────

export async function listContracts() {
  if (!supabase) return MOCK_CONTRACTS
  const { data, error } = await supabase.from('contracts').select('*').order('label')
  if (error) throw error
  return data
}

export async function createContract(label) {
  if (!supabase) throw new Error('Supabase not configured')
  const id = label.toLowerCase().replace(/\s+/g, '-')
  const { data, error } = await supabase.from('contracts').insert({ id, label }).select().single()
  if (error) throw error
  return data
}

export async function updateContract(id, label) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('contracts').update({ label }).eq('id', id)
  if (error) throw error
}

export async function deleteContract(id) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) throw error
}

// ── Audit ─────────────────────────────────────────────────────

export async function listAuditLog(limit = 50) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// ── Helpers ───────────────────────────────────────────────────

function dbProfileToRecruiter(p) {
  return {
    id:         p.id,
    name:       p.name,
    email:      p.email,
    avatar:     p.avatar,
    role:       p.job_title,
    department: p.department,
    phone:      p.phone,
    active:     p.active,
    createdAt:  p.created_at?.slice(0, 10),
  }
}
