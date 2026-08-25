import { useState, useMemo, useEffect } from 'react'
import {
  User, Send, Bookmark, Mail, Phone, MapPin, Home, Sparkles,
  Briefcase, Plus, Pencil, Share2, Linkedin, Github, Globe,
  Instagram, Twitter, Palette, GraduationCap, Circle, X,
  Upload, FileText, Loader2, CheckCircle2, Trash2, BookmarkX,
} from 'lucide-react'
import { Avatar, Badge, Button, Card, Empty, Input, Modal, Tabs, Textarea } from '../components/ui.jsx'
import {
  STAGES, SECTOR_LABEL, fmtDate, fmtRange,
} from '../data/mock.js'
import { useStore } from '../store/useStore.js'
import { uploadResumeRemote, getResumeUrlRemote } from '../services/supabaseCrud.js'
import { useNavigate } from 'react-router-dom'

export default function CandidatePage({ session }) {
  const candidates = useStore(state => state.candidates)
  const applications = useStore(state => state.applications)
  const jobs = useStore(state => state.jobs)
  const savedJobs = useStore(state => state.savedJobs)
  const toggleSavedJob = useStore(state => state.toggleSavedJob)
  const [tab, setTab] = useState('profile')

  const seed = candidates.find((c) => c.email === session.email) || candidates[10]
  const [profile, setProfile] = useState({
    ...seed,
    name: session.name,
    email: session.email,
    address: seed?.address || 'Curitiba, PR',
  })

  const myApplications = applications
    .filter((a) => a.candidateId === seed?.id)
    .map((a) => ({ ...a, job: jobs.find((j) => j.id === a.jobId) }))
    .filter(a => a.job)

  const mySavedJobs = jobs.filter(j => savedJobs.includes(j.id))

  const completion = useMemo(() => {
    let pts = 0
    if (profile.name) pts += 10
    if (profile.email) pts += 10
    if (profile.phone) pts += 15
    if (profile.address) pts += 15
    if (profile.summary) pts += 15
    if (profile.skills?.length) pts += 10
    if (profile.experiences?.length) pts += 15
    if (profile.education?.length) pts += 10
    return pts
  }, [profile])

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wide mb-1">Área do candidato</div>
          <h1 className="text-[24px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Olá, {profile.name.split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Currículo</div>
            <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{completion}% completo</div>
          </div>
          <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'profile', label: 'Currículo', icon: User },
          { value: 'applications', label: 'Candidaturas', icon: Send, count: myApplications.length },
          { value: 'saved', label: 'Vagas salvas', icon: Bookmark, count: mySavedJobs.length },
        ]}
      />

      <div className="mt-6">
        {tab === 'profile' && <ProfileTab profile={profile} setProfile={setProfile} candidateId={seed?.id} />}
        {tab === 'applications' && <ApplicationsTab applications={myApplications} />}
        {tab === 'saved' && <SavedTab jobs={mySavedJobs} onRemove={toggleSavedJob} />}
      </div>
    </div>
  )
}

function ProfileTab({ profile, setProfile, candidateId }) {
  const set = (k, v) => setProfile({ ...profile, [k]: v })
  const [expModal, setExpModal] = useState(false)
  const [editingExp, setEditingExp] = useState(null)
  const [eduModal, setEduModal] = useState(false)
  const [editingEdu, setEditingEdu] = useState(null)

  const saveExperience = (exp) => {
    if (editingExp !== null) {
      set('experiences', profile.experiences.map((e, i) => i === editingExp ? exp : e))
    } else {
      set('experiences', [...(profile.experiences || []), exp])
    }
    setExpModal(false); setEditingExp(null)
  }

  const removeExperience = (i) => {
    set('experiences', profile.experiences.filter((_, idx) => idx !== i))
  }

  const saveEducation = (edu) => {
    if (editingEdu !== null) {
      set('education', profile.education.map((e, i) => i === editingEdu ? edu : e))
    } else {
      set('education', [...(profile.education || []), edu])
    }
    setEduModal(false); setEditingEdu(null)
  }

  const removeEducation = (i) => {
    set('education', profile.education.filter((_, idx) => idx !== i))
  }

  return (
    <div className="grid grid-cols-[1fr_280px] gap-6">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-500 dark:text-slate-400" />
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Dados pessoais</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldC label="Nome completo"><Input value={profile.name} onChange={(e) => set('name', e.target.value)} /></FieldC>
            <FieldC label="E-mail"><Input value={profile.email} onChange={(e) => set('email', e.target.value)} icon={Mail} /></FieldC>
            <FieldC label="Telefone"><Input value={profile.phone} onChange={(e) => set('phone', e.target.value)} icon={Phone} /></FieldC>
            <FieldC label="Localização"><Input value={profile.location} onChange={(e) => set('location', e.target.value)} icon={MapPin} /></FieldC>
            <div className="col-span-2">
              <FieldC label="Endereço"><Input value={profile.address} onChange={(e) => set('address', e.target.value)} icon={Home} /></FieldC>
            </div>
            <div className="col-span-2">
              <FieldC label="Resumo profissional"><Textarea value={profile.summary} onChange={(e) => set('summary', e.target.value)} rows={3} /></FieldC>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-slate-500 dark:text-slate-400" />
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Competências</h3>
          </div>
          <SkillsEditor skills={profile.skills || []} onChange={(skills) => set('skills', skills)} />
        </Card>

        {/* Experiências */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-slate-500 dark:text-slate-400" />
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Experiência profissional</h3>
            </div>
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => { setEditingExp(null); setExpModal(true) }}>Adicionar</Button>
          </div>
          <div className="space-y-2">
            {(profile.experiences || []).map((exp, i) => (
              <div key={i} className="p-3 border border-slate-200 dark:border-slate-700 rounded-[8px] hover:bg-slate-50 dark:hover:bg-slate-800 transition group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100">{exp.role}</div>
                    <div className="text-[12px] text-slate-600 dark:text-slate-400">{exp.company} · <span className="text-slate-400 dark:text-slate-500">{exp.period}</span></div>
                    {exp.summary && <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-1.5">{exp.summary}</div>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEditingExp(i); setExpModal(true) }} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><Pencil size={12} /></button>
                    <button onClick={() => removeExperience(i)} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
            {!(profile.experiences || []).length && (
              <Empty icon={Briefcase} title="Sem experiências cadastradas" hint="Adicione cargos anteriores para se destacar." />
            )}
          </div>
        </Card>

        <ResumeUpload candidateId={candidateId} />

        {/* Redes sociais */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Share2 size={14} className="text-slate-500 dark:text-slate-400" />
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Mídias sociais e portfólio</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldC label="LinkedIn">
              <Input value={profile.socials?.linkedin || ''} onChange={(e) => set('socials', { ...(profile.socials || {}), linkedin: e.target.value })} icon={Linkedin} placeholder="linkedin.com/in/seu-perfil" />
            </FieldC>
            <FieldC label="GitHub">
              <Input value={profile.socials?.github || ''} onChange={(e) => set('socials', { ...(profile.socials || {}), github: e.target.value })} icon={Github} placeholder="github.com/seu-usuario" />
            </FieldC>
            <FieldC label="Portfólio / Site">
              <Input value={profile.socials?.portfolio || ''} onChange={(e) => set('socials', { ...(profile.socials || {}), portfolio: e.target.value })} icon={Globe} placeholder="seu-site.com" />
            </FieldC>
            <FieldC label="Instagram">
              <Input value={profile.socials?.instagram || ''} onChange={(e) => set('socials', { ...(profile.socials || {}), instagram: e.target.value })} icon={Instagram} placeholder="@seu_usuario" />
            </FieldC>
            <FieldC label="X / Twitter">
              <Input value={profile.socials?.twitter || ''} onChange={(e) => set('socials', { ...(profile.socials || {}), twitter: e.target.value })} icon={Twitter} placeholder="@seu_usuario" />
            </FieldC>
            <FieldC label="Behance / Dribbble">
              <Input value={profile.socials?.design || ''} onChange={(e) => set('socials', { ...(profile.socials || {}), design: e.target.value })} icon={Palette} placeholder="behance.net/seu-perfil" />
            </FieldC>
          </div>
        </Card>

        {/* Formação */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap size={14} className="text-slate-500 dark:text-slate-400" />
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Formação acadêmica</h3>
            </div>
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => { setEditingEdu(null); setEduModal(true) }}>Adicionar</Button>
          </div>
          <div className="space-y-2">
            {(profile.education || []).map((ed, i) => (
              <div key={i} className="p-3 border border-slate-200 dark:border-slate-700 rounded-[8px] hover:bg-slate-50 dark:hover:bg-slate-800 transition group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100">{ed.degree}</div>
                    <div className="text-[12px] text-slate-600 dark:text-slate-400">{ed.school} · <span className="text-slate-400 dark:text-slate-500">{ed.year}</span></div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEditingEdu(i); setEduModal(true) }} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><Pencil size={12} /></button>
                    <button onClick={() => removeEducation(i)} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
            {!(profile.education || []).length && (
              <Empty icon={GraduationCap} title="Sem formação cadastrada" hint="Adicione sua formação acadêmica." />
            )}
          </div>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="p-5">
          <div className="flex flex-col items-center text-center">
            <Avatar initials={profile.avatar} size={56} tone="emerald" />
            <div className="mt-3 text-[15px] font-semibold text-slate-900 dark:text-slate-100">{profile.name}</div>
            <div className="text-[12px] text-slate-500 dark:text-slate-400">{profile.role}</div>
            <Badge tone="emerald" size="sm" icon={Circle}>Disponibilidade {profile.availability?.toLowerCase()}</Badge>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[12px]">
            <Row icon={Mail} text={profile.email} />
            <Row icon={Phone} text={profile.phone} />
            <Row icon={MapPin} text={profile.location} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Visibilidade</div>
          <ToggleRow label="Aparecer na busca de talentos" defaultOn />
          <ToggleRow label="Permitir contato direto de recrutadores" defaultOn />
          <ToggleRow label="Receber alertas de novas vagas" />
        </Card>
      </aside>

      {/* Modais */}
      <ExperienceModal
        open={expModal}
        onClose={() => { setExpModal(false); setEditingExp(null) }}
        onSave={saveExperience}
        initial={editingExp !== null ? profile.experiences[editingExp] : null}
      />
      <EducationModal
        open={eduModal}
        onClose={() => { setEduModal(false); setEditingEdu(null) }}
        onSave={saveEducation}
        initial={editingEdu !== null ? profile.education[editingEdu] : null}
      />
    </div>
  )
}

function ExperienceModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({ role: '', company: '', period: '', summary: '' })
  useEffect(() => {
    if (!open) return
    setForm(initial ? { ...initial } : { role: '', company: '', period: '', summary: '' })
  }, [open, initial])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar experiência' : 'Adicionar experiência'} size="md"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={() => onSave(form)}>{initial ? 'Salvar' : 'Adicionar'}</Button></>}>
      <div className="space-y-3">
        <FieldC label="Cargo / Função"><Input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="Ex: Engenheiro de Software" /></FieldC>
        <FieldC label="Empresa"><Input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Ex: Sua Empresa" /></FieldC>
        <FieldC label="Período"><Input value={form.period} onChange={(e) => set('period', e.target.value)} placeholder="Ex: Jan 2022 – Atual" /></FieldC>
        <FieldC label="Descrição (opcional)"><Textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={3} placeholder="Descreva suas responsabilidades e conquistas..." /></FieldC>
      </div>
    </Modal>
  )
}

function EducationModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({ degree: '', school: '', year: '' })
  useEffect(() => {
    if (!open) return
    setForm(initial ? { ...initial } : { degree: '', school: '', year: '' })
  }, [open, initial])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar formação' : 'Adicionar formação'} size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={() => onSave(form)}>{initial ? 'Salvar' : 'Adicionar'}</Button></>}>
      <div className="space-y-3">
        <FieldC label="Curso / Graduação"><Input value={form.degree} onChange={(e) => set('degree', e.target.value)} placeholder="Ex: Ciência da Computação" /></FieldC>
        <FieldC label="Instituição"><Input value={form.school} onChange={(e) => set('school', e.target.value)} placeholder="Ex: UFPR" /></FieldC>
        <FieldC label="Ano de conclusão"><Input value={form.year} onChange={(e) => set('year', e.target.value)} placeholder="Ex: 2022" /></FieldC>
      </div>
    </Modal>
  )
}

function ResumeUpload({ candidateId }) {
  const [uploading, setUploading] = useState(false)
  const [resumeUrl, setResumeUrl] = useState(null)
  const [fileName, setFileName] = useState(null)
  const isDemoMode = useStore(state => state.isDemoMode)

  useEffect(() => {
    if (!isDemoMode && candidateId) {
      getResumeUrlRemote(candidateId).then(url => { if (url) setResumeUrl(url) })
    }
  }, [candidateId, isDemoMode])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('Apenas arquivos PDF são aceitos.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('O arquivo deve ter no máximo 5 MB.'); return }
    setFileName(file.name); setUploading(true)
    try {
      const url = await uploadResumeRemote(candidateId, file)
      if (url) setResumeUrl(url)
    } catch (err) {
      console.error('Erro no upload:', err)
      alert('Erro ao enviar currículo. Tente novamente.')
    } finally { setUploading(false) }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-slate-500 dark:text-slate-400" />
          <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Currículo em PDF</h3>
        </div>
        {resumeUrl && <Badge size="sm" tone="emerald" icon={CheckCircle2}>Enviado</Badge>}
      </div>
      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[10px] p-6 text-center hover:border-slate-300 dark:hover:border-slate-600 transition">
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="text-slate-400 animate-spin" />
            <span className="text-[12px] text-slate-500 dark:text-slate-400">Enviando {fileName}...</span>
          </div>
        ) : (
          <>
            <Upload size={24} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-1">
              {resumeUrl ? 'Currículo já enviado. Clique para substituir.' : 'Clique para enviar seu currículo'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">Apenas PDF, máximo 5 MB</p>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[12px] font-medium rounded-[7px] cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-200 transition">
              <Upload size={13} />
              {isDemoMode ? 'Upload desativado (modo demo)' : 'Selecionar arquivo'}
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} disabled={isDemoMode} />
            </label>
          </>
        )}
      </div>
      {resumeUrl && !isDemoMode && (
        <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-blue-600 dark:text-blue-400 hover:underline">
          <FileText size={12} /> Visualizar currículo enviado
        </a>
      )}
    </Card>
  )
}

function FieldC({ label, children }) {
  return (
    <div>
      <div className="text-[11.5px] font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</div>
      {children}
    </div>
  )
}

function Row({ icon: Icon, text }) {
  return <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Icon size={12} className="text-slate-400 dark:text-slate-500" /> {text}</div>
}

function ToggleRow({ label, defaultOn }) {
  const [on, setOn] = useState(!!defaultOn)
  return (
    <button onClick={() => setOn(!on)} className="w-full flex items-center justify-between py-1.5 text-left">
      <span className="text-[12px] text-slate-700 dark:text-slate-300">{label}</span>
      <span className={`relative w-7 h-4 rounded-full transition ${on ? 'bg-slate-900 dark:bg-slate-300' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${on ? 'left-3.5' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

function SkillsEditor({ skills, onChange }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...new Set([...skills, v])])
    setDraft('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 text-[12px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-[6px]">
            {s}
            <button onClick={() => onChange(skills.filter((x) => x !== s))} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <X size={11} />
            </button>
          </span>
        ))}
        {skills.length === 0 && <span className="text-[12px] text-slate-400 dark:text-slate-500">Adicione suas competências</span>}
      </div>
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ex: TypeScript" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
        <Button variant="secondary" size="md" icon={Plus} onClick={add}>Adicionar</Button>
      </div>
    </div>
  )
}

function ApplicationsTab({ applications }) {
  if (!applications.length) {
    return <Card><Empty icon={Send} title="Você ainda não se candidatou a nenhuma vaga" hint="Volte para a Home e encontre oportunidades." /></Card>
  }
  return (
    <div className="space-y-2">
      {applications.map((a) => {
        const stage = STAGES.find((s) => s.id === a.stage)
        return (
          <Card key={a.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{a.job.title}</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{SECTOR_LABEL(a.job.sector)} · {a.job.location} · Candidatou-se em {fmtDate(a.appliedAt)}</div>
            </div>
            <Badge tone={stage?.tone}>{stage?.label}</Badge>
          </Card>
        )
      })}
    </div>
  )
}

function SavedTab({ jobs, onRemove }) {
  const navigate = useNavigate()
  if (!jobs.length) {
    return <Card><Empty icon={Bookmark} title="Nenhuma vaga salva" hint="Salve vagas de seu interesse para acompanhá-las aqui." /></Card>
  }
  return (
    <div className="space-y-2">
      {jobs.map((j) => (
        <Card key={j.id} className="p-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <button onClick={() => navigate(`/job/${j.id}`)} className="text-left hover:underline">
              <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{j.title}</div>
            </button>
            <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{SECTOR_LABEL(j.sector)} · {j.location} · {fmtRange(j.salaryMin, j.salaryMax)}</div>
          </div>
          <Button variant="ghost" size="sm" icon={BookmarkX} onClick={() => onRemove(j.id)}>Remover</Button>
        </Card>
      ))}
    </div>
  )
}
