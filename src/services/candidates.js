import { supabase } from '../lib/supabase.js'
import { MOCK_CANDIDATES } from '../data/mock.js'

export async function getCandidate(id) {
  if (!supabase) return MOCK_CANDIDATES.find((c) => c.id === id) ?? null

  const { data, error } = await supabase
    .from('candidate_profiles')
    .select('*, profiles(*), education(*), experiences(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return dbCandidateToMock(data)
}

export async function getCandidateByEmail(email) {
  if (!supabase) return MOCK_CANDIDATES.find((c) => c.email === email) ?? null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()
  if (!profile) return null
  return getCandidate(profile.id)
}

export async function listCandidates(filters = {}) {
  if (!supabase) return applyFilters(MOCK_CANDIDATES, filters)

  let q = supabase
    .from('candidate_profiles')
    .select('*, profiles(*)')

  if (filters.seniority?.length) q = q.in('seniority', filters.seniority)
  if (filters.availability)      q = q.eq('availability', filters.availability)
  if (filters.search)            q = q.ilike('profiles.name', `%${filters.search}%`)

  const { data, error } = await q
  if (error) throw error
  return data.map(dbCandidateToMock)
}

export async function updateCandidateProfile(id, updates) {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('candidate_profiles')
    .update({
      role_title:   updates.role,
      location:     updates.location,
      seniority:    updates.seniority?.toLowerCase(),
      years_exp:    updates.yearsExp,
      availability: updates.availability,
      summary:      updates.summary,
      skills:       updates.skills,
      linkedin:     updates.socials?.linkedin,
      github:       updates.socials?.github,
      portfolio:    updates.socials?.portfolio,
      instagram:    updates.socials?.instagram,
      twitter:      updates.socials?.twitter,
      behance:      updates.socials?.behance,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error

  if (updates.name) {
    const { error: pErr } = await supabase
      .from('profiles')
      .update({ name: updates.name, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (pErr) throw pErr
  }
}

function dbCandidateToMock(d) {
  const p = d.profiles ?? {}
  return {
    id:           d.id,
    name:         p.name,
    email:        p.email,
    avatar:       p.avatar,
    phone:        p.phone,
    role:         d.role_title,
    location:     d.location,
    seniority:    d.seniority,
    yearsExp:     d.years_exp ?? 0,
    availability: d.availability,
    summary:      d.summary,
    skills:       d.skills ?? [],
    education:    (d.education ?? []).map((e) => ({ school: e.school, degree: e.degree, year: e.year })),
    experiences:  (d.experiences ?? []).map((e) => ({ company: e.company, role: e.role, period: e.period, summary: e.summary })),
    socials: {
      linkedin:  d.linkedin,
      github:    d.github,
      portfolio: d.portfolio,
      instagram: d.instagram,
      twitter:   d.twitter,
      behance:   d.behance,
    },
  }
}

function applyFilters(candidates, { seniority, availability, search, skills, yearsExpMin, yearsExpMax }) {
  return candidates.filter((c) => {
    if (seniority?.length    && !seniority.includes(c.seniority))       return false
    if (availability         && c.availability !== availability)         return false
    if (yearsExpMin !== undefined && c.yearsExp < yearsExpMin)           return false
    if (yearsExpMax !== undefined && c.yearsExp > yearsExpMax)           return false
    if (skills?.length && !skills.some((s) => c.skills.includes(s)))    return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
}
