import { supabase } from '../lib/supabase.js'
import { useStore } from '../store/useStore.js'
import { 
  MOCK_JOBS, MOCK_APPLICATIONS, MOCK_CANDIDATES, MOCK_RECRUITERS, 
  MOCK_SECTORS, MOCK_SENIORITIES, MOCK_CONTRACTS, MOCK_LOCATIONS 
} from '../data/mock.js'

/**
 * Normalise a Supabase `jobs` row into the shape the UI components expect.
 * DB columns → UI keys:
 *   sector_id  → sector
 *   contract_id → contract
 *   salary_min → salaryMin
 *   salary_max → salaryMax
 *   published_at → publishedAt
 *   recruiter_id → recruiterId
 *   nice_to_have → niceToHave
 */
function normalizeJob(j) {
  return {
    ...j,
    sector:      j.sector_id,
    contract:    j.contract_id,
    salaryMin:   j.salary_min,
    salaryMax:   j.salary_max,
    publishedAt: j.published_at,
    recruiterId: j.recruiter_id,
    niceToHave:  j.nice_to_have,
    applicants:  j._app_count ?? 0,
  }
}

function normalizeApp(a) {
  return {
    ...a,
    jobId:       a.job_id,
    candidateId: a.candidate_id,
    appliedAt:   a.applied_at,
  }
}

function normalizeCandidate(profile, cp) {
  return {
    id:           profile.id,
    name:         profile.name,
    email:        profile.email,
    avatar:       profile.avatar || profile.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
    phone:        profile.phone || '',
    role:         cp?.role_title || profile.job_title || '',
    location:     cp?.location || '',
    seniority:    cp?.seniority || '',
    yearsExp:     cp?.years_exp || 0,
    availability: cp?.availability || 'Disponível',
    summary:      cp?.summary || '',
    skills:       cp?.skills || [],
    experiences:  [],  // will be populated separately if needed
    education:    [],
    socials: {
      linkedin:  cp?.linkedin || '',
      github:    cp?.github || '',
      portfolio: cp?.portfolio || '',
    },
  }
}

export async function syncData() {
  const store = useStore.getState()
  store.setIsLoading(true)

  if (store.isDemoMode) {
    // Load mock data
    store.setJobs([...MOCK_JOBS])
    store.setApplications([...MOCK_APPLICATIONS])
    store.setCandidates([...MOCK_CANDIDATES])
    store.setRecruiters([...MOCK_RECRUITERS])
    store.setSectors([...MOCK_SECTORS])
    store.setSeniorities([...MOCK_SENIORITIES])
    store.setContracts([...MOCK_CONTRACTS])
    store.setLocations([...MOCK_LOCATIONS])
    store.setIsLoading(false)
    return
  }

  // Load real data from Supabase
  if (!supabase) {
    console.warn('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env para usar dados reais.')
    // Clear mock data so UI reflects that we're in "real" mode with no backend
    store.setJobs([])
    store.setApplications([])
    store.setCandidates([])
    store.setRecruiters([])
    store.setSectors([])
    store.setSeniorities([])
    store.setContracts([])
    store.setLocations([])
    store.setIsLoading(false)
    return
  }

  try {
    const [
      { data: jobs, error: jobsErr },
      { data: applications, error: appsErr },
      { data: profiles, error: profErr },
      { data: candidateProfiles, error: cpErr },
      { data: sectors, error: secErr },
      { data: seniorities, error: senErr },
      { data: contracts, error: conErr }
    ] = await Promise.all([
      supabase.from('jobs').select('*'),
      supabase.from('applications').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('candidate_profiles').select('*'),
      supabase.from('sectors').select('*').order('label'),
      supabase.from('seniorities').select('*').order('order'),
      supabase.from('contracts').select('*').order('label')
    ])

    // Log any errors for debugging
    ;[jobsErr, appsErr, profErr, cpErr, secErr, senErr, conErr].forEach(e => {
      if (e) console.warn('Supabase sync warning:', e.message)
    })

    if (jobs) {
      // Compute applicant counts per job
      const appCountMap = {}
      if (applications) {
        applications.forEach(a => {
          appCountMap[a.job_id] = (appCountMap[a.job_id] || 0) + 1
        })
      }
      store.setJobs(jobs.map(j => normalizeJob({ ...j, _app_count: appCountMap[j.id] || 0 })))
    }
    
    if (applications) store.setApplications(applications.map(normalizeApp))

    if (profiles) {
      // Recruiters
      const recruiters = profiles
        .filter(p => p.role === 'recruiter')
        .map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          avatar: p.avatar || p.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
          phone: p.phone || '',
          role: p.job_title || 'Recruiter',
          department: p.department || '',
          active: p.active ?? true,
          createdAt: p.created_at?.slice(0, 10) || '',
        }))
      store.setRecruiters(recruiters)

      // Candidates
      const cpMap = {}
      if (candidateProfiles) {
        candidateProfiles.forEach(cp => { cpMap[cp.id] = cp })
      }
      const candidates = profiles
        .filter(p => p.role === 'candidate')
        .map(p => normalizeCandidate(p, cpMap[p.id]))
      store.setCandidates(candidates)
    }

    if (sectors) store.setSectors(sectors)
    if (seniorities) store.setSeniorities(seniorities)
    if (contracts) store.setContracts(contracts)

  } catch (error) {
    console.error('Erro ao sincronizar dados com Supabase:', error)
  } finally {
    useStore.getState().setIsLoading(false)
  }
}
