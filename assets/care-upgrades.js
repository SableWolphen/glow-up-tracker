(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.PlushLifeCare = api;
    api.installSupabaseReadDeduper(root);
    if (root.document && !root.__plushlifeGentleUiScriptLoading) {
      root.__plushlifeGentleUiScriptLoading = true;
      const script = root.document.createElement("script");
      script.src = "./assets/gentle-discovery-ui.js";
      script.defer = true;
      root.document.head.appendChild(script);
    }
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const DAY_ALIASES = {
    sunday: "sun", sun: "sun", monday: "mon", mon: "mon",
    tuesday: "tue", tue: "tue", tues: "tue", wednesday: "wed", wed: "wed",
    thursday: "thu", thu: "thu", thurs: "thu", friday: "fri", fri: "fri",
    saturday: "sat", sat: "sat",
  };

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function normalizeTime(hourText, minuteText, meridiem) {
    let hour = Number(hourText);
    const minute = Number(minuteText || 0);
    const suffix = String(meridiem || "").toLowerCase();
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    if (suffix) {
      if (hour < 1 || hour > 12) return null;
      if (suffix === "pm" && hour !== 12) hour += 12;
      if (suffix === "am" && hour === 12) hour = 0;
    }
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function parseNaturalSchedule(input, referenceDate) {
    const source = String(input || "").trim();
    const text = source.toLowerCase().replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
    const now = referenceDate instanceof Date ? new Date(referenceDate) : new Date();
    if (!text) return { recognized: false, summary: "Type a schedule such as “weekdays at 8 AM”." };
    const timeMatch = text.match(/(?:\bat\s*)?\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) || text.match(/(?:\bat\s*)\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    const time = timeMatch ? normalizeTime(timeMatch[1], timeMatch[2], timeMatch[3]) : null;
    let scheduleDays = [];
    let dayId = "daily";
    let scheduleType = "weekly";
    let oneTimeDate = null;
    if (/\btomorrow\b/.test(text)) {
      const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
      scheduleType = "once"; oneTimeDate = localDateString(tomorrow);
    } else if (/\btoday\b/.test(text)) {
      scheduleType = "once"; oneTimeDate = localDateString(now);
    } else if (/\bweekdays?\b|\bmonday through friday\b/.test(text)) {
      scheduleDays = ["mon", "tue", "wed", "thu", "fri"];
    } else if (/\bweekends?\b/.test(text)) {
      scheduleDays = ["sat", "sun"];
    } else if (!/\bevery day\b|\bdaily\b|\beach day\b/.test(text)) {
      scheduleDays = Object.entries(DAY_ALIASES).filter(([label]) => new RegExp(`\\b${label}\\b`).test(text)).map(([, value]) => value).filter((value, index, values) => values.indexOf(value) === index);
      if (scheduleDays.length === 1) dayId = scheduleDays[0];
    }
    const recognized = scheduleType === "once" || scheduleDays.length > 0 || /\bevery day\b|\bdaily\b|\beach day\b/.test(text) || !!time;
    if (!recognized) return { recognized: false, summary: "I couldn't confidently read that schedule. You can still use the regular controls." };
    const daySummary = scheduleType === "once"
      ? new Date(`${oneTimeDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
      : scheduleDays.length === 0 ? "Every day"
      : scheduleDays.length === 5 && scheduleDays.join(",") === "mon,tue,wed,thu,fri" ? "Weekdays"
      : scheduleDays.length === 2 && scheduleDays.includes("sat") && scheduleDays.includes("sun") ? "Weekends"
      : scheduleDays.map((id) => id.charAt(0).toUpperCase() + id.slice(1)).join(", ");
    return { recognized: true, day_id: dayId, schedule_days: scheduleDays, schedule_type: scheduleType, one_time_date: oneTimeDate, reminder_time: time, summary: `${daySummary}${time ? ` at ${time}` : ""}` };
  }

  function cleanBulkTaskLine(line) {
    return String(line || "").replace(/^\s*(?:[-*•‣▪◦]|\d+[.)]|\[[ xX]\])\s*/, "").replace(/\s+/g, " ").trim();
  }

  function parseBulkTasks(input, options) {
    const maxTasks = Math.max(1, Math.min(200, Number(options?.maxTasks) || 50));
    const seen = new Set();
    const tasks = [], duplicates = [], ignored = [];
    String(input || "").split(/\r?\n/).forEach((rawLine) => {
      const task = cleanBulkTaskLine(rawLine).slice(0, 140);
      if (!task) return;
      const key = task.toLocaleLowerCase();
      if (seen.has(key)) { duplicates.push(task); return; }
      seen.add(key);
      if (tasks.length >= maxTasks) { ignored.push(task); return; }
      tasks.push(task);
    });
    return { tasks, duplicates, ignored, maxTasks };
  }

  function gentleDiscoverySuggestions(context) {
    const taskCount = Math.max(0, Number(context?.taskCount) || 0);
    const daysUsed = Math.max(0, Number(context?.daysUsed) || 0);
    const seen = new Set(Array.isArray(context?.seen) ? context.seen : []);
    const suggestions = [];
    const add = (id, title, body, action) => { if (!seen.has(id)) suggestions.push({ id, title, body, action }); };
    if (taskCount >= 4) add("bulk-organize", "Make the list easier to scan", "Group tasks into Morning, Afternoon, Evening, or your own sections.", "organize");
    if (taskCount >= 6 && !context?.hasSoftVersion) add("tiny-versions", "Prepare for lower-energy days", "Add a softer or tiny version to important tasks without deleting the full version.", "soft_versions");
    if (taskCount >= 1 && !context?.hasReminder) add("gentle-reminders", "Want a gentle reminder?", "Choose reminders only for the tasks that truly need a nudge.", "reminders");
    if (daysUsed >= 3) add("progress", "Your PlushProgress is ready", "See patterns and completed care without turning your life into a score.", "progress");
    if (daysUsed >= 2 && !context?.hasGuardian) add("guardian", "Support is optional", "Connect a trusted Guardian only when sharing would genuinely help.", "guardian");
    return suggestions.slice(0, 2);
  }

  function buildRescuePlan(tasks, completedKeys, options) {
    const done = new Set(Array.isArray(completedKeys) ? completedKeys : []);
    const maxVisible = Math.max(1, Math.min(5, Number(options?.maxVisible) || 3));
    const active = (Array.isArray(tasks) ? tasks : []).filter((task) => task && !task.archived_at && !done.has(task.task_key));
    const essential = active.filter((task) => task.essential_on_low_capacity);
    const short = active.filter((task) => !task.essential_on_low_capacity && Number(task.estimated_minutes || 999) <= 10);
    const remaining = active.filter((task) => !essential.includes(task) && !short.includes(task));
    const selected = [...essential, ...short, ...remaining].slice(0, maxVisible).map((task) => ({ ...task, rescue_label: task.tiny_label || task.soft_label || task.task }));
    return {
      day_type: "recovery",
      visible_tasks: selected,
      hidden_count: Math.max(0, active.length - selected.length),
      grounding_prompt: options?.groundingPrompt || "Take one slow breath. One caring step is enough.",
      guardian_prompt: options?.hasGuardian ? "Would a no-pressure Guardian check-in help?" : null,
    };
  }

  function taskTargetsDate(task, date, dayIdForDate) {
    if (!task || task.archived_at) return false;
    const dateDayId = dayIdForDate(date);
    const scheduleDays = Array.isArray(task.schedule_days) ? task.schedule_days.filter((id) => DAY_IDS.includes(id)) : [];
    if (scheduleDays.length) return scheduleDays.includes(dateDayId);
    return task.day_id === "daily" || task.day_id === dateDayId;
  }

  function isSnoozed(snooze, now) {
    if (!snooze?.snoozed_until) return false;
    const until = new Date(snooze.snoozed_until).getTime();
    return Number.isFinite(until) && until > (now instanceof Date ? now.getTime() : Date.now());
  }

  function notificationId(seed, offset) {
    let hash = 2166136261;
    const value = String(seed || "plushlife");
    for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
    return Math.abs((hash + Number(offset || 0)) | 0) || 1;
  }

  function installSupabaseReadDeduper(target, options) {
    const host = target || (typeof globalThis !== "undefined" ? globalThis : null);
    if (!host || typeof host.fetch !== "function") return false;
    if (host.__plushlifeSupabaseReadDeduper) return true;
    const ttlMs = Math.max(0, Number(options?.ttlMs ?? 1000));
    const maxEntries = Math.max(10, Number(options?.maxEntries ?? 100));
    const originalFetch = host.fetch.bind(host);
    const inFlight = new Map(), recent = new Map(), writeInFlight = new Map();
    const stats = { sharedInflight: 0, sharedRecent: 0, networkReads: 0, sharedWriteInflight: 0, networkWrites: 0 };
    const headerValue = (headers, name) => {
      if (!headers) return "";
      if (typeof headers.get === "function") return headers.get(name) || "";
      const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
      return key ? String(headers[key]) : "";
    };
    const requestDetails = (input, init) => {
      const request = input && typeof input === "object" ? input : null;
      return {
        url: String(request?.url || input || ""),
        method: String(init?.method || request?.method || "GET").toUpperCase(),
        headers: init?.headers || request?.headers || null,
        signal: init?.signal || request?.signal || null,
        body: typeof init?.body === "string" ? init.body : null,
      };
    };
    const buildKey = ({ url, method, headers }) => [method, url, headerValue(headers, "authorization"), headerValue(headers, "apikey"), headerValue(headers, "accept-profile"), headerValue(headers, "range")].join("\n");
    const canonicalWriteBody = ({ body }) => {
      if (typeof body !== "string" || !body) return body || "";
      try {
        const parsed = JSON.parse(body);
        const normalizeRow = (value) => {
          if (!value || typeof value !== "object" || Array.isArray(value)) return value;
          const copy = { ...value };
          // updated_at is client-generated and can differ by a few milliseconds
          // when the same action is accidentally fired twice.
          delete copy.updated_at;
          return copy;
        };
        return JSON.stringify(Array.isArray(parsed) ? parsed.map(normalizeRow) : normalizeRow(parsed));
      } catch (_) {
        return body;
      }
    };
    const buildWriteKey = (details) => [
      details.method,
      details.url,
      headerValue(details.headers, "authorization"),
      headerValue(details.headers, "apikey"),
      headerValue(details.headers, "content-profile"),
      headerValue(details.headers, "prefer"),
      canonicalWriteBody(details),
    ].join("\n");
    const isSupabaseRest = (url) => /^https:\/\/[^/]+\.supabase\.co\/rest\/v1\//.test(url);
    const isSafeRead = ({ url, method, signal }) => !signal && (method === "GET" || method === "HEAD") && isSupabaseRest(url);
    const isDedupableWrite = ({ url, method, signal, body }) => !signal && isSupabaseRest(url) && ["POST", "PUT", "PATCH", "DELETE"].includes(method) && (body === null || typeof body === "string");
    const trimRecent = (now) => {
      for (const [key, entry] of recent) if (now - entry.savedAt > ttlMs) recent.delete(key);
      while (recent.size > maxEntries) recent.delete(recent.keys().next().value);
    };
    host.fetch = function plushLifeFetch(input, init) {
      const details = requestDetails(input, init);
      if (isSafeRead(details)) {
        const key = buildKey(details), now = Date.now();
        trimRecent(now);
        if (inFlight.has(key)) { stats.sharedInflight += 1; return inFlight.get(key).then((response) => response.clone()); }
        const cached = recent.get(key);
        if (cached && now - cached.savedAt <= ttlMs) { stats.sharedRecent += 1; return Promise.resolve(cached.response.clone()); }
        stats.networkReads += 1;
        const shared = originalFetch(input, init).then((response) => {
          if (response?.ok && ttlMs > 0) { recent.set(key, { response: response.clone(), savedAt: Date.now() }); trimRecent(Date.now()); }
          return response;
        }).finally(() => inFlight.delete(key));
        inFlight.set(key, shared);
        return shared.then((response) => response.clone());
      }
      if (isDedupableWrite(details)) {
        const key = buildWriteKey(details);
        if (writeInFlight.has(key)) {
          stats.sharedWriteInflight += 1;
          return writeInFlight.get(key).then((response) => response.clone());
        }
        stats.networkWrites += 1;
        const sharedWrite = originalFetch(input, init).finally(() => writeInFlight.delete(key));
        writeInFlight.set(key, sharedWrite);
        return sharedWrite.then((response) => response.clone());
      }
      return originalFetch(input, init);
    };
    host.__plushlifeSupabaseReadDeduper = {
      stats,
      clear() { inFlight.clear(); recent.clear(); writeInFlight.clear(); },
      restore() { host.fetch = originalFetch; delete host.__plushlifeSupabaseReadDeduper; },
    };
    return true;
  }

  return { DAY_IDS, parseNaturalSchedule, parseBulkTasks, gentleDiscoverySuggestions, buildRescuePlan, taskTargetsDate, isSnoozed, notificationId, localDateString, installSupabaseReadDeduper };
});