# Plush Ecosystem naming registry

Central place to track the "Plush"-branded name for every major user-facing
feature area, so future renames happen deliberately and in one place instead
of ad hoc. **This document is planning only.** No renames listed here have
been applied to the live app, database, deep links, or analytics as part of
this phase — see the "Safety verdict" column for why each one is or isn't
safe to do casually.

Do not rename anything based on this doc without re-checking the current
codebase first; line numbers and internal names drift as the app changes.

Covers the full name list from `docs/plushlife-product-vision.md`. Where a
named feature (PlushCalendar's day/week/agenda views, a unified PlushPause,
PlushSafety) doesn't exist in the app yet, that's called out as a feature
gap rather than a naming question — see `docs/plushlife-vision-audit.md`
for the fuller picture of what's missing versus what just needs a label
change.

## How to use this

1. Before renaming a feature in the UI, find its row below.
2. If the verdict is "Safe (display-only)", the change is just a label/copy
   change — go ahead when it's in scope for the task at hand.
3. If the verdict is "Needs care" or "Do not rename", read the note before
   touching anything — those names are load-bearing for navigation, saved
   data, deep links, or analytics, and a careless rename will break existing
   user data or break the published app for real users.
4. Add a row here any time a new major feature area is introduced, even if
   it already launches with its Plush name.

## Registry

| Current name (in app/code) | Proposed Plush name | Where it lives | Safety verdict | Notes |
|---|---|---|---|---|
| Today tab (`DASHBOARDS` id `"today"`) | PlushHome | `index.html` `DASHBOARDS`, `dashboardItems` | Applied | `id: "today"` unchanged. |
| Progress / week tab (`DASHBOARDS` id `"week"`) | PlushCalendar | `index.html` `DASHBOARDS` | Applied | Renamed per explicit product direction — the tab now hosts all calendar-style views (Whole-week progress, Progress calendar month view, Week view) under one PlushCalendar label. The card that used to also say "PlushCalendar" (the week-view grid) was renamed to "Week view" to avoid the tab and a card inside it sharing the same name. `id: "week"` unchanged. |
| Care tab (`DASHBOARDS` id `"care"`) | — (umbrella tab, holds Quick/Paths/Sleep below) | `index.html` `DASHBOARDS` | Needs care | This tab is a container for three sub-sections that each deserve their own Plush name (below); renaming the umbrella tab itself is lower priority and easy to get wrong if it implies a single feature. |
| Care → Quick section (`careSection === "quick"`) | PlushCalm | `index.html` `careSection` state | Applied | Was already labeled "PlushCare" (not "Quick" as the doc assumed) — relabeled to PlushCalm. `careSection` string value `"quick"` unchanged. |
| Care → Paths section, `PLUSH_PATHS` | PlushPaths | `index.html` `PLUSH_PATHS` | Applied | Tab label aligned from "PlushPath" (singular) to "PlushPaths" to match the internal array name and the vision doc. |
| Care → Sleep section, `SLEEP_TOOLS` | PlushSleep | `index.html` `SLEEP_TOOLS`, `careSection === "sleep"` | Already on-brand | Was already labeled "PlushSleep" — no change needed. |
| Care → Quick tools, `COMFORT_TOOLS` | PlushCalm tools / PlushFocus tools (split by tool type) | `index.html` `COMFORT_TOOLS` | Needs care | `COMFORT_TOOLS` currently mixes calming and focus-style tools under one array. A clean PlushCalm/PlushFocus split means auditing which tools are which before renaming — not just a label change. |
| Habit / task list (daily tasks, `DAILY`/`DAYS`/`ALL`) | PlushHabits / PlushRoutines | `index.html` task data model | Do not rename (data layer) | `taskKey`, task type fields, and notification IDs (`window.PlushLifeCare.notificationId`) are derived from these internal names and are persisted in Supabase and in scheduled local notifications on users' devices. Renaming the *displayed* word "tasks"/"habits" in copy is safe; renaming the underlying field names or IDs is not — it would silently orphan existing notifications and saved data. |
| Private Reflection (`reflectionViewerDate`, private note draft) | PlushJournal | `index.html` reflection state/UI | Applied (panel/headers only) | Renamed the ToolPanel title and both "PRIVATE REFLECTION" section headers to PlushJournal. Left generic descriptive copy ("your private reflections", FAQ answers, achievement flavor text like "First Reflection") as-is — those read fine as plain English and renaming every instance risked awkward phrasing for no real benefit. Underlying columns/state names unchanged. |
| Mood / check-in flow | PlushMood | `index.html` mood/check-in UI | Applied (panel title only) | Renamed the "Daily check-in" ToolPanel title to PlushMood. Left the in-context greeting ("How are you today?") alone — that's conversational voice, not a feature label. Column/table names unchanged. |
| Guardian tab (`DASHBOARDS` id `"guardian"`) | — | `index.html` `DASHBOARDS` | Do not rename | Guardian is a relationship role (the caregiver/support person), not a feature module. It doesn't fit the Plush-prefixed feature-branding pattern and shouldn't be forced into it. |
| Widget (`android/app/.../WidgetBridgePlugin`, home-screen widget) | PlushWidgets | Android native + `index.html` widget bridge | Needs care | Matches the `plushWidgets` entitlement flag name already, which is good. Renaming anything on the native Android side (provider class names, widget IDs) requires a full native rebuild and re-signing, and any user who already placed the widget on their home screen must not lose it — treat this as an Android-side task, not a copy change. |
| Data export (existing local export feature) | PlushCloudBackup / PlushSync | `index.html` export UI | Do not rename yet (naming/reality mismatch) | The current feature is a local, on-device export — there's no cloud backup or cross-device sync today. Calling it "PlushCloudBackup" before that's actually built would be misleading. Keep the current name until the feature underneath it changes; the `plushCloudBackup` / `plushCrossDeviceSync` entitlement flags in `assets/entitlements.js` are named for the *future* feature, not the current export. |
| PlushPlus subscription (future) | PlushPlus | `assets/entitlements.js` `PLUSH_PLANS.PLUSHPLUS` | Already on-brand | Already named correctly at the architecture level; no live pricing/paywall UI exists yet (see `docs/plushplus-billing-plan.md`). |
| PlushFamily plan (future) | PlushFamily | `assets/entitlements.js` `PLUSH_PLANS.PLUSHFAMILY` | Already on-brand | Same as above. |
| Focus Mode (`preferences.focus_mode`, one-task-at-a-time layout) | PlushFocus | `index.html` `focus_mode` preference, `adminStats.using_focus_mode` | Applied (display copy only) | Renamed the Settings checkbox label, the FAQ question/answer, and the related achievement hint. `focus_mode` preference key and `adminStats.using_focus_mode` analytics field left untouched. This "Focus Mode" is still a display-density toggle, not the timer-based PlushFocus sessions the vision doc describes — the name now matches, the underlying feature is still the simpler one. |
| Pattern insight cards (`patternInsightCards`, `pattern_insights_enabled` preference) | PlushInsights | `index.html` weekly-progress card | Applied | Added a small "PLUSHINSIGHTS" label above the card (it previously had no header at all), and updated the Settings toggle copy to say "Show PlushInsights (...)". `pattern_insights_enabled` preference key unchanged. |
| "More" tab (`DASHBOARDS` id `"more"`: Settings, Help & FAQ, Send feedback, Admin) | PlushProfile | `index.html` `DASHBOARDS`, `dashboard === "more"` | Applied | `id: "more"` unchanged. |
| Progress calendar (month-view heatmap card, inside the now-renamed PlushCalendar tab) | Keep as "Progress calendar" (or similar) | `index.html` `weekCardIndex === 1` block | Applied (tab); card intentionally left as-is | The tab hosting this card is now named PlushCalendar. This card itself stays named "Progress calendar" rather than also being called PlushCalendar, since it's only the month-view fragment of the full day/week/month/agenda PlushCalendar the vision doc describes — see `docs/plushlife-vision-audit.md`. Same reasoning applied to the week-view card, named "Week view" rather than reusing "PlushCalendar" for a sub-view. |
| — (no unified pause mechanism exists) | PlushPause | n/a — feature gap, not a naming question | Does not exist yet | Rest Days / Vacation Mode (`index.html`, Settings) covers pausing the *whole* daily plan for a date range, which is close. There's no way today to pause a single habit, routine, or Path independently the way the vision describes, or to keep paused days visually distinct from missed days in Progress. Worth reusing the "Rest Days" naming/UI as the seed for PlushPause rather than building a second, separate pause system. |
| PlushSafety panel (More tab) | PlushSafety | `index.html`, `safetyOpen` state, More tab button | Applied | Built and named correctly — crisis resources (988 Lifeline, Crisis Text Line, findahelpline.com), always free, no entitlement gating. |
| Settings → "Your Data" (export, "we never sell your data") | PlushPrivacy | `index.html` Settings panel | Applied | Section header now reads "PLUSHPRIVACY · YOUR DATA". Confirmed export/deletion still aren't gated by any entitlement check. Preference/table names unchanged. |
| Notifications settings section (push-notification enable card in Settings) | PlushReminders | `index.html` Settings panel | Applied | Section header renamed from "NOTIFICATIONS" to "PLUSHREMINDERS". `notifications_enabled` preference key and per-task `reminder_time` fields unchanged. |
| Data export destination concept (local export today; no real sync yet) | PlushSync (future) | `index.html` export UI, future cross-device sync | Do not rename yet | Same reality mismatch already noted under the Data export row above — PlushSync per the vision doc means secure cloud backup *and* cross-device sync with conflict handling, neither of which exists today. Don't apply this name to the current local-only export. |

## General rule for "Needs care" / "Do not rename" rows

Before renaming anything flagged above, check whether the *internal* name
(not just the label shown to users) is referenced by any of:

- Supabase table/column names or RLS policies
- `taskKey` values, notification IDs (`window.PlushLifeCare.notificationId`),
  or anything derived from them
- Deep links or Android intent data
- Analytics/admin-stat field names (see the Admin panel in `index.html`,
  e.g. `adminStats.using_focus_mode`)
- Native Android code (widget provider names, `AndroidManifest.xml` entries)

If none of those match, it's a safe, display-only copy change. If any of
them do, the rename needs a real migration plan — not something to do as
part of a "just rename the label" task.
