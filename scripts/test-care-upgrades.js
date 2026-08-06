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

const bulk = care.parseBulkTasks("- Brush teeth\n2. Take meds\n[ ] Drink water\n• Brush teeth\n\nCall doctor", { maxTasks: 3 });
assert.deepEqual(bulk.tasks, ["Brush teeth", "Take meds", "Drink water"]);
assert.deepEqual(bulk.duplicates, ["Brush teeth"]);
assert.deepEqual(bulk.ignored, ["Call doctor"]);

const discovery = care.gentleDiscoverySuggestions({
  taskCount: 8,
  daysUsed: 4,
  hasReminder: false,
  hasSoftVersion: false,
  hasGuardian: false,
  seen: ["bulk-organize"],
});
assert.equal(discovery.length, 2);
assert.equal(discovery[0].id, "tiny-versions");
assert.equal(discovery[1].id, "gentle-reminders");

const rescue = care.buildRescuePlan([
  { task_key: "meds", task: "Take medicine", essential_on_low_capacity: true, estimated_minutes: 2 },
  { task_key: "shower", task: "Take a shower", soft_label: "Wash face", tiny_label: "Use a wipe", estimated_minutes: 20 },
  { task_key: "water", task: "Drink water", estimated_minutes: 1 },
  { task_key: "laundry", task: "Do laundry", estimated_minutes: 45 },
], ["water"], { maxVisible: 2, hasGuardian: true });
assert.equal(rescue.day_type, "recovery");
assert.deepEqual(rescue.visible_tasks.map((task) => task.task_key), ["meds", "shower"]);
assert.equal(rescue.visible_tasks[1].rescue_label, "Use a wipe");
assert.equal(rescue.hidden_count, 1);
assert.ok(rescue.guardian_prompt);

async function testReadDeduper() {
  let networkCalls = 0;
  const host = {
    fetch: async () => {
      networkCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  };

  assert.equal(care.installSupabaseReadDeduper(host, { ttlMs: 40 }), true);
  const url = "https://example.supabase.co/rest/v1/tracker_tasks?select=*";
  const [first, second] = await Promise.all([host.fetch(url), host.fetch(url)]);
  assert.equal(networkCalls, 1, "identical in-flight reads should share one network request");
  assert.deepEqual(await first.json(), { ok: true });
  assert.deepEqual(await second.json(), { ok: true });

  const cached = await host.fetch(url);
  assert.equal(networkCalls, 1, "an immediate repeat read should use the short cache");
  assert.deepEqual(await cached.json(), { ok: true });

  await host.fetch(url, { method: "POST" });
  assert.equal(networkCalls, 2, "writes must never be deduplicated or cached");

  await new Promise((resolve) => setTimeout(resolve, 50));
  await host.fetch(url);
  assert.equal(networkCalls, 3, "reads must refresh after the short cache expires");
  assert.equal(host.__plushlifeSupabaseReadDeduper.stats.sharedInflight, 1);
  assert.equal(host.__plushlifeSupabaseReadDeduper.stats.sharedRecent, 1);
}

testReadDeduper()
  .then(() => console.log("care-upgrades tests passed"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
