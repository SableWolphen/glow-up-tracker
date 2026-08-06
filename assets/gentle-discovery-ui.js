(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeGentleDiscoveryUiInstalled) return;
  window.__plushlifeGentleDiscoveryUiInstalled = true;

  const STORAGE_KEY = "plushlife-gentle-discovery-v2";
  const state = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_error) { return {}; } })();
  const saveState = (patch) => { Object.assign(state, patch); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_error) {} };
  const visible = (node) => !!(node && node.getClientRects && node.getClientRects().length);
  const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const findExternalButton = (patterns) => Array.from(document.querySelectorAll("button")).find((button) => {
    if (!visible(button) || button.closest("#plushlife-gentle-panel")) return false;
    const text = normalize(button.textContent);
    const label = normalize(button.getAttribute("aria-label"));
    return patterns.some((pattern) => text.includes(pattern) || label.includes(pattern));
  });

  const style = document.createElement("style");
  style.textContent = `
    #plushlife-gentle-launcher{position:fixed;right:10px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:2147483000;border:0;border-radius:999px;padding:10px 12px;background:linear-gradient(135deg,#b75acb,#6f8de8);color:#fff;font:800 12px system-ui,sans-serif;box-shadow:0 8px 26px #6b3e7a55;cursor:pointer}
    #plushlife-save-status{position:fixed;left:8px;bottom:calc(66px + env(safe-area-inset-bottom));z-index:2147482999;border-radius:999px;padding:8px 11px;background:#fff8fc;border:1px solid #ead7ef;color:#6d5b79;font:800 11px system-ui,sans-serif;box-shadow:0 5px 18px #5a416533;display:none;max-width:min(72vw,330px)}
    #plushlife-save-status[data-state="saving"],#plushlife-save-status[data-state="offline"],#plushlife-save-status[data-state="error"]{display:block}
    #plushlife-gentle-panel{position:fixed;inset:0;z-index:2147483001;background:#32243b99;display:grid;place-items:end center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));font-family:system-ui,sans-serif}
    #plushlife-gentle-card{width:min(520px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:#fff8fc;border:1px solid #ead7ef;box-shadow:0 20px 70px #26152f66;padding:18px;color:#5b4b6b}
    .plushlife-gentle-action{width:100%;border:1px solid #dec5e8;border-radius:16px;background:#fff;padding:13px 14px;margin-top:9px;text-align:left;color:#5b4b6b;cursor:pointer}
    .plushlife-gentle-action:active{transform:scale(.99)}
    .plushlife-gentle-close{border:0;background:transparent;font-size:22px;cursor:pointer;color:#806d8d}
    .plushlife-gentle-note{margin-top:12px;padding:11px;border-radius:14px;background:#f3e9f7;font-size:12px;line-height:1.45}
    [data-plushlife-rescue-hidden="true"]{display:none!important}
    body.plushlife-rescue-view #plushlife-gentle-launcher{background:linear-gradient(135deg,#4c8fe8,#56b7a2)}
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "plushlife-gentle-launcher";
  launcher.type = "button";
  launcher.textContent = state.rescueActive ? "🌿 Rescue active" : "🧸 PlushRescue";
  document.body.appendChild(launcher);

  const saveStatus = document.createElement("div");
  saveStatus.id = "plushlife-save-status";
  saveStatus.setAttribute("role", "status");
  document.body.appendChild(saveStatus);
  let saveTimer = null;
  const showSave = (kind, text) => {
    clearTimeout(saveTimer);
    saveStatus.dataset.state = kind;
    saveStatus.textContent = text;
    if (kind === "saved") saveTimer = setTimeout(() => { saveStatus.dataset.state = ""; saveStatus.style.display = "none"; }, 1200);
    else saveStatus.style.display = "block";
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function plushLifeStatusFetch(input, init) {
    const url = String((input && input.url) || input || "");
    const method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
    const isWrite = /^https:\/\/[^/]+\.supabase\.co\//.test(url) && !["GET", "HEAD"].includes(method);
    if (!isWrite) return originalFetch(input, init);
    showSave(navigator.onLine ? "saving" : "offline", navigator.onLine ? "Saving…" : "Offline — changes may need another try.");
    try {
      const response = await originalFetch(input, init);
      showSave(response.ok ? "saved" : "error", response.ok ? "Saved ✓" : "Needs another try.");
      return response;
    } catch (error) {
      showSave(navigator.onLine ? "error" : "offline", navigator.onLine ? "Needs another try." : "Offline — changes may need another try.");
      throw error;
    }
  };

  const taskRows = () => {
    const rows = [];
    document.querySelectorAll('input[type="checkbox"],[role="checkbox"],button[aria-pressed]').forEach((control) => {
      if (!visible(control)) return;
      const row = control.closest("li,article,[data-task-key],[class*='task-row'],[class*='task-card']") || control.parentElement;
      if (row && !rows.includes(row) && !row.closest("#plushlife-gentle-panel")) rows.push(row);
    });
    return rows;
  };

  const applyRescue = () => {
    const rows = taskRows();
    const keep = new Set(rows.slice(0, 3));
    rows.forEach((row) => {
      if (keep.has(row)) delete row.dataset.plushlifeRescueHidden;
      else row.dataset.plushlifeRescueHidden = "true";
    });
    document.body.classList.add("plushlife-rescue-view");
    saveState({ rescueActive: true, rescueUsed: true });
    launcher.textContent = "🌿 Rescue active";
    return rows.length;
  };

  const stopRescue = () => {
    document.querySelectorAll('[data-plushlife-rescue-hidden="true"]').forEach((row) => delete row.dataset.plushlifeRescueHidden);
    document.body.classList.remove("plushlife-rescue-view");
    saveState({ rescueActive: false });
    launcher.textContent = "🧸 PlushRescue";
  };

  let panel = null;
  const note = (text) => { const node = panel && panel.querySelector(".plushlife-gentle-note"); if (node) node.textContent = text; };
  const closePanel = () => { if (panel) panel.remove(); panel = null; };
  const activateOutsideButton = (patterns, fallbackMessage) => {
    const button = findExternalButton(patterns);
    if (!button) { note(fallbackMessage); return false; }
    closePanel();
    window.setTimeout(() => button.click(), 0);
    return true;
  };

  const openPanel = () => {
    if (panel) return;
    panel = document.createElement("div");
    panel.id = "plushlife-gentle-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.innerHTML = `<div id="plushlife-gentle-card"><div style="display:flex;gap:12px"><div style="flex:1"><strong>PLUSH TOOLS</strong><h2 style="margin:5px 0">What would help right now?</h2></div><button class="plushlife-gentle-close" type="button" aria-label="Close PlushRescue">×</button></div><button type="button" class="plushlife-gentle-action" data-action="tasks">➕ Add all my tasks</button><button type="button" class="plushlife-gentle-action" data-action="rescue">🌿 ${state.rescueActive ? "Refresh Rescue view" : "I’m overwhelmed"}</button>${state.rescueActive ? '<button type="button" class="plushlife-gentle-action" data-action="normal">↩️ Return to my full day</button>' : ""}<button type="button" class="plushlife-gentle-action" data-action="progress">✨ Open PlushProgress</button><div class="plushlife-gentle-note">Choose an option above.</div><div style="margin-top:12px;padding:11px;border-radius:14px;background:#f3e9f7"><strong>PlushInsights</strong><br>Gentle summaries stay available without rescanning the whole app.</div></div>`;
    document.body.appendChild(panel);
    panel.querySelector(".plushlife-gentle-close").addEventListener("click", closePanel);
    panel.addEventListener("click", (event) => { if (event.target === panel) closePanel(); });
    panel.querySelector('[data-action="tasks"]').addEventListener("click", () => activateOutsideButton(["manage tasks", "add task", "edit tasks", "tasks"], "Open the Today screen first, then try Add all my tasks again."));
    panel.querySelector('[data-action="rescue"]').addEventListener("click", () => {
      const count = applyRescue();
      note(count ? `Rescue mode is active. Showing up to 3 caring steps from ${count}.` : "Open Today where your tasks are visible, then try Rescue again.");
      if (count) window.setTimeout(closePanel, 450);
    });
    const normal = panel.querySelector('[data-action="normal"]');
    if (normal) normal.addEventListener("click", () => { stopRescue(); closePanel(); });
    panel.querySelector('[data-action="progress"]').addEventListener("click", () => activateOutsideButton(["plushprogress", "progress", "insights"], "Open the main dashboard first, then try PlushProgress again."));
  };

  launcher.addEventListener("click", openPanel);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closePanel(); });
  window.addEventListener("offline", () => showSave("offline", "Offline — your loaded content stays available."));
  window.addEventListener("online", () => showSave("saved", "Back online ✓"));

  // No document-wide MutationObserver. React is free to update screens without triggering full-page rescans.
  if (state.rescueActive) setTimeout(applyRescue, 400);
})();
