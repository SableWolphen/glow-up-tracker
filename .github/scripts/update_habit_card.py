from pathlib import Path

p = Path('index.html')
s = p.read_text()
old = "All of today\\'s habits are checked in. ✨"
new = "All of today's habits are checked in. ✨"
if old not in s:
    raise SystemExit('Expected escaped Habit card copy not found; refusing blind edit')
s = s.replace(old, new, 1)
# Guard the intended habit wording while we are here.
for required in ['🌱 HABITS TODAY', 'Build a habit', 'Break a habit', '🍂', 'Breaking']:
    if required not in s:
        raise SystemExit(f'Missing expected Habit UI text: {required}')
p.write_text(s)
