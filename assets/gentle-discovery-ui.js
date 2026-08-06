(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeGentleDiscoveryUiInstalled) return;
  window.__plushlifeGentleDiscoveryUiInstalled = true;

  const care = window.PlushLifeCare;
  const STORAGE_KEY = "plushlife-gentle-discovery-v2";
  const state = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_error) { return {}; } })();
  const saveState = (patch) => { Object.assign(state, patch); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_error) {} };
  const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const visible = (node) => !!(node && node.getClientRects && node.getClientRects().length);
  const allButtons = () => Array.from(document.querySelectorAll("button")).filter(visible);
  const findButton = (patterns) => allButtons().find((button) => patterns.some((pattern) => normalize(button.textContent).includes(pattern)));
  const clickFirst = (patterns) => { const button = findButton(patterns); if (!button) return false; button.click(); return true; };

  const style = document.createElement("style");
  style.textContent = `
    #plushlife-gentle-launcher{position:fixed;right:14px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:2147483000;border:0;border-radius:999px;padding:11px 15px;background:linear-gradient(135deg,#b75acb,#6f8de8);color:#fff;font:800 13px system-ui,sans-serif;box-shadow:0 8px 26px #6b3e7a55;cursor:pointer}
    #plushlife-save-status{position:fixed;left:12px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:2147482999;border-radius:999px;padding:8px 11px;background:#fff8fc;border:1px solid #ead7ef;color:#6d5b79;font:800 11px system-ui,sans-serif;box-shadow:0 5px 18px #5a416533;display:none;max-width:min(72vw,330px)}
    #plushlife-save-status[data-state="saving"],#plushlife-save-status[data-state="offline"],#plushlife-save-status[data-state="error"]{display:block}
    #plushlife-save-status button{border:0;background:transparent;color:#8a4da0;font:inherit;text-decoration:underline;cursor:pointer;margin-left:5px}
    #plushlife-gentle-panel{position:fixed;inset:0;z-index:2147483001;background:#32243b99;display:grid;place-items:end center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));font-family:system-ui,sans-serif}
    #plushlife-gentle-card{width:min(520px,100%);max-height:min(82vh,740px);overflow:auto;border-radius:24px;background:#fff8fc;border:1px solid #ead7ef;box-shadow:0 20px 70px #26152f66;padding:18px;color:#5b4b6b}
    .plushlife-gentle-action{width:100%;border:1px solid #dec5e8;border-radius:16px;background:#fff;padding:13px 14px;margin-top:9px;text-align:left;color:#5b4b6b;cursor:pointer}
    .plushlife-gentle-action strong{display:block;font-size:14px}.plushlife-gentle-action span{display:block;margin-top:3px;font-size:12px;line-height:1.45;color:#806d8d}
    .plushlife-gentle-close{border:0;background:transparent;font-size:22px;cursor:pointer;color:#806d8d}
    .plushlife-gentle-note,.plushlife-insight{margin-top:12px;padding:11px 12px;border-radius:14px;background:#f3e9f7;font-size:12px;line-height:1.45}
    .plushlife-discovery-card{margin:12px 0;padding:13px;border:1px solid #ead7ef;border-radius:16px;background:#fff8fc;font-family:system-ui,sans-serif;color:#5b4b6b}
    .plushlife-discovery-card button{margin-top:8px;border:1px solid #dec5e8;border-radius:999px;background:#fff;padding:7px 10px;color:#6f5480;font-weight:800;cursor:pointer}
    [data-plushlife-rescue-hidden="true"]{display:none!important}
    body.plushlife-rescue-view #plushlife-gentle-launcher{background:linear-gradient(135deg,#4c8fe8,#56b7a2)}
    @media(max-width:420px){#plushlife-gentle-launcher{right:10px;padding:10px 12px}#plushlife-save-status{left:8px;bottom:calc(66px + env(safe-area-inset-bottom))}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}.plushlife-gentle-panel,.plushlife-gentle-card{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "plushlife-gentle-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-haspopup", "dialog");
  launcher.textContent = state.rescueActive ? "🌿 Rescue active" : "🧸 PlushRescue";
  document.body.appendChild(launcher);

  const saveStatus = document.createElement("div");
  saveStatus.id = "plushlife-save-status";
  saveStatus.setAttribute("role", "status");
  saveStatus.setAttribute("aria-live", "polite");
  document.body.appendChild(saveStatus);
  let saveTimer = null;
  let retryLast = null;
  const showSave = (kind, text, retry) => {
    clearTimeout(saveTimer);
    saveStatus.dataset.state = kind;
    saveStatus.textContent = text;
    retryLast = retry || null;
    if (retryLast) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Retry";
      button.addEventListener("click", () => retryLast && retryLast());
      saveStatus.appendChild(button);
    }
    if (kind === "saved") saveTimer = setTimeout(() => { saveStatus.dataset.state = ""; saveStatus.style.display = "none"; }, 1600);
    else saveStatus.style.display = "block";
  };
  const isSupabaseWrite = (input, init) => {
    const url = String((input && input.url) || input || "");
    const method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
    return /^https:\/\/[^/]+\.supabase\.co\//.test(url) && !["GET", "HEAD"].includes(method);
  };
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function plushLifeStatusFetch(input, init) {
    if (!isSupabaseWrite(input, init)) return originalFetch(input, init);
    if (!navigator.onLine) showSave("offline", "Offline — your last loaded content is still here.");
    else showSave("saving", "Saving…");
    const retry = () => window.fetch(input, init);
    try {
      const response = await originalFetch(input, init);
      if (!response.ok) showSave("error", "Needs another try.", retry);
      else showSave("saved", "Saved ✓");
      return response;
    } catch (error) {
      showSave(navigator.onLine ? "error" : "offline", navigator.onLine ? "Needs another try." : "Offline — changes may need another try.", retry);
      throw error;
    }
  };
  window.addEventListener("offline", () => showSave("offline", "Offline — your loaded content stays available."));
  window.addEventListener("online", () => showSave("saved", "Back online ✓"));

  const taskRows = () => {
    const controls = Array.from(document.querySelectorAll('input[type="checkbox"],[role="checkbox"],button[aria-pressed]')).filter(visible);
    const rows = [];
    controls.forEach((control) => {
      let row = control.closest("li,article,[data-task-key],[class*='task-row'],[class*='task-card']");
      if (!row) {
        row = control.parentElement;
        for (let i = 0; row && i < 4 && normalize(row.textContent).length < 8; i += 1) row = row.parentElement;
      }
      if (row && normalize(row.textContent).length > 2 && !rows.includes(row)) rows.push(row);
    });
    return rows.filter((row) => !row.closest("#plushlife-gentle-panel"));
  };
  const rowPriority = (row) => {
    const text = normalize(row.textContent);
    if (/essential|medicine|medication|eat|drink|water|appointment|urgent/.test(text)) return 0;
    if (/tiny|soft|quick|5 min|10 min/.test(text)) return 1;
    return 2;
  };
  const applyRescue = () => {
    const rows = taskRows().sort((a, b) => rowPriority(a) - rowPriority(b));
    if (!rows.length) return { hidden: 0, shown: 0 };
    const keep = new Set(rows.slice(0, 3));
    rows.forEach((row) => {
      if (keep.has(row)) row.removeAttribute("data-plushlife-rescue-hidden");
      else row.setAttribute("data-plushlife-rescue-hidden", "true");
    });
    document.body.classList.add("plushlife-rescue-view");
    saveState({ rescueActive: true, rescueUsed: true, rescueUsedAt: new Date().toISOString() });
    launcher.textContent = "🌿 Rescue active";
    return { hidden: Math.max(0, rows.length - keep.size), shown: keep.size };
  };
  const stopRescue = () => {
    document.querySelectorAll('[data-plushlife-rescue-hidden="true"]').forEach((row) => row.removeAttribute("data-plushlife-rescue-hidden"));
    document.body.classList.remove("plushlife-rescue-view");
    saveState({ rescueActive: false });
    launcher.textContent = "🧸 PlushRescue";
  };
  if (state.rescueActive) setTimeout(applyRescue, 500);

  let panel = null;
  const closePanel = () => { if (panel) panel.remove(); panel = null; launcher.focus(); };
  const message = (text) => { const note = panel && panel.querySelector(".plushlife-gentle-note"); if (note) note.textContent = text; };
  const openTaskImporter = () => {
    if (!clickFirst(["manage tasks", "add task", "edit tasks"])) return message("Open Today, then tap Manage tasks. Paste one task per line to add your whole list.");
    message("Task manager opened. Paste one task per line; bullets, numbers, and checkboxes are cleaned automatically.");
    setTimeout(() => { const textarea = Array.from(document.querySelectorAll("textarea")).find((item) => /task|paste|line/i.test(`${item.placeholder || ""} ${item.getAttribute("aria-label") || ""}`)); if (textarea) textarea.focus(); }, 180);
  };
  const startRescue = () => {
    clickFirst(["recovery day", "tiny day", "soft day"]);
    const result = applyRescue();
    message(result.shown ? `Showing ${result.shown} caring steps and temporarily hiding ${result.hidden}. Your full list is preserved.` : "Open Today and choose Rescue again. Your full list will stay preserved.");
  };
  const openProgress = () => { if (clickFirst(["progress", "plushprogress"])) { saveState({ progressSeen: true }); closePanel(); } else message("Open the PlushProgress tab when you’re ready."); };
  const fillGuardianReply = (text) => {
    const guardianArea = Array.from(document.querySelectorAll("textarea,input[type='text']")).find((field) => visible(field) && /guardian|message|reply|support/i.test(`${field.placeholder || ""} ${field.getAttribute("aria-label") || ""} ${field.closest("section,div")?.textContent || ""}`));
    if (!guardianArea) return message("Open PlushGuardian first, then choose a quick reply. PlushLife will fill it without sending automatically.");
    const prototype = guardianArea.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(guardianArea, text); else guardianArea.value = text;
    guardianArea.dispatchEvent(new Event("input", { bubbles: true }));
    guardianArea.focus();
    message("Reply filled in. Review it, then send when you’re ready.");
  };
  const insightText = () => {
    const rows = taskRows();
    const checked = rows.filter((row) => row.querySelector('input[type="checkbox"]:checked,[role="checkbox"][aria-checked="true"],button[aria-pressed="true"]')).length;
    if (!rows.length) return "Add a few tasks and PlushInsights will gently summarize patterns without scoring you.";
    if (!checked) return "Nothing completed yet—and that is information, not failure. A Tiny or Soft version may help today.";
    if (checked === rows.length) return `You completed all ${rows.length} visible caring steps. PlushInsights notices consistency, not perfection.`;
    return `You completed ${checked} of ${rows.length} visible caring steps. That can be enough; the rest can stay flexible.`;
  };

  const openPanel = () => {
    if (panel) return;
    panel = document.createElement("div");
    panel.id = "plushlife-gentle-panel";
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", "PlushRescue and gentle tools");
    panel.innerHTML = `
      <div id="plushlife-gentle-card">
        <div style="display:flex;align-items:flex-start;gap:12px"><div style="flex:1"><div style="font-size:11px;letter-spacing:.12em;font-weight:900;color:#a65dc1">PLUSH TOOLS</div><h2 style="margin:5px 0 0;font-size:21px">What would help right now?</h2><p style="margin:5px 0 0;font-size:12.5px;line-height:1.45;color:#806d8d">Nothing here limits how many tasks you can add.</p></div><button class="plushlife-gentle-close" type="button" aria-label="Close">×</button></div>
        <button class="plushlife-gentle-action" data-action="tasks"><strong>➕ Add all my tasks</strong><span>Open bulk entry and paste one task per line.</span></button>
        <button class="plushlife-gentle-action" data-action="rescue"><strong>🌿 ${state.rescueActive ? "Refresh Rescue view" : "I’m overwhelmed"}</strong><span>Show only a few essential, short, Tiny, or Soft steps while preserving the full list.</span></button>
        ${state.rescueActive ? '<button class="plushlife-gentle-action" data-action="normal"><strong>↩️ Return to my full day</strong><span>Restore every hidden task without changing completion history.</span></button>' : ""}
        <button class="plushlife-gentle-action" data-action="progress"><strong>✨ Open PlushProgress</strong><span>See progress without pressure.</span></button>
        <div class="plushlife-insight"><strong>PlushInsights</strong><br>${insightText()}</div>
        <div class="plushlife-gentle-note">Nothing changes until you choose an option.</div>
        <div style="margin-top:14px;font-size:11px;font-weight:900;color:#a65dc1">PLUSHGUARDIAN QUICK REPLIES</div>
        <button class="plushlife-gentle-action" data-reply="I saw this 💛"><strong>I saw this</strong></button>
        <button class="plushlife-gentle-action" data-reply="Proud of you 💛"><strong>Proud of you</strong></button>
        <button class="plushlife-gentle-action" data-reply="Need anything?"><strong>Need anything?</strong></button>
        <button class="plushlife-gentle-action" data-reply="No reply needed 💛"><strong>No reply needed</strong></button>
      </div>`;
    document.body.appendChild(panel);
    panel.querySelector(".plushlife-gentle-close").addEventListener("click", closePanel);
    panel.addEventListener("click", (event) => { if (event.target === panel) closePanel(); });
    panel.querySelector('[data-action="tasks"]').addEventListener("click", openTaskImporter);
    panel.querySelector('[data-action="rescue"]').addEventListener("click", startRescue);
    panel.querySelector('[data-action="progress"]').addEventListener("click", openProgress);
    panel.querySelector('[data-action="normal"]')?.addEventListener("click", () => { stopRescue(); message("Your full day is back. Completion history was not changed."); });
    panel.querySelectorAll("[data-reply]").forEach((button) => button.addEventListener("click", () => fillGuardianReply(button.dataset.reply)));
    panel.querySelector(".plushlife-gentle-close").focus();
  };
  launcher.addEventListener("click", openPanel);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && panel) closePanel(); });

  const enhanceBulkTextarea = (textarea) => {
    if (!textarea || textarea.dataset.plushlifeBulkEnhanced) return;
    const descriptor = `${textarea.placeholder || ""} ${textarea.getAttribute("aria-label") || ""}`;
    if (!/paste|one task per line|task list/i.test(descriptor)) return;
    textarea.dataset.plushlifeBulkEnhanced = "true";
    textarea.addEventListener("paste", () => setTimeout(() => {
      if (!care?.parseBulkTasks) return;
      const parsed = care.parseBulkTasks(textarea.value, { maxTasks: 50 });
      const cleaned = parsed.tasks.join("\n");
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      if (setter) setter.call(textarea, cleaned); else textarea.value = cleaned;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
    }, 0));
  };
  const addDiscoveryCard = () => {
    if (state.discoveryDismissed || document.querySelector(".plushlife-discovery-card")) return;
    const target = Array.from(document.querySelectorAll("main,section,[role='main']")).find(visible);
    if (!target || taskRows().length < 4) return;
    const card = document.createElement("div");
    card.className = "plushlife-discovery-card";
    card.innerHTML = '<strong>Make this list gentler?</strong><div style="font-size:12px;margin-top:4px">PlushRescue can temporarily show only three caring steps without deleting anything.</div><button type="button">Show me</button> <button type="button" data-dismiss>Not now</button>';
    target.prepend(card);
    card.querySelector("button:not([data-dismiss])").addEventListener("click", openPanel);
    card.querySelector("[data-dismiss]").addEventListener("click", () => { saveState({ discoveryDismissed: true }); card.remove(); });
  };
  const observer = new MutationObserver(() => { document.querySelectorAll("textarea").forEach(enhanceBulkTextarea); addDiscoveryCard(); if (state.rescueActive) applyRescue(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll("textarea").forEach(enhanceBulkTextarea);
  setTimeout(addDiscoveryCard, 800);
})();
