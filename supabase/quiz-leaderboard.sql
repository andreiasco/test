-- Clasament comun: 1 punct / răspuns corect, fără bonus final.
-- Se rulează după crearea tabelelor profiles și quizzes. Poate fi rulat din nou.
begin;

create table if not exists public.quiz_leaderboard_entries (
    user_id uuid primary key references auth.users(id) on delete cascade,
    points bigint not null default 0 check (points >= 0),
    games bigint not null default 0 check (games >= 0)
);

-- Chitanțele împiedică dublarea punctelor, inclusiv după golirea clasamentului.
create table if not exists public.quiz_score_receipts (
    attempt_id uuid primary key,
    user_id uuid not null references auth.users(id) on delete cascade
);

alter table public.quiz_leaderboard_entries enable row level security;
alter table public.quiz_score_receipts enable row level security;
revoke all on public.quiz_leaderboard_entries from public, anon, authenticated;
revoke all on public.quiz_score_receipts from public, anon, authenticated;

create or replace function public.submit_quiz_score(
    p_attempt_id uuid, p_quiz_id uuid, p_correct integer, p_total integer
)
returns void language plpgsql security definer set search_path = '' as $$
declare
    player_id uuid := auth.uid();
    question_count integer;
    inserted integer;
begin
    if player_id is null or not exists (
        select 1 from public.profiles where id = player_id and role = 'elev'
    ) then
        raise exception 'Doar elevii autentificați pot înregistra puncte.' using errcode = '42501';
    end if;

    if p_attempt_id is null or p_quiz_id is null or p_correct is null or p_total is null
       or p_total < 1 or p_correct < 0 or p_correct > p_total then
        raise exception 'Rezultat invalid.' using errcode = '22023';
    end if;

    select jsonb_array_length(q.questions::jsonb) into question_count
    from public.quizzes q
    where q.id = p_quiz_id and q.published and jsonb_typeof(q.questions::jsonb) = 'array';

    if question_count is null or question_count <> p_total then
        raise exception 'Quiz-ul nu este disponibil sau numărul de întrebări nu corespunde.' using errcode = '22023';
    end if;

    -- Aceeași ordine pentru salvare și resetare, fără rezultate parțiale.
    perform pg_catalog.pg_advisory_xact_lock(748162901);
    insert into public.quiz_score_receipts(attempt_id, user_id)
    values (p_attempt_id, player_id) on conflict (attempt_id) do nothing;
    get diagnostics inserted = row_count;
    if inserted = 0 then return; end if;

    insert into public.quiz_leaderboard_entries(user_id, points, games)
    values (player_id, p_correct, 1)
    on conflict (user_id) do update
    set points = public.quiz_leaderboard_entries.points + excluded.points,
        games = public.quiz_leaderboard_entries.games + 1;
end;
$$;

create or replace function public.get_quiz_leaderboard()
returns table(user_id uuid, display_name text, points bigint, games bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
    if auth.uid() is null then
        raise exception 'Autentifică-te pentru a vedea clasamentul.' using errcode = '42501';
    end if;
    return query
    select entry.user_id, 'Elev ' || left(entry.user_id::text, 8), entry.points, entry.games
    from public.quiz_leaderboard_entries entry
    join public.profiles profile on profile.id = entry.user_id and profile.role = 'elev'
    order by entry.points desc, entry.user_id;
end;
$$;

create or replace function public.reset_quiz_leaderboard()
returns void language plpgsql security definer set search_path = '' as $$
begin
    if auth.uid() is null or not exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ) then
        raise exception 'Doar administratorul poate goli clasamentul.' using errcode = '42501';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(748162901);
    delete from public.quiz_leaderboard_entries;
end;
$$;

revoke all on function public.submit_quiz_score(uuid, uuid, integer, integer) from public, anon;
revoke all on function public.get_quiz_leaderboard() from public, anon;
revoke all on function public.reset_quiz_leaderboard() from public, anon;
grant execute on function public.submit_quiz_score(uuid, uuid, integer, integer) to authenticated;
grant execute on function public.get_quiz_leaderboard() to authenticated;
grant execute on function public.reset_quiz_leaderboard() to authenticated;

notify pgrst, 'reload schema';
commit;
