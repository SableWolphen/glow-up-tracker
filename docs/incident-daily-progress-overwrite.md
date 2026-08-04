# Incident: nightly cron overwrote saved daily progress

**Found:** 2026-08-04, from a user report ("I did stuff yesterday and it's
not showing" + Whole-week progress stuck at 0%).

## What was wrong

A Supabase pg_cron job, `sables-tracker-daily-reset` (jobid 1, schedule
`0 9 * * *`, not tracked anywhere in this repo — it was created directly in
the Supabase dashboard/SQL editor), ran every night and:

1. Rebuilt the previous day's `daily_progress.completed_keys` by
   re-snapshotting `tracker_progress` (a separate, non-date-scoped "current
   checkbox state" mirror table) at cron time, then upserted that
   reconstruction over whatever was already in `daily_progress` for that
   date.
2. Reset `tracker_progress`'s `daily-%` rows to `completed = false`.

The app itself already writes to `daily_progress` directly and immediately
whenever a user checks a task off (`flushPendingQueue` in `index.html`,
upserting the real `progress_date` + `completed_keys` right away). That
write is the correct, real-time record. The cron's nightly reconstruction
from `tracker_progress` was redundant with that — and actively harmful,
because by the time it ran (9am UTC), `tracker_progress`'s per-task
`completed` flags no longer necessarily reflected what was true on the day
being reconstructed. The cron's snapshot would overwrite good, real-time
data with a stale or empty one.

Confirmed directly: a real account's `daily_progress` row for 2026-08-03
showed `completed_keys: []` with `updated_at` at exactly
`2026-08-04 09:00:00 UTC` — timed precisely to this cron's run.

## Fix

Disabled the job (`select cron.alter_job(job_id := 1, active := false);`)
rather than deleting it, so it's trivially reversible if something turns
out to depend on it. Left the app's own real-time `daily_progress` writes
untouched — those were already correct and are the actual source of truth.

Checked `tracker_progress`'s role in the client: it's only read as a
fallback on days where no `daily_progress` row exists yet, and that
fallback already filters by `updated_at`'s calendar date matching today —
so a stale `completed = true` left over from a previous day doesn't get
misread as "done today" even without the cron's reset. No client-side
change was needed.

## Follow-ups worth considering (not done as part of this fix)

- Past days that were already overwritten before this fix (at minimum
  2026-08-03, likely also some emptier days like 2026-07-29/07-30) cannot
  be automatically recovered — the real per-check-in data is gone. If a
  user reports a specific day as wrong, there's no way to reconstruct it
  server-side.
- `sables-tracker-weekly-reset` (jobid 2) is a separate job that only
  touches `tracker_progress` (not `daily_progress`) and wasn't implicated
  in this bug — left untouched.
- Consider adding cron job definitions to this repo (e.g. under
  `database/`) going forward, so changes like this are reviewable instead
  of living only in the Supabase dashboard.
