-- ============================================================
-- REVISTA: materiale trimise de profesori (spre revizuire admin)
-- + numerele publicate ale revistei (admin -> vizibile in tabul Revista)
-- Presupune ca public.is_admin() exista deja (supabase/admin-account.sql).
-- Ruleaza acest script o singura data in Supabase SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1. BUCKETS DE STORAGE (private)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('RevistaSubmisii', 'RevistaSubmisii', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('RevistaNumere', 'RevistaNumere', false)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 2. TABEL: materiale trimise de profesori spre revizuire
-- ------------------------------------------------------------
create table if not exists public.reviste_materiale (
    id bigint generated always as identity primary key,
    profesor_id uuid not null references auth.users(id) on delete cascade,
    titlu text not null,
    descriere text,
    storage_path text not null,
    nume_fisier text,
    stare text not null default 'in_asteptare' check (stare in ('in_asteptare', 'acceptat', 'refuzat')),
    motiv_respingere text,
    creat_la timestamptz not null default now(),
    actualizat_la timestamptz not null default now(),
    actualizat_de uuid references auth.users(id)
);

alter table public.reviste_materiale enable row level security;

drop policy if exists "Profesorii trimit materiale proprii" on public.reviste_materiale;
create policy "Profesorii trimit materiale proprii"
    on public.reviste_materiale for insert
    with check (
        profesor_id = auth.uid()
        and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'profesor')
    );

drop policy if exists "Vizualizare materiale proprii sau admin" on public.reviste_materiale;
create policy "Vizualizare materiale proprii sau admin"
    on public.reviste_materiale for select
    using (public.is_admin() or profesor_id = auth.uid());

drop policy if exists "Adminii actualizeaza starea materialelor" on public.reviste_materiale;
create policy "Adminii actualizeaza starea materialelor"
    on public.reviste_materiale for update
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "Sterge material propriu in asteptare sau admin" on public.reviste_materiale;
create policy "Sterge material propriu in asteptare sau admin"
    on public.reviste_materiale for delete
    using (public.is_admin() or (profesor_id = auth.uid() and stare = 'in_asteptare'));

-- ------------------------------------------------------------
-- 3. TABEL: numerele publicate ale revistei (vizibile in site)
-- ------------------------------------------------------------
create table if not exists public.reviste_numere (
    id bigint generated always as identity primary key,
    titlu text not null,
    descriere text,
    storage_path text not null,
    nume_fisier text,
    publicat_la timestamptz not null default now(),
    creat_de uuid references auth.users(id)
);

alter table public.reviste_numere enable row level security;

drop policy if exists "Oricine poate vedea numerele publicate" on public.reviste_numere;
create policy "Oricine poate vedea numerele publicate"
    on public.reviste_numere for select
    using (true);

drop policy if exists "Doar adminii gestioneaza numerele" on public.reviste_numere;
create policy "Doar adminii gestioneaza numerele"
    on public.reviste_numere for all
    using (public.is_admin())
    with check (public.is_admin());

-- ------------------------------------------------------------
-- 4. STORAGE RLS: RevistaSubmisii
--    - profesorul incarca doar in propriul folder (numele lui de utilizator)
--    - DOAR administratorii pot citi/descarca fisierele (nimeni altcineva)
-- ------------------------------------------------------------
drop policy if exists "Profesorii incarca in propriul folder" on storage.objects;
create policy "Profesorii incarca in propriul folder"
    on storage.objects for insert
    with check (
        bucket_id = 'RevistaSubmisii'
        and (storage.foldername(name))[1] = auth.uid()::text
        and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'profesor')
    );

drop policy if exists "Doar adminii citesc materialele trimise" on storage.objects;
create policy "Doar adminii citesc materialele trimise"
    on storage.objects for select
    using (bucket_id = 'RevistaSubmisii' and public.is_admin());

drop policy if exists "Sterge materiale trimise" on storage.objects;
create policy "Sterge materiale trimise"
    on storage.objects for delete
    using (
        bucket_id = 'RevistaSubmisii'
        and (
            public.is_admin()
            or (
                (storage.foldername(name))[1] = auth.uid()::text
                and exists (
                    select 1 from public.reviste_materiale rm
                    where rm.storage_path = storage.objects.name and rm.stare = 'in_asteptare'
                )
            )
        )
    );

-- ------------------------------------------------------------
-- 5. STORAGE RLS: RevistaNumere
--    - doar adminii scriu/sterg, oricine autentificat poate descarca
--      (la fel ca restul PDF-urilor de pe site)
-- ------------------------------------------------------------
drop policy if exists "Oricine autentificat descarca numerele" on storage.objects;
create policy "Oricine autentificat descarca numerele"
    on storage.objects for select
    using (bucket_id = 'RevistaNumere' and auth.role() = 'authenticated');

drop policy if exists "Adminii incarca fisierele numerelor" on storage.objects;
create policy "Adminii incarca fisierele numerelor"
    on storage.objects for insert
    with check (bucket_id = 'RevistaNumere' and public.is_admin());

drop policy if exists "Adminii actualizeaza fisierele numerelor" on storage.objects;
create policy "Adminii actualizeaza fisierele numerelor"
    on storage.objects for update
    using (bucket_id = 'RevistaNumere' and public.is_admin());

drop policy if exists "Adminii sterg fisierele numerelor" on storage.objects;
create policy "Adminii sterg fisierele numerelor"
    on storage.objects for delete
    using (bucket_id = 'RevistaNumere' and public.is_admin());
