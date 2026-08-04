-- PlushPause: lets a single habit/routine be paused for a date range
-- without it counting as missed. Fully additive - both new columns are
-- nullable and default to null, so every existing task's behavior is
-- unchanged until a user explicitly pauses something (see index.html's
-- isTaskPausedOnDate, requiredKeysForDate, and the weekly-progress loop).
--
-- paused_since/paused_until are a stored date range rather than a single
-- "paused" boolean specifically so resuming a task only ever caps the
-- range going forward (sets paused_until to yesterday) instead of
-- clearing it outright - clearing it would make the app's date check
-- retroactively stop excluding the days it WAS paused, silently making
-- already-recorded Progress history look different after the fact.
alter table public.tracker_tasks
  add column if not exists paused_since date,
  add column if not exists paused_until date,
  add column if not exists pause_reason text;

-- Paths already had a "paused" status column (plush_path_progress.status)
-- from earlier work; nothing to add there. This file only covers
-- individual habits/routines (tracker_tasks), which had no pause concept
-- at all before this.
