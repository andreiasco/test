-- Adds a visual theme without changing questions, scores, policies or existing IDs.
begin;
alter table public.quizzes add column if not exists world_theme text not null default 'castle';
alter table public.quizzes drop constraint if exists quizzes_world_theme_check;
alter table public.quizzes add constraint quizzes_world_theme_check
    check (world_theme in ('castle', 'snow', 'desert', 'jungle'));
comment on column public.quizzes.world_theme is 'Visual environment, independent of game_mode and difficulty. Existing quizzes default to castle.';
notify pgrst, 'reload schema';
commit;
