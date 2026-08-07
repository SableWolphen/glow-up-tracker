(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlushLifeEntitlements = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  // Centralized future-subscription architecture. Nothing in this file is
  // called anywhere in the app to actually restrict a real feature today —
  // hasPlushFeature() always returns true unless explicitly told
  // enforced: true, which nothing in the live app does. This exists so that
  // whenever real billing does arrive, there's exactly one place ("is this
  // feature included in this plan?") instead of scattered checks.

  const PLUSH_PLANS = {
    FREE: "free",
    PLUSHPLUS: "plushplus",
    PLUSHFAMILY: "plushfamily",
  };

  // One key per gate-able feature. Adding a new one here is the only step
  // needed to make it available to hasPlushFeature() — it still does
  // nothing to the real app until some UI actually calls that function
  // with enforced: true, which none does yet.
  const PLUSH_FEATURE_FLAGS = [
    "plushUnlimitedHabits",
    "plushAdvancedRoutines",
    "plushAdvancedInsights",
    "plushFullPathsLibrary",
    "plushAdvancedJournal",
    "plushFocusTools",
    "plushCalmTools",
    "plushSleepTools",
    "plushCloudBackup",
    "plushCrossDeviceSync",
    "plushWidgets",
    "plushFamilyFeatures",
  ];

  const PLUSHPLUS_FEATURES = PLUSH_FEATURE_FLAGS.filter((flag) => flag !== "plushFamilyFeatures");

  // What each plan would include, once plans are real. Free is deliberately
  // empty here — that's the *future* free tier's feature set, not "what
  // free users can do today" (today, everyone gets everything; see
  // hasPlushFeature's enforced check below).
  const PLAN_FEATURES = {
    [PLUSH_PLANS.FREE]: [],
    [PLUSH_PLANS.PLUSHPLUS]: PLUSHPLUS_FEATURES,
    [PLUSH_PLANS.PLUSHFAMILY]: [...PLUSHPLUS_FEATURES, "plushFamilyFeatures"],
  };

  /**
   * @param {string} featureKey - one of PLUSH_FEATURE_FLAGS
   * @param {{ enforced?: boolean, plan?: string, devPreviewPlan?: string|null }} context
   *   enforced: master switch. False (the only value ever passed by the
   *     live app right now) means every feature is available to everyone,
   *     regardless of plan — this is the "beta, nothing is gated yet" state.
   *   plan: the account's real plan, once purchases exist. Ignored unless
   *     enforced is true.
   *   devPreviewPlan: admin-only simulated plan for testing future gating
   *     UI before it's real. Only meaningful when enforced is true; takes
   *     priority over plan when set.
   */
  function hasPlushFeature(featureKey, context) {
    const { enforced = false, plan = PLUSH_PLANS.FREE, devPreviewPlan = null } = context || {};
    if (!enforced) return true;
    const effectivePlan = devPreviewPlan || plan;
    const features = PLAN_FEATURES[effectivePlan];
    return Array.isArray(features) && features.includes(featureKey);
  }

  return { PLUSH_PLANS, PLUSH_FEATURE_FLAGS, PLAN_FEATURES, hasPlushFeature };
});

// Keep the normal Today task list fully visible without fighting the optional
// discovery helper on a timer. That helper may still tag rows as home overflow,
// but this late stylesheet makes that presentation tag inert. PlushRescue uses
// a different data-plushlife-rescue-hidden attribute, so explicit Rescue modes
// can still intentionally reduce the list.
(function keepFullTodayTaskListStable() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const installOverride = () => {
    if (document.getElementById("plushlife-full-task-list-override")) return;
    const style = document.createElement("style");
    style.id = "plushlife-full-task-list-override";
    style.textContent = `
      [data-plushlife-home-overflow="true"] { display: flex !important; }
      #plushlife-home-more { display: none !important; }
    `;
    document.head.appendChild(style);
  };
  if (document.readyState === "loading") {
    window.addEventListener("load", installOverride, { once: true });
  } else {
    installOverride();
  }
})();
