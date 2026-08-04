# Audit: current PlushLife vs. the product vision

Comparing `docs/plushlife-product-vision.md` against the app as it exists
today (`index.html`, `database/`). This is phase 1 of that document's own
recommended rollout order — read-only, no code changed for this audit.

## Already matches, or close to it

- **PlushPaths** — `PLUSH_PATHS` already exists and is already on-brand
  (guided programs, pause/resume-friendly, no restart-on-miss penalty).
- **PlushCompanion** — the mascot/streak/badge system already follows the
  vision's "must never" rules: missing a day doesn't punish the mascot,
  streaks reset gently, badges are never lost once earned.
- **PlushPlus / entitlements** — the centralized, inert entitlement system
  (`assets/entitlements.js`, `PLUSH_PLANS`, feature flags, dev-only
  preview) matches this doc's "Future PlushPlus" section almost exactly —
  built earlier this session, nothing further needed there for now.
- **No external calendar integration** — matches the "must not" list
  outright; a prior Google Calendar sync feature was built and then
  deliberately reverted in an earlier session, so the app is already
  compliant here.
- **Widgets** — home-screen widget (`WidgetBridgePlugin`) already exists;
  roughly matches PlushWidgets' "today's habits / companion" scope.
- **Naming registry** — `docs/plush-ecosystem-naming.md` already exists
  from this session, but only covers the names raised at the time. It
  needs extending to the fuller name list in this new vision doc
  (PlushCalendar, PlushPause, PlushSync, PlushWear, PlushTogether,
  PlushFamily, etc.) before it can act as the "one central registry" this
  doc asks for.

## Real gaps

- **PlushCalendar (day / week / agenda views) doesn't exist.** Today
  there's one month-view heatmap inside the Progress tab (shows
  completion-percentage shading per day, tap to jump there) — no day view,
  no week view, no agenda/filterable list, no "add an activity from the
  calendar" flow, no per-occurrence reschedule ("only this one" vs "this
  and future"). This is the single largest gap versus the vision, and the
  vision's own data-model section (separate activity / schedule /
  occurrence / completion-history records) doesn't match how the app
  stores things today — tasks carry their own schedule directly, and
  `daily_progress` is a flat per-date completed-keys array, not
  per-occurrence records. Building this properly is a real schema project,
  not a UI tweak.
- **Bottom navigation doesn't match.** Current tabs: Today, Progress
  (labelled "week"), Care, Guardian, More. Recommended: PlushHome,
  PlushCalendar, PlushCompanion, PlushProgress, PlushProfile. This is a
  live, load-bearing piece of UX for existing real users — changing it
  is a product decision with real disruption risk, not a safe unilateral
  merge.
- **No unified PlushPause.** There's a "Rest Days" planner and per-day
  resting state already, but no cross-cutting way to pause a single habit,
  routine, or Path for a range of days the way the vision describes —
  today "not doing something" just shows up as an unmarked day, not a
  distinct paused state kept separate from missed days in PlushProgress.
- **PlushMood / PlushJournal naming.** The features exist (daily
  check-in, private reflection) but aren't named or grouped under those
  labels anywhere in the UI yet — flagged in the naming registry as
  safe, display-only renames once prioritized.
- **PlushCalm vs. PlushFocus aren't cleanly split.** `COMFORT_TOOLS`
  currently mixes both; already flagged as "needs care" in the naming
  registry.
- **PlushTogether / PlushFamily / PlushWear** don't exist. The existing
  Guardian/caregiver system covers some of PlushTogether's spirit
  (encouragement, consent-based sharing) but isn't the same feature and
  isn't being proposed for a rename — Guardian is a relationship role, not
  a feature module (see the naming registry).

## Why nothing beyond this audit + registry update happened yet

Per the vision doc's own "Development approach" section: audit first,
implement in safe phases, don't rebuild everything in one uncontrolled
change, and don't start a new phase while the current one is unstable.
The two biggest real items here — a true PlushCalendar and a bottom-nav
restructure — are exactly the kind of thing that doc says to phase
carefully, and both are product-scope decisions (what the calendar data
model should look like, whether real users should see a different bottom
nav) rather than something to decide unilaterally. Flagged back to the
product owner for prioritization rather than guessed at.
