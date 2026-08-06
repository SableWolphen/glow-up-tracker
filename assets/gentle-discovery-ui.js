(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeGentleDiscoveryUiInstalled) return;
  window.__plushlifeGentleDiscoveryUiInstalled = true;

  const STORAGE_KEY = "plushlife-rescue-v4";
  const TODAY = new Date().toISOString().slice(0, 10);
  const state = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_) { return {}; } })();
  const saveState = (patch) => { Object.assign(state, patch); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} };
  const visible = (node) => !!(node && node.getClientRects && node.getClientRects().length);
  const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const style = document.createElement("style");
  style.textContent = `
    #plushlife-gentle-launcher{position:fixed;right:10px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:2147483000;border:0;border-radius:999px;padding:10px 12px;background:linear-gradient(135deg,#b75acb,#6f8de8);color:#fff;font:800 12px system-ui,sans-serif;box-shadow:0 8px 26px #6b3e7a55;cursor:pointer}
    #plushlife-gentle-panel{position:fixed;inset:0;z-index:2147483001;background:#32243b99;display:grid;place-items:end center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));font-family:system-ui,sans-serif}
    #plushlife-gentle-card{width:min(520px,100%);max-height:84vh;overflow:auto;border-radius:24px;background:#fff8fc;border:1px solid #ead7ef;box-shadow:0 20px 70px #26152f66;padding:18px;color:#5b4b6b}
    .plushlife-gentle-action{width:100%;border:1px solid #dec5e8;border-radius:16px;background:#fff;padding:13px 14px;margin-top:9px;text-align:left;color:#5b4b6b;cursor:pointer;font:700 14px system-ui,sans-serif}
    .plushlife-gentle-action small{display:block;margin-top:4px;font-weight:500;opacity:.76}
    .plushlife-gentle-action:active{transform:scale(.99)}
    .plushlife-gentle-close{border:0;background:transparent;font-size:22px;cursor:pointer;color:#806d8d}
    .plushlife-gentle-note{margin-top:12px;padding:11px;border-radius:14px;background:#f3e9f7;font-size:12px;line-height:1.45}
    .plushlife-energy-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 4px}
    .plushlife-energy{border:1px solid #dec5e8;border-radius:14px;background:#fff;padding:10px;color:#5b4b6b;font:700 13px system-ui,sans-serif;cursor:pointer}
    .plushlife-energy[aria-pressed="true"]{background:#efe5f7;border-color:#9b7cc9}
    [data-plushlife-rescue-hidden="true"]{display:none!important}
    [data-plushlife-rescue-focus="true"]{outline:3px solid #8f79d8!important;outline-offset:3px;border-radius:14px}
    [data-plushlife-tiny-step]{position:relative}
    [data-plushlife-tiny-step]::after{content:attr(data-plushlife-tiny-step);display:block;margin-top:7px;padding:7px 9px;border-radius:10px;background:#f4ecf8;color:#6b5676;font:700 11px system-ui,sans-serif}
    body.plushlife-rescue-view #plushlife-gentle-launcher{background:linear-gradient(135deg,#4c8fe8,#56b7a2)}
    body.plushlife-pressure-paused [aria-label*="reminder" i],body.plushlife-pressure-paused [class*="streak" i],body.plushlife-pressure-paused [class*="overdue" i]{opacity:.28!important}
    #plushlife-win{position:fixed;left:50%;bottom:calc(76px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483002;max-width:min(88vw,420px);padding:11px 14px;border-radius:16px;background:#fff8fc;border:1px solid #dec5e8;box-shadow:0 10px 30px #4f365744;color:#5b4b6b;font:800 13px system-ui,sans-serif;text-align:center}
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

  const taskLabel = (row) => cleanText(row && row.textContent).slice(0, 90);
  const tinyStepFor = (label) => {
    const lower = label.toLowerCase();
    if (/clean|tidy|organize|laundry/.test(lower)) return "PlushTinyStep: put away one thing.";
    if (/exercise|workout|walk|gym|stretch/.test(lower)) return "PlushTinyStep: move for two minutes.";
    if (/email|message|reply|call/.test(lower)) return "PlushTinyStep: open the first message.";
    if (/study|read|homework|learn/.test(lower)) return "PlushTinyStep: do two focused minutes.";
    if (/cook|meal|eat|food/.test(lower)) return "PlushTinyStep: prepare one simple part.";
    return "PlushTinyStep: do the smallest visible part.";
  };

  const clearPresentation = () => {
    document.querySelectorAll('[data-plushlife-rescue-hidden="true"]').forEach((row) => delete row.dataset.plushlifeRescueHidden);
    document.querySelectorAll('[data-plushlife-rescue-focus="true"]').forEach((row) => delete row.dataset.plushlifeRescueFocus);
    document.querySelectorAll('[data-plushlife-tiny-step]').forEach((row) => delete row.dataset.plushlifeTinyStep);
  };

  const restore = () => {
    clearPresentation();
    document.body.classList.remove("plushlife-rescue-view", "plushlife-pressure-paused");
    saveState({ mode: null, pressureDate: null, reentry: false });
    launcher.textContent = "🧸 PlushRescue";
  };

  const showOnly = (count, focusFirst, useTinySteps) => {
    const rows = taskRows();
    if (!rows.length) return 0;
    rows.forEach((row, index) => {
      if (index < count) delete row.dataset.plushlifeRescueHidden;
      else row.dataset.plushlifeRescueHidden = "true";
      delete row.dataset.plushlifeRescueFocus;
      delete row.dataset.plushlifeTinyStep;
      if (index < count && useTinySteps) row.dataset.plushlifeTinyStep = tinyStepFor(taskLabel(row));
    });
    if (focusFirst) {
      rows[0].dataset.plushlifeRescueFocus = "true";
      rows[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    document.body.classList.add("plushlife-rescue-view");
    launcher.textContent = "🌿 Rescue active";
    return rows.length;
  };

  const showWin = () => {
    const old = document.getElementById("plushlife-win");
    if (old) old.remove();
    const win = document.createElement("div");
    win.id = "plushlife-win";
    win.textContent = "✨ PlushWin — you made today a little lighter.";
    document.body.appendChild(win);
    window.setTimeout(() => win.remove(), 2600);
  };

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!state.mode || !target || target.type !== "checkbox" || !target.checked) return;
    showWin();
    saveState({ completedInRescue: (state.completedInRescue || 0) + 1, reentry: true });
  });

  let panel = null;
  const closePanel = () => { if (panel) panel.remove(); panel = null; };
  const note = (text) => { const node = panel && panel.querySelector(".plushlife-gentle-note"); if (node) node.textContent = text; };
  const finish = (text) => { note(text); window.setTimeout(closePanel, 700); };

  const applyEnergy = (energy) => {
    saveState({ energy, energyDate: TODAY });
    const map = { empty: [1, true, true], low: [2, false, true], okay: [3, false, false], ready: [5, false, false] };
    const plan = map[energy] || map.low;
    const count = showOnly(plan[0], plan[1], plan[2]);
    if (count) saveState({ mode: energy === "empty" ? "next" : "smaller", reentry: true });
    return count;
  };

  const openPanel = () => {
    if (panel) return;
    const returning = state.reentry && state.mode;
    panel = document.createElement("div");
    panel.id = "plushlife-gentle-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.innerHTML = `<div id="plushlife-gentle-card"><div style="display:flex;gap:12px"><div style="flex:1"><strong>PLUSHRESCUE</strong><h2 style="margin:5px 0">${returning ? "Welcome back. Your day stayed safe." : "What can today realistically hold?"}</h2><p style="margin:0 0 8px;line-height:1.45">${returning ? "Keep it small, continue with one step, or gently rebuild your day." : "Choose your energy first. PlushLife will make the plan fit you."}</p></div><button class="plushlife-gentle-close" type="button" aria-label="Close PlushRescue">×</button></div><div class="plushlife-energy-grid"><button class="plushlife-energy" data-energy="empty" aria-pressed="${state.energy === "empty"}">🫧 Empty</button><button class="plushlife-energy" data-energy="low" aria-pressed="${state.energy === "low"}">🌙 Low</button><button class="plushlife-energy" data-energy="okay" aria-pressed="${state.energy === "okay"}">🌿 Okay</button><button class="plushlife-energy" data-energy="ready" aria-pressed="${state.energy === "ready"}">✨ Ready</button></div><button class="plushlife-gentle-action" data-action="smaller">🌿 Make today smaller<small>Show a few caring steps. Low energy also adds PlushTinySteps.</small></button><button class="plushlife-gentle-action" data-action="next">✨ Give me one next step<small>Put one doable task front and center.</small></button><button class="plushlife-gentle-action" data-action="pause">🌙 Pause the pressure<small>Soften reminders, streaks, and overdue pressure for today.</small></button><button class="plushlife-gentle-action" data-action="landing">🪶 Gently rebuild my day<small>Bring back one more task instead of everything at once.</small></button><button class="plushlife-gentle-action" data-action="carryover">🌅 Decide what carries over<small>Keep today small now and review unfinished tasks tomorrow.</small></button><button class="plushlife-gentle-action" data-action="restore">↩️ Back to my full day<small>Restore everything exactly as it was.</small></button><div class="plushlife-gentle-note">Doing the smallest version still counts.</div></div>`;
    document.body.appendChild(panel);
    panel.querySelector(".plushlife-gentle-close").addEventListener("click", closePanel);
    panel.addEventListener("click", (event) => { if (event.target === panel) closePanel(); });
    panel.querySelectorAll("[data-energy]").forEach((button) => button.addEventListener("click", () => {
      panel.querySelectorAll("[data-energy]").forEach((item) => item.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      const count = applyEnergy(button.dataset.energy);
      if (!count) return note("Open Today where your tasks are visible, then choose your energy again.");
      finish(`PlushEnergy adjusted today for ${button.textContent.trim().toLowerCase()} energy.`);
    }));
    panel.querySelector('[data-action="smaller"]').addEventListener("click", () => {
      const useTiny = state.energy === "empty" || state.energy === "low";
      const count = showOnly(state.energy === "empty" ? 1 : 3, false, useTiny);
      if (!count) return note("Open Today where your tasks are visible, then try again.");
      saveState({ mode: "smaller", reentry: true });
      finish(`Today is smaller now. Showing ${Math.min(state.energy === "empty" ? 1 : 3, count)} of ${count} steps.`);
    });
    panel.querySelector('[data-action="next"]').addEventListener("click", () => {
      const count = showOnly(1, true, true);
      if (!count) return note("Open Today where your tasks are visible, then try again.");
      saveState({ mode: "next", reentry: true });
      finish("One PlushTinyStep is ready. The rest can wait.");
    });
    panel.querySelector('[data-action="pause"]').addEventListener("click", () => {
      document.body.classList.add("plushlife-pressure-paused");
      saveState({ mode: "pause", pressureDate: TODAY, reentry: true });
      launcher.textContent = "🌿 Rescue active";
      finish("Pressure is softened for today. Your tasks and data are unchanged.");
    });
    panel.querySelector('[data-action="landing"]').addEventListener("click", () => {
      const rows = taskRows();
      if (!rows.length) return note("Open Today where your tasks are visible, then try again.");
      const currentlyVisible = rows.filter((row) => row.dataset.plushlifeRescueHidden !== "true").length;
      const nextCount = Math.min(rows.length, Math.max(1, currentlyVisible + 1));
      showOnly(nextCount, false, state.energy === "empty" || state.energy === "low");
      saveState({ mode: nextCount === rows.length ? null : "landing", reentry: nextCount !== rows.length });
      if (nextCount === rows.length) launcher.textContent = "🧸 PlushRescue";
      finish(nextCount === rows.length ? "Your full day has been gently restored." : `PlushLanding brought back one more step. ${nextCount} are visible now.`);
    });
    panel.querySelector('[data-action="carryover"]').addEventListener("click", () => {
      saveState({ carryoverDate: TODAY, reentry: true });
      finish("PlushCarryover saved this as a small day. Tomorrow, unfinished steps can be moved, made smaller, or released.");
    });
    panel.querySelector('[data-action="restore"]').addEventListener("click", () => { restore(); finish("Your full day is back."); });
  };

  launcher.addEventListener("click", openPanel);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closePanel(); });

  if (state.pressureDate && state.pressureDate !== TODAY) restore();
  else if (state.mode === "smaller") setTimeout(() => showOnly(state.energy === "empty" ? 1 : 3, false, state.energy === "empty" || state.energy === "low"), 400);
  else if (state.mode === "next") setTimeout(() => showOnly(1, true, true), 400);
  else if (state.mode === "landing") setTimeout(() => showOnly(2, false, state.energy === "empty" || state.energy === "low"), 400);
  else if (state.mode === "pause") document.body.classList.add("plushlife-pressure-paused");
})();
