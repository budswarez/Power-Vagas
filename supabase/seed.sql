-- ============================================================
-- Power Vagas — seed data
-- Mirrors src/data/mock.js for local Supabase development.
-- Run via: supabase db reset  (applies migrations + seed)
-- ============================================================

-- Sectors
insert into sectors (id, label) values
  ('tech',      'Tecnologia'),
  ('hardware',  'Hardware & Engenharia'),
  ('logistics', 'Logística'),
  ('marketing', 'Marketing'),
  ('sales',     'Vendas'),
  ('support',   'Atendimento'),
  ('finance',   'Financeiro'),
  ('people',    'Pessoas & Cultura')
on conflict (id) do nothing;

-- Seniorities
insert into seniorities (id, label, "order") values
  ('junior', 'Júnior', 1),
  ('pleno',  'Pleno',  2),
  ('senior', 'Sênior', 3)
on conflict (id) do nothing;

-- Contracts
insert into contracts (id, label) values
  ('clt',     'CLT'),
  ('pj',      'PJ'),
  ('estagio', 'Estágio')
on conflict (id) do nothing;

-- ── Demo auth users (local dev only) ────────────────────────
-- These simulate the mock accounts. Random hashes are generated at seed time;
-- no reusable password is shipped in the repository.
-- Set local credentials through Supabase Auth after seeding.

insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@suaempresa.com.br',
    crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
    now(),
    '{"role":"admin","name":"Daniela Sua Empresa"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'renata.s@suaempresa.com.br',
    crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
    now(),
    '{"role":"recruiter","name":"Renata Schmidt","department":"Tecnologia","job_title":"Tech Recruiter"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'marcos.v@suaempresa.com.br',
    crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
    now(),
    '{"role":"recruiter","name":"Marcos Vieira","department":"Operações","job_title":"Recruiter — Operações"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'ana.lima@email.com',
    crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
    now(),
    '{"role":"candidate","name":"Ana Lima"}'::jsonb,
    now(), now(), '', '', '', ''
  )
on conflict (id) do nothing;

-- Profiles (trigger handles this on real signup; seed manually for demo)
insert into profiles (id, role, name, email, avatar, department, job_title, active, created_at) values
  ('00000000-0000-0000-0000-000000000001', 'admin',     'Daniela Sua Empresa', 'admin@suaempresa.com.br',     'DP', 'Pessoas', 'Head de Pessoas',           true, '2025-01-01'),
  ('00000000-0000-0000-0000-000000000002', 'recruiter', 'Renata Schmidt', 'renata.s@suaempresa.com.br',  'RS', 'Tecnologia', 'Tech Recruiter',          true, '2025-11-04'),
  ('00000000-0000-0000-0000-000000000003', 'recruiter', 'Marcos Vieira',  'marcos.v@suaempresa.com.br',  'MV', 'Operações', 'Recruiter — Operações',   true, '2025-12-12'),
  ('00000000-0000-0000-0000-000000000004', 'candidate', 'Ana Lima',       'ana.lima@email.com',      'AL', null, null, true, '2026-01-15')
on conflict (id) do nothing;

-- Candidate profile for Ana Lima
insert into candidate_profiles (id, role_title, location, seniority, years_exp, availability, summary, skills, linkedin, github, portfolio) values
  ('00000000-0000-0000-0000-000000000004',
   'Engenheira de Software', 'Curitiba, PR', 'pleno', 4, 'Imediata',
   'Backend pragmática, gosto de sistemas legíveis e bem testados.',
   '{"Node.js","TypeScript","PostgreSQL","AWS","Docker"}',
   'linkedin.com/in/analima', 'github.com/analima', 'ana.dev')
on conflict (id) do nothing;

-- Jobs (use the mock IDs so existing app code still works)
insert into jobs (id, title, description, requirements, nice_to_have, benefits, skills,
  sector_id, modality, seniority, contract_id, location, salary_min, salary_max,
  department, status, recruiter_id, published_at) values
  (
    'j-001', 'Engenheiro(a) de Software Pleno — Backend',
    'Responsável por evoluir os serviços que sustentam o checkout e o catálogo da Sua Empresa.',
    '{"3+ anos com Node.js ou Go em produção","Experiência com PostgreSQL e modelagem relacional","Vivência com mensageria (Kafka, RabbitMQ ou SQS)","Boas práticas de testes automatizados"}',
    '{"Kubernetes","Terraform","Observabilidade (Grafana/Prom)"}',
    '{"Vale-refeição","Plano de saúde","Gympass","Desconto Sua Empresa"}',
    '{"Node.js","PostgreSQL","Kafka","Docker"}',
    'tech', 'Híbrido', 'pleno', 'clt', 'Curitiba, PR', 9000, 13000,
    'Plataforma', 'active', '00000000-0000-0000-0000-000000000002', '2026-05-02'
  ),
  (
    'j-002', 'Designer de Produto Sênior',
    'Liderar a discovery e o design de fluxos críticos do e-commerce.',
    '{"5+ anos em produto digital","Domínio de Figma e prototipação","Histórico de pesquisa com usuários"}',
    '{"Design Systems","Motion design"}',
    '{"Auxílio home office","Plano de saúde","PLR"}',
    '{"Figma","Design System","Pesquisa","Prototipação"}',
    'tech', 'Remoto', 'senior', 'clt', 'Remoto', 11000, 15000,
    'Produto', 'active', '00000000-0000-0000-0000-000000000002', '2026-05-01'
  ),
  (
    'j-003', 'Analista de Logística Júnior',
    'Apoio na operação do CD: roteirização, conferência de carga e indicadores de SLA.',
    '{"Ensino superior em andamento (Logística, Engenharia ou correlatos)","Excel intermediário","Boa comunicação"}',
    '{"Power BI","WMS"}',
    '{"Vale-transporte","Refeitório no local","Plano odonto"}',
    '{"Excel","Roteirização","WMS"}',
    'logistics', 'Presencial', 'junior', 'clt', 'São José dos Pinhais, PR', 3200, 4200,
    'Operações', 'active', '00000000-0000-0000-0000-000000000003', '2026-05-04'
  ),
  (
    'j-007', 'SRE Sênior',
    'Manter e evoluir a infraestrutura cloud que sustenta o e-commerce em datas de pico.',
    '{"AWS sólido (EKS, RDS, SQS)","Terraform em produção","Observabilidade ponta a ponta"}',
    '{"Chaos engineering","FinOps"}',
    '{"100% remoto","Hardware fornecido"}',
    '{"AWS","Terraform","Kubernetes","Prometheus"}',
    'tech', 'Remoto', 'senior', 'pj', 'Remoto', 14000, 19000,
    'Plataforma', 'active', '00000000-0000-0000-0000-000000000002', '2026-04-22'
  )
on conflict (id) do nothing;
