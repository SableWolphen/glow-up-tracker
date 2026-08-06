(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeCompletionInstalled) return;
  window.__plushlifeCompletionInstalled = true;

  const ADMIN_EMAILS = new Set([
    "johnston.alexander.k@gmail.com",
    "johnston.alexander.k+plushlisttest@gmail.com",
  ]);
  const QA_KEY = "plushlife-qa-local-v1";
  const DRAFT_PREFIX = "plushlife-offline-draft:";
  const failedRequests = [];

  const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const visible = (node) => !!(node && node.getClientRects && node.getClientRects().length);
  const readAuthEmail = () => {
    try {
      const key = Object.keys(localStorage).find((item) => /^sb-.*-auth-token$/.test(item));
      const session = key ? JSON.parse(localStorage.getItem(key) || "null") : null;
      return normalize(session?.user?.email || session?.currentSession?.user?.email);
    } catch (_error) { return ""; }
  };
  const isAdmin = () => ADMIN_EMAILS.has(readAuthEmail());
  const clickButton = (patterns) => {
    const button = Array.from(document.querySelectorAll("button")).find((item) => visible(item) && patterns.some((pattern) => normalize(item.textContent).includes(pattern)));
    if (!button) return false;
    button.click();
    return true;
  };
  const setNativeValue = (field, value) => {
    const prototype = field.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(field, value); else field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const style = document.createElement("style");
  style.textContent = `
    #plushlife-context-feedback{position:fixed;left:12px;bottom:calc(62px + env(safe-area-inset-bottom));z-index:2147483000;max-width:min(86vw,360px);padding:10px 12px;border-radius:15px;background:#fff8fc;border:1px solid #e2cfe9;box-shadow:0 8px 28px #5a416544;font:700 11.5px/1.4 system-ui,sans-serif;color:#6d5b79;display:none}
    #plushlife-context-feedback button{margin:7px 6px 0 0;border:1px solid #dec5e8;border-radius:999px;background:#fff;padding:6px 9px;color:#6f5480;font-weight:800;cursor:pointer}
    #plushlife-qa-panel{position:fixed;inset:0;z-index:2147483005;background:#32243baa;display:grid;place-items:end center;padding:16px 12px calc(16px + env(safe-area-inset-bottom));font-family:system-ui,sans-serif}
    #plushlife-qa-card{width:min(560px,100%);max-height:84vh;overflow:auto;border-radius:24px;background:#fff9fd;border:1px solid #ead7ef;padding:18px;color:#5b4b6b;box-shadow:0 20px 70px #26152f66}
    .plushlife-qa-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:12px}
    .plushlife-qa-grid button{border:1px solid #dec5e8;border-radius:14px;background:#fff;padding:11px;text-align:left;color:#5b4b6b;font-weight:800;cursor:pointer}
    .plushlife-qa-log{margin-top:12px;padding:10px;border-radius:12px;background:#f3e9f7;font:12px/1.45 ui-monospace,monospace;white-space:pre-wrap;max-height:180px;overflow:auto}
    @media(max-width:420px){#plushlife-context-feedback{left:8px;bottom:calc(110px + env(safe-area-inset-bottom))}}
    @media(prefers-reduced-motion:reduce){#plushlife-qa-panel,#plushlife-qa-card{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const feedbackPrompt = document.createElement("div");
  feedbackPrompt.id = "plushlife-context-feedback";
  feedbackPrompt.setAttribute("role", "status");
  feedbackPrompt.innerHTML = '<div data-copy>Was this confusing?</div><button type="button" data-feedback>Tell me</button><button type="button" data-dismiss>Not now</button>';
  document.body.appendChild(feedbackPrompt);
  let feedbackContext = "";
  const showFeedbackPrompt = (context, message) => {
    feedbackContext = String(context || "unknown").slice(0, 100);
    feedbackPrompt.querySelector("[data-copy]").textContent = message || "Was this confusing?";
    feedbackPrompt.style.display = "block";
  };
  feedbackPrompt.querySelector("[data-dismiss]").addEventListener("click", () => { feedbackPrompt.style.display = "none"; });
  feedbackPrompt.querySelector("[data-feedback]").addEventListener("click", () => {
    feedbackPrompt.style.display = "none";
    clickButton(["settings", "profile"]);
    setTimeout(() => {
      const settingsButton = Array.from(document.querySelectorAll("button")).find((item) => visible(item) && normalize(item.textContent).includes("send feedback"));
      if (settingsButton) settingsButton.click();
      setTimeout(() => {
        const textarea = Array.from(document.querySelectorAll("textarea")).find((item) => visible(item) && /what's going on|feedback/i.test(item.placeholder || ""));
        if (textarea) {
          const prefix = `[Context: ${feedbackContext}] `;
          if (!textarea.value.startsWith(prefix)) setNativeValue(textarea, prefix + textarea.value);
          textarea.focus();
        }
      }, 150);
    }, 100);
  });

  const saveStatus = document.getElementById("plushlife-save-status");
  if (saveStatus) {
    new MutationObserver(() => {
      if (saveStatus.dataset.state === "error") showFeedbackPrompt("save-error", "That save did not work. Was this confusing?");
    }).observe(saveStatus, { attributes: true, childList: true, subtree: true });
  }

  const draftEligible = (field) => {
    if (!field || !["INPUT", "TEXTAREA"].includes(field.tagName)) return false;
    if (field.type && !["text", "search", "email", ""].includes(field.type)) return false;
    const descriptor = normalize(`${field.placeholder || ""} ${field.getAttribute("aria-label") || ""}`);
    return /feedback|task|paste|message|reply|intention|note/.test(descriptor);
  };
  const draftKey = (field) => `${DRAFT_PREFIX}${normalize(field.placeholder || field.getAttribute("aria-label") || field.name || "field").slice(0, 80)}`;
  const enhanceDraft = (field) => {
    if (!draftEligible(field) || field.dataset.plushlifeDraftEnhanced) return;
    field.dataset.plushlifeDraftEnhanced = "true";
    try {
      const saved = sessionStorage.getItem(draftKey(field));
      if (saved && !field.value) setNativeValue(field, saved);
    } catch (_error) {}
    field.addEventListener("input", () => {
      try {
        if (field.value) sessionStorage.setItem(draftKey(field), field.value.slice(0, 5000));
        else sessionStorage.removeItem(draftKey(field));
      } catch (_error) {}
    });
  };

  const previousFetch = window.fetch.bind(window);
  window.fetch = async function plushLifeCompletionFetch(input, init) {
    try {
      const response = await previousFetch(input, init);
      const url = String(input?.url || input || "");
      const method = String(init?.method || input?.method || "GET").toUpperCase();
      if (!response.ok && /^https:\/\/[^/]+\.supabase\.co\//.test(url) && !["GET", "HEAD"].includes(method)) {
        failedRequests.unshift({ at: new Date().toISOString(), method, url: url.replace(/\?.*$/, ""), status: response.status });
        failedRequests.splice(20);
      }
      return response;
    } catch (error) {
      failedRequests.unshift({ at: new Date().toISOString(), method: String(init?.method || input?.method || "GET"), url: String(input?.url || input || "").replace(/\?.*$/, ""), error: error?.message || "Network error" });
      failedRequests.splice(20);
      throw error;
    }
  };

  const openQa = () => {
    if (!isAdmin() || document.getElementById("plushlife-qa-panel")) return;
    const panel = document.createElement("div");
    panel.id = "plushlife-qa-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.innerHTML = `
      <div id="plushlife-qa-card">
        <div style="display:flex;gap:12px;align-items:flex-start"><div style="flex:1"><div style="font-size:11px;font-weight:900;letter-spacing:.12em;color:#c45d74">PLUSHQA · ADMIN ONLY</div><h2 style="margin:5px 0 0">Safe test controls</h2><div style="margin-top:4px;font-size:12px;color:#806d8d">These controls change only this browser unless you manually save something through the normal app.</div></div><button type="button" data-close style="border:0;background:transparent;font-size:24px;color:#806d8d;cursor:pointer">×</button></div>
        <div class="plushlife-qa-grid">
          <button data-action="cozy">🧸 Open Cozy view</button>
          <button data-action="guardian">💛 Open Guardian view</button>
          <button data-action="samples">📝 Prepare sample tasks</button>
          <button data-action="offline">📴 Simulate offline banner</button>
          <button data-action="failure">⚠️ Simulate failed save</button>
          <button data-action="reset">↺ Reset local discovery</button>
          <button data-action="clear">🧹 Clear local QA data</button>
          <button data-action="logs">🔎 Refresh failed-request log</button>
        </div>
        <div class="plushlife-qa-log" data-log>No failed requests captured in this session.</div>
      </div>`;
    document.body.appendChild(panel);
    const log = panel.querySelector("[data-log]");
    const refreshLog = () => { log.textContent = failedRequests.length ? failedRequests.map((item) => `${item.at} ${item.method} ${item.status || item.error || "failed"} ${item.url}`).join("\n") : "No failed requests captured in this session."; };
    panel.querySelector("[data-close]").addEventListener("click", () => panel.remove());
    panel.addEventListener("click", (event) => { if (event.target === panel) panel.remove(); });
    panel.querySelector('[data-action="cozy"]').addEventListener("click", () => { panel.remove(); clickButton(["my plushlife", "cozy", "today"]); });
    panel.querySelector('[data-action="guardian"]').addEventListener("click", () => { panel.remove(); clickButton(["guardian", "support"]); });
    panel.querySelector('[data-action="samples"]').addEventListener("click", () => {
      panel.remove();
      clickButton(["manage tasks", "add task", "edit tasks"]);
      setTimeout(() => {
        const area = Array.from(document.querySelectorAll("textarea")).find((item) => visible(item) && /paste|task|line/i.test(`${item.placeholder || ""} ${item.getAttribute("aria-label") || ""}`));
        if (area) setNativeValue(area, "Drink water\nTake medication\nFive-minute tidy\nText someone I trust\nPrepare tomorrow's clothes");
      }, 180);
    });
    panel.querySelector('[data-action="offline"]').addEventListener("click", () => {
      const status = document.getElementById("plushlife-save-status");
      if (status) { status.dataset.state = "offline"; status.textContent = "QA: Offline — loaded content stays available."; status.style.display = "block"; }
    });
    panel.querySelector('[data-action="failure"]').addEventListener("click", () => {
      const status = document.getElementById("plushlife-save-status");
      if (status) { status.dataset.state = "error"; status.textContent = "QA: Needs another try."; status.style.display = "block"; }
      showFeedbackPrompt("qa-simulated-save-error", "QA simulated a failed save. Was this confusing?");
    });
    panel.querySelector('[data-action="reset"]').addEventListener("click", () => {
      Object.keys(localStorage).filter((key) => /plushlife.*(gentle|discovery|onboarding)/i.test(key)).forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(QA_KEY, JSON.stringify({ resetAt: new Date().toISOString() }));
      log.textContent = "Local discovery/onboarding flags cleared. Production user data was not touched.";
    });
    panel.querySelector('[data-action="clear"]').addEventListener("click", () => {
      localStorage.removeItem(QA_KEY);
      Object.keys(sessionStorage).filter((key) => key.startsWith(DRAFT_PREFIX)).forEach((key) => sessionStorage.removeItem(key));
      failedRequests.splice(0);
      refreshLog();
    });
    panel.querySelector('[data-action="logs"]').addEventListener("click", refreshLog);
    refreshLog();
  };

  const addQaEntry = () => {
    if (!isAdmin() || document.querySelector("[data-plushlife-qa-entry]")) return;
    const launcher = document.getElementById("plushlife-gentle-launcher");
    if (!launcher) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.plushlifeQaEntry = "true";
    button.textContent = "🧪";
    button.setAttribute("aria-label", "Open PlushQA admin tools");
    button.style.cssText = "position:fixed;right:14px;bottom:calc(66px + env(safe-area-inset-bottom));z-index:2147483000;border:1px solid #e4ccd9;border-radius:999px;background:#fff8fc;padding:9px 11px;box-shadow:0 5px 18px #5a416533;cursor:pointer";
    button.addEventListener("click", openQa);
    document.body.appendChild(button);
  };

  const emptyGuardianFeedback = () => {
    if (document.querySelector("[data-plushlife-empty-guardian-feedback]")) return;
    const node = Array.from(document.querySelectorAll("div,p,section")).find((item) => visible(item) && /no guardian|no support|invite.*guardian|guardian.*not.*connected/i.test(normalize(item.textContent)) && normalize(item.textContent).length < 220);
    if (!node) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.plushlifeEmptyGuardianFeedback = "true";
    button.textContent = "Was this confusing?";
    button.style.cssText = "display:block;margin-top:8px;border:1px solid #dec5e8;border-radius:999px;background:#fff;padding:6px 9px;color:#6f5480;font-weight:800;cursor:pointer";
    button.addEventListener("click", () => showFeedbackPrompt("empty-guardian-state", "Was the Guardian setup unclear?"));
    node.appendChild(button);
  };

  const observer = new MutationObserver(() => {
    document.querySelectorAll("input,textarea").forEach(enhanceDraft);
    addQaEntry();
    emptyGuardianFeedback();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll("input,textarea").forEach(enhanceDraft);
  setTimeout(() => { addQaEntry(); emptyGuardianFeedback(); }, 700);
})();
