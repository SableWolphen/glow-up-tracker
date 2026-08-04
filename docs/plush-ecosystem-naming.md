# Plush Ecosystem naming registry

Central place to track the "Plush"-branded name for every major user-facing
feature area, so future renames happen deliberately and in one place instead
of ad hoc. **This document is planning only.** No renames listed here have
been applied to the live app, database, deep links, or analytics as part of
this phase — see the "Safety verdict" column for why each one is or isn't
safe to do casually.

Do not rename anything based on this doc without re-checking the current
codebase first; line numbers and internal names drift as the app changes.

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
| Today tab (`DASHBOARDS` id `"today"`) | PlushHome | `index.html` `DASHBOARDS`, `dashboardItems` | Safe (display-only) | The `label` shown to users can change freely; the `id: "today"` must stay as-is (see below). |
| Progress / week tab (`DASHBOARDS` id `"week"`) | PlushProgress / PlushInsights | `index.html` `DASHBOARDS` | Safe (display-only) | Pick one — PlushProgress reads better for the streak/history view, PlushInsights for the analysis view. They currently share one tab, so one name should win rather than splitting it. |
| Care tab (`DASHBOARDS` id `"care"`) | — (umbrella tab, holds Quick/Paths/Sleep below) | `index.html` `DASHBOARDS` | Needs care | This tab is a container for three sub-sections that each deserve their own Plush name (below); renaming the umbrella tab itself is lower priority and easy to get wrong if it implies a single feature. |
| Care → Quick section (`careSection === "quick"`) | PlushCalm | `index.html` `careSection` state | Safe (display-only) | `careSection` values (`"quick"`, `"paths"`, `"sleep"`) are local UI state only, not persisted per-user, so relabeling the tab text is low risk. Don't rename the string literal itself without grepping every place `careSection === "quick"` is compared. |
| Care → Paths section, `PLUSH_PATHS` | PlushPaths | `index.html` `PLUSH_PATHS` | Already on-brand | No rename needed — this one already matches the ecosystem naming. |
| Care → Sleep section, `SLEEP_TOOLS` | PlushSleep | `index.html` `SLEEP_TOOLS`, `careSection === "sleep"` | Safe (display-only) | Same caveat as Quick/Calm above — relabel the visible text, leave the `"sleep"` state value alone. |
| Care → Quick tools, `COMFORT_TOOLS` | PlushCalm tools / PlushFocus tools (split by tool type) | `index.html` `COMFORT_TOOLS` | Needs care | `COMFORT_TOOLS` currently mixes calming and focus-style tools under one array. A clean PlushCalm/PlushFocus split means auditing which tools are which before renaming — not just a label change. |
| Habit / task list (daily tasks, `DAILY`/`DAYS`/`ALL`) | PlushHabits / PlushRoutines | `index.html` task data model | Do not rename (data layer) | `taskKey`, task type fields, and notification IDs (`window.PlushLifeCare.notificationId`) are derived from these internal names and are persisted in Supabase and in scheduled local notifications on users' devices. Renaming the *displayed* word "tasks"/"habits" in copy is safe; renaming the underlying field names or IDs is not — it would silently orphan existing notifications and saved data. |
| Private Reflection (`reflectionViewerDate`, private note draft) | PlushJournal | `index.html` reflection state/UI | Safe (display-only) | Purely a copy change in the UI; the underlying `private_note`-style Supabase columns should keep their current names (see Data layer note below). |
| Mood / check-in flow | PlushMood | `index.html` mood/check-in UI | Safe (display-only), verify column names first | Confirm the Supabase column/table storing mood history isn't also renamed in the same pass — same rule as Journal above. |
| Guardian tab (`DASHBOARDS` id `"guardian"`) | — | `index.html` `DASHBOARDS` | Do not rename | Guardian is a relationship role (the caregiver/support person), not a feature module. It doesn't fit the Plush-prefixed feature-branding pattern and shouldn't be forced into it. |
| Widget (`android/app/.../WidgetBridgePlugin`, home-screen widget) | PlushWidgets | Android native + `index.html` widget bridge | Needs care | Matches the `plushWidgets` entitlement flag name already, which is good. Renaming anything on the native Android side (provider class names, widget IDs) requires a full native rebuild and re-signing, and any user who already placed the widget on their home screen must not lose it — treat this as an Android-side task, not a copy change. |
| Data export (existing local export feature) | PlushCloudBackup / PlushSync | `index.html` export UI | Do not rename yet (naming/reality mismatch) | The current feature is a local, on-device export — there's no cloud backup or cross-device sync today. Calling it "PlushCloudBackup" before that's actually built would be misleading. Keep the current name until the feature underneath it changes; the `plushCloudBackup` / `plushCrossDeviceSync` entitlement flags in `assets/entitlements.js` are named for the *future* feature, not the current export. |
| PlushPlus subscription (future) | PlushPlus | `assets/entitlements.js` `PLUSH_PLANS.PLUSHPLUS` | Already on-brand | Already named correctly at the architecture level; no live pricing/paywall UI exists yet (see `docs/plushplus-billing-plan.md`). |
| PlushFamily plan (future) | PlushFamily | `assets/entitlements.js` `PLUSH_PLANS.PLUSHFAMILY` | Already on-brand | Same as above. |

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
