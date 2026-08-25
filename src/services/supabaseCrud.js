/**
 * supabaseCrud.js – Supabase mutation helpers
 *
 * Every function checks isDemoMode first.  In demo mode it returns
 * immediately (the caller already updates the local Zustand store).
 * In live mode the function writes to Supabase, then returns the
 * server row so the caller can update the store with the canonical data.
 */
import { supabase } from '../lib/supabase.js'
import { useStore } from '../store/useStore.js'

function isLive() {
  return supabase && !useStore.getState().isDemoMode
}

// ─── Jobs ──────────────────────────────────────────────────────

export async function createJobRemote(job) {
  if (!isLive()) return null
  const { data, error } = await supabase.from('jobs').insert({
    title:        job.title,
    description:  job.description  || '',
    requirements: job.requirements || [],
    nice_to_have: job.niceToHave   || [],
    benefits:     job.benefits     || [],
    skills:       job.skills       || [],
    sector_id:    job.sector,
    modality:     job.modality,
    seniority:    job.seniority,
    contract_id:  job.contract,
    location:     job.location,
    salary_min:   job.salaryMin,
    salary_max:   job.salaryMax,
    department:   job.department || '',
    status:       'active',
    recruiter_id: job.recruiterId || null,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateJobRemote(jobId, job) {
  if (!isLive()) return null
  const { data, error } = await supabase.from('jobs').update({
    title:        job.title,
    description:  job.description  || '',
    requirements: job.requirements || [],
    nice_to_have: job.niceToHave   || [],
    benefits:     job.benefits     || [],
    skills:       job.skills       || [],
    sector_id:    job.sector,
    modality:     job.modality,
    seniority:    job.seniority,
    contract_id:  job.contract,
    location:     job.location,
    salary_min:   job.salaryMin,
    salary_max:   job.salaryMax,
    department:   job.department   || '',
    updated_at:   new Date().toISOString(),
  }).eq('id', jobId).select().single()
  if (error) throw error
  return data
}

export async function updateJobStatusRemote(jobId, status) {
  if (!isLive()) return null
  const { data, error } = await supabase
    .from('jobs')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteJobRemote(jobId) {
  if (!isLive()) return null
  const { error } = await supabase.from('jobs').delete().eq('id', jobId)
  if (error) throw error
}

// ─── Applications ──────────────────────────────────────────────

export async function moveAppRemote(appId, stage) {
  if (!isLive()) return null
  const { data, error } = await supabase
    .from('applications')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', appId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createApplicationRemote(jobId, candidateId) {
  if (!isLive()) return null
  const { data, error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, candidate_id: candidateId, stage: 'screening' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Taxonomy (sectors, seniorities, contracts) ────────────────

export async function addTaxonomyRemote(table, item) {
  if (!isLive()) return null
  const payload = { id: item.id, label: item.label }
  if (table === 'seniorities' && item.order != null) payload.order = item.order
  const { data, error } = await supabase.from(table).insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateTaxonomyRemote(table, id, label) {
  if (!isLive()) return null
  const { error } = await supabase.from(table).update({ label }).eq('id', id)
  if (error) throw error
}

export async function deleteTaxonomyRemote(table, id) {
  if (!isLive()) return null
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

// ─── Recruiters / Profiles ─────────────────────────────────────

export async function createRecruiterRemote(rec) {
  if (!isLive()) return null

  // Call the create-user Edge Function (uses service-role key server-side)
  const { data: { session } } = await supabase.auth.getSession()
  const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`

  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: rec.email,
      name: rec.name,
      role: 'recruiter',
      password: rec.password,
      phone: rec.phone || null,
      department: rec.department || null,
      job_title: rec.role || 'Recruiter',
    }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to create recruiter')
  return json.user
}

export async function updateRecruiterRemote(id, fields) {
  if (!isLive()) return null
  const { error } = await supabase.from('profiles').update({
    name: fields.name,
    email: fields.email,
    phone: fields.phone || null,
    department: fields.department || null,
    job_title: fields.role || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw error

  // Update auth password if provided
  if (fields.password) {
    const { data: { session } } = await supabase.auth.getSession()
    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-password`
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ user_id: id, password: fields.password }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erro ao atualizar senha')
  }
}

export async function toggleRecruiterRemote(id, active) {
  if (!isLive()) return null
  const { error } = await supabase.from('profiles').update({
    active,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw error
}

export async function deleteRecruiterRemote(id) {
  if (!isLive()) return null
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
}

// ─── Saved Jobs ───────────────────────────────────────────────

export async function toggleSavedJobRemote(candidateId, jobId, save) {
  if (!isLive()) return null
  if (save) {
    const { error } = await supabase.from('saved_jobs')
      .insert({ candidate_id: candidateId, job_id: jobId })
    if (error && error.code !== '23505') throw error // ignore duplicate
  } else {
    const { error } = await supabase.from('saved_jobs').delete()
      .eq('candidate_id', candidateId).eq('job_id', jobId)
    if (error) throw error
  }
}

export async function fetchSavedJobsRemote(candidateId) {
  if (!isLive()) return null
  const { data, error } = await supabase.from('saved_jobs')
    .select('job_id').eq('candidate_id', candidateId)
  if (error) throw error
  return data.map(r => r.job_id)
}

// ─── Candidates ───────────────────────────────────────────────

export async function deleteCandidateRemote(candidateId) {
  if (!isLive()) return null
  // Deleting from profiles cascades to candidate_profiles, education, experiences, applications
  const { error } = await supabase.from('profiles').delete().eq('id', candidateId)
  if (error) throw error
}

// ─── Resume Upload (Supabase Storage) ─────────────────────────

export async function uploadResumeRemote(candidateId, file) {
  if (!isLive()) return null
  const filePath = `${candidateId}/curriculo.pdf`

  const { error: uploadErr } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, { upsert: true, contentType: 'application/pdf' })
  if (uploadErr) throw uploadErr

  // Save reference in candidate_profiles
  const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(filePath)
  const resumeUrl = urlData?.publicUrl || filePath

  const { error: updateErr } = await supabase
    .from('candidate_profiles')
    .update({ resume_url: resumeUrl, updated_at: new Date().toISOString() })
    .eq('id', candidateId)
  if (updateErr) throw updateErr

  return resumeUrl
}

export async function getResumeUrlRemote(candidateId) {
  if (!isLive()) return null
  const filePath = `${candidateId}/curriculo.pdf`
  const { data } = await supabase.storage.from('resumes').createSignedUrl(filePath, 3600)
  return data?.signedUrl || null
}
