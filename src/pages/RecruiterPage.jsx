import { useState, useRef } from 'react'
import {
  Download, Plus, Briefcase, Users, MessageSquare, Award, LineChart,
  Kanban, Search, Bell, UserPlus, Eye, Pencil, Pause, Play, Trash2,
  MoreHorizontal, Check, MapPin, Mail, Phone, Send, Circle,
  BarChart3, Filter, X,
} from 'lucide-react'
import {
  Avatar, Badge, Button, Card, Drawer, Empty, Input, KPI, Modal, Select, Tabs, Textarea, useToast,
} from '../components/ui.jsx'
import {
  STAGES, SECTOR_LABEL, fmtBRL, fmtRange, fmtDate, daysSince,
} from '../data/mock.js'
import { printResume } from '../lib/printResume.js'
import { useStore } from '../store/useStore.js'
import { createJobRemote, updateJobRemote, updateJobStatusRemote, deleteJobRemote, moveAppRemote } from '../services/supabaseCrud.js'

export default function RecruiterPage({ session }) {
  const [tab, setTab] = useState('overview')
  const [openJobModal, setOpenJobModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const toast = useToast()

  const { jobs, setJobs, applications: apps, setApplications: setApps, sectors, candidates } = useStore()
  const [drawerEntry, setDrawerEntry] = useState(null)

  const activeJobs = jobs.filter((j) => j.status === 'active').length
  const offers = apps.filter((a) => a.stage === 'offer').length

  const moveApp = async (appId, stage) => {
    setApps(apps.map((a) => (a.id === appId ? { ...a, stage } : a)))
    try { await moveAppRemote(appId, stage) } catch (e) { console.error('moveApp remote error:', e) }
  }

  const togglePause = async (jobId) => {
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return
    const newStatus = job.status === 'active' ? 'paused' : 'active'
    setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)))
    toast.push('Status da vaga atualizado')
    try { await updateJobStatusRemote(jobId, newStatus) } catch (e) { console.error('togglePause remote error:', e) }
  }

  const removeJob = async (jobId) => {
    setJobs(jobs.filter((j) => j.id !== jobId))
    toast.push('Vaga excluída')
    try { await deleteJobRemote(jobId) } catch (e) { console.error('removeJob remote error:', e) }
  }

  const createJob = async (j) => {
    const tempId = 'j-' + Math.random().toString(36).slice(2, 6)
    const newJob = { id: tempId, ...j, status: 'active', applicants: 0, publishedAt: new Date().toISOString().slice(0, 10), recruiterId: session?.id || 'u-r-01' }
    setJobs([newJob, ...jobs])
    toast.push('Vaga publicada com sucesso', 'emerald')
    try {
      const remote = await createJobRemote({ ...j, recruiterId: session?.id || null })
      if (remote) {
        const store = useStore.getState()
        setJobs(store.jobs.map((jj) => jj.id === tempId ? {
          ...remote,
          salaryMin: remote.salary_min,
          salaryMax: remote.salary_max,
          publishedAt: remote.published_at,
          recruiterId: remote.recruiter_id,
          niceToHave: remote.nice_to_have,
          sector: remote.sector_id,
          contract: remote.contract_id,
        } : jj))
      }
    } catch (e) { console.error('createJob remote error:', e) }
  }

  const saveEditJob = async (j) => {
    const updated = { ...editingJob, ...j }
    setJobs(jobs.map((jj) => jj.id === updated.id ? updated : jj))
    toast.push('Vaga atualizada com sucesso', 'emerald')
    try { await updateJobRemote(updated.id, updated) } catch (e) { console.error('updateJob remote error:', e) }
    setEditingJob(null)
  }

  const handleExportCSV = () => {
    const headers = ['Título', 'Setor', 'Local', 'Modalidade', 'Senioridade', 'Contrato', 'Salário Min', 'Salário Max', 'Status', 'Candidaturas', 'Publicada em']
    const rows = jobs.map((j) => [
      j.title, SECTOR_LABEL(j.sector), j.location, j.modality,
      j.seniority, j.contract, j.salaryMin, j.salaryMax,
      j.status, j.applicants, j.publishedAt,
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `power-vagas-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wide">Painel do recrutador</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Power Vagas</span>
          </div>
          <h1 className="text-[24px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Bom dia, {session.name.split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsButton apps={apps} jobs={jobs} candidates={candidates} />
          <Button variant="secondary" icon={Download} onClick={handleExportCSV}>Exportar CSV</Button>
          <Button variant="primary" icon={Plus} onClick={() => setOpenJobModal(true)}>Nova vaga</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPI label="Vagas ativas" value={activeJobs} delta="+2 esta semana" tone="emerald" icon={Briefcase} />
        <KPI label="Candidaturas (30d)" value={apps.length} delta="+18%" tone="emerald" icon={Users} />
        <KPI label="Em entrevista" value={apps.filter((a) => a.stage === 'interview').length} delta="3 hoje" tone="blue" icon={MessageSquare} />
        <KPI label="Em proposta" value={offers} delta={offers > 1 ? 'Aguardando' : '1 fechada'} tone="slate" icon={Award} />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Vagas', icon: Briefcase, count: jobs.length },
          { value: 'kanban', label: 'Pipeline', icon: Kanban },
          { value: 'analytics', label: 'Análise', icon: LineChart },
        ]}
      />

      <div className="mt-6">
        {tab === 'overview' && (
          <JobsTable jobs={jobs} apps={apps} onView={(job) => { setSelectedJob(job); setTab('kanban') }} onPause={togglePause} onDelete={removeJob} onEdit={setEditingJob} />
        )}
        {tab === 'kanban' && (
          <KanbanView jobs={jobs} selectedJob={selectedJob || jobs[0]} onSelectJob={setSelectedJob} apps={apps} candidates={candidates} onMove={moveApp} onOpenCandidate={(candidate, app) => setDrawerEntry({ candidate, app })} />
        )}
        {tab === 'analytics' && <AnalyticsView jobs={jobs} apps={apps} sectors={sectors} />}
      </div>

      <NewJobModal open={openJobModal} onClose={() => setOpenJobModal(false)} onCreate={createJob} sectors={sectors} />
      <NewJobModal open={!!editingJob} onClose={() => setEditingJob(null)} onCreate={saveEditJob} sectors={sectors} initialJob={editingJob} editMode />
      <CandidateDrawer candidate={drawerEntry?.candidate} app={drawerEntry?.app} onClose={() => setDrawerEntry(null)} onMove={moveApp} />
      {toast.node}
    </div>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function NotificationsButton({ apps, jobs, candidates }) {
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState(false)

  // Build real notifications from recent applications
  const recent = [...apps]
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
    .slice(0, 8)

  const items = recent.map((a) => {
    const c = candidates.find((cc) => cc.id === a.candidateId)
    const j = jobs.find((jj) => jj.id === a.jobId)
    if (!c || !j) return null
    return {
      icon: UserPlus,
      text: `${c.name} se candidatou em ${j.title}`,
      time: timeAgo(a.appliedAt),
    }
  }).filter(Boolean)

  const hasUnread = !read && items.length > 0

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative h-9 w-9 inline-flex items-center justify-center rounded-[7px] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
        <Bell size={15} className="text-slate-700 dark:text-slate-300" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] shadow-xl z-40">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-slate-900 dark:text-slate-100">Notificações</span>
              <button onClick={() => setRead(true)} className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Marcar como lidas</button>
            </div>
            <div className="max-h-[320px] overflow-auto">
              {items.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-slate-400 dark:text-slate-500">Nenhuma notificação</div>
              ) : items.map((it, i) => (
                <div key={i} className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-800 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <it.icon size={14} className="text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-slate-800 dark:text-slate-200 leading-snug">{it.text}</p>
                    <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">há {it.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function JobsTable({ jobs, apps, onView, onPause, onDelete, onEdit }) {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const filtered = jobs.filter((j) => {
    if (q && !j.title.toLowerCase().includes(q.toLowerCase())) return false
    if (statusFilter && j.status !== statusFilter) return false
    return true
  })

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar vaga..." className="max-w-xs" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="Todos status"
          options={[{ value: 'active', label: 'Ativas' }, { value: 'paused', label: 'Pausadas' }]} />
        <div className="ml-auto text-[11.5px] text-slate-500 dark:text-slate-400">{filtered.length} de {jobs.length} vagas</div>
      </div>
      <table className="w-full text-[12.5px]">
        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <tr className="text-left text-[11px] uppercase font-medium text-slate-500 dark:text-slate-400 tracking-wide">
            <Th>Vaga</Th><Th>Setor</Th><Th>Local</Th>
            <Th align="right">Salário</Th><Th align="right">Candidaturas</Th>
            <Th>Pipeline</Th><Th>Status</Th><Th />
          </tr>
        </thead>
        <tbody>
          {filtered.map((j) => {
            const jobApps = apps.filter((a) => a.jobId === j.id)
            const stages = STAGES.slice(0, 3).map((s) => ({ ...s, count: jobApps.filter((a) => a.stage === s.id).length }))
            return (
              <tr key={j.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group">
                <Td>
                  <button onClick={() => onView(j)} className="text-left">
                    <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:underline">{j.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{j.contract} · {j.seniority} · há {daysSince(j.publishedAt)}d</div>
                  </button>
                </Td>
                <Td><Badge size="sm">{SECTOR_LABEL(j.sector)}</Badge></Td>
                <Td className="text-slate-700 dark:text-slate-300">{j.location}</Td>
                <Td align="right" className="tabular-nums text-slate-700 dark:text-slate-300">{fmtBRL(j.salaryMin)}–{fmtBRL(j.salaryMax)}</Td>
                <Td align="right" className="tabular-nums font-medium text-slate-900 dark:text-slate-100">{j.applicants}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    {stages.map((s) => (
                      <span key={s.id} title={s.label} className="inline-flex items-center gap-0.5 text-[10.5px] tabular-nums px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className={`w-1.5 h-1.5 rounded-full bg-${s.tone}-500`} />
                        {s.count}
                      </span>
                    ))}
                  </div>
                </Td>
                <Td>
                  {j.status === 'active'
                    ? <Badge tone="emerald" size="sm" icon={Circle}>Ativa</Badge>
                    : <Badge tone="amber" size="sm" icon={Pause}>Pausada</Badge>}
                </Td>
                <Td>
                  <RowActions onView={() => onView(j)} onEdit={() => onEdit(j)} onPause={() => onPause(j.id)} onDelete={() => onDelete(j.id)} paused={j.status === 'paused'} />
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {filtered.length === 0 && <Empty icon={Search} title="Nenhuma vaga encontrada" />}
    </Card>
  )
}

function Th({ children, align }) {
  return <th className={`px-4 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'} font-medium`}>{children}</th>
}
function Td({ children, align, className = '' }) {
  return <td className={`px-4 py-2.5 ${align === 'right' ? 'text-right' : ''} ${className}`}>{children}</td>
}

function RowActions({ onView, onEdit, onPause, onDelete, paused }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef(null)

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((v) => !v)
  }

  return (
    <div>
      <button ref={btnRef} onClick={handleOpen} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="fixed w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[7px] shadow-lg py-1 z-40"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button onClick={() => { onView(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left">
              <Eye size={13} /> Ver candidaturas
            </button>
            <button onClick={() => { onEdit(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left">
              <Pencil size={13} /> Editar vaga
            </button>
            <button onClick={() => { onPause(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left">
              {paused ? <><Play size={13} /> Reativar</> : <><Pause size={13} /> Pausar</>}
            </button>
            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
            <button onClick={() => { onDelete(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-left">
              <Trash2 size={13} /> Excluir
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function KanbanView({ jobs, selectedJob, onSelectJob, apps, candidates, onMove, onOpenCandidate }) {
  const job = selectedJob || jobs[0]
  if (!job) return null
  const jobApps = apps.filter((a) => a.jobId === job.id)
  const stages = STAGES.slice(0, 4)
  const [draggingId, setDraggingId] = useState(null)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[12px] text-slate-500 dark:text-slate-400">Vaga:</span>
        <Select value={job.id} onChange={(e) => onSelectJob(jobs.find((j) => j.id === e.target.value))} placeholder=""
          options={jobs.map((j) => ({ value: j.id, label: j.title }))} className="min-w-[320px]" />
        <div className="ml-auto flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
          <span>{jobApps.length} candidatos</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span>{job.location}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stages.map((stage) => {
          const stageApps = jobApps.filter((a) => a.stage === stage.id)
          return (
            <div
              key={stage.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (draggingId) onMove(draggingId, stage.id); setDraggingId(null) }}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[10px] p-2.5 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-2.5 px-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full bg-${stage.tone}-500`} />
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{stage.label}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{stageApps.length}</span>
                </div>
                <button className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500"><Plus size={12} /></button>
              </div>
              <div className="space-y-2">
                {stageApps.map((a) => {
                  const c = candidates.find((cc) => cc.id === a.candidateId)
                  if (!c) return null
                  return (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={() => setDraggingId(a.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onClick={() => onOpenCandidate(c, a)}
                      className="bg-white dark:bg-slate-900 rounded-[8px] p-2.5 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar initials={c.avatar} size={28} tone="auto" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-medium text-slate-900 dark:text-slate-100 truncate">{c.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{c.role}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10.5px] text-slate-500 dark:text-slate-400">{c.location}</span>
                        <span className="text-[10.5px] text-slate-400 dark:text-slate-500">{fmtDate(a.appliedAt)}</span>
                      </div>
                    </div>
                  )
                })}
                {stageApps.length === 0 && (
                  <div className="text-center text-[11.5px] text-slate-400 dark:text-slate-500 py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-[8px]">
                    Arraste candidatos aqui
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const STAGE_ORDER = ['screening', 'interview', 'offer', 'hired']

function CandidateDrawer({ candidate, app, onClose, onMove }) {
  const currentIdx = app ? STAGE_ORDER.indexOf(app.stage) : -1
  const nextStageId = currentIdx >= 0 && currentIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[currentIdx + 1] : null
  const nextStageLabel = nextStageId ? STAGES.find((s) => s.id === nextStageId)?.label : null

  const handleAdvance = () => {
    if (app && nextStageId) {
      onMove(app.id, nextStageId)
      onClose()
    }
  }

  return (
    <Drawer
      open={!!candidate}
      onClose={onClose}
      title="Currículo do candidato"
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button variant="secondary" icon={Download} onClick={() => candidate && printResume(candidate)}>Baixar PDF</Button>
          <Button variant="primary" icon={Check} onClick={handleAdvance} disabled={!nextStageId}>
            {nextStageLabel ? `Avançar para ${nextStageLabel}` : 'Última etapa'}
          </Button>
        </>
      }
    >
      {candidate && (
        <div className="p-5">
          <div className="flex items-start gap-3">
            <Avatar initials={candidate.avatar} size={48} tone="auto" />
            <div className="flex-1">
              <div className="text-[16px] font-semibold text-slate-900 dark:text-slate-100">{candidate.name}</div>
              <div className="text-[12.5px] text-slate-500 dark:text-slate-400">{candidate.role}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge size="sm" tone="emerald">{candidate.availability}</Badge>
                <Badge size="sm">{candidate.seniority}</Badge>
                <Badge size="sm" icon={MapPin}>{candidate.location}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
            <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Mail size={12} className="text-slate-400 dark:text-slate-500" /> {candidate.email}</div>
            <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Phone size={12} className="text-slate-400 dark:text-slate-500" /> {candidate.phone}</div>
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Resumo</div>
            <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{candidate.summary}</p>
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Competências</div>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((s) => <span key={s} className="text-[11.5px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded">{s}</span>)}
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Experiência ({candidate.yearsExp} anos)</div>
            <div className="space-y-3">
              {candidate.experiences.map((e, i) => (
                <div key={i} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                  <span className="absolute -left-[5px] top-1 w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" />
                  <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100">{e.role}</div>
                  <div className="text-[11.5px] text-slate-500 dark:text-slate-400">{e.company} · {e.period}</div>
                  {e.summary && <div className="text-[12px] text-slate-600 dark:text-slate-400 mt-1">{e.summary}</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Formação</div>
            <div className="space-y-2">
              {candidate.education.map((e, i) => (
                <div key={i}>
                  <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100">{e.degree}</div>
                  <div className="text-[11.5px] text-slate-500 dark:text-slate-400">{e.school} · {e.year}</div>
                </div>
              ))}
            </div>
          </div>
          {candidate.socials && Object.values(candidate.socials).some(Boolean) && (
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Links</div>
              <div className="flex flex-col gap-1">
                {candidate.socials.linkedin && <a href={`https://${candidate.socials.linkedin}`} target="_blank" rel="noreferrer" className="text-[12px] text-blue-600 dark:text-blue-400 hover:underline">{candidate.socials.linkedin}</a>}
                {candidate.socials.github && <a href={`https://${candidate.socials.github}`} target="_blank" rel="noreferrer" className="text-[12px] text-slate-600 dark:text-slate-400 hover:underline">{candidate.socials.github}</a>}
                {candidate.socials.portfolio && <a href={`https://${candidate.socials.portfolio}`} target="_blank" rel="noreferrer" className="text-[12px] text-slate-600 dark:text-slate-400 hover:underline">{candidate.socials.portfolio}</a>}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}

function NewJobModal({ open, onClose, onCreate, sectors, initialJob, editMode }) {
  const blank = {
    title: '', sector: 'tech', location: 'Curitiba, PR', modality: 'Híbrido',
    seniority: 'Pleno', contract: 'CLT', salaryMin: 5000, salaryMax: 8000,
    department: '', description: '', skills: [],
  }
  const [form, setForm] = useState(blank)
  const [skill, setSkill] = useState('')

  // Sync form when initialJob changes (edit mode)
  const prevOpen = useRef(false)
  if (open !== prevOpen.current) {
    prevOpen.current = open
    if (open) {
      setForm(initialJob ? {
        title: initialJob.title || '',
        sector: initialJob.sector || 'tech',
        location: initialJob.location || 'Curitiba, PR',
        modality: initialJob.modality || 'Híbrido',
        seniority: initialJob.seniority || 'Pleno',
        contract: initialJob.contract || 'CLT',
        salaryMin: initialJob.salaryMin ?? 5000,
        salaryMax: initialJob.salaryMax ?? 8000,
        department: initialJob.department || '',
        description: initialJob.description || '',
        skills: initialJob.skills || [],
      } : blank)
      setSkill('')
    }
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = () => {
    onCreate({ ...form, requirements: initialJob?.requirements || [], niceToHave: initialJob?.niceToHave || [], benefits: initialJob?.benefits || [] })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editMode ? 'Editar vaga' : 'Publicar nova vaga'} size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" icon={editMode ? Check : Send} onClick={submit}>{editMode ? 'Salvar alterações' : 'Publicar vaga'}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldC label="Título da vaga"><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex: Engenheiro de Software Pleno" /></FieldC>
        </div>
        <FieldC label="Setor / Área">
          <Select value={form.sector} onChange={(e) => set('sector', e.target.value)} placeholder="" className="w-full"
            options={(sectors || []).map((s) => ({ value: s.id, label: s.label }))} />
        </FieldC>
        <FieldC label="Departamento"><Input value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="Ex: Plataforma" /></FieldC>
        <FieldC label="Localização"><Input value={form.location} onChange={(e) => set('location', e.target.value)} icon={MapPin} /></FieldC>
        <FieldC label="Modalidade">
          <Select value={form.modality} onChange={(e) => set('modality', e.target.value)} placeholder="" className="w-full"
            options={['Remoto', 'Híbrido', 'Presencial'].map((v) => ({ value: v, label: v }))} />
        </FieldC>
        <FieldC label="Senioridade">
          <Select value={form.seniority} onChange={(e) => set('seniority', e.target.value)} placeholder="" className="w-full"
            options={['Júnior', 'Pleno', 'Sênior'].map((v) => ({ value: v, label: v }))} />
        </FieldC>
        <FieldC label="Tipo de contrato">
          <Select value={form.contract} onChange={(e) => set('contract', e.target.value)} placeholder="" className="w-full"
            options={['CLT', 'PJ', 'Estágio'].map((v) => ({ value: v, label: v }))} />
        </FieldC>
        <FieldC label="Salário mínimo (R$)"><Input value={form.salaryMin} onChange={(e) => set('salaryMin', parseInt(e.target.value || '0'))} type="number" /></FieldC>
        <FieldC label="Salário máximo (R$)"><Input value={form.salaryMax} onChange={(e) => set('salaryMax', parseInt(e.target.value || '0'))} type="number" /></FieldC>
        <div className="col-span-2">
          <FieldC label="Descrição da vaga"><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Conte sobre a oportunidade, time, responsabilidades..." /></FieldC>
        </div>
        <div className="col-span-2">
          <FieldC label="Tecnologias / habilidades (Enter para adicionar)">
            <div className="flex gap-2 mb-2">
              <Input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Ex: Node.js"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skill.trim()) { set('skills', [...new Set([...form.skills, skill.trim()])]); setSkill('') } } }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 text-[12px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                  {s}
                  <button onClick={() => set('skills', form.skills.filter((x) => x !== s))} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"><X size={10} /></button>
                </span>
              ))}
            </div>
          </FieldC>
        </div>
      </div>
    </Modal>
  )
}

function FieldC({ label, children }) {
  return <div><div className="text-[11.5px] font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</div>{children}</div>
}

function AnalyticsView({ jobs, apps, sectors }) {
  const bySector = (sectors || []).map((s) => ({
    label: s.label,
    value: jobs.filter((j) => j.sector === s.id).reduce((acc, j) => acc + apps.filter((a) => a.jobId === j.id).length, 0),
  })).filter((x) => x.value > 0)
  const max = Math.max(...bySector.map((x) => x.value), 1)

  const funnel = STAGES.slice(0, 4).map((s) => ({
    ...s,
    count: apps.filter((a) => a.stage === s.id).length,
  }))
  const top = funnel[0].count || 1

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={14} className="text-slate-500 dark:text-slate-400" />
          <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Candidaturas por setor</h3>
        </div>
        <div className="space-y-2.5">
          {bySector.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-slate-700 dark:text-slate-300">{b.label}</span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums">{b.value}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 dark:bg-slate-400" style={{ width: `${(b.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-slate-500 dark:text-slate-400" />
          <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Funil de contratação</h3>
        </div>
        <div className="space-y-2">
          {funnel.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <div className="w-24 text-[12px] text-slate-700 dark:text-slate-300">{f.label}</div>
              <div className="flex-1 h-7 bg-slate-50 dark:bg-slate-800 rounded relative overflow-hidden">
                <div className={`h-full rounded bg-${f.tone}-500 flex items-center justify-end pr-2`} style={{ width: `${(f.count / top) * 100}%`, opacity: 0.8 }}>
                  <span className="text-[11px] font-medium text-white tabular-nums">{f.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
