-- Adds a flexible "entries" column to tracker_schedules so people can build
-- their own custom schedule items (time + freeform text) instead of being
-- limited to fixed fields like wake/morning/work/workout/home.
-- Safe to run even if the column already exists.

alter table public.tracker_schedules
  add column if not exists entries jsonb not null default '[]'::jsonb;
