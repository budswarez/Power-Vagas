import { useState, useMemo } from 'react'
import {
  Search, ArrowRight, SlidersHorizontal, Check, SearchX,
  Globe, Building2, MapPin, Briefcase, Wallet, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Badge, Button, Card, Empty, Input, Select, JobCardSkeleton } from '../components/ui.jsx'
import {
  SECTOR_LABEL, fmtBRL, fmtRange, daysSince,
} from '../data/mock.js'

import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'

const PAGE_SIZE = 8

export default function HomePage({ session, onOpenAuth }) {
  const navigate = useNavigate()
  const jobs = useStore(state => state.jobs)
  const sectors = useStore(state => state.sectors)
  const isLoading = useStore(state => state.isLoading)
  const [q, setQ] = useState('')
  const [sector, setSector] = useState([])
  const [modality, setModality] = useState([])
  const [seniority, setSeniority] = useState([])
  const [contract, setContract] = useState([])
  const [salaryMin, setSalaryMin] = useState(0)
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)

  const toggle = (setter, list, v) => {
    setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
    setPage(1)
  }

  const filteredJobs = useMemo(() => {
    let out = jobs.filter((j) => j.status === 'active')
    if (q.trim()) {
      const t = q.toLowerCase()
      out = out.filter(
        (j) =>
          j.title.toLowerCase().includes(t) ||
          j.skills.some((s) => s.toLowerCase().includes(t)) ||
          j.department.toLowerCase().includes(t),
      )
    }
    if (sector.length) out = out.filter((j) => sector.includes(j.sector))
    if (modality.length) out = out.filter((j) => modality.includes(j.modality))
    if (seniority.length) out = out.filter((j) => seniority.includes(j.seniority))
    if (contract.length) out = out.filter((j) => contract.includes(j.contract))
    if (salaryMin > 0) out = out.filter((j) => j.salaryMax >= salaryMin)
    if (sort === 'recent') out = [...out].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    if (sort === 'salary') out = [...out].sort((a, b) => b.salaryMax - a.salaryMax)
    if (sort === 'applicants') out = [...out].sort((a, b) => b.applicants - a.applicants)
    return out
  }, [jobs, q, sector, modality, seniority, contract, salaryMin, sort])

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE))
  const pagedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clearAll = () => {
    setQ(''); setSector([]); setModality([]); setSeniority([]); setContract([]); setSalaryMin(0); setPage(1)
  }
  const activeFilterCount = sector.length + modality.length + seniority.length + contract.length + (salaryMin > 0 ? 1 : 0)
  const activeJobs = jobs.filter((j) => j.status === 'active').length

  const handleSearch = (e) => { e.preventDefault(); setPage(1) }

  return (
    <div>
      {/* Hero */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 dark:from-slate-900 to-white dark:to-slate-900">
        <div className="max-w-[1280px] mx-auto px-6 py-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-3 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {activeJobs} vagas abertas agora
            </div>
            <h1 className="text-[40px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-[1.1]">
              Construa o futuro do varejo de tecnologia<br />
              <span className="text-slate-500 dark:text-slate-400">com a gente.</span>
            </h1>
            <p className="mt-4 text-[15px] text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Aqui você encontra todas as oportunidades abertas na Sua Empresa — de Tecnologia a Operações.
            </p>
            <form onSubmit={handleSearch} className="mt-6 flex items-center gap-2 max-w-xl">
              <Input
                icon={Search}
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1) }}
                placeholder="Buscar por cargo, área, tecnologia..."
                className="flex-1"
              />
              <Button type="submit" variant="primary" icon={ArrowRight}>Buscar</Button>
            </form>
          </div>
        </div>
      </div>

      {/* Listing */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-8">
        {/* Sidebar */}
        <aside className="space-y-5 md:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-slate-500 dark:text-slate-400" />
              <span className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Filtros</span>
              {activeFilterCount > 0 && <Badge size="sm" tone="dark">{activeFilterCount}</Badge>}
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Limpar</button>
            )}
          </div>

          <FilterGroup label="Setor / Área">
            {sectors.map((s) => (
              <FilterCheck
                key={s.id}
                checked={sector.includes(s.id)}
                onChange={() => toggle(setSector, sector, s.id)}
                label={s.label}
                count={jobs.filter((j) => j.sector === s.id && j.status === 'active').length}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="Modalidade">
            {['Remoto', 'Híbrido', 'Presencial'].map((m) => (
              <FilterCheck key={m} checked={modality.includes(m)} onChange={() => toggle(setModality, modality, m)} label={m} />
            ))}
          </FilterGroup>

          <FilterGroup label="Senioridade">
            {['Júnior', 'Pleno', 'Sênior'].map((s) => (
              <FilterCheck key={s} checked={seniority.includes(s)} onChange={() => toggle(setSeniority, seniority, s)} label={s} />
            ))}
          </FilterGroup>

          <FilterGroup label="Contrato">
            {['CLT', 'PJ', 'Estágio'].map((c) => (
              <FilterCheck key={c} checked={contract.includes(c)} onChange={() => toggle(setContract, contract, c)} label={c} />
            ))}
          </FilterGroup>

          <FilterGroup label="Salário mínimo">
            <div>
              <input
                type="range"
                min={0}
                max={20000}
                step={500}
                value={salaryMin}
                onChange={(e) => { setSalaryMin(parseInt(e.target.value)); setPage(1) }}
                className="w-full accent-slate-900 dark:accent-slate-300"
              />
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                <span>R$ 0</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium tabular-nums">{fmtBRL(salaryMin)}+</span>
                <span>R$ 20k</span>
              </div>
            </div>
          </FilterGroup>
        </aside>

        {/* Results */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[20px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">{filteredJobs.length}</span>
              <span className="text-[14px] text-slate-500 dark:text-slate-400 ml-1.5">{filteredJobs.length === 1 ? 'vaga' : 'vagas'}</span>
              {activeFilterCount > 0 && (
                <span className="text-[13px] text-slate-400 dark:text-slate-500 ml-1">encontradas</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-500 dark:text-slate-400">Ordenar:</span>
              <Select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1) }}
                placeholder=""
                options={[
                  { value: 'recent', label: 'Mais recentes' },
                  { value: 'salary', label: 'Maior salário' },
                  { value: 'applicants', label: 'Mais candidaturas' },
                ]}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <Empty
                icon={SearchX}
                title="Nenhuma vaga corresponde aos seus filtros"
                hint="Tente remover algumas restrições ou limpar todos os filtros."
                action={<Button variant="secondary" size="sm" onClick={clearAll}>Limpar filtros</Button>}
              />
            </Card>
          ) : (
            <>
              <div className="space-y-2.5">
                {pagedJobs.map((j) => <JobCard key={j.id} job={j} onOpen={() => navigate(`/job/${j.id}`)} />)}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[12px] text-slate-500 dark:text-slate-400">
                    Página {page} de {totalPages} · {filteredJobs.length} vagas
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-[6px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, []).map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="h-8 w-8 inline-flex items-center justify-center text-[12px] text-slate-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`h-8 w-8 inline-flex items-center justify-center rounded-[6px] text-[12.5px] font-medium transition ${p === page ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-[6px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function FilterGroup({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{label}</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function FilterCheck({ checked, onChange, label, count }) {
  return (
    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group">
      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${checked ? 'bg-slate-900 dark:bg-slate-300 border-slate-900 dark:border-slate-300' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500'}`}>
        {checked && <Check size={10} strokeWidth={3} className="text-white dark:text-slate-900" />}
      </span>
      <span className="text-[12.5px] text-slate-700 dark:text-slate-300 flex-1">{label}</span>
      {typeof count === 'number' && <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">{count}</span>}
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  )
}

function JobCard({ job, onOpen }) {
  const sectorLabel = SECTOR_LABEL(job.sector)
  const ModalityIcon = job.modality === 'Remoto' ? Globe : job.modality === 'Híbrido' ? Building2 : MapPin
  return (
    <button onClick={onOpen} className="w-full text-left">
      <Card interactive className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge size="sm">{sectorLabel}</Badge>
              <Badge size="sm" tone="slate">{job.department}</Badge>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">·</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">há {daysSince(job.publishedAt)}d</span>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{job.title}</h3>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{job.description}</p>
            <div className="flex items-center gap-4 mt-3 text-[12px] text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <ModalityIcon size={12} className="text-slate-400 dark:text-slate-500" />
                {job.modality} · {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={12} className="text-slate-400 dark:text-slate-500" />
                {job.contract} · {job.seniority}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={12} className="text-slate-400 dark:text-slate-500" />
                {fmtRange(job.salaryMin, job.salaryMax)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{job.applicants} candidaturas</span>
            <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
              Ver vaga <ArrowRight size={12} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {job.skills.map((s) => (
            <span key={s} className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">{s}</span>
          ))}
        </div>
      </Card>
    </button>
  )
}
