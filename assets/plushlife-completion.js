(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeCompletionInstalled) return;
  window.__plushlifeCompletionInstalled = true;

  const ADMIN_EMAILS = new Set([
    "johnston.alexander.k@gmail.com",
    "johnston.alexander.k+plushlisttest@gmail.com",
  ]);
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

  const style = document.createElement("style");
  style.textContent = `
    #plushlife-context-feedback{position:fixed;left:12px;bottom:calc(62px + env(safe-area-inset-bottom));z-index:2147483000;max-width:min(86vw,360px);padding:10px 12px;border-radius:15px;background:#fff8fc;border:1px solid #e2cfe9;box-shadow:0 8px 28px #5a416544;font:700 11.5px/1.4 system-ui,sans-serif;color:#6d5b79;display:none}
    #plushlife-context-feedback button{margin:7px 6px 0 0;border:1px solid #dec5e8;border-radius:999px;background:#fff;padding:6px 9px;color:#6f5480;font-weight:800;cursor:pointer}
    #plushlife-qa-panel{position:fixed;inset:0;z-index:2147483005;background:#32243baa;display:grid;place-items:end center;padding:16px 12px calc(16px + env(safe-area-inset-bottom));font-family:system-ui,sans-serif}
    #plushlife-qa-card{width:min(560px,100%);max-height:84vh;overflow:auto;border-radius:24px;background:#fff9fd;border:1px solid #ead7ef;padding:18px;color:#5b4b6b;box-shadow:0 20px 70px #26152f66}
    .plushlife-qa-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:12px}
    .plushlife-qa-grid button{border:1px solid #dec5e8;border-radius:14px;background:#fff;padding:11px;text-align:left;color:#5b4b6b;font-weight:800;cursor:pointer}
    .plushlife-qa-log{margin-top:12px;padding:10px;border-radius:12px;background:#f3e9f7;font:12px/1.45 ui-monospace,monospace;white-space:pre-wrap;max-height:180px;overflow:auto}
  `;
  document.head.appendChild(style);

  const feedbackPrompt = document.createElement("div");
  feedbackPrompt.id = "plushlife-context-feedback";
  feedbackPrompt.innerHTML = '<div data-copy>Was this confusing?</div><button type="button" data-feedback>Tell me</button><button type="button" data-dismiss>Not now</button>';
  document.body.appendChild(feedbackPrompt);
  feedbackPrompt.querySelector("[data-dismiss]").addEventListener("click", () => { feedbackPrompt.style.display = "none"; });
  feedbackPrompt.querySelector("[data-feedback]").addEventListener("click", () => {
    feedbackPrompt.style.display = "none";
    const button = Array.from(document.querySelectorAll("button")).find((item) => visible(item) && /send feedback/i.test(item.textContent || ""));
    if (button) button.click();
  });

  const draftEligible = (field) => {
    if (!field || !["INPUT", "TEXTAREA"].includes(field.tagName)) return false;
    if (field.type && !["text", "search", "email", ""].includes(field.type)) return false;
    return /feedback|task|paste|message|reply|intention|note/.test(normalize(`${field.placeholder || ""} ${field.getAttribute("aria-label") || ""}`));
  };
  const draftKey = (field) => `${DRAFT_PREFIX}${normalize(field.placeholder || field.getAttribute("aria-label") || field.name || "field").slice(0, 80)}`;
  const enhanceDraft = (field) => {
    if (!draftEligible(field) || field.dataset.plushlifeDraftEnhanced) return;
    field.dataset.plushlifeDraftEnhanced = "true";
    try {
      const saved = sessionStorage.getItem(draftKey(field));
      if (saved && !field.value) field.value = saved;
    } catch (_error) {}
    field.addEventListener("input", () => {
      try {
        if (field.value) sessionStorage.setItem(draftKey(field), field.value.slice(0, 5000));
        else sessionStorage.removeItem(draftKey(field));
      } catch (_error) {}
    }, { passive: true });
  };

  // Enhance only the field the user actually interacts with. This avoids scanning every input after every React render.
  document.addEventListener("focusin", (event) => enhanceDraft(event.target), { passive: true });
  document.querySelectorAll("input,textarea").forEach(enhanceDraft);

  const previousFetch = window.fetch.bind(window);
  window.fetch = async function plushLifeCompletionFetch(input, init) {
    try {
      const response = await previousFetch(input, init);
      const url = String(input?.url || input || "");
      const method = String(init?.method || input?.method || "GET").toUpperCase();
      if (!response.ok && /^https:\/\/[^/]+\.supabase\.co\//.test(url) && !["GET", "HEAD"].includes(method)) {
        failedRequests.unshift({ at: new Date().toISOString(), method, status: response.status, url: url.replace(/\?.*$/, "") });
        failedRequests.splice(20);
      }
      return response;
    } catch (error) {
      failedRequests.unshift({ at: new Date().toISOString(), method: String(init?.method || input?.method || "GET"), error: error?.message || "Network error", url: String(input?.url || input || "").replace(/\?.*$/, "") });
      failedRequests.splice(20);
      throw error;
    }
  };

  const openQa = () => {
    if (!isAdmin() || document.getElementById("plushlife-qa-panel")) return;
    const panel = document.createElement("div");
    panel.id = "plushlife-qa-panel";
    panel.innerHTML = `<div id="plushlife-qa-card"><div style="display:flex;gap:12px"><div style="flex:1"><div style="font-size:11px;font-weight:900;letter-spacing:.12em;color:#c45d74">PLUSHQA · ADMIN ONLY</div><h2 style="margin:5px 0">Safe test controls</h2></div><button type="button" data-close style="border:0;background:transparent;font-size:24px">×</button></div><div class="plushlife-qa-grid"><button data-action="clear">🧹 Clear local QA data</button><button data-action="logs">🔎 Refresh failed-request log</button></div><div class="plushlife-qa-log" data-log>No failed requests captured in this session.</div></div>`;
    document.body.appendChild(panel);
    const log = panel.querySelector("[data-log]");
    const refreshLog = () => { log.textContent = failedRequests.length ? failedRequests.map((item) => `${item.at} ${item.method} ${item.status || item.error || "failed"} ${item.url}`).join("\n") : "No failed requests captured in this session."; };
    panel.querySelector("[data-close]").addEventListener("click", () => panel.remove());
    panel.addEventListener("click", (event) => { if (event.target === panel) panel.remove(); });
    panel.querySelector('[data-action="clear"]').addEventListener("click", () => {
      Object.keys(sessionStorage).filter((key) => key.startsWith(DRAFT_PREFIX)).forEach((key) => sessionStorage.removeItem(key));
      failedRequests.splice(0);
      refreshLog();
    });
    panel.querySelector('[data-action="logs"]').addEventListener("click", refreshLog);
    refreshLog();
  };

  if (isAdmin()) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.plushlifeQaEntry = "true";
    button.textContent = "🧪";
    button.setAttribute("aria-label", "Open PlushQA admin tools");
    button.style.cssText = "position:fixed;right:14px;bottom:calc(66px + env(safe-area-inset-bottom));z-index:2147483000;border:1px solid #e4ccd9;border-radius:999px;background:#fff8fc;padding:9px 11px;box-shadow:0 5px 18px #5a416533;cursor:pointer";
    button.addEventListener("click", openQa);
    document.body.appendChild(button);
  }

  // No document-wide MutationObserver. The previous observer repeatedly scanned the whole app on every button-driven React update.
})();
