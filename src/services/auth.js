import { supabase } from '../lib/supabase.js'
import { MOCK_ADMINS, MOCK_RECRUITERS, MOCK_CANDIDATES } from '../data/mock.js'
import { useStore } from '../store/useStore.js'

export async function signIn(email, password) {
  const isDemo = useStore.getState().isDemoMode
  if (!supabase || isDemo) return mockSignIn(email, password)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()
  if (profErr) throw profErr

  return normalizeProfile(profile)
}

export async function signUp(email, password, name) {
  const isDemo = useStore.getState().isDemoMode
  if (!supabase || isDemo) return mockSignUp(email, name)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: 'candidate' } },
  })
  if (error) throw error

  // Profile is created by the DB trigger handle_new_user()
  return data
}

export async function signOut() {
  const isDemo = useStore.getState().isDemoMode
  if (!supabase || isDemo) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Returns an unsubscribe function.
// Calls callback(profile | null, event) on auth state changes.
// event is one of: 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED', etc.
export function onAuthChange(callback) {
  const isDemo = useStore.getState().isDemoMode
  if (!supabase || isDemo) return () => {}

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (!session) { callback(null, event); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      callback(profile ? normalizeProfile(profile) : null, event)
    }
  )

  return () => subscription.unsubscribe()
}

// Call once on app mount to restore persisted session.
export async function restoreSession() {
  const isDemo = useStore.getState().isDemoMode
  if (!supabase || isDemo) return null

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return profile ? normalizeProfile(profile) : null
}

function normalizeProfile(p) {
  return {
    id:     p.id,
    role:   p.role,
    name:   p.name,
    email:  p.email,
    avatar: p.avatar ?? p.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
  }
}

// ── Mock fallbacks (demo mode, no Supabase configured) ───────

function mockSignIn(email, password) {
  if (!email || !password) return null

  const store = useStore.getState()
  const adm  = MOCK_ADMINS.find((a) => a.email === email)
  const rec  = store.recruiters.find((r) => r.email === email)
  const cand = store.candidates.find((c) => c.email === email)

  const user = adm || rec || cand
  if (!user) return null

  // Mock mode intentionally has no versioned password. Use a local test password.
  if (password.length < 4) return null

  if (adm)  return { role: 'admin',     name: adm.name,  email: adm.email,  avatar: adm.avatar }
  if (rec)  return { role: 'recruiter', name: rec.name,  email: rec.email,  avatar: rec.avatar }
  if (cand) return { role: 'candidate', name: cand.name, email: cand.email, avatar: cand.avatar }
  return null
}

function mockSignUp(email, name) {
  const store = useStore.getState()
  
  const newCandidate = {
    id: 'u-c-' + Math.random().toString(36).slice(2, 5),
    role: 'candidate',
    name: name || 'Você',
    email: email || 'voce@email.com',
    avatar: (name || 'VC').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
    skills: [],
    education: [],
    experiences: [],
    summary: '',
  }
  
  store.setCandidates([...store.candidates, newCandidate])
  
  return {
    role:   'candidate',
    name:   newCandidate.name,
    email:  newCandidate.email,
    avatar: newCandidate.avatar,
  }
}
