from pathlib import Path
import re

p = Path('index.html')
s = p.read_text()
original = s

replacements = [
    ('const previewTasks = requiredRows.filter((r) => !viewDone[r.key]).slice(0, 3);',
     'const habitRowsToday = rows.filter((r) => r.habitType !== "regular");\n          const previewHabits = habitRowsToday.filter((r) => !viewDone[r.key]).slice(0, 3);'),
    ('if (previewTasks.length === 0) return null;',
     'if (habitRowsToday.length === 0) return null;'),
    ('>A FEW TASKS TODAY</div>',
     '>🌱 HABITS TODAY</div>'),
    ('onClick={() => setTodayCardIndex(1)} style={{ padding: "5px 9px", borderRadius: 8, border: `1px solid ${day.accent}55`, background: "white", color: day.accent, fontWeight: 900, fontSize: 11, cursor: "pointer" }}>See all ({requiredRows.length}) →</button>',
     'onClick={() => openTaskManager(dayIdForDate(period.date))} style={{ padding: "5px 9px", borderRadius: 8, border: `1px solid ${day.accent}55`, background: "white", color: day.accent, fontWeight: 900, fontSize: 11, cursor: "pointer" }}>Manage habits ({habitRowsToday.length}) →</button>'),
    ('{previewTasks.map((r) => (',
     '{previewHabits.length > 0 ? previewHabits.map((r) => ('),
    ('                ))}\n              </div>\n            </div>\n          );\n        })()}',
     '                )) : (\n                  <div style={{ padding: "9px 10px", borderRadius: 9, background: "#FFFFFF99", border: "1px solid #D7EEE2", fontSize: 12.5, color: "#318C79", fontWeight: 800 }}>All of today\\\'s habits are checked in. ✨</div>\n                )}\n              </div>\n            </div>\n          );\n        })()}', 1),
    ('Build a good habit', 'Build a habit'),
    ('Reduce a habit', 'Break a habit'),
    ('{habit.habitType === "build" ? "🌱" : "🛡️"} {habit.task}',
     '{habit.habitType === "build" ? "🌱" : "🍂"} {habit.task}'),
    ('{habit.habitType === "build" ? "Building" : "Reducing"}',
     '{habit.habitType === "build" ? "Building" : "Breaking"}'),
    ('Good habits grow here, and habits you are reducing count as caring wins too.',
     'Habits you are building grow here, and habits you are breaking count as caring wins too.'),
]

for item in replacements:
    if len(item) == 2:
        old, new = item
        if old not in s:
            raise SystemExit(f'Expected text not found; refusing blind edit: {old[:100]}')
        s = s.replace(old, new)
    else:
        old, new, count = item
        if old not in s:
            raise SystemExit(f'Expected block ending not found; refusing blind edit')
        s = s.replace(old, new, count)

# Change only the icon used by HabitTypeIcon, without touching unrelated shields.
match = re.search(r'(function HabitTypeIcon\(.*?\n\})', s, flags=re.S)
if not match:
    raise SystemExit('HabitTypeIcon function not found')
habit_icon_fn = match.group(1)
if '🛡️' not in habit_icon_fn:
    raise SystemExit('Expected reduce-habit shield not found inside HabitTypeIcon')
updated_fn = habit_icon_fn.replace('🛡️', '🍂')
s = s[:match.start(1)] + updated_fn + s[match.end(1):]

if s == original:
    raise SystemExit('No changes made')

p.write_text(s)
