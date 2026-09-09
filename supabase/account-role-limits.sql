-- Reguli suplimentare pentru gestionarea conturilor din tab-ul "Cont" al admin-ului:
-- 1. Rolul de administrator nu poate fi atins: nimeni nu poate promova pe cineva
--    la "admin" si nimeni nu poate schimba rolul unui cont deja "admin".
-- 2. Conturile elev/profesor pot fi sterse definitiv de un administrator;
--    conturile de administrator nu pot fi sterse niciodata.
-- Presupune ca public.is_admin() a fost deja creat (supabase/admin-account.sql,
-- rulat anterior). Ruleaza acest script o singura data in Supabase SQL Editor.

-- Actualizarea rolului: doar randuri care NU sunt deja admin, si doar spre elev/profesor.
drop policy if exists "Admins can update roles" on public.profiles;
drop policy if exists "Admins can update non-admin roles" on public.profiles;
create policy "Admins can update non-admin roles"
    on public.profiles for update
    using (public.is_admin() and role <> 'admin')
    with check (public.is_admin() and role <> 'admin');

-- Stergerea contului: rulata printr-o functie, pentru ca auth.users nu e
-- accesibil direct din API. Functia verifica explicit ca tinta nu e admin.
create or replace function public.sterge_cont_utilizator(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    rol_tinta text;
begin
    if not public.is_admin() then
        raise exception 'Doar administratorii pot șterge conturi.';
    end if;

    select role into rol_tinta from public.profiles where id = target_id;

    if rol_tinta is null then
        raise exception 'Utilizatorul nu a fost găsit.';
    end if;

    if rol_tinta = 'admin' then
        raise exception 'Conturile de administrator nu pot fi șterse.';
    end if;

    delete from auth.users where id = target_id;
end;
$$;

revoke all on function public.sterge_cont_utilizator(uuid) from public;
grant execute on function public.sterge_cont_utilizator(uuid) to authenticated;
