import { useState, useMemo, useEffect } from 'react'
import {
  Download, SlidersHorizontal, Search, Check, LayoutGrid, List,
  MapPin, Briefcase, Clock, UserSearch, Mail, Phone, Trash2,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

const PAGE_SIZE = 12
import { Avatar, Badge, Button, Card, Drawer, Empty, Input, useToast } from '../components/ui.jsx'
import { printResume } from '../lib/printResume.js'
import { useStore } from '../store/useStore.js'
import { deleteCandidateRemote } from '../services/supabaseCrud.js'

function CandidateDrawer({ candidate, onClose, onRemove }) {
  return (
    <Drawer
      open={!!candidate}
      onClose={onClose}
      title="Currículo do candidato"
      width={520}
      footer={
        <>
          <Button variant="ghost" className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20" icon={Trash2} onClick={() => { if (candidate && confirm(`Remover ${candidate.name} do banco de talentos?`)) onRemove(candidate.id) }}>Remover</Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button variant="primary" icon={Download} onClick={() => candidate && printResume(candidate)}>Baixar PDF</Button>
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-400"><Mail size={12} className="text-slate-400 dark:text-slate-500" /> {candidate.email}</div>
            <div className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-400"><Phone size={12} className="text-slate-400 dark:text-slate-500" /> {candidate.phone}</div>
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
            {candidate.education.map((e, i) => (
              <div key={i}>
                <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100">{e.degree}</div>
                <div className="text-[11.5px] text-slate-500 dark:text-slate-400">{e.school} · {e.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  )
}

export default function TalentsPage({ session }) {
  const storeCandidates = useStore(state => state.candidates)
  const setCandidates = useStore(state => state.setCandidates)
  const toast = useToast()
  const [q, setQ] = useState('')
  const [seniority, setSeniority] = useState([])
  const [availability, setAvailability] = useState([])
  const [locations, setLocations] = useState([])
  const [skills, setSkills] = useState([])
  const [yearsRange, setYearsRange] = useState([0, 12])
  const [drawerCandidate, setDrawerCandidate] = useState(null)
  const [view, setView] = useState('grid')
  const [page, setPage] = useState(1)

  const allSkills = [...new Set(storeCandidates.flatMap((c) => c.skills))].sort()
  const allLocations = [...new Set(storeCandidates.map((c) => c.location))]
  const toggle = (setter, list, v) => setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const candidates = useMemo(() => {
    return storeCandidates.filter((c) => {
      if (q.trim()) {
        const t = q.toLowerCase()
        if (!c.name.toLowerCase().includes(t) && !c.role.toLowerCase().includes(t) && !c.skills.some((s) => s.toLowerCase().includes(t))) return false
      }
      if (seniority.length && !seniority.includes(c.seniority)) return false
      if (availability.length && !availability.includes(c.availability)) return false
      if (locations.length && !locations.includes(c.location)) return false
      if (skills.length && !skills.every((s) => c.skills.includes(s))) return false
      if (c.yearsExp < yearsRange[0] || c.yearsExp > yearsRange[1]) return false
      return true
    })
  }, [storeCandidates, q, seniority, availability, locations, skills, yearsRange])

  const clearAll = () => { setQ(''); setSeniority([]); setAvailability([]); setLocations([]); setSkills([]); setYearsRange([0, 12]) }
  const activeCount = seniority.length + availability.length + locations.length + skills.length + (q ? 1 : 0) + ((yearsRange[0] !== 0 || yearsRange[1] !== 12) ? 1 : 0)

  // Reset page when filters or view changes
  useEffect(() => { setPage(1) }, [q, seniority, availability, locations, skills, yearsRange, view])

  const totalPages = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE))
  const pagedCandidates = candidates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleExportCSV = () => {
    const headers = ['Nome', 'Cargo', 'Senioridade', 'Local', 'Disponibilidade', 'Anos Exp.', 'E-mail', 'Telefone', 'Skills']
    const rows = candidates.map((c) => [
      c.name, c.role, c.seniority, c.location, c.availability,
      c.yearsExp, c.email, c.phone, c.skills.join('; '),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `talentos-suaempresa-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wide mb-1">Banco de talentos</div>
          <h1 className="text-[24px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Busca global de talentos</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">{storeCandidates.length} candidatos cadastrados na base Sua Empresa.</p>
        </div>
        <Button variant="secondary" icon={Download} onClick={handleExportCSV}>Exportar CSV</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-slate-500 dark:text-slate-400" />
              <span className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Filtros</span>
              {activeCount > 0 && <Badge size="sm" tone="dark">{activeCount}</Badge>}
            </div>
            {activeCount > 0 && <button onClick={clearAll} className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Limpar</button>}
          </div>

          <FilterGroupT label="Buscar">
            <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, cargo, skill..." />
          </FilterGroupT>

          <FilterGroupT label="Senioridade">
            {['Júnior', 'Pleno', 'Sênior'].map((s) => (
              <FilterCheckT key={s} checked={seniority.includes(s)} onChange={() => toggle(setSeniority, seniority, s)} label={s} count={storeCandidates.filter((c) => c.seniority === s).length} />
            ))}
          </FilterGroupT>

          <FilterGroupT label="Disponibilidade">
            {['Imediata', '30 dias', '60 dias'].map((s) => (
              <FilterCheckT key={s} checked={availability.includes(s)} onChange={() => toggle(setAvailability, availability, s)} label={s} />
            ))}
          </FilterGroupT>

          <FilterGroupT label="Anos de experiência">
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={20} value={yearsRange[0]}
                onChange={(e) => setYearsRange([parseInt(e.target.value || '0'), yearsRange[1]])}
                className="w-16 h-8 px-2 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12.5px] text-slate-900 dark:text-slate-100 text-center tabular-nums focus:outline-none focus:border-slate-400 dark:focus:border-slate-500" />
              <span className="text-[11px] text-slate-400 dark:text-slate-500">até</span>
              <input type="number" min={0} max={30} value={yearsRange[1]}
                onChange={(e) => setYearsRange([yearsRange[0], parseInt(e.target.value || '0')])}
                className="w-16 h-8 px-2 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12.5px] text-slate-900 dark:text-slate-100 text-center tabular-nums focus:outline-none focus:border-slate-400 dark:focus:border-slate-500" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">anos</span>
            </div>
          </FilterGroupT>

          <FilterGroupT label="Localização">
            {allLocations.map((l) => (
              <FilterCheckT key={l} checked={locations.includes(l)} onChange={() => toggle(setLocations, locations, l)} label={l} />
            ))}
          </FilterGroupT>

          <FilterGroupT label="Competências">
            <div className="flex flex-wrap gap-1">
              {allSkills.map((s) => {
                const active = skills.includes(s)
                return (
                  <button key={s} onClick={() => toggle(setSkills, skills, s)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition ${active ? 'bg-slate-900 dark:bg-slate-200 border-slate-900 dark:border-slate-200 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                    {s}
                  </button>
                )
              })}
            </div>
          </FilterGroupT>
        </aside>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[20px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">{candidates.length}</span>
              <span className="text-[14px] text-slate-500 dark:text-slate-400 ml-1.5">{candidates.length === 1 ? 'candidato' : 'candidatos'}</span>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-[7px]">
              <button onClick={() => setView('grid')} className={`h-7 px-2.5 rounded-[5px] text-[12px] font-medium inline-flex items-center gap-1 transition ${view === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                <LayoutGrid size={13} /> Grid
              </button>
              <button onClick={() => setView('list')} className={`h-7 px-2.5 rounded-[5px] text-[12px] font-medium inline-flex items-center gap-1 transition ${view === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                <List size={13} /> Lista
              </button>
            </div>
          </div>

          {candidates.length === 0 ? (
            <Card><Empty icon={UserSearch} title="Nenhum candidato encontrado" hint="Ajuste os filtros ou tente uma busca diferente." /></Card>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pagedCandidates.map((c) => <TalentCard key={c.id} candidate={c} onOpen={() => setDrawerCandidate(c)} />)}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-[12.5px]">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  <tr className="text-left text-[11px] uppercase font-medium text-slate-500 dark:text-slate-400 tracking-wide">
                    <Th>Candidato</Th><Th>Cargo</Th><Th>Senioridade</Th><Th>Local</Th>
                    <Th align="right">Exp.</Th><Th>Disponibilidade</Th><Th>Top skills</Th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCandidates.map((c) => (
                    <tr key={c.id} onClick={() => setDrawerCandidate(c)} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                      <Td>
                        <div className="flex items-center gap-2">
                          <Avatar initials={c.avatar} size={28} tone="auto" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                        </div>
                      </Td>
                      <Td className="text-slate-700 dark:text-slate-300">{c.role}</Td>
                      <Td><Badge size="sm">{c.seniority}</Badge></Td>
                      <Td className="text-slate-600 dark:text-slate-400">{c.location}</Td>
                      <Td align="right" className="tabular-nums text-slate-700 dark:text-slate-300">{c.yearsExp}a</Td>
                      <Td><Badge size="sm" tone="emerald">{c.availability}</Badge></Td>
                      <Td>
                        <div className="flex gap-1">
                          {c.skills.slice(0, 3).map((s) => <span key={s} className="text-[10.5px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">{s}</span>)}
                          {c.skills.length > 3 && <span className="text-[10.5px] text-slate-400 dark:text-slate-500">+{c.skills.length - 3}</span>}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <span className="text-[12px] text-slate-500 dark:text-slate-400">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, candidates.length)} de {candidates.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-[6px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`h-8 w-8 inline-flex items-center justify-center rounded-[6px] text-[12.5px] font-medium transition
                      ${p === page ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-[6px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <CandidateDrawer
        candidate={drawerCandidate}
        onClose={() => setDrawerCandidate(null)}
        onRemove={async (id) => {
          setCandidates(storeCandidates.filter(c => c.id !== id))
          setDrawerCandidate(null)
          toast.push('Candidato removido do banco de talentos')
          try { await deleteCandidateRemote(id) } catch (e) { console.error('deleteCandidateRemote error:', e) }
        }}
      />
      {toast.node}
    </div>
  )
}

function FilterGroupT({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{label}</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function FilterCheckT({ checked, onChange, label, count }) {
  return (
    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group">
      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${checked ? 'bg-slate-900 dark:bg-slate-300 border-slate-900 dark:border-slate-300' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
        {checked && <Check size={10} strokeWidth={3} className="text-white dark:text-slate-900" />}
      </span>
      <span className="text-[12.5px] text-slate-700 dark:text-slate-300 flex-1">{label}</span>
      {typeof count === 'number' && <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">{count}</span>}
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  )
}

function TalentCard({ candidate, onOpen }) {
  return (
    <button onClick={onOpen} className="text-left">
      <Card interactive className="p-4 h-full">
        <div className="flex items-start gap-3">
          <Avatar initials={candidate.avatar} size={42} tone="auto" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{candidate.name}</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">{candidate.role}</div>
              </div>
              <Badge size="sm" tone="emerald">{candidate.availability}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11.5px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><MapPin size={11} /> {candidate.location}</span>
              <span className="inline-flex items-center gap-1"><Briefcase size={11} /> {candidate.seniority}</span>
              <span className="inline-flex items-center gap-1"><Clock size={11} /> {candidate.yearsExp}a</span>
            </div>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{candidate.summary}</p>
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {candidate.skills.slice(0, 5).map((s) => (
                <span key={s} className="text-[11px] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">{s}</span>
              ))}
              {candidate.skills.length > 5 && <span className="text-[11px] text-slate-400 dark:text-slate-500 self-center">+{candidate.skills.length - 5}</span>}
            </div>
          </div>
        </div>
      </Card>
    </button>
  )
}

function Th({ children, align }) {
  return <th className={`px-4 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'} font-medium`}>{children}</th>
}
function Td({ children, align, className = '' }) {
  return <td className={`px-4 py-2.5 ${align === 'right' ? 'text-right' : ''} ${className}`}>{children}</td>
}
