import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronDown, User, LayoutDashboard, Users, ShieldCheck,
  Settings, LogOut, Moon, Sun,
} from 'lucide-react'
import { Avatar, Button } from './ui.jsx'

export function TopBar({ session, onLogout, onOpenAuth, darkMode, onToggleDark }) {
  const isAuthed = !!session
  const location = useLocation()
  
  let current = 'home'
  if (location.pathname.startsWith('/job')) current = 'job'
  else if (location.pathname === '/diagram') current = 'diagram'
  else if (location.pathname === '/candidate') current = 'candidate'
  else if (location.pathname === '/recruiter') current = 'recruiter'
  else if (location.pathname === '/talents') current = 'talents'
  else if (location.pathname === '/admin') current = 'admin'

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-7">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-[7px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-semibold text-[13px] tracking-tight">P</div>
            <div className="leading-tight hidden sm:block">
              <div className="text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Power Vagas</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">Carreiras</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            <NavLink active={current === 'home'} to="/">Vagas</NavLink>
            {isAuthed && session.role === 'candidate' && (
              <NavLink active={current === 'candidate'} to="/candidate">Meu currículo</NavLink>
            )}
            {isAuthed && session.role === 'recruiter' && (
              <>
                <NavLink active={current === 'recruiter'} to="/recruiter">Recrutador</NavLink>
                <NavLink active={current === 'talents'} to="/talents">Talentos</NavLink>
              </>
            )}
            {isAuthed && session.role === 'admin' && (
              <>
                <NavLink active={current === 'recruiter'} to="/recruiter">Recrutador</NavLink>
                <NavLink active={current === 'talents'} to="/talents">Talentos</NavLink>
                <NavLink active={current === 'admin'} to="/admin">Admin</NavLink>
                <NavLink active={current === 'diagram'} to="/diagram">Arquitetura</NavLink>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDark}
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
            className="h-8 w-8 inline-flex items-center justify-center rounded-[6px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {!isAuthed ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => onOpenAuth('login')}>Entrar</Button>
              <Button variant="primary" size="sm" onClick={() => onOpenAuth('signup')}>Criar conta</Button>
            </>
          ) : (
            <UserMenu session={session} onLogout={onLogout} />
          )}
        </div>
      </div>
    </header>
  )
}

function NavLink({ active, to, children }) {
  return (
    <Link
      to={to}
      className={`h-8 px-2.5 flex items-center rounded-[6px] text-[13px] font-medium transition ${active ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
    >
      {children}
    </Link>
  )
}

function UserMenu({ session, onLogout }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-[7px] hover:bg-slate-100 dark:hover:bg-slate-800 transition">
        <Avatar initials={session.avatar} size={26} tone={session.role === 'admin' ? 'violet' : session.role === 'recruiter' ? 'blue' : 'emerald'} />
        <div className="text-left">
          <div className="text-[12.5px] font-medium text-slate-900 dark:text-slate-100 leading-tight">{session.name}</div>
          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">{session.role === 'admin' ? 'Administrador' : session.role === 'recruiter' ? 'Recrutador' : 'Candidato'}</div>
        </div>
        <ChevronDown size={13} className="text-slate-400 dark:text-slate-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] shadow-lg dark:shadow-slate-900 py-1 z-20">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="text-[12px] font-medium text-slate-900 dark:text-slate-100">{session.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{session.email}</div>
            </div>
            {session.role === 'candidate' && (
              <MenuItem icon={User} onClick={() => { navigate('/candidate'); setOpen(false) }}>Meu currículo</MenuItem>
            )}
            {session.role === 'recruiter' && (
              <>
                <MenuItem icon={LayoutDashboard} onClick={() => { navigate('/recruiter'); setOpen(false) }}>Dashboard</MenuItem>
                <MenuItem icon={Users} onClick={() => { navigate('/talents'); setOpen(false) }}>Busca de talentos</MenuItem>
              </>
            )}
            {session.role === 'admin' && (
              <>
                <MenuItem icon={LayoutDashboard} onClick={() => { navigate('/recruiter'); setOpen(false) }}>Dashboard</MenuItem>
                <MenuItem icon={Users} onClick={() => { navigate('/talents'); setOpen(false) }}>Busca de talentos</MenuItem>
                <MenuItem icon={ShieldCheck} onClick={() => { navigate('/admin'); setOpen(false) }}>Painel admin</MenuItem>
              </>
            )}
            <MenuItem icon={Settings} disabled>Configurações</MenuItem>
            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
            <MenuItem icon={LogOut} onClick={() => { onLogout(); setOpen(false) }} tone="rose">Sair</MenuItem>
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({ icon: Icon, children, onClick, tone, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-left transition ${disabled ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' : tone === 'rose' ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
    >
      <Icon size={14} />
      {children}
    </button>
  )
}
