-- Smart reminder timing: a dismissible one-off suggestion offering to add
-- a reminder time around when the user actually tends to be active in the
-- app, computed client-side from daily_progress.updated_at (already being
-- fetched for habit-streak calculations - see index.html's habitHistory
-- query, which now also selects updated_at). Nothing here changes what
-- gets sent or when automatically; it only lets the user dismiss the
-- suggestion so it stops resurfacing, same pattern as the existing
-- notification_nudge_dismissed_at column.
alter table public.app_preferences
  add column if not exists smart_reminder_hint_dismissed_at timestamptz;
