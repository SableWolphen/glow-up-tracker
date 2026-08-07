from pathlib import Path

p = Path('index.html')
s = p.read_text()
old = '<option value="reduce">🛡️ Break a habit</option>'
new = '<option value="reduce">🍂 Reduce a habit</option>'
count = s.count(old)
if count != 1:
    raise SystemExit(f'Expected exactly one stale reduce-habit label, found {count}; refusing blind edit')
s = s.replace(old, new, 1)
p.write_text(s)
