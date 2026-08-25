import { Key, Link2, Database, Layers, FolderTree, ShieldCheck, Zap } from 'lucide-react'
import { Badge, Card } from '../components/ui.jsx'

export default function DiagramPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-2">
          <Database size={12} /> Modelo de dados · uso interno
        </div>
        <h1 className="text-[28px] font-semibold text-slate-900 tracking-tight">Arquitetura do Power Vagas</h1>
        <p className="text-[14px] text-slate-600 mt-2 max-w-2xl">
          Frontend em <strong>React 18 + Vite + Tailwind CSS</strong>, backend e autenticação via <strong>Supabase (PostgreSQL + Auth)</strong>, deploy na <strong>Vercel</strong>. Row Level Security garante isolamento por papel sem lógica de autorização no cliente.
        </p>
      </div>

      {/* ER Diagram */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-900">Diagrama de Entidades — tabelas principais</span>
            <Badge size="sm">5 tabelas</Badge>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1"><Key size={11} className="text-amber-600" /> PK</span>
            <span className="inline-flex items-center gap-1"><Link2 size={11} className="text-blue-600" /> FK</span>
            <span className="inline-flex items-center gap-1"><span className="text-rose-500 font-semibold">*</span> required</span>
          </div>
        </div>

        <div className="relative bg-[radial-gradient(circle,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:18px_18px] bg-slate-50/50" style={{ height: 660 }}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1232 660" preserveAspectRatio="none">
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
              </marker>
            </defs>
            {/* auth.users → profiles */}
            <path d="M 166 50 L 166 90" stroke="#475569" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
            <text x="172" y="76" fontSize="10" fill="#64748b" fontFamily="ui-monospace,monospace">trigger</text>
            {/* profiles → jobs (recruiter_id) */}
            <path d="M 296 210 C 400 210 400 290 490 290" stroke="#475569" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
            <text x="350" y="248" fontSize="10" fill="#64748b" fontFamily="ui-monospace,monospace">publica</text>
            {/* profiles → applications (candidate_id) */}
            <path d="M 296 340 C 360 340 360 480 490 480" stroke="#475569" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
            <text x="316" y="434" fontSize="10" fill="#64748b" fontFamily="ui-monospace,monospace">candidata-se</text>
            {/* jobs → applications (job_id) */}
            <path d="M 760 370 C 760 430 700 480 762 480" stroke="#475569" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
            <text x="716" y="446" fontSize="10" fill="#64748b" fontFamily="ui-monospace,monospace">recebe</text>
            {/* profiles → saved_jobs */}
            <path d="M 296 260 C 1050 260 1050 120 980 120" stroke="#475569" strokeWidth="1.5" fill="none" strokeDasharray="4 3" markerEnd="url(#arr)" />
            <text x="660" y="248" fontSize="10" fill="#64748b" fontFamily="ui-monospace,monospace">salva</text>
          </svg>

          {/* auth.users (Supabase managed) */}
          <div className="absolute" style={{ left: 36, top: 20 }}>
            <div className="w-[260px] bg-slate-900 text-white rounded-[10px] shadow overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                <span className="text-[12.5px] font-semibold font-mono">auth.users</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Supabase Auth</span>
              </div>
              <div className="px-3 py-1.5 text-[11px] text-slate-400 font-mono">id · email · encrypted_password</div>
              <div className="px-3 pb-1.5 text-[11px] text-slate-400 font-mono">raw_user_meta_data (role, name)</div>
            </div>
          </div>

          <Entity name="profiles" sub="perfil do usuário" accent="emerald" style={{ left: 36, top: 120 }}
            fields={[
              { name: 'id', type: 'uuid', pk: true },
              { name: 'role', type: "enum('admin','recruiter','candidate')", required: true },
              { name: 'name', type: 'text', required: true },
              { name: 'email', type: 'text', required: true },
              { name: 'avatar', type: 'text' },
              { name: 'phone', type: 'text' },
              { name: 'department', type: 'text' },
              { name: 'job_title', type: 'text' },
              { name: 'active', type: 'boolean' },
              { name: 'created_at', type: 'timestamptz' },
            ]}
          />

          <Entity name="jobs" sub="vaga" accent="blue" style={{ left: 490, top: 180 }}
            fields={[
              { name: 'id', type: 'text', pk: true },
              { name: 'recruiter_id', type: 'uuid', fk: true, required: true },
              { name: 'title', type: 'text', required: true },
              { name: 'sector_id', type: 'text', fk: true },
              { name: 'modality', type: "enum", required: true },
              { name: 'seniority', type: 'text' },
              { name: 'contract_id', type: 'text', fk: true },
              { name: 'salary_min / salary_max', type: 'int' },
              { name: 'status', type: "enum('active','paused','closed')" },
              { name: 'published_at', type: 'date' },
            ]}
          />

          <Entity name="applications" sub="candidatura" accent="violet" style={{ left: 490, top: 430 }}
            fields={[
              { name: 'id', type: 'text', pk: true },
              { name: 'job_id', type: 'text', fk: true, required: true },
              { name: 'candidate_id', type: 'uuid', fk: true, required: true },
              { name: 'stage', type: "enum('screening'…'hired')", required: true },
              { name: 'note', type: 'text' },
              { name: 'applied_at', type: 'date' },
              { name: 'updated_at', type: 'timestamptz' },
            ]}
          />

          <Entity name="saved_jobs" sub="vaga salva" accent="amber" style={{ right: 36, top: 60 }}
            fields={[
              { name: 'candidate_id', type: 'uuid', fk: true, required: true },
              { name: 'job_id', type: 'text', fk: true, required: true },
              { name: 'saved_at', type: 'timestamptz' },
            ]}
          />
        </div>
      </Card>

      {/* Lookup tables row */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {[
          { name: 'sectors', fields: ['id (text PK)', 'label'] },
          { name: 'seniorities', fields: ['id (text PK)', 'label', '"order" (int)'] },
          { name: 'contracts', fields: ['id (text PK)', 'label'] },
        ].map(({ name, fields }) => (
          <Card key={name} className="p-4">
            <div className="text-[11.5px] font-semibold font-mono text-slate-900 mb-2">{name}</div>
            <ul className="space-y-0.5">
              {fields.map((f) => (
                <li key={f} className="text-[11.5px] font-mono text-slate-500">{f}</li>
              ))}
            </ul>
            <div className="mt-2 text-[11px] text-slate-400">referenciado por jobs</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Services layer */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-slate-500" />
            <span className="text-[12px] font-semibold text-slate-900 uppercase tracking-wide">Camada de serviços</span>
            <Badge size="sm" tone="slate">src/services/</Badge>
          </div>
          <div className="space-y-2">
            {[
              { file: 'auth.js', fns: ['signIn', 'signUp', 'signOut', 'onAuthChange', 'restoreSession'] },
              { file: 'jobs.js', fns: ['listJobs', 'getJob', 'createJob', 'updateJob', 'deleteJob'] },
              { file: 'applications.js', fns: ['listApplicationsForJob', 'applyToJob', 'updateApplicationStage', 'saveJob'] },
              { file: 'candidates.js', fns: ['getCandidate', 'listCandidates', 'updateCandidateProfile'] },
              { file: 'admin.js', fns: ['listRecruiters', 'createRecruiter', 'listSectors', 'createSector', '…'] },
            ].map(({ file, fns }) => (
              <div key={file} className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-[11.5px] font-mono font-semibold text-slate-900 w-32 shrink-0">{file}</span>
                <span className="text-[11.5px] text-slate-500">{fns.join(', ')}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
            Cada função usa Supabase quando <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> está configurada; cai nos dados mock caso contrário.
          </p>
        </Card>

        {/* Folder structure */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <FolderTree size={14} className="text-slate-500" />
            <span className="text-[12px] font-semibold text-slate-900 uppercase tracking-wide">Estrutura de pastas</span>
          </div>
          <pre className="text-[11.5px] font-mono text-slate-700 leading-[1.65]">{`power-vagas/
├─ src/
│  ├─ lib/
│  │  └─ supabase.js        cliente Supabase (ou null)
│  ├─ services/             abstração de dados
│  │  ├─ auth.js
│  │  ├─ jobs.js
│  │  ├─ applications.js
│  │  ├─ candidates.js
│  │  └─ admin.js
│  ├─ data/
│  │  └─ mock.js            fallback de demonstração
│  ├─ components/
│  │  ├─ ui.jsx             Button, Card, Modal, Badge…
│  │  └─ nav.jsx            TopBar por papel
│  ├─ pages/
│  │  ├─ HomePage.jsx
│  │  ├─ JobDetailPage.jsx
│  │  ├─ CandidatePage.jsx
│  │  ├─ RecruiterPage.jsx
│  │  ├─ TalentsPage.jsx
│  │  ├─ AdminPage.jsx
│  │  └─ DiagramPage.jsx    ← esta página
│  └─ App.jsx               roteador + sessão
├─ supabase/
│  ├─ migrations/
│  │  └─ 001_initial_schema.sql
│  └─ seed.sql
├─ vercel.json
└─ .env.example`}</pre>
        </Card>
      </div>

      {/* RLS */}
      <Card className="p-5 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={14} className="text-slate-500" />
          <span className="text-[12px] font-semibold text-slate-900 uppercase tracking-wide">Políticas RLS por papel</span>
          <Badge size="sm" tone="violet">Row Level Security</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left pb-2 text-[11px] font-medium text-slate-500 uppercase tracking-wide pr-6">Tabela</th>
                <th className="text-left pb-2 text-[11px] font-medium text-slate-500 uppercase tracking-wide pr-6">Candidato</th>
                <th className="text-left pb-2 text-[11px] font-medium text-slate-500 uppercase tracking-wide pr-6">Recrutador</th>
                <th className="text-left pb-2 text-[11px] font-medium text-slate-500 uppercase tracking-wide">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                ['profiles',           'próprio',           'leitura total',     'total'],
                ['candidate_profiles', 'próprio',           'leitura total',     'total'],
                ['jobs',               'leitura (active)',  'leitura + escrita', 'total'],
                ['applications',       'próprias',          'todas',             'total'],
                ['saved_jobs',         'próprias',          '—',                 'total'],
                ['sectors / contratos','leitura',           'leitura',           'total'],
                ['audit_log',          '—',                 'inserção',          'total'],
              ].map(([table, cand, rec, adm]) => (
                <tr key={table}>
                  <td className="py-2 pr-6 font-mono text-slate-900 font-semibold text-[11.5px]">{table}</td>
                  <td className="py-2 pr-6 text-slate-600">{cand}</td>
                  <td className="py-2 pr-6 text-slate-600">{rec}</td>
                  <td className="py-2 text-emerald-700 font-medium">{adm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tech stack */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        {[
          { label: 'Frontend', items: ['React 18', 'Vite 6', 'Tailwind CSS 3', 'Lucide React'] },
          { label: 'Auth & DB', items: ['Supabase Auth', 'PostgreSQL 15', 'Row Level Security', 'Supabase JS v2'] },
          { label: 'Deploy', items: ['Vercel', 'SPA rewrite (vercel.json)', 'VITE_ env vars', 'Preview deployments'] },
          { label: 'Modo demo', items: ['src/data/mock.js', 'Sem Supabase configurado', 'Qualquer senha funciona', 'Dados estáticos'] },
        ].map(({ label, items }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Layers size={12} className="text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
            </div>
            <ul className="space-y-1">
              {items.map((i) => (
                <li key={i} className="text-[12px] text-slate-700">{i}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Field({ name, type, pk, fk, required }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-2">
        {pk && <Key size={11} className="text-amber-600" />}
        {fk && <Link2 size={11} className="text-blue-600" />}
        <span className={`text-[12px] font-mono ${pk ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{name}</span>
        {required && <span className="text-[10px] text-rose-500 font-semibold">*</span>}
      </div>
      <span className="text-[10.5px] text-slate-400 font-mono truncate max-w-[110px]">{type}</span>
    </div>
  )
}

function Entity({ name, sub, fields, accent = 'slate', style }) {
  const header = {
    slate:   'border-slate-300 bg-slate-50',
    blue:    'border-blue-300 bg-blue-50',
    emerald: 'border-emerald-300 bg-emerald-50',
    violet:  'border-violet-300 bg-violet-50',
    amber:   'border-amber-300 bg-amber-50',
  }
  return (
    <div className="absolute" style={style}>
      <div className="w-[270px] bg-white border border-slate-200 rounded-[10px] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className={`px-3 py-2 border-b ${header[accent]}`}>
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-slate-900 font-mono">{name}</span>
            <Badge tone={accent} size="sm">{sub}</Badge>
          </div>
        </div>
        <div>{fields.map((f) => <Field key={f.name} {...f} />)}</div>
      </div>
    </div>
  )
}
