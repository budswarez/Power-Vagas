import { useState } from 'react'
import {
  ArrowLeft, MapPin, Globe, Briefcase, Wallet, Check, CheckCircle2,
  Send, Bookmark, BookmarkCheck, Linkedin, Copy, ArrowRight, Mail, Lock, Info,
} from 'lucide-react'
import { Badge, Button, Card, Modal, Input } from '../components/ui.jsx'
import { SECTOR_LABEL, fmtDate, fmtRange, daysSince } from '../data/mock.js'
import { useStore } from '../store/useStore.js'
import { toggleSavedJobRemote } from '../services/supabaseCrud.js'

import { useNavigate } from 'react-router-dom'

export default function JobDetailPage({ jobId, session, onApply, onOpenAuth }) {
  const navigate = useNavigate()
  const jobs = useStore(state => state.jobs)
  const onBack = () => navigate('/')
  const job = jobs.find((j) => j.id === jobId)
  if (!job) return null
  const [applied, setApplied] = useState(false)
  const [copied, setCopied] = useState(false)
  const savedJobs = useStore(state => state.savedJobs)
  const toggleSavedJob = useStore(state => state.toggleSavedJob)
  const isSaved = savedJobs.includes(jobId)

  const handleSave = async () => {
    if (!session) { onOpenAuth('login'); return }
    toggleSavedJob(jobId)
    try {
      await toggleSavedJobRemote(session.id, jobId, !isSaved)
    } catch (e) { console.error('toggleSavedJob remote error:', e) }
  }
  const sectorLabel = SECTOR_LABEL(job.sector)

  const shareUrl = `${window.location.origin}${window.location.pathname}?jobId=${jobId}`

  const handleLinkedin = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer,width=600,height=500',
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApply = () => {
    if (!session) { onOpenAuth('login'); return }
    if (session.role !== 'candidate') return
    setApplied(true)
    onApply(job)
  }

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[12.5px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6">
        <ArrowLeft size={13} /> Voltar para vagas
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge>{sectorLabel}</Badge>
            <Badge tone="slate">{job.department}</Badge>
            <span className="text-[12px] text-slate-400 dark:text-slate-500">·</span>
            <span className="text-[12px] text-slate-500 dark:text-slate-400">Publicada em {fmtDate(job.publishedAt)}</span>
          </div>
          <h1 className="text-[32px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-[1.15]">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[13px] text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-slate-400 dark:text-slate-500" /> {job.location}</span>
            <span className="inline-flex items-center gap-1.5"><Globe size={13} className="text-slate-400 dark:text-slate-500" /> {job.modality}</span>
            <span className="inline-flex items-center gap-1.5"><Briefcase size={13} className="text-slate-400 dark:text-slate-500" /> {job.contract} · {job.seniority}</span>
            <span className="inline-flex items-center gap-1.5"><Wallet size={13} className="text-slate-400 dark:text-slate-500" /> {fmtRange(job.salaryMin, job.salaryMax)}</span>
          </div>

          <div className="mt-7 space-y-7">
            <Section title="Sobre a vaga">
              <p className="text-[13.5px] text-slate-700 dark:text-slate-300 leading-relaxed">{job.description}</p>
            </Section>
            <Section title="Requisitos">
              <BulletList items={job.requirements} />
            </Section>
            <Section title="Diferenciais">
              <BulletList items={job.niceToHave} muted />
            </Section>
            <Section title="Benefícios">
              <div className="grid grid-cols-2 gap-2">
                {job.benefits.map((b) => (
                  <div key={b} className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-300 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-[7px] border border-slate-200 dark:border-slate-700">
                    <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> {b}
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Tecnologias / habilidades">
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span key={s} className="text-[12px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-[6px]">{s}</span>
                ))}
              </div>
            </Section>
          </div>
        </div>

        <aside>
          <div className="sticky top-20 space-y-4">
            <Card className="p-5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Faixa salarial</div>
              <div className="text-[20px] font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{fmtRange(job.salaryMin, job.salaryMax)}</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{job.contract} · {job.seniority}</div>

              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {applied ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-[8px] text-[13px] text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 size={15} /> Candidatura enviada
                  </div>
                ) : (
                  <Button variant="primary" size="lg" full icon={Send} onClick={handleApply}>
                    {!session ? 'Entrar para candidatar' : session.role === 'recruiter' ? 'Recrutadores não podem candidatar' : 'Candidatar-se'}
                  </Button>
                )}
                <Button variant="secondary" size="lg" full icon={isSaved ? BookmarkCheck : Bookmark} onClick={handleSave}>
                {isSaved ? 'Vaga salva' : 'Salvar vaga'}
              </Button>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                <Stat label="Candidaturas" value={job.applicants} />
                <Stat label="Há" value={`${daysSince(job.publishedAt)}d`} />
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Compartilhar</div>
              <div className="flex gap-1.5">
                <Button variant="secondary" size="sm" icon={Linkedin} onClick={handleLinkedin}>LinkedIn</Button>
                <Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={handleCopy}>
                  {copied ? 'Copiado!' : 'Copiar link'}
                </Button>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-2.5">{title}</h2>
      {children}
    </div>
  )
}

function BulletList({ items, muted }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it} className="flex items-start gap-2 text-[13.5px] text-slate-700 dark:text-slate-300">
          <span className={`mt-[7px] w-1 h-1 rounded-full shrink-0 ${muted ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-900 dark:bg-slate-400'}`} />
          {it}
        </li>
      ))}
    </ul>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{value}</div>
    </div>
  )
}

export function AuthModal({ mode, open, onClose, onSubmit, onSwitch }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})

  const submit = () => {
    const errs = {}
    if (!email.trim()) errs.email = 'E-mail é obrigatório'
    if (!password.trim()) errs.password = 'Senha é obrigatória'
    if (mode === 'signup' && !name.trim()) errs.name = 'Nome é obrigatório'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    onSubmit({ role: mode === 'signup' ? 'candidate' : undefined, name, email, password })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'login' ? 'Entrar no Power Vagas' : 'Criar conta'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={submit} icon={ArrowRight}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Button>
        </>
      }
    >
      {mode === 'signup' && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-700 rounded-[7px] text-[12px] text-blue-800 dark:text-blue-300 leading-relaxed flex gap-2">
          <Info size={14} className="shrink-0 mt-0.5" />
          <div>
            Apenas <strong>candidatos</strong> podem criar conta aqui. Recrutadores são cadastrados pelo administrador no painel <code>/admin</code>.
          </div>
        </div>
      )}
      {mode === 'signup' && (
        <Field2 label="Nome completo" error={errors.name}>
          <Input value={name} onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }} placeholder="Ex: Ana Silva" />
        </Field2>
      )}
      <Field2 label="E-mail" error={errors.email}>
        <Input value={email} onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }} placeholder={mode === 'signup' ? 'voce@email.com' : 'admin@suaempresa.com.br'} icon={Mail} />
      </Field2>
      <Field2 label="Senha" error={errors.password}>
        <Input value={password} onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }} type="password" placeholder="••••••••" icon={Lock} />
      </Field2>

      {mode === 'login' && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">Acesso de demonstração</div>
          <div>Use uma conta de demonstração e uma senha de teste local. Nenhuma senha é armazenada no código.</div>
        </div>
      )}

      <div className="mt-4 text-center text-[12px] text-slate-500 dark:text-slate-400">
        {mode === 'login' ? (
          <>Não tem conta? <button onClick={() => onSwitch('signup')} className="text-slate-900 dark:text-slate-100 font-medium hover:underline">Criar conta</button></>
        ) : (
          <>Já tem conta? <button onClick={() => onSwitch('login')} className="text-slate-900 dark:text-slate-100 font-medium hover:underline">Entrar</button></>
        )}
      </div>
    </Modal>
  )
}

function Field2({ label, error, children }) {
  return (
    <div className="mb-3">
      <div className="text-[11.5px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</div>
      {children}
      {error && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-0.5">{error}</p>}
    </div>
  )
}
