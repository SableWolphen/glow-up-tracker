(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeGentleDiscoveryUiInstalled) return;
  window.__plushlifeGentleDiscoveryUiInstalled = true;

  const STORAGE_KEY = "plushlife-rescue-v3";
  const TODAY = new Date().toISOString().slice(0, 10);
  const state = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_) { return {}; } })();
  const saveState = (patch) => { Object.assign(state, patch); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} };
  const visible = (node) => !!(node && node.getClientRects && node.getClientRects().length);

  const style = document.createElement("style");
  style.textContent = `
    #plushlife-gentle-launcher{position:fixed;right:10px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:2147483000;border:0;border-radius:999px;padding:10px 12px;background:linear-gradient(135deg,#b75acb,#6f8de8);color:#fff;font:800 12px system-ui,sans-serif;box-shadow:0 8px 26px #6b3e7a55;cursor:pointer}
    #plushlife-gentle-panel{position:fixed;inset:0;z-index:2147483001;background:#32243b99;display:grid;place-items:end center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));font-family:system-ui,sans-serif}
    #plushlife-gentle-card{width:min(520px,100%);max-height:82vh;overflow:auto;border-radius:24px;background:#fff8fc;border:1px solid #ead7ef;box-shadow:0 20px 70px #26152f66;padding:18px;color:#5b4b6b}
    .plushlife-gentle-action{width:100%;border:1px solid #dec5e8;border-radius:16px;background:#fff;padding:13px 14px;margin-top:9px;text-align:left;color:#5b4b6b;cursor:pointer;font:700 14px system-ui,sans-serif}
    .plushlife-gentle-action small{display:block;margin-top:4px;font-weight:500;opacity:.76}
    .plushlife-gentle-action:active{transform:scale(.99)}
    .plushlife-gentle-close{border:0;background:transparent;font-size:22px;cursor:pointer;color:#806d8d}
    .plushlife-gentle-note{margin-top:12px;padding:11px;border-radius:14px;background:#f3e9f7;font-size:12px;line-height:1.45}
    [data-plushlife-rescue-hidden="true"]{display:none!important}
    [data-plushlife-rescue-focus="true"]{outline:3px solid #8f79d8!important;outline-offset:3px;border-radius:14px}
    body.plushlife-rescue-view #plushlife-gentle-launcher{background:linear-gradient(135deg,#4c8fe8,#56b7a2)}
    body.plushlife-pressure-paused [aria-label*="reminder" i],body.plushlife-pressure-paused [class*="streak" i],body.plushlife-pressure-paused [class*="overdue" i]{opacity:.28!important}
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "plushlife-gentle-launcher";
  launcher.type = "button";
  launcher.textContent = state.mode ? "🌿 Rescue active" : "🧸 PlushRescue";
  document.body.appendChild(launcher);

  const taskRows = () => {
    const rows = [];
    document.querySelectorAll('input[type="checkbox"],[role="checkbox"],button[aria-pressed]').forEach((control) => {
      if (!visible(control)) return;
      const row = control.closest("li,article,[data-task-key],[class*='task-row'],[class*='task-card']") || control.parentElement;
      if (row && !rows.includes(row) && !row.closest("#plushlife-gentle-panel")) rows.push(row);
    });
    return rows;
  };

  const restore = () => {
    document.querySelectorAll('[data-plushlife-rescue-hidden="true"]').forEach((row) => delete row.dataset.plushlifeRescueHidden);
    document.querySelectorAll('[data-plushlife-rescue-focus="true"]').forEach((row) => delete row.dataset.plushlifeRescueFocus);
    document.body.classList.remove("plushlife-rescue-view", "plushlife-pressure-paused");
    saveState({ mode: null, pressureDate: null });
    launcher.textContent = "🧸 PlushRescue";
  };

  const showOnly = (count, focusFirst) => {
    const rows = taskRows();
    if (!rows.length) return 0;
    rows.forEach((row, index) => {
      if (index < count) delete row.dataset.plushlifeRescueHidden;
      else row.dataset.plushlifeRescueHidden = "true";
      delete row.dataset.plushlifeRescueFocus;
    });
    if (focusFirst) {
      rows[0].dataset.plushlifeRescueFocus = "true";
      rows[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    document.body.classList.add("plushlife-rescue-view");
    launcher.textContent = "🌿 Rescue active";
    return rows.length;
  };

  let panel = null;
  const closePanel = () => { if (panel) panel.remove(); panel = null; };
  const note = (text) => { const node = panel && panel.querySelector(".plushlife-gentle-note"); if (node) node.textContent = text; };
  const finish = (text) => { note(text); window.setTimeout(closePanel, 650); };

  const openPanel = () => {
    if (panel) return;
    panel = document.createElement("div");
    panel.id = "plushlife-gentle-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.innerHTML = `<div id="plushlife-gentle-card"><div style="display:flex;gap:12px"><div style="flex:1"><strong>PLUSHRESCUE</strong><h2 style="margin:5px 0">What do you need right now?</h2><p style="margin:0 0 8px;line-height:1.45">You don’t have to do everything today. Let’s make this smaller.</p></div><button class="plushlife-gentle-close" type="button" aria-label="Close PlushRescue">×</button></div><button class="plushlife-gentle-action" data-action="smaller">🌿 Make today smaller<small>Show only up to three caring steps. Nothing is deleted.</small></button><button class="plushlife-gentle-action" data-action="next">✨ Give me one next step<small>Put one doable task front and center.</small></button><button class="plushlife-gentle-action" data-action="pause">🌙 Pause the pressure<small>Soften reminders, streaks, and overdue pressure for today.</small></button><button class="plushlife-gentle-action" data-action="restore">↩️ Back to my full day<small>Restore everything exactly as it was.</small></button><div class="plushlife-gentle-note">Choose what would feel kindest right now.</div></div>`;
    document.body.appendChild(panel);
    panel.querySelector(".plushlife-gentle-close").addEventListener("click", closePanel);
    panel.addEventListener("click", (event) => { if (event.target === panel) closePanel(); });
    panel.querySelector('[data-action="smaller"]').addEventListener("click", () => {
      const count = showOnly(3, false);
      if (!count) return note("Open Today where your tasks are visible, then try again.");
      saveState({ mode: "smaller" });
      finish(`Today is smaller now. Showing ${Math.min(3, count)} of ${count} steps.`);
    });
    panel.querySelector('[data-action="next"]').addEventListener("click", () => {
      const count = showOnly(1, true);
      if (!count) return note("Open Today where your tasks are visible, then try again.");
      saveState({ mode: "next" });
      finish("One next step is ready. The rest can wait.");
    });
    panel.querySelector('[data-action="pause"]').addEventListener("click", () => {
      document.body.classList.add("plushlife-pressure-paused");
      saveState({ mode: "pause", pressureDate: TODAY });
      launcher.textContent = "🌿 Rescue active";
      finish("Pressure is softened for today. Your tasks and data are unchanged.");
    });
    panel.querySelector('[data-action="restore"]').addEventListener("click", () => { restore(); finish("Your full day is back."); });
  };

  launcher.addEventListener("click", openPanel);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closePanel(); });

  if (state.pressureDate && state.pressureDate !== TODAY) restore();
  else if (state.mode === "smaller") setTimeout(() => showOnly(3, false), 400);
  else if (state.mode === "next") setTimeout(() => showOnly(1, true), 400);
  else if (state.mode === "pause") document.body.classList.add("plushlife-pressure-paused");
})();
