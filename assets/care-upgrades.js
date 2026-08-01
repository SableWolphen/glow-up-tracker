(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlushLifeCare = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const DAY_ALIASES = {
    sunday: "sun", sun: "sun",
    monday: "mon", mon: "mon",
    tuesday: "tue", tue: "tue", tues: "tue",
    wednesday: "wed", wed: "wed",
    thursday: "thu", thu: "thu", thurs: "thu",
    friday: "fri", fri: "fri",
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

    const timeMatch = text.match(/(?:\bat\s*)?\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ||
      text.match(/(?:\bat\s*)\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    const time = timeMatch ? normalizeTime(timeMatch[1], timeMatch[2], timeMatch[3]) : null;

    let scheduleDays = [];
    let dayId = "daily";
    let scheduleType = "weekly";
    let oneTimeDate = null;

    if (/\btomorrow\b/.test(text)) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      scheduleType = "once";
      oneTimeDate = localDateString(tomorrow);
    } else if (/\btoday\b/.test(text)) {
      scheduleType = "once";
      oneTimeDate = localDateString(now);
    } else if (/\bweekdays?\b|\bmonday through friday\b/.test(text)) {
      scheduleDays = ["mon", "tue", "wed", "thu", "fri"];
    } else if (/\bweekends?\b/.test(text)) {
      scheduleDays = ["sat", "sun"];
    } else if (/\bevery day\b|\bdaily\b|\beach day\b/.test(text)) {
      scheduleDays = [];
    } else {
      scheduleDays = Object.entries(DAY_ALIASES)
        .filter(([label]) => new RegExp(`\\b${label}\\b`).test(text))
        .map(([, value]) => value)
        .filter((value, index, values) => values.indexOf(value) === index);
      if (scheduleDays.length === 1) dayId = scheduleDays[0];
    }

    const recognized = scheduleType === "once" || scheduleDays.length > 0 || /\bevery day\b|\bdaily\b|\beach day\b/.test(text) || !!time;
    if (!recognized) return { recognized: false, summary: "I couldn't confidently read that schedule. You can still use the regular controls." };

    const daySummary = scheduleType === "once"
      ? new Date(`${oneTimeDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
      : scheduleDays.length === 0
        ? "Every day"
        : scheduleDays.length === 5 && scheduleDays.join(",") === "mon,tue,wed,thu,fri"
          ? "Weekdays"
          : scheduleDays.length === 2 && scheduleDays.includes("sat") && scheduleDays.includes("sun")
            ? "Weekends"
            : scheduleDays.map((id) => id.charAt(0).toUpperCase() + id.slice(1)).join(", ");
    return {
      recognized: true,
      day_id: dayId,
      schedule_days: scheduleDays,
      schedule_type: scheduleType,
      one_time_date: oneTimeDate,
      reminder_time: time,
      summary: `${daySummary}${time ? ` at ${time}` : ""}`,
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
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs((hash + Number(offset || 0)) | 0) || 1;
  }

  return { DAY_IDS, parseNaturalSchedule, taskTargetsDate, isSnoozed, notificationId, localDateString };
});
