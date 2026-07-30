create table if not exists public.user_achievements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  visit_streak integer not null default 0 check (visit_streak >= 0),
  best_visit_streak integer not null default 0 check (best_visit_streak >= 0),
  last_visit_date date,
  best_care_streak integer not null default 0 check (best_care_streak >= 0),
  unlocked_ids text[] not null default array['classic']::text[],
  selected_mascot text not null default 'classic',
  celebration_sound boolean not null default true,
  last_celebrated_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_achievements enable row level security;

revoke all on table public.user_achievements from anon;
grant select, insert, update, delete on table public.user_achievements to authenticated;

drop policy if exists "Users can read their achievements" on public.user_achievements;
create policy "Users can read their achievements"
on public.user_achievements
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their achievements" on public.user_achievements;
create policy "Users can create their achievements"
on public.user_achievements
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their achievements" on public.user_achievements;
create policy "Users can update their achievements"
on public.user_achievements
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their achievements" on public.user_achievements;
create policy "Users can delete their achievements"
on public.user_achievements
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.record_plushlist_visit(p_visit_date date)
returns public.user_achievements
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.user_achievements;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_achievements (
    user_id,
    visit_streak,
    best_visit_streak,
    last_visit_date
  )
  values (
    (select auth.uid()),
    1,
    1,
    p_visit_date
  )
  on conflict (user_id) do update
  set
    visit_streak = case
      when public.user_achievements.last_visit_date = p_visit_date
        then public.user_achievements.visit_streak
      when public.user_achievements.last_visit_date = p_visit_date - 1
        then public.user_achievements.visit_streak + 1
      else 1
    end,
    best_visit_streak = greatest(
      public.user_achievements.best_visit_streak,
      case
        when public.user_achievements.last_visit_date = p_visit_date
          then public.user_achievements.visit_streak
        when public.user_achievements.last_visit_date = p_visit_date - 1
          then public.user_achievements.visit_streak + 1
        else 1
      end
    ),
    last_visit_date = greatest(
      coalesce(public.user_achievements.last_visit_date, p_visit_date),
      p_visit_date
    ),
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.record_plushlist_visit(date) from public, anon;
grant execute on function public.record_plushlist_visit(date) to authenticated;
