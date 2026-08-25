import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom'
import { TopBar } from './components/nav.jsx'
import { Button, useToast } from './components/ui.jsx'
import HomePage from './pages/HomePage.jsx'
import DiagramPage from './pages/DiagramPage.jsx'
import JobDetailPage, { AuthModal } from './pages/JobDetailPage.jsx'
import CandidatePage from './pages/CandidatePage.jsx'
import RecruiterPage from './pages/RecruiterPage.jsx'
import TalentsPage from './pages/TalentsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import { supabase } from './lib/supabase.js'
import { signIn, signUp, signOut, onAuthChange, restoreSession } from './services/auth.js'
import { useDarkMode } from './lib/useDarkMode.js'
import { useStore } from './store/useStore.js'

function NoAccessPanel({ onOpenAuth }) {
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
        <span className="text-slate-500 dark:text-slate-400 text-xl">🔒</span>
      </div>
      <h2 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">Esta área requer acesso</h2>
      <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2">Entre com a conta certa para acessar este painel.</p>
      <div className="mt-5">
        <Button variant="primary" onClick={onOpenAuth}>Entrar</Button>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-16">
      <div className="max-w-[1280px] mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
          <div className="w-5 h-5 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[10px] font-semibold">P</div>
          Power Vagas · MVP de recrutamento interno
        </div>
      </div>
    </footer>
  )
}

function RequireAuth({ role, children }) {
  const session = useStore(state => state.session)
  const setAuthMode = useStore(state => state.setAuthMode)
  
  if (!session) {
    return <NoAccessPanel onOpenAuth={() => setAuthMode('login')} />
  }
  
  if (role) {
    const roles = Array.isArray(role) ? role : [role]
    if (!roles.includes(session.role)) {
      if (session.role === 'admin') {
         // Admins can access recruiter routes as per old logic
         if (!roles.includes('recruiter') && !roles.includes('admin')) {
             return <NoAccessPanel onOpenAuth={() => setAuthMode('login')} />
         }
      } else {
         return <NoAccessPanel onOpenAuth={() => setAuthMode('login')} />
      }
    }
  }
  
  return children
}

function JobDetailWrapper(props) {
  const { id } = useParams()
  return <JobDetailPage jobId={id} {...props} />
}

function AppContent() {
  const session = useStore(state => state.session)
  const setSession = useStore(state => state.setSession)
  const authMode = useStore(state => state.authMode)
  const setAuthMode = useStore(state => state.setAuthMode)
  
  const [darkMode, toggleDark] = useDarkMode()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Restore persisted Supabase session on first load
  useEffect(() => {
    if (!supabase) return
    restoreSession().then((profile) => {
      if (profile) setSession(profile)
    })
  }, [setSession])

  // Keep session in sync with Supabase auth state changes
  useEffect(() => {
    return onAuthChange((profile, event) => {
      setSession(profile)
      if (event === 'SIGNED_IN' && profile) {
        setAuthMode(null)
        toast.push(`Bem-vindo(a), ${profile.name.split(' ')[0]}!`, 'emerald')
        navigate(profile.role === 'admin' ? '/admin' : profile.role === 'recruiter' ? '/recruiter' : '/candidate')
      }
      if (event === 'SIGNED_OUT') navigate('/')
    })
  }, [navigate, setSession, setAuthMode, toast])

  const isDemoMode = useStore(state => state.isDemoMode)
  useEffect(() => {
    import('./services/dataSync.js').then(({ syncData }) => syncData())
  }, [isDemoMode])

  const onLogin = async ({ name, email, password }) => {
    try {
      const isDemo = useStore.getState().isDemoMode
      if (supabase && !isDemo) {
        // Real Supabase auth — navigation + toast handled in onAuthChange
        await signIn(email, password)
        return
      }
      // Demo / mock mode
      let profile = await signIn(email, password)
      if (!profile) throw new Error('Credenciais inválidas. Verifique o email.')
      
      setSession(profile)
      setAuthMode(null)
      toast.push(`Bem-vindo(a), ${profile.name.split(' ')[0]}!`, 'emerald')
      navigate(profile.role === 'admin' ? '/admin' : profile.role === 'recruiter' ? '/recruiter' : '/candidate')
    } catch (err) {
      toast.push(err.message || 'Erro ao entrar', 'rose')
    }
  }

  const onSignup = async ({ name, email, password }) => {
    try {
      const isDemo = useStore.getState().isDemoMode
      if (supabase && !isDemo) {
        await signUp(email, password, name)
        setAuthMode(null)
        toast.push('Conta criada! Verifique seu e-mail para confirmar o acesso.', 'emerald')
        return
      }
      // Mock signup
      const profile = await signUp(email, password, name)
      setSession(profile)
      setAuthMode(null)
      toast.push(`Bem-vindo(a), ${profile.name.split(' ')[0]}!`, 'emerald')
      navigate('/candidate')
    } catch (err) {
      toast.push(err.message || 'Erro ao criar conta', 'rose')
    }
  }

  const onLogout = async () => {
    try {
      const isDemo = useStore.getState().isDemoMode
      if (supabase && !isDemo) {
        await signOut()
      }
    } catch (_) { /* ignore */ }
    setSession(null)
    navigate('/')
    toast.push('Sessão encerrada')
  }

  const handleApply = async (job) => {
    try {
      const isDemo = useStore.getState().isDemoMode
      if (supabase && !isDemo && session) {
        await import('./services/supabaseCrud.js').then(async ({ createApplicationRemote }) => {
          await createApplicationRemote(job.id, session.id)
        })
      }
      toast.push(`Candidatura enviada para ${job.title}`, 'emerald')
    } catch (err) {
      toast.push(err.message || 'Erro ao enviar candidatura', 'rose')
    }
  }

  const handleAuthSubmit = (data) => {
    if (authMode === 'signup') onSignup(data)
    else onLogin(data)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      <TopBar 
        session={session} 
        onLogout={onLogout} 
        onOpenAuth={(m) => setAuthMode(m)} 
        darkMode={darkMode} 
        onToggleDark={toggleDark} 
      />

      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage session={session} onOpenAuth={(m) => setAuthMode(m)} />} />
          <Route path="/job/:id" element={<JobDetailWrapper session={session} onApply={handleApply} onOpenAuth={(m) => setAuthMode(m)} />} />
          <Route path="/diagram" element={<RequireAuth role="admin"><DiagramPage /></RequireAuth>} />
          <Route path="/candidate" element={<RequireAuth role="candidate"><CandidatePage session={session} /></RequireAuth>} />
          <Route path="/recruiter" element={<RequireAuth role={['recruiter', 'admin']}><RecruiterPage session={session} /></RequireAuth>} />
          <Route path="/talents" element={<RequireAuth role={['recruiter', 'admin']}><TalentsPage session={session} /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth role="admin"><AdminPage session={session} /></RequireAuth>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <AuthModal mode={authMode || 'login'} open={!!authMode} onClose={() => setAuthMode(null)} onSubmit={handleAuthSubmit} onSwitch={(m) => setAuthMode(m)} />
      <Footer />
      {toast.node}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
