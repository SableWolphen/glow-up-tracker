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
