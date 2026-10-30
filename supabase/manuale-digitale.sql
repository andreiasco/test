-- Rulează în Supabase SQL Editor. Necesită tabela public.profiles existentă.
-- Poate fi rulat din nou; elimină manualele din afara liceului. Nu modifică celelalte colecții.
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

create table if not exists public.edu_manuale_digitale (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) between 1 and 180),
    description text not null default '' check (length(description) <= 600),
    body text not null default '' check (length(body) <= 30000),
    grade text not null check (grade in ('9','10','11','12')),
    sort_order integer not null default 0 check (sort_order between 0 and 100000),
    external_url text check (external_url is null or external_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),
    file_path text unique,
    file_name text,
    published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    subject text not null check (length(btrim(subject)) between 1 and 300),
    publisher text not null default '' check (length(publisher) <= 300),
    authors text not null default '' check (length(authors) <= 300),
    check ((file_path is null) = (file_name is null)),
    check (file_path is null or (file_path ~ '^manuale-digitale/[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$' and lower(file_name) ~ '\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$')),
    check (file_path is not null or external_url is not null)
);
-- Actualizează și o instalare existentă: păstrează exclusiv manualele de liceu.
delete from public.edu_manuale_digitale where grade is null or grade not in ('9','10','11','12');
alter table public.edu_manuale_digitale drop constraint if exists edu_manuale_digitale_grade_check;
alter table public.edu_manuale_digitale add constraint edu_manuale_digitale_grade_check check (grade in ('9','10','11','12'));
alter table public.edu_manuale_digitale alter column grade set not null;
alter table public.edu_manuale_digitale enable row level security;
grant select on public.edu_manuale_digitale to anon, authenticated;
grant insert, update, delete on public.edu_manuale_digitale to authenticated;
create index if not exists edu_manuale_digitale_order on public.edu_manuale_digitale(grade,subject,title);
drop policy if exists education_read on public.edu_manuale_digitale;
create policy education_read on public.edu_manuale_digitale for select to anon, authenticated using (published or public.education_is_admin());
drop policy if exists education_insert on public.edu_manuale_digitale;
create policy education_insert on public.edu_manuale_digitale for insert to authenticated with check (public.education_is_admin());
drop policy if exists education_update on public.edu_manuale_digitale;
create policy education_update on public.edu_manuale_digitale for update to authenticated using (public.education_is_admin()) with check (public.education_is_admin());
drop policy if exists education_delete on public.edu_manuale_digitale;
create policy education_delete on public.edu_manuale_digitale for delete to authenticated using (public.education_is_admin());
drop trigger if exists education_updated on public.edu_manuale_digitale;
create trigger education_updated before update on public.edu_manuale_digitale for each row execute function public.education_touch();

insert into storage.buckets(id, name, public, file_size_limit)
values ('ResurseEducationale','ResurseEducationale',false,20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;
drop policy if exists education_files_admin on storage.objects;
create policy education_files_admin on storage.objects for all to authenticated
using (bucket_id = 'ResurseEducationale' and public.education_is_admin())
with check (bucket_id = 'ResurseEducationale' and public.education_is_admin());
drop policy if exists manuale_digitale_files_read on storage.objects;
create policy manuale_digitale_files_read on storage.objects for select to authenticated
using (bucket_id = 'ResurseEducationale' and exists (
    select 1 from public.edu_manuale_digitale where published and file_path = storage.objects.name
));
commit;
