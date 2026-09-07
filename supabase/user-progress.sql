-- Progresul elevului, sincronizat intre dispozitive.
-- Ruleaza acest script o singura data in Supabase SQL Editor.

create table if not exists public.user_progress (
    user_id uuid primary key references auth.users(id) on delete cascade,
    progress_data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_progress enable row level security;

drop policy if exists "Users can read their own progress" on public.user_progress;
create policy "Users can read their own progress"
    on public.user_progress for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress"
    on public.user_progress for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress"
    on public.user_progress for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create or replace function public.set_user_progress_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists user_progress_updated_at on public.user_progress;
create trigger user_progress_updated_at
before update on public.user_progress
for each row execute function public.set_user_progress_updated_at();