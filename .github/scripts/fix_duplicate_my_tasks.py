from pathlib import Path

p = Path('index.html')
s = p.read_text()
old = '''  const rows = trackerTasks
    .filter((task) => taskIsScheduledForDate(task, selectedProgressDate))
    .sort((a, b) => {
      if (a.day_id !== b.day_id) return a.day_id === "daily" ? -1 : b.day_id === "daily" ? 1 : 0;
      return a.sort_order - b.sort_order;
    })
    .map(rowForTask);'''
new = '''  const scheduledTasksForView = trackerTasks
    .filter((task) => taskIsScheduledForDate(task, selectedProgressDate))
    .sort((a, b) => {
      if (a.day_id !== b.day_id) return a.day_id === "daily" ? -1 : b.day_id === "daily" ? 1 : 0;
      return a.sort_order - b.sort_order;
    });
  // Keep every saved section contiguous on the Today/preview list. A section
  // such as "MY TASKS" can contain both true every-day rows and rows scheduled
  // only for this weekday; the old daily-first sort split those into two
  // visually identical headings. Preserve the first-seen section order while
  // keeping each section's own task order intact.
  const taskSectionOrder = new Map();
  scheduledTasksForView.forEach((task) => {
    const sectionKey = task.section || "MY TASKS";
    if (!taskSectionOrder.has(sectionKey)) taskSectionOrder.set(sectionKey, taskSectionOrder.size);
  });
  const rows = scheduledTasksForView
    .sort((a, b) => {
      const aSection = a.section || "MY TASKS";
      const bSection = b.section || "MY TASKS";
      const sectionDelta = taskSectionOrder.get(aSection) - taskSectionOrder.get(bSection);
      if (sectionDelta) return sectionDelta;
      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || a.task_key.localeCompare(b.task_key);
    })
    .map(rowForTask);'''
if old not in s:
    raise SystemExit('Expected rows block not found; refusing blind edit')
p.write_text(s.replace(old, new, 1))
