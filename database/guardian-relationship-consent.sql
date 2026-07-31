-- Cozy and Guardian are relationship roles on one account, not separate account
-- types, and a person can be a Cozy in one relationship and a Guardian in
-- another (or support each other mutually). These changes add explicit invite
-- consent and a safe, server-side way to detect mutual relationships without
-- exposing other users' emails to the client.

alter table public.caregiver_links
  add column if not exists accepted_at timestamptz;

-- Grandfather in relationships created before consent tracking existed.
update public.caregiver_links
  set accepted_at = created_at
  where accepted_at is null;

-- Returns the caller's support relationships in both directions, matched
-- server-side via auth.users so the client never has to resolve another
-- user's email to their id (or vice versa) to detect a mutual relationship.
create or replace function public.list_my_support_relationships()
returns table (
  partner_user_id uuid,
  partner_display_name text,
  they_support_me boolean,
  they_support_me_link_id uuid,
  they_support_me_accepted boolean,
  i_support_them boolean,
  i_support_them_link_id uuid,
  i_support_them_accepted boolean
)
language sql
security definer
set search_path = public, auth
stable
as $$
  with my_email as (
    select lower(email) as email from auth.users where id = auth.uid()
  ),
  they_support_me as (
    select cl.id, u.id as partner_id, cl.accepted_at
    from caregiver_links cl
    join auth.users u on lower(u.email) = lower(cl.caregiver_email)
    where cl.owner_user_id = auth.uid() and cl.active
  ),
  i_support_them as (
    select cl.id, cl.owner_user_id as partner_id, cl.accepted_at
    from caregiver_links cl, my_email
    where lower(cl.caregiver_email) = my_email.email
      and cl.active
      and cl.owner_user_id <> auth.uid()
  ),
  partners as (
    select partner_id from they_support_me
    union
    select partner_id from i_support_them
  )
  select
    p.partner_id,
    tp.display_name,
    (tsm.id is not null) as they_support_me,
    tsm.id as they_support_me_link_id,
    (tsm.accepted_at is not null) as they_support_me_accepted,
    (ist.id is not null) as i_support_them,
    ist.id as i_support_them_link_id,
    (ist.accepted_at is not null) as i_support_them_accepted
  from partners p
  left join they_support_me tsm on tsm.partner_id = p.partner_id
  left join i_support_them ist on ist.partner_id = p.partner_id
  left join tracker_profiles tp on tp.user_id = p.partner_id;
$$;

revoke all on function public.list_my_support_relationships() from public;
revoke all on function public.list_my_support_relationships() from anon;
grant execute on function public.list_my_support_relationships() to authenticated;

-- Lets the invited party accept a pending invitation. Only the owner can
-- UPDATE caregiver_links per existing RLS, so the invited caregiver has no
-- other way to record their consent.
create or replace function public.accept_support_invitation(link_id uuid)
returns void
language sql
security definer
set search_path = public, auth
as $$
  update public.caregiver_links
  set accepted_at = now()
  where id = link_id
    and accepted_at is null
    and lower(caregiver_email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''));
$$;

revoke all on function public.accept_support_invitation(uuid) from public;
revoke all on function public.accept_support_invitation(uuid) from anon;
grant execute on function public.accept_support_invitation(uuid) to authenticated;

-- Only the owner can DELETE caregiver_links rows per existing RLS, so the
-- invited party has no client-side way to decline a pending invite. This lets
-- them remove their own not-yet-accepted invitation without granting delete
-- rights over relationships in general (accepted relationships still end only
-- via the owner's "End relationship" action, matching existing behavior).
create or replace function public.decline_support_invitation(link_id uuid)
returns void
language sql
security definer
set search_path = public, auth
as $$
  delete from public.caregiver_links
  where id = link_id
    and accepted_at is null
    and lower(caregiver_email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''));
$$;

revoke all on function public.decline_support_invitation(uuid) from public;
revoke all on function public.decline_support_invitation(uuid) from anon;
grant execute on function public.decline_support_invitation(uuid) to authenticated;
