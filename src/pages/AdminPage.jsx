import { useState, useEffect } from 'react'
import {
  ShieldCheck, Users, Layers, TrendingUp, FileText, History,
  UserPlus, Pencil, UserX, UserCheck, Trash2, GripVertical,
  Check, X, Plus, Mail, Phone, Save, Briefcase, Database, DatabaseBackup,
  Lock, Eye, EyeOff
} from 'lucide-react'
import {
  Avatar, Badge, Button, Card, Input, Modal, Select, Tabs, useToast,
} from '../components/ui.jsx'
import { useStore } from '../store/useStore.js'
import {
  addTaxonomyRemote, updateTaxonomyRemote, deleteTaxonomyRemote,
  createRecruiterRemote, updateRecruiterRemote, toggleRecruiterRemote, deleteRecruiterRemote
} from '../services/supabaseCrud.js'
import { syncData } from '../services/dataSync.js'
import { supabase } from '../lib/supabase.js'

export default function AdminPage({ session }) {
  const [tab, setTab] = useState('recruiters')
  
  const { isDemoMode, setIsDemoMode, sectors, setSectors, seniorities, setSeniorities, contracts, setContracts, recruiters, setRecruiters } = useStore()
  const toast = useToast()

  const handleToggleDemoMode = async () => {
    const goingReal = isDemoMode
    setIsDemoMode(!isDemoMode)
    toast.push(goingReal ? 'Modo Real ativado (Supabase)' : 'Modo Demonstrativo ativado (Mock)', goingReal ? 'emerald' : 'blue')
    // Force immediate data reload after store update
    await new Promise(r => setTimeout(r, 0))
    await syncData()
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wide">Painel administrativo</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <Badge size="sm" tone="violet" icon={ShieldCheck}>Admin</Badge>
          </div>
          <h1 className="text-[24px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Configurações da plataforma</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Gerencie recrutadores e taxonomias do sistema de vagas.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${isDemoMode ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Fonte de Dados</span>
              <div className="flex items-center gap-1.5">
                {isDemoMode ? <DatabaseBackup size={14} className="text-blue-600 dark:text-blue-400" /> : <Database size={14} className="text-emerald-600 dark:text-emerald-400" />}
                <span className={`text-[13px] font-semibold ${isDemoMode ? 'text-blue-700 dark:text-blue-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                  {isDemoMode ? 'Modo Demonstrativo' : 'Banco de Dados Real'}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleDemoMode}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${isDemoMode ? 'bg-slate-300 dark:bg-slate-600' : 'bg-emerald-500'}`}
              role="switch"
              aria-checked={!isDemoMode}
            >
              <span className="sr-only">Alternar modo de dados</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDemoMode ? 'translate-x-0' : 'translate-x-4'}`}
              />
            </button>
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'recruiters', label: 'Recrutadores', icon: Users },
          { value: 'sectors', label: 'Setores / Áreas', icon: Layers },
          { value: 'seniorities', label: 'Senioridade', icon: TrendingUp },
          { value: 'contracts', label: 'Tipos de contrato', icon: FileText },
          { value: 'audit', label: 'Auditoria', icon: History },
        ]}
      />

      <div className="mt-6">
        {tab === 'recruiters' && <RecruitersAdmin sectors={sectors} list={recruiters} setList={setRecruiters} />}
        {tab === 'sectors' && <SectorsAdmin sectors={sectors} setSectors={setSectors} />}
        {tab === 'seniorities' && <SenioritiesAdmin list={seniorities} setList={setSeniorities} />}
        {tab === 'contracts' && <ContractsAdmin list={contracts} setList={setContracts} />}
        {tab === 'audit' && <AuditView />}
      </div>
    </div>
  )
}

function RecruitersAdmin({ sectors, list, setList }) {
  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const toast = useToast()

  const save = async (rec) => {
    if (editing) {
      setList(list.map((r) => (r.id === editing.id ? { ...editing, ...rec } : r)))
      toast.push('Recrutador atualizado', 'emerald')
      try { await updateRecruiterRemote(editing.id, rec) } catch (e) { console.error('updateRecruiter remote error:', e) }
    } else {
      const newRec = {
        id: 'u-r-' + Math.random().toString(36).slice(2, 5),
        avatar: rec.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
        active: true,
        createdAt: new Date().toISOString().slice(0, 10),
        ...rec,
      }
      setList([newRec, ...list])
      toast.push('Recrutador cadastrado', 'emerald')
      try { await createRecruiterRemote(rec) } catch (e) { console.error('createRecruiter remote error:', e) }
    }
    setOpenModal(false)
    setEditing(null)
  }

  const toggle = async (id) => {
    const rec = list.find((r) => r.id === id)
    setList(list.map((r) => (r.id === id ? { ...r, active: !r.active } : r)))
    try { await toggleRecruiterRemote(id, !rec.active) } catch (e) { console.error('toggleRecruiter remote error:', e) }
  }
  const remove = async (id) => {
    setList(list.filter((r) => r.id !== id))
    toast.push('Recrutador removido')
    try { await deleteRecruiterRemote(id) } catch (e) { console.error('deleteRecruiter remote error:', e) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-slate-600 dark:text-slate-400">{list.length} recrutadores cadastrados. Apenas administradores podem criar novos acessos.</p>
        <Button variant="primary" icon={UserPlus} onClick={() => { setEditing(null); setOpenModal(true) }}>Cadastrar recrutador</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
            <tr className="text-left text-[11px] uppercase font-medium text-slate-500 dark:text-slate-400 tracking-wide">
              <ThA>Nome</ThA><ThA>Cargo</ThA><ThA>E-mail</ThA><ThA>Departamento</ThA><ThA>Cadastrado em</ThA><ThA>Status</ThA><ThA />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <TdA>
                  <div className="flex items-center gap-2">
                    <Avatar initials={r.avatar} size={26} tone="blue" />
                    <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>
                  </div>
                </TdA>
                <TdA className="text-slate-700 dark:text-slate-300">{r.role}</TdA>
                <TdA className="text-slate-600 dark:text-slate-400 font-mono text-[11.5px]">{r.email}</TdA>
                <TdA><Badge size="sm">{r.department}</Badge></TdA>
                <TdA className="text-slate-500 dark:text-slate-400 tabular-nums">{r.createdAt}</TdA>
                <TdA>
                  {r.active ? <Badge tone="emerald" size="sm">Ativo</Badge> : <Badge tone="slate" size="sm">Inativo</Badge>}
                </TdA>
                <TdA>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(r); setOpenModal(true) }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" title="Editar"><Pencil size={13} /></button>
                    <button onClick={() => toggle(r.id)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" title={r.active ? 'Desativar' : 'Reativar'}>
                      {r.active ? <UserX size={13} /> : <UserCheck size={13} />}
                    </button>
                    <button onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 dark:text-rose-400" title="Remover"><Trash2 size={13} /></button>
                  </div>
                </TdA>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <RecruiterFormModal open={openModal} onClose={() => { setOpenModal(false); setEditing(null) }} onSave={save} initial={editing} sectors={sectors} />
      {toast.node}
    </div>
  )
}

function RecruiterFormModal({ open, onClose, onSave, initial, sectors }) {
  const defaultDept = sectors?.[0]?.label ?? ''
  const [form, setForm] = useState({ name: '', email: '', role: 'Recruiter', department: defaultDept, phone: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(initial
      ? { name: initial.name, email: initial.email, role: initial.role, department: initial.department, phone: initial.phone || '', password: '' }
      : { name: '', email: '', role: 'Recruiter', department: defaultDept, phone: '', password: '' })
    setShowPw(false)
  }, [open, initial, defaultDept])

  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm((prev) => ({ ...prev, [k]: v })); setErrors((prev) => ({ ...prev, [k]: undefined })) }

  const handleSave = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nome é obrigatório'
    if (!form.email.trim()) errs.email = 'E-mail é obrigatório'
    if (!initial && !form.password.trim()) errs.password = 'Senha é obrigatória'
    if (form.password && form.password.length < 8) errs.password = 'Mínimo 8 caracteres'
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar recrutador' : 'Cadastrar novo recrutador'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon={Save} onClick={handleSave}>{initial ? 'Salvar' : 'Cadastrar'}</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldA label="Nome completo" error={errors.name}><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: João da Silva" /></FieldA>
        </div>
        <FieldA label="E-mail corporativo" error={errors.email}><Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="nome@suaempresa.com.br" icon={Mail} /></FieldA>
        <FieldA label="Telefone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(41) 9..." icon={Phone} /></FieldA>
        <FieldA label="Cargo / Função"><Input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="Ex: Tech Recruiter" /></FieldA>
        <FieldA label="Departamento">
          <Select value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="" className="w-full"
            options={(sectors ?? []).map((s) => ({ value: s.label, label: s.label }))} />
        </FieldA>
        <div className="col-span-2">
          <FieldA label={initial ? 'Nova senha (opcional)' : 'Senha de acesso *'} error={errors.password}>
            <div className="relative">
              <Input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder={initial ? 'Deixe vazio para manter a atual' : 'Mínimo 8 caracteres'}
                icon={Lock}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FieldA>
        </div>
      </div>
    </Modal>
  )
}

function SectorsAdmin({ sectors, setSectors }) {
  return (
    <CrudList
      title="Setores / Áreas"
      hint="Categorias usadas na publicação, nos filtros de vagas e no departamento dos recrutadores."
      items={sectors}
      onAdd={async (label) => {
        const id = label.toLowerCase().replace(/\s+/g, '-')
        setSectors([...sectors, { id, label }])
        try { await addTaxonomyRemote('sectors', { id, label }) } catch (e) { console.error(e) }
      }}
      onUpdate={async (id, label) => {
        setSectors(sectors.map((x) => (x.id === id ? { ...x, label } : x)))
        try { await updateTaxonomyRemote('sectors', id, label) } catch (e) { console.error(e) }
      }}
      onRemove={async (id) => {
        setSectors(sectors.filter((x) => x.id !== id))
        try { await deleteTaxonomyRemote('sectors', id) } catch (e) { console.error(e) }
      }}
      placeholder="Ex: Inteligência Artificial"
      icon={Layers}
    />
  )
}

function SenioritiesAdmin({ list, setList }) {
  return (
    <CrudList
      title="Níveis de senioridade"
      hint="Usado em vagas e filtros de busca de talentos."
      items={list}
      onAdd={async (label) => {
        const item = { id: label.toLowerCase(), label, order: list.length + 1 }
        setList([...list, item])
        try { await addTaxonomyRemote('seniorities', item) } catch (e) { console.error(e) }
      }}
      onUpdate={async (id, label) => {
        setList(list.map((x) => (x.id === id ? { ...x, label } : x)))
        try { await updateTaxonomyRemote('seniorities', id, label) } catch (e) { console.error(e) }
      }}
      onRemove={async (id) => {
        setList(list.filter((x) => x.id !== id))
        try { await deleteTaxonomyRemote('seniorities', id) } catch (e) { console.error(e) }
      }}
      placeholder="Ex: Especialista"
      icon={TrendingUp}
    />
  )
}

function ContractsAdmin({ list, setList }) {
  return (
    <CrudList
      title="Tipos de contrato"
      hint="Vínculos disponíveis ao publicar uma vaga."
      items={list}
      onAdd={async (label) => {
        const item = { id: label.toLowerCase().replace(/\s+/g, '-'), label }
        setList([...list, item])
        try { await addTaxonomyRemote('contracts', item) } catch (e) { console.error(e) }
      }}
      onUpdate={async (id, label) => {
        setList(list.map((x) => (x.id === id ? { ...x, label } : x)))
        try { await updateTaxonomyRemote('contracts', id, label) } catch (e) { console.error(e) }
      }}
      onRemove={async (id) => {
        setList(list.filter((x) => x.id !== id))
        try { await deleteTaxonomyRemote('contracts', id) } catch (e) { console.error(e) }
      }}
      placeholder="Ex: Aprendiz"
      icon={FileText}
    />
  )
}

function CrudList({ title, hint, items, onAdd, onUpdate, onRemove, placeholder, icon: Icon }) {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editVal, setEditVal] = useState('')

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Icon size={14} className="text-slate-500 dark:text-slate-400" />
          <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{title}</span>
          <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">{items.length} cadastrados</span>
        </div>
        <div>
          {items.map((it) => (
            <div key={it.id} className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0 flex items-center gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
              <GripVertical size={13} className="text-slate-300 dark:text-slate-600" />
              {editingId === it.id ? (
                <Input value={editVal} onChange={(e) => setEditVal(e.target.value)} className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { onUpdate(it.id, editVal); setEditingId(null) }
                    if (e.key === 'Escape') setEditingId(null)
                  }} />
              ) : (
                <>
                  <span className="text-[13px] text-slate-900 dark:text-slate-100 flex-1">{it.label}</span>
                  <code className="text-[10.5px] text-slate-400 dark:text-slate-500 font-mono">{it.id}</code>
                </>
              )}
              <div className="flex items-center gap-1">
                {editingId === it.id ? (
                  <>
                    <button onClick={() => { onUpdate(it.id, editVal); setEditingId(null) }} className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"><Check size={13} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><X size={13} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(it.id); setEditVal(it.label) }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><Pencil size={12} /></button>
                    <button onClick={() => onRemove(it.id)} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 dark:text-rose-400"><Trash2 size={12} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <aside>
        <Card className="p-4">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Adicionar novo</div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-3">{hint}</p>
          <div className="space-y-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder}
              onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { onAdd(draft.trim()); setDraft('') } }} />
            <Button variant="primary" full icon={Plus} onClick={() => { if (draft.trim()) { onAdd(draft.trim()); setDraft('') } }}>Adicionar</Button>
          </div>
        </Card>
      </aside>
    </div>
  )
}

function AuditView() {
  const isDemoMode = useStore(state => state.isDemoMode)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  const ICON_MAP = { user_created: UserPlus, job_published: Briefcase, sector_created: Layers, user_reactivated: UserCheck }

  const demoEvents = [
    { icon: UserPlus, text: "Renata Schmidt cadastrou-se como recrutadora", actor: 'admin@suaempresa.com.br', time: 'há 2 dias' },
    { icon: Briefcase, text: "Vaga 'SRE Sênior' publicada por Renata Schmidt", actor: 'renata.s@suaempresa.com.br', time: 'há 14 dias' },
    { icon: Layers, text: "Setor 'Hardware & Engenharia' criado", actor: 'admin@suaempresa.com.br', time: 'há 21 dias' },
    { icon: UserCheck, text: 'Acesso de Marcos Vieira reativado', actor: 'admin@suaempresa.com.br', time: 'há 30 dias' },
  ]

  useEffect(() => {
    if (isDemoMode) { setEvents(demoEvents); return }
    if (!supabase) { setEvents(demoEvents); return }
    setLoading(true)
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setEvents(data.map(e => {
            const ago = Math.floor((Date.now() - new Date(e.created_at).getTime()) / 86400000)
            return {
              icon: ICON_MAP[e.action] || History,
              text: `${e.action}: ${e.entity || ''} ${e.entity_id || ''}`.trim(),
              actor: e.actor_role || '–',
              time: ago === 0 ? 'hoje' : `há ${ago}d`,
            }
          }))
        } else {
          setEvents(demoEvents)
        }
      })
      .catch(() => setEvents(demoEvents))
      .finally(() => setLoading(false))
  }, [isDemoMode])

  return (
    <Card className="p-0">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-[13px] font-semibold text-slate-900 dark:text-slate-100">Atividade recente do sistema</div>
      {loading ? (
        <div className="px-4 py-8 text-center text-[12px] text-slate-500 dark:text-slate-400">Carregando...</div>
      ) : (
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {events.map((e, i) => (
          <div key={i} className="px-4 py-3 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><e.icon size={13} className="text-slate-600 dark:text-slate-400" /></div>
            <div className="flex-1">
              <p className="text-[13px] text-slate-800 dark:text-slate-200">{e.text}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{e.actor} · {e.time}</p>
            </div>
          </div>
        ))}
      </div>
      )}
    </Card>
  )
}

function FieldA({ label, error, children }) {
  return (
    <div>
      <div className="text-[11.5px] font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</div>
      {children}
      {error && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-0.5">{error}</p>}
    </div>
  )
}
function ThA({ children }) { return <th className="px-4 py-2.5 text-left font-medium">{children}</th> }
function TdA({ children, className = '' }) { return <td className={`px-4 py-2.5 ${className}`}>{children}</td> }
