const assert = require("node:assert/strict");
const care = require("../assets/care-upgrades.js");

const reference = new Date(2026, 7, 1, 12, 0, 0);

assert.deepEqual(care.parseNaturalSchedule("weekdays at 8pm", reference), {
  recognized: true,
  day_id: "daily",
  schedule_days: ["mon", "tue", "wed", "thu", "fri"],
  schedule_type: "weekly",
  one_time_date: null,
  reminder_time: "20:00",
  summary: "Weekdays at 20:00",
});
assert.equal(care.parseNaturalSchedule("Tuesday and Friday at 7:30 am", reference).summary, "Tue, Fri at 07:30");
assert.equal(care.parseNaturalSchedule("tomorrow at 9pm", reference).one_time_date, "2026-08-02");
assert.equal(care.parseNaturalSchedule("whenever I feel like it", reference).recognized, false);
assert.equal(care.taskTargetsDate({ day_id: "daily", archived_at: "2026-08-01" }, "2026-08-03", () => "mon"), false);
assert.equal(care.taskTargetsDate({ day_id: "daily", schedule_days: ["tue", "fri"] }, "2026-08-04", () => "tue"), true);
assert.equal(care.isSnoozed({ snoozed_until: "2026-08-01T13:00:00" }, reference), true);
assert.equal(care.notificationId("drink-water"), care.notificationId("drink-water"));

console.log("care-upgrades tests passed");
