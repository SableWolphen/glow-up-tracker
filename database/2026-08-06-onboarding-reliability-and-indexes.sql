-- PlushLife onboarding reliability and low-risk performance fixes.
-- This file is staged for review; apply through a Supabase migration after testing.

begin;

-- Atomically creates or repairs the two records every signed-in account needs.
-- Existing profile choices are preserved unless the caller explicitly supplies
-- a non-empty replacement value. Repeated calls are safe.
create or replace function public.complete_my_onboarding(
  requested_display_name text,
  requested_account_type text,
  requested_timezone text default 'America/Chicago'
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  clean_name text := trim(coalesce(requested_display_name, ''));
  clean_type text := lower(trim(coalesce(requested_account_type, '')));
  clean_timezone text := nullif(trim(coalesce(requested_timezone, '')), '');
begin
  if caller_id is null then
    raise exception 'authentication required';
  end if;

  if clean_type not in ('little', 'caretaker') then
    raise exception 'invalid account type';
  end if;

  insert into public.tracker_profiles (
    user_id,
    display_name,
    account_type,
    guardian_read_only,
    updated_at
  ) values (
    caller_id,
    clean_name,
    clean_type,
    true,
    now()
  )
  on conflict (user_id) do update
  set display_name = case
        when excluded.display_name <> '' then excluded.display_name
        else public.tracker_profiles.display_name
      end,
      account_type = excluded.account_type,
      guardian_read_only = true,
      updated_at = now();

  insert into public.app_preferences (
    user_id,
    timezone,
    onboarding_complete,
    updated_at
  ) values (
    caller_id,
    coalesce(clean_timezone, 'America/Chicago'),
    true,
    now()
  )
  on conflict (user_id) do update
  set timezone = coalesce(clean_timezone, public.app_preferences.timezone),
      onboarding_complete = true,
      updated_at = now();
end;
$$;

revoke all on function public.complete_my_onboarding(text, text, text) from public;
grant execute on function public.complete_my_onboarding(text, text, text) to authenticated;

-- Cover foreign keys called out by Supabase's performance advisor.
create index if not exists app_error_logs_user_id_idx
  on public.app_error_logs (user_id);
create index if not exists feedback_messages_user_id_idx
  on public.feedback_messages (user_id);
create index if not exists onboarding_events_user_id_idx
  on public.onboarding_events (user_id);
create index if not exists supporter_payments_user_id_idx
  on public.supporter_payments (user_id);

commit;
