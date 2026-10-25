-- Noua structură: câte o tabelă pentru fiecare colecție administrabilă.
-- Nu modifică tabelele existente de autori/opere/quiz/revistă.
-- Paginile informative nu au tabele.
begin;
create or replace function public.education_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.education_is_admin() from public;
grant execute on function public.education_is_admin() to anon, authenticated;
create or replace function public.education_touch()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

-- Fișe vizuale
create table if not exists public.edu_fise_vizuale (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text check (grade in ('5','6','7','8')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    topic text not null default '' check (topic in ('','Gramatică','Vocabular','Lectură')),
    sheet_type text not null default '' check (sheet_type in ('','Schemă','Sinteză','Exemple comentate')),
    worked_example text not null default '' check (length(worked_example) <= 10000),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^fise-vizuale/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (length(btrim(body)) > 0 or file_path is not null or external_url is not null)
);
alter table public.edu_fise_vizuale enable row level security;
grant select on public.edu_fise_vizuale to anon, authenticated;
grant insert, update, delete on public.edu_fise_vizuale to authenticated;
create index if not exists edu_fise_vizuale_order on public.edu_fise_vizuale(sort_order,title);
drop policy if exists education_read on public.edu_fise_vizuale;
create policy education_read on public.edu_fise_vizuale for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_fise_vizuale;
create policy education_insert on public.edu_fise_vizuale for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_fise_vizuale;
create policy education_update on public.edu_fise_vizuale for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_fise_vizuale;
create policy education_delete on public.edu_fise_vizuale for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_fise_vizuale;
create trigger education_updated before update on public.edu_fise_vizuale for each row execute function public.education_touch();

-- Pregătire pentru Evaluarea Națională
create table if not exists public.edu_antrenament_examen (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text check (grade in ('5','6','7','8')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    exam_area text not null default '' check (exam_area in ('','Receptarea textului','Gramatică','Vocabular','Redactare','Test complet')),
    duration_minutes integer check (duration_minutes between 1 and 10000),
    answers text not null default '' check (length(answers) <= 10000),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^antrenament-examen/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (length(btrim(body)) > 0 or file_path is not null or external_url is not null)
);
alter table public.edu_antrenament_examen enable row level security;
grant select on public.edu_antrenament_examen to anon, authenticated;
grant insert, update, delete on public.edu_antrenament_examen to authenticated;
create index if not exists edu_antrenament_examen_order on public.edu_antrenament_examen(sort_order,title);
drop policy if exists education_read on public.edu_antrenament_examen;
create policy education_read on public.edu_antrenament_examen for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_antrenament_examen;
create policy education_insert on public.edu_antrenament_examen for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_antrenament_examen;
create policy education_update on public.edu_antrenament_examen for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_antrenament_examen;
create policy education_delete on public.edu_antrenament_examen for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_antrenament_examen;
create trigger education_updated before update on public.edu_antrenament_examen for each row execute function public.education_touch();

-- Exerciții pe competențe
create table if not exists public.edu_exercitii_competente (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text check (grade in ('5','6','7','8')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    competence text not null default '' check (length(competence) <= 300),
    difficulty text not null default '' check (difficulty in ('','Consolidare','Aplicare','Aprofundare')),
    answers text not null default '' check (length(answers) <= 10000),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^exercitii-competente/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (length(btrim(body)) > 0 or file_path is not null or external_url is not null)
);
alter table public.edu_exercitii_competente enable row level security;
grant select on public.edu_exercitii_competente to anon, authenticated;
grant insert, update, delete on public.edu_exercitii_competente to authenticated;
create index if not exists edu_exercitii_competente_order on public.edu_exercitii_competente(sort_order,title);
drop policy if exists education_read on public.edu_exercitii_competente;
create policy education_read on public.edu_exercitii_competente for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_exercitii_competente;
create policy education_insert on public.edu_exercitii_competente for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_exercitii_competente;
create policy education_update on public.edu_exercitii_competente for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_exercitii_competente;
create policy education_delete on public.edu_exercitii_competente for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_exercitii_competente;
create trigger education_updated before update on public.edu_exercitii_competente for each row execute function public.education_touch();

-- Teste și bareme
create table if not exists public.edu_teste_bareme (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text check (grade in ('5','6','7','8')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    evaluation_type text not null default '' check (evaluation_type in ('','Inițială','Pe unitate','Pe modul','Finală')),
    duration_minutes integer check (duration_minutes between 1 and 10000),
    max_score numeric check (max_score between 1 and 10000),
    rubric text not null default '' check (length(rubric) <= 10000),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^teste-bareme/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (length(btrim(body)) > 0 or file_path is not null or external_url is not null)
);
alter table public.edu_teste_bareme enable row level security;
grant select on public.edu_teste_bareme to anon, authenticated;
grant insert, update, delete on public.edu_teste_bareme to authenticated;
create index if not exists edu_teste_bareme_order on public.edu_teste_bareme(sort_order,title);
drop policy if exists education_read on public.edu_teste_bareme;
create policy education_read on public.edu_teste_bareme for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_teste_bareme;
create policy education_insert on public.edu_teste_bareme for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_teste_bareme;
create policy education_update on public.edu_teste_bareme for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_teste_bareme;
create policy education_delete on public.edu_teste_bareme for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_teste_bareme;
create trigger education_updated before update on public.edu_teste_bareme for each row execute function public.education_touch();

-- Adaptări CES
create table if not exists public.edu_resurse_ces (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text check (grade in ('5','6','7','8')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    support_type text not null default '' check (support_type in ('','Cerințe simplificate','Sprijin vizual','Activitate pe pași')),
    adaptation_notes text not null default '' check (length(adaptation_notes) <= 10000),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^resurse-ces/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (length(btrim(body)) > 0 or file_path is not null or external_url is not null)
);
alter table public.edu_resurse_ces enable row level security;
grant select on public.edu_resurse_ces to anon, authenticated;
grant insert, update, delete on public.edu_resurse_ces to authenticated;
create index if not exists edu_resurse_ces_order on public.edu_resurse_ces(sort_order,title);
drop policy if exists education_read on public.edu_resurse_ces;
create policy education_read on public.edu_resurse_ces for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_resurse_ces;
create policy education_insert on public.edu_resurse_ces for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_resurse_ces;
create policy education_update on public.edu_resurse_ces for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_resurse_ces;
create policy education_delete on public.edu_resurse_ces for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_resurse_ces;
create trigger education_updated before update on public.edu_resurse_ces for each row execute function public.education_touch();

-- Analiză și diagnoză
create table if not exists public.edu_centralizatoare_swot (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text check (grade in ('5','6','7','8')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    analysis_type text not null default '' check (analysis_type in ('','Centralizator','Analiză SWOT')),
    purpose text not null default '' check (length(purpose) <= 300),
    strengths text not null default '' check (length(strengths) <= 10000),
    weaknesses text not null default '' check (length(weaknesses) <= 10000),
    opportunities text not null default '' check (length(opportunities) <= 10000),
    threats text not null default '' check (length(threats) <= 10000),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^centralizatoare-swot/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (length(btrim(body)) > 0 or file_path is not null or external_url is not null)
);
alter table public.edu_centralizatoare_swot enable row level security;
grant select on public.edu_centralizatoare_swot to anon, authenticated;
grant insert, update, delete on public.edu_centralizatoare_swot to authenticated;
create index if not exists edu_centralizatoare_swot_order on public.edu_centralizatoare_swot(sort_order,title);
drop policy if exists education_read on public.edu_centralizatoare_swot;
create policy education_read on public.edu_centralizatoare_swot for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_centralizatoare_swot;
create policy education_insert on public.edu_centralizatoare_swot for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_centralizatoare_swot;
create policy education_update on public.edu_centralizatoare_swot for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_centralizatoare_swot;
create policy education_delete on public.edu_centralizatoare_swot for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_centralizatoare_swot;
create trigger education_updated before update on public.edu_centralizatoare_swot for each row execute function public.education_touch();

-- Planuri de intervenție
create table if not exists public.edu_planuri_interventie (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text check (grade in ('5','6','7','8')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    objective text not null default '' check (length(objective) <= 300),
    duration_weeks integer check (duration_weeks between 1 and 10000),
    success_criteria text not null default '' check (length(success_criteria) <= 10000),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^planuri-interventie/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (length(btrim(body)) > 0 or file_path is not null or external_url is not null)
);
alter table public.edu_planuri_interventie enable row level security;
grant select on public.edu_planuri_interventie to anon, authenticated;
grant insert, update, delete on public.edu_planuri_interventie to authenticated;
create index if not exists edu_planuri_interventie_order on public.edu_planuri_interventie(sort_order,title);
drop policy if exists education_read on public.edu_planuri_interventie;
create policy education_read on public.edu_planuri_interventie for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_planuri_interventie;
create policy education_insert on public.edu_planuri_interventie for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_planuri_interventie;
create policy education_update on public.edu_planuri_interventie for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_planuri_interventie;
create policy education_delete on public.edu_planuri_interventie for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_planuri_interventie;
create trigger education_updated before update on public.edu_planuri_interventie for each row execute function public.education_touch();

-- Fișe remediale
create table if not exists public.edu_activitati_remediale (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text check (grade in ('5','6','7','8')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    competence text not null default '' check (length(competence) <= 300),
    difficulty text not null default '' check (difficulty in ('','Cu sprijin','Consolidare','Transfer')),
    answers text not null default '' check (length(answers) <= 10000),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^activitati-remediale/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (length(btrim(body)) > 0 or file_path is not null or external_url is not null)
);
alter table public.edu_activitati_remediale enable row level security;
grant select on public.edu_activitati_remediale to anon, authenticated;
grant insert, update, delete on public.edu_activitati_remediale to authenticated;
create index if not exists edu_activitati_remediale_order on public.edu_activitati_remediale(sort_order,title);
drop policy if exists education_read on public.edu_activitati_remediale;
create policy education_read on public.edu_activitati_remediale for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_activitati_remediale;
create policy education_insert on public.edu_activitati_remediale for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_activitati_remediale;
create policy education_update on public.edu_activitati_remediale for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_activitati_remediale;
create policy education_delete on public.edu_activitati_remediale for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_activitati_remediale;
create trigger education_updated before update on public.edu_activitati_remediale for each row execute function public.education_touch();

-- Planificări și proiectări
create table if not exists public.edu_documente_planificare (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text check (grade in ('5','6','7','8')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    document_type text not null default '' check (document_type in ('','Planificare anuală','Proiectare pe unitate','Proiect de lecție')),
    school_year text not null default '' check (length(school_year) <= 300),
    unit_title text not null default '' check (length(unit_title) <= 300),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^documente-planificare/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (length(btrim(body)) > 0 or file_path is not null or external_url is not null)
);
alter table public.edu_documente_planificare enable row level security;
grant select on public.edu_documente_planificare to anon, authenticated;
grant insert, update, delete on public.edu_documente_planificare to authenticated;
create index if not exists edu_documente_planificare_order on public.edu_documente_planificare(sort_order,title);
drop policy if exists education_read on public.edu_documente_planificare;
create policy education_read on public.edu_documente_planificare for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_documente_planificare;
create policy education_insert on public.edu_documente_planificare for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_documente_planificare;
create policy education_update on public.edu_documente_planificare for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_documente_planificare;
create policy education_delete on public.edu_documente_planificare for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_documente_planificare;
create trigger education_updated before update on public.edu_documente_planificare for each row execute function public.education_touch();

-- Revista elevilor
create table if not exists public.edu_creatii_elevi (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text check (grade in ('5','6','7','8')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    author_credit text not null default '' check (length(btrim(author_credit)) between 1 and 300),
    creation_type text not null default '' check (creation_type in ('','Poezie','Proză','Compunere','Recenzie','Desen')),
    author_note text not null default '' check (length(author_note) <= 300),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^creatii-elevi/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (length(btrim(body)) > 0 or file_path is not null or external_url is not null)
);
alter table public.edu_creatii_elevi enable row level security;
grant select on public.edu_creatii_elevi to anon, authenticated;
grant insert, update, delete on public.edu_creatii_elevi to authenticated;
create index if not exists edu_creatii_elevi_order on public.edu_creatii_elevi(sort_order,title);
drop policy if exists education_read on public.edu_creatii_elevi;
create policy education_read on public.edu_creatii_elevi for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_creatii_elevi;
create policy education_insert on public.edu_creatii_elevi for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_creatii_elevi;
create policy education_update on public.edu_creatii_elevi for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_creatii_elevi;
create policy education_delete on public.edu_creatii_elevi for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_creatii_elevi;
create trigger education_updated before update on public.edu_creatii_elevi for each row execute function public.education_touch();

create or replace function public.education_can_read_file(requested_path text)
returns boolean language sql stable security invoker set search_path = '' as $$
select exists (
select file_path from public.edu_fise_vizuale where published and file_path = requested_path
union all
select file_path from public.edu_antrenament_examen where published and file_path = requested_path
union all
select file_path from public.edu_exercitii_competente where published and file_path = requested_path
union all
select file_path from public.edu_teste_bareme where published and file_path = requested_path
union all
select file_path from public.edu_resurse_ces where published and file_path = requested_path
union all
select file_path from public.edu_centralizatoare_swot where published and file_path = requested_path
union all
select file_path from public.edu_planuri_interventie where published and file_path = requested_path
union all
select file_path from public.edu_activitati_remediale where published and file_path = requested_path
union all
select file_path from public.edu_documente_planificare where published and file_path = requested_path
union all
select file_path from public.edu_creatii_elevi where published and file_path = requested_path
);
$$;
revoke all on function public.education_can_read_file(text) from public;
grant execute on function public.education_can_read_file(text) to authenticated;
insert into storage.buckets(id, name, public, file_size_limit)
values ('ResurseEducationale','ResurseEducationale',false,20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;
drop policy if exists education_files_admin on storage.objects;
create policy education_files_admin on storage.objects for all to authenticated
using (bucket_id = 'ResurseEducationale' and public.education_is_admin())
with check (bucket_id = 'ResurseEducationale' and public.education_is_admin());
drop policy if exists education_files_read on storage.objects;
create policy education_files_read on storage.objects for select to authenticated
using (bucket_id = 'ResurseEducationale' and public.education_can_read_file(name));
commit;
