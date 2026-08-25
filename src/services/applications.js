import { supabase } from '../lib/supabase.js'
import { MOCK_APPLICATIONS } from '../data/mock.js'

export async function listApplicationsForJob(jobId) {
  if (!supabase) return MOCK_APPLICATIONS.filter((a) => a.jobId === jobId)

  const { data, error } = await supabase
    .from('applications')
    .select('*, profiles(*), candidate_profiles(*)')
    .eq('job_id', jobId)
  if (error) throw error
  return data.map(dbAppToMock)
}

export async function listApplicationsForCandidate(candidateId) {
  if (!supabase) return MOCK_APPLICATIONS.filter((a) => a.candidateId === candidateId)

  const { data, error } = await supabase
    .from('applications')
    .select('*, jobs(*)')
    .eq('candidate_id', candidateId)
  if (error) throw error
  return data.map(dbAppToMock)
}

export async function applyToJob(jobId, candidateId) {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, candidate_id: candidateId, stage: 'screening' })
    .select()
    .single()
  if (error) throw error
  return dbAppToMock(data)
}

export async function updateApplicationStage(id, stage, note) {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('applications')
    .update({ stage, note, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return dbAppToMock(data)
}

export async function listSavedJobs(candidateId) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('saved_jobs')
    .select('job_id, jobs(*)')
    .eq('candidate_id', candidateId)
  if (error) throw error
  return data.map((r) => r.jobs)
}

export async function saveJob(jobId, candidateId) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase
    .from('saved_jobs')
    .insert({ job_id: jobId, candidate_id: candidateId })
  if (error && error.code !== '23505') throw error // ignore duplicate
}

export async function unsaveJob(jobId, candidateId) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('job_id', jobId)
    .eq('candidate_id', candidateId)
  if (error) throw error
}

function dbAppToMock(d) {
  return {
    id:          d.id,
    jobId:       d.job_id,
    candidateId: d.candidate_id,
    stage:       d.stage,
    appliedAt:   d.applied_at,
    note:        d.note,
  }
}
