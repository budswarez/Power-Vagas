import { supabase } from '../lib/supabase.js'
import { MOCK_JOBS } from '../data/mock.js'

export async function listJobs(filters = {}) {
  if (!supabase) return applyFilters(MOCK_JOBS, filters)

  let q = supabase.from('jobs').select('*')

  if (!filters.includeAll) q = q.eq('status', 'active')
  if (filters.sector?.length)   q = q.in('sector_id', filters.sector)
  if (filters.modality?.length) q = q.in('modality', filters.modality)
  if (filters.seniority?.length) q = q.in('seniority', filters.seniority)
  if (filters.contract?.length) q = q.in('contract_id', filters.contract)
  if (filters.salaryMin)        q = q.gte('salary_min', filters.salaryMin)
  if (filters.salaryMax)        q = q.lte('salary_max', filters.salaryMax)
  if (filters.search)           q = q.ilike('title', `%${filters.search}%`)

  const { data, error } = await q.order('published_at', { ascending: false })
  if (error) throw error
  return data.map(dbJobToMock)
}

export async function getJob(id) {
  if (!supabase) return MOCK_JOBS.find((j) => j.id === id) ?? null

  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single()
  if (error) throw error
  return dbJobToMock(data)
}

export async function createJob(job) {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase.from('jobs').insert(mockJobToDb(job)).select().single()
  if (error) throw error
  return dbJobToMock(data)
}

export async function updateJob(id, updates) {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('jobs').update(mockJobToDb(updates)).eq('id', id).select().single()
  if (error) throw error
  return dbJobToMock(data)
}

export async function deleteJob(id) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('jobs').delete().eq('id', id)
  if (error) throw error
}

// ── Field mapping ─────────────────────────────────────────────

// DB uses snake_case + _id suffixes; mock uses camelCase with label values
function dbJobToMock(d) {
  if (!d) return null
  return {
    id:           d.id,
    title:        d.title,
    description:  d.description,
    requirements: d.requirements ?? [],
    niceToHave:   d.nice_to_have ?? [],
    benefits:     d.benefits ?? [],
    skills:       d.skills ?? [],
    sector:       d.sector_id,
    modality:     d.modality,
    seniority:    d.seniority,
    contract:     d.contract_id,
    location:     d.location,
    salaryMin:    d.salary_min,
    salaryMax:    d.salary_max,
    department:   d.department,
    status:       d.status,
    recruiterId:  d.recruiter_id,
    publishedAt:  d.published_at,
    applicants:   0, // populated separately if needed
  }
}

function mockJobToDb(m) {
  return {
    title:        m.title,
    description:  m.description,
    requirements: m.requirements,
    nice_to_have: m.niceToHave,
    benefits:     m.benefits,
    skills:       m.skills,
    sector_id:    m.sector,
    modality:     m.modality,
    seniority:    m.seniority,
    contract_id:  m.contract,
    location:     m.location,
    salary_min:   m.salaryMin,
    salary_max:   m.salaryMax,
    department:   m.department,
    status:       m.status,
    recruiter_id: m.recruiterId,
    published_at: m.publishedAt,
  }
}

// Client-side filter applied to mock data
function applyFilters(jobs, { sector, modality, seniority, contract, salaryMin, salaryMax, search, includeAll }) {
  return jobs.filter((j) => {
    if (!includeAll && j.status !== 'active') return false
    if (sector?.length   && !sector.includes(j.sector))    return false
    if (modality?.length && !modality.includes(j.modality)) return false
    if (seniority?.length && !seniority.includes(j.seniority)) return false
    if (contract?.length && !contract.includes(j.contract)) return false
    if (salaryMin && j.salaryMax < salaryMin) return false
    if (salaryMax && j.salaryMin > salaryMax) return false
    if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
}
