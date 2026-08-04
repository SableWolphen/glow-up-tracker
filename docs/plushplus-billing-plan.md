# Future Google Play Billing connection plan

**Status: not active.** PlushLife does not integrate or activate real
purchases today. `BILLING_ENABLED` and `PAYWALLS_ENABLED` are both `false`
in `index.html`, `PLUSH_ENFORCE_ENTITLEMENTS` is `false`, and no purchase
UI, pricing, trial, or locked-feature indicator exists anywhere in the app.
Every real account currently gets full access to every feature. This
document describes how the pieces already in the repo would connect *if
and when* billing is turned on later — it is not a task list to build now.

## The pieces that already exist (inert, groundwork only)

1. **`assets/entitlements.js`** — the single place that answers "does this
   plan include this feature?" (`PLUSH_PLANS`, `PLUSH_FEATURE_FLAGS`,
   `PLAN_FEATURES`, `hasPlushFeature(featureKey, context)`). Right now every
   caller either omits `context` or passes `enforced: false`, so it always
   returns `true`. Tested in `scripts/test-entitlements.js`.
2. **`index.html`'s `GooglePlayBillingProvider`** — a `BillingProvider`-shaped
   object (`getProducts`, `purchase`, `restorePurchases`,
   `getSubscriptionStatus`, `manageSubscription`) whose methods currently
   throw or return `null`. `getBillingProvider()` is the single lookup point
   the rest of the app would call through, so a future Apple StoreKit
   provider can be added without touching call sites.
3. **`database/entitlements.sql`** — the `entitlements` table, already live
   in Supabase with 0 rows. Stores one row per verified purchase: provider,
   platform, product ID, status, timestamps. RLS restricts writes to
   `service_role` only (i.e. a trusted server-side path) and reads to the
   owning user's own row.
4. **Product ID placeholders** — `BILLING_PRODUCT_IDS` in `index.html` holds
   `plushplus_monthly` / `plushplus_yearly` as placeholder strings only.
   **These products do not exist in Google Play Console and must not be
   created there until explicitly approved.** No price is hardcoded
   anywhere in the app; Play Console (or App Store Connect) remains the
   source of truth for price whenever billing goes live.

## How they'd connect, in order, once approved

1. **Create the real products in Play Console** (subscription, not a
   one-time or lifetime purchase — see the monetization restrictions in
   the naming registry / project conventions), matching the
   `BILLING_PRODUCT_IDS` values or updated ones agreed on at that time.
2. **Implement `GooglePlayBillingProvider`'s methods for real**, backed by
   the Google Play Billing Library on the Android side (a native Capacitor
   plugin, similar in shape to the existing `WidgetBridgePlugin` /
   `BuildInfoPlugin`), bridged back to this provider object.
3. **Server-side purchase verification**: a Supabase Edge Function (not a
   client call) verifies each purchase/renewal against the Google Play
   Developer API and writes the corresponding row into `entitlements` using
   the service role. The client never writes its own "I paid" row — that's
   why the table's RLS has no client insert/update policy today.
4. **`getSubscriptionStatus()`** starts reading the caller's own row from
   `entitlements` (already permitted by RLS) instead of returning `null`.
5. **A real `plan` gets computed** from that row (e.g. `active` +
   `product_id` → `PLUSH_PLANS.PLUSHPLUS` or `PLUSHFAMILY`) and passed into
   `hasPlushFeature(featureKey, { enforced: true, plan })` at whatever UI
   points are chosen to gate. Flipping `PLUSH_ENFORCE_ENTITLEMENTS` to
   `true` (or removing it in favor of always passing real `enforced`
   values) is the actual "turn gating on" moment — a single, deliberate,
   reviewable change, not something that happens implicitly.
6. **Apple StoreKit**, when built, implements the same `BillingProvider`
   shape as a sibling to `GooglePlayBillingProvider`, selected by
   `getBillingProvider()` based on platform, and writes into the same
   `entitlements` table with `provider: 'apple_app_store'` — so a user who
   purchased on one platform is recognized on the other without being asked
   to pay twice.

## What this phase deliberately does NOT do

- Does not create `plushplus_monthly` / `plushplus_yearly` (or any) real
  products in Play Console.
- Does not implement any of `GooglePlayBillingProvider`'s methods for real.
- Does not add any purchase, upgrade, pricing, trial, or locked-feature UI.
- Does not flip `BILLING_ENABLED`, `PAYWALLS_ENABLED`, or
  `PLUSH_ENFORCE_ENTITLEMENTS` to `true`.
- Does not touch the separate, already-inert `SUPPORTER_FEATURES_ENABLED` /
  `FREE_TASK_LIMIT_PER_DAY` mechanism from earlier groundwork — it stays
  off, and is a separate decision from PlushPlus if it's ever revisited.

No user can be charged as a result of anything in this document or the
current codebase — there is no code path anywhere that can initiate a real
purchase today.
