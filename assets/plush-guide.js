(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeGuideInstalled) return;
  window.__plushlifeGuideInstalled = true;

  const GUIDE_ID = "plushlife-feature-guide";
  const ENTRY_ID = "plushlife-guide-entry";

  const style = document.createElement("style");
  style.textContent = `
    #${ENTRY_ID}{width:100%;margin:10px 0 2px;border:1px solid #dec5e8;border-radius:16px;background:linear-gradient(135deg,#fff8fc,#f2edff);padding:13px 14px;text-align:left;color:#5b4b6b;font:800 14px system-ui,sans-serif;cursor:pointer}
    #${ENTRY_ID} small{display:block;margin-top:4px;font-weight:500;line-height:1.35;opacity:.78}
    #${GUIDE_ID}{position:fixed;inset:0;z-index:2147483200;background:#32243b99;display:grid;place-items:end center;padding:16px 14px calc(16px + env(safe-area-inset-bottom));font-family:system-ui,sans-serif}
    #${GUIDE_ID} .pg-card{width:min(540px,100%);max-height:86vh;overflow:auto;border-radius:24px;background:#fff8fc;border:1px solid #ead7ef;box-shadow:0 20px 70px #26152f66;padding:18px;color:#5b4b6b}
    #${GUIDE_ID} .pg-head{display:flex;gap:12px;align-items:flex-start}
    #${GUIDE_ID} .pg-head>div{flex:1}
    #${GUIDE_ID} h2{margin:4px 0 5px;font-size:22px}
    #${GUIDE_ID} p{margin:0;line-height:1.45}
    #${GUIDE_ID} .pg-close{border:0;background:transparent;color:#806d8d;font-size:25px;cursor:pointer}
    #${GUIDE_ID} .pg-section{margin-top:16px}
    #${GUIDE_ID} .pg-section-title{font-size:11px;font-weight:900;letter-spacing:.08em;color:#8a6b98;margin-bottom:7px}
    #${GUIDE_ID} .pg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    #${GUIDE_ID} .pg-action{border:1px solid #dec5e8;border-radius:15px;background:#fff;padding:11px;text-align:left;color:#5b4b6b;cursor:pointer;font:800 13px system-ui,sans-serif}
    #${GUIDE_ID} .pg-action small{display:block;margin-top:3px;font-weight:500;line-height:1.3;opacity:.75}
    #${GUIDE_ID} .pg-note{margin-top:14px;padding:10px 11px;border-radius:13px;background:#f2e9f7;font-size:12px;line-height:1.4}
    @media(max-width:390px){#${GUIDE_ID} .pg-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const visible = (node) => !!(node && node.getClientRects && node.getClientRects().length);

  function candidates() {
    return Array.from(document.querySelectorAll('button,a,[role="button"]')).filter(visible);
  }

  function clickMatching(labels) {
    const wanted = labels.map(clean);
    const match = candidates().find((node) => {
      const text = clean(node.textContent || node.getAttribute("aria-label") || node.getAttribute("title"));
      return wanted.some((label) => text === label || text.includes(label));
    });
    if (!match) return false;
    match.click();
    return true;
  }

  function closeGuide() {
    const guide = document.getElementById(GUIDE_ID);
    if (guide) guide.remove();
  }

  function route(labels, fallbackMessage) {
    closeGuide();
    window.setTimeout(() => {
      if (!clickMatching(labels)) {
        window.alert(fallbackMessage || "Open the matching PlushLife section from the navigation or Profile menu.");
      }
    }, 40);
  }

  function openGuide() {
    if (document.getElementById(GUIDE_ID)) return;
    const guide = document.createElement("div");
    guide.id = GUIDE_ID;
    guide.setAttribute("role", "dialog");
    guide.setAttribute("aria-modal", "true");
    guide.setAttribute("aria-label", "PlushGuide");
    guide.innerHTML = `
      <div class="pg-card">
        <div class="pg-head">
          <div><strong>PLUSHGUIDE</strong><h2>Everything you already have, in one place</h2><p>Choose what you need right now. This guide only opens existing PlushLife tools—your tasks, history, profile, and preferences stay exactly as you saved them.</p></div>
          <button class="pg-close" type="button" aria-label="Close PlushGuide">×</button>
        </div>
        <div class="pg-section"><div class="pg-section-title">MAKE TODAY FIT</div><div class="pg-grid">
          <button class="pg-action" data-route="rescue">🧸 PlushRescue<small>Make today smaller, choose one next step, or soften pressure.</small></button>
          <button class="pg-action" data-route="focus">🎯 PlushFocus<small>See one clear task without the rest of the day crowding you.</small></button>
        </div></div>
        <div class="pg-section"><div class="pg-section-title">PLAN & SEE PROGRESS</div><div class="pg-grid">
          <button class="pg-action" data-route="calendar">📅 PlushCalendar<small>See Month, Week, and Day views.</small></button>
          <button class="pg-action" data-route="progress">📈 PlushProgress<small>Review trends, consistency, and what is helping.</small></button>
        </div></div>
        <div class="pg-section"><div class="pg-section-title">CARE FOR YOURSELF</div><div class="pg-grid">
          <button class="pg-action" data-route="calm">🌙 PlushCalm<small>Open grounding, sound, breathing, and gentle-care tools.</small></button>
          <button class="pg-action" data-route="journal">📖 PlushJournal<small>Write a private reflection or return to today’s prompt.</small></button>
          <button class="pg-action" data-route="paths">🌿 PlushPaths<small>Open guided routines and care paths.</small></button>
          <button class="pg-action" data-route="tasks">✅ Change My Tasks<small>Add, edit, pause, schedule, or clean up routines.</small></button>
        </div></div>
        <div class="pg-section"><div class="pg-section-title">SUPPORT & SAFETY</div><div class="pg-grid">
          <button class="pg-action" data-route="guardian">🤝 PlushGuardian<small>Open the support connection and privacy controls.</small></button>
          <button class="pg-action" data-route="safety">🛟 PlushSafety<small>Find safety resources and account protections.</small></button>
        </div></div>
        <div class="pg-note">PlushGuide does not create new data or change existing data. It is simply a map to the features already built into PlushLife.</div>
      </div>`;
    document.body.appendChild(guide);
    guide.querySelector(".pg-close").addEventListener("click", closeGuide);
    guide.addEventListener("click", (event) => { if (event.target === guide) closeGuide(); });
    guide.querySelector('[data-route="rescue"]').addEventListener("click", () => route(["plushrescue", "rescue active"], "Open PlushRescue from its floating button."));
    guide.querySelector('[data-route="focus"]').addEventListener("click", () => route(["plushfocus", "focus mode", "focus"]));
    guide.querySelector('[data-route="calendar"]').addEventListener("click", () => route(["calendar", "plushcalendar"]));
    guide.querySelector('[data-route="progress"]').addEventListener("click", () => route(["progress", "plushprogress"]));
    guide.querySelector('[data-route="calm"]').addEventListener("click", () => route(["plushcalm", "calm"]));
    guide.querySelector('[data-route="journal"]').addEventListener("click", () => route(["plushjournal", "journal", "private reflection"]));
    guide.querySelector('[data-route="paths"]').addEventListener("click", () => route(["plushpaths", "paths"]));
    guide.querySelector('[data-route="tasks"]').addEventListener("click", () => route(["change my tasks", "manage tasks", "tasks"]));
    guide.querySelector('[data-route="guardian"]').addEventListener("click", () => route(["plushguardian", "guardian"]));
    guide.querySelector('[data-route="safety"]').addEventListener("click", () => route(["plushsafety", "safety"]));
  }

  function looksLikeProfilePanel(node) {
    if (!visible(node)) return false;
    const text = clean(node.textContent);
    return text.includes("settings") && text.includes("feedback") && (text.includes("profile") || text.includes("plushprivacy") || text.includes("plushsafety"));
  }

  function installEntry() {
    if (document.getElementById(ENTRY_ID)) return;
    const panels = Array.from(document.querySelectorAll('[role="dialog"],aside,[class*="panel"],[class*="modal"]'));
    const profile = panels.find(looksLikeProfilePanel);
    if (!profile) return;
    const entry = document.createElement("button");
    entry.id = ENTRY_ID;
    entry.type = "button";
    entry.innerHTML = '✨ PlushGuide<small>Find PlushRescue, PlushProgress, PlushJournal, PlushGuardian, and the rest of your PlushLife tools.</small>';
    entry.addEventListener("click", openGuide);
    const target = profile.querySelector('button,a,[role="button"]');
    if (target && target.parentElement) target.parentElement.insertBefore(entry, target);
    else profile.prepend(entry);
  }

  const observer = new MutationObserver(() => installEntry());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeGuide(); });
  installEntry();
})();
