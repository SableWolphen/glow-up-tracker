(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeGentleDiscoveryUiInstalled) return;
  window.__plushlifeGentleDiscoveryUiInstalled = true;

  const care = window.PlushLifeCare;
  const STORAGE_KEY = "plushlife-gentle-discovery-v1";
  const state = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch (_error) { return {}; }
  })();
  const saveState = (patch) => {
    Object.assign(state, patch);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_error) {}
  };

  const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const visible = (node) => !!(node && node.getClientRects && node.getClientRects().length);
  const buttons = () => Array.from(document.querySelectorAll("button")).filter(visible);
  const findButton = (patterns) => buttons().find((button) => patterns.some((pattern) => normalize(button.textContent).includes(pattern)));
  const clickFirst = (patterns) => {
    const button = findButton(patterns);
    if (!button) return false;
    button.click();
    return true;
  };

  const style = document.createElement("style");
  style.textContent = `
    #plushlife-gentle-launcher{position:fixed;right:14px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:2147483000;border:0;border-radius:999px;padding:11px 15px;background:linear-gradient(135deg,#b75acb,#6f8de8);color:#fff;font:800 13px system-ui,sans-serif;box-shadow:0 8px 26px #6b3e7a55;cursor:pointer}
    #plushlife-gentle-panel{position:fixed;inset:0;z-index:2147483001;background:#32243b99;display:grid;place-items:end center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));font-family:system-ui,sans-serif}
    #plushlife-gentle-card{width:min(520px,100%);max-height:min(80vh,720px);overflow:auto;border-radius:24px;background:#fff8fc;border:1px solid #ead7ef;box-shadow:0 20px 70px #26152f66;padding:18px;color:#5b4b6b}
    .plushlife-gentle-action{width:100%;border:1px solid #dec5e8;border-radius:16px;background:#fff;padding:13px 14px;margin-top:9px;text-align:left;color:#5b4b6b;cursor:pointer}
    .plushlife-gentle-action strong{display:block;font-size:14px}.plushlife-gentle-action span{display:block;margin-top:3px;font-size:12px;line-height:1.45;color:#806d8d}
    .plushlife-gentle-close{border:0;background:transparent;font-size:22px;cursor:pointer;color:#806d8d}
    .plushlife-gentle-note{margin-top:12px;padding:11px 12px;border-radius:14px;background:#f3e9f7;font-size:12px;line-height:1.45}
    body.plushlife-rescue-view #plushlife-gentle-launcher{background:linear-gradient(135deg,#4c8fe8,#56b7a2)}
    @media (prefers-reduced-motion:reduce){#plushlife-gentle-panel,#plushlife-gentle-card{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "plushlife-gentle-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-haspopup", "dialog");
  launcher.textContent = "🧸 PlushRescue";
  document.body.appendChild(launcher);

  let panel = null;
  const closePanel = () => { if (panel) panel.remove(); panel = null; launcher.focus(); };
  const message = (text) => {
    const note = panel && panel.querySelector(".plushlife-gentle-note");
    if (note) note.textContent = text;
  };

  const openTaskImporter = () => {
    const opened = clickFirst(["manage tasks", "add task", "edit tasks"]);
    if (!opened) {
      message("Open Today, then tap Manage tasks. PlushLife already lets you paste one task per line, up to 50 at once.");
      return;
    }
    message("Task manager opened. Look for “paste one task per line” to add your whole list at once.");
    setTimeout(() => {
      const textarea = Array.from(document.querySelectorAll("textarea")).find((item) => /task|paste|line/i.test(`${item.placeholder || ""} ${item.getAttribute("aria-label") || ""}`));
      if (textarea) { textarea.focus(); textarea.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }, 180);
  };

  const startRescue = () => {
    const usedBuiltIn = clickFirst(["recovery day", "tiny day", "soft day"]);
    document.body.classList.add("plushlife-rescue-view");
    saveState({ rescueUsed: true, rescueUsedAt: new Date().toISOString() });
    launcher.textContent = "🌿 Rescue active";
    message(usedBuiltIn
      ? "PlushLife switched to its gentler day view. One caring step is enough."
      : "Rescue mode is ready. Pick only 1–3 essential or very short tasks today; everything else can wait without being deleted.");
  };

  const openProgress = () => {
    if (clickFirst(["progress", "plushprogress"])) {
      saveState({ progressSeen: true });
      closePanel();
    } else message("Open the Progress tab when you’re ready. Nothing here is a score or punishment.");
  };

  const openPanel = () => {
    if (panel) return;
    panel = document.createElement("div");
    panel.id = "plushlife-gentle-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "PlushRescue and task shortcuts");
    panel.innerHTML = `
      <div id="plushlife-gentle-card">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="flex:1"><div style="font-size:11px;letter-spacing:.12em;font-weight:900;color:#a65dc1">PLUSHRESCUE</div><h2 style="margin:5px 0 0;font-size:21px">What would help right now?</h2><p style="margin:5px 0 0;font-size:12.5px;line-height:1.45;color:#806d8d">You can still add every task you have. These shortcuts only make the app easier to use.</p></div>
          <button class="plushlife-gentle-close" type="button" aria-label="Close">×</button>
        </div>
        <button class="plushlife-gentle-action" type="button" data-action="tasks"><strong>➕ Add all my tasks</strong><span>Open the bulk importer and paste one task per line. Bullets, numbers, and checkboxes are cleaned automatically.</span></button>
        <button class="plushlife-gentle-action" type="button" data-action="rescue"><strong>🌿 I’m overwhelmed</strong><span>Use a Recovery, Tiny, or Soft day and focus on only a few caring steps.</span></button>
        <button class="plushlife-gentle-action" type="button" data-action="progress"><strong>✨ Show PlushProgress</strong><span>See what helped over time without turning care into pressure.</span></button>
        <div class="plushlife-gentle-note">Nothing changes until you choose an option.</div>
      </div>`;
    document.body.appendChild(panel);
    panel.querySelector(".plushlife-gentle-close").addEventListener("click", closePanel);
    panel.addEventListener("click", (event) => { if (event.target === panel) closePanel(); });
    panel.querySelector('[data-action="tasks"]').addEventListener("click", openTaskImporter);
    panel.querySelector('[data-action="rescue"]').addEventListener("click", startRescue);
    panel.querySelector('[data-action="progress"]').addEventListener("click", openProgress);
    panel.querySelector(".plushlife-gentle-close").focus();
  };

  launcher.addEventListener("click", openPanel);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && panel) closePanel(); });

  const enhanceBulkTextarea = (textarea) => {
    if (!textarea || textarea.dataset.plushlifeBulkEnhanced) return;
    const descriptor = `${textarea.placeholder || ""} ${textarea.getAttribute("aria-label") || ""}`;
    if (!/paste|one task per line|task list/i.test(descriptor)) return;
    textarea.dataset.plushlifeBulkEnhanced = "true";
    textarea.addEventListener("paste", () => {
      setTimeout(() => {
        if (!care?.parseBulkTasks) return;
        const parsed = care.parseBulkTasks(textarea.value, { maxTasks: 50 });
        const cleaned = parsed.tasks.join("\n");
        if (cleaned === textarea.value) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
        if (setter) setter.call(textarea, cleaned); else textarea.value = cleaned;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      }, 0);
    });
  };

  const observer = new MutationObserver(() => {
    document.querySelectorAll("textarea").forEach(enhanceBulkTextarea);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll("textarea").forEach(enhanceBulkTextarea);
})();
