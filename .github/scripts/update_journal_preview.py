from pathlib import Path

p = Path('index.html')
s = p.read_text()
old = '''            {privateNote ? (\n              <div style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: \"#6B5A7D\" }}>You already wrote about today — tap to keep going.</div>\n            ) : (\n              <div style={{ marginTop: 5, fontSize: 13, lineHeight: 1.5, color: \"#6B5A7D\", fontStyle: \"italic\" }}>{reflectionPrompt}</div>\n            )}'''
new = '''            {privateNote ? (\n              <div style={{ marginTop: 7 }}>\n                <div style={{ fontSize: 9.5, letterSpacing: \"0.08em\", fontWeight: 900, color: \"#9A6BAD\" }}>TODAY'S PROMPT</div>\n                <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.45, color: \"#6B5A7D\", fontStyle: \"italic\" }}>{reflectionPrompt}</div>\n                <div style={{ marginTop: 8, fontSize: 9.5, letterSpacing: \"0.08em\", fontWeight: 900, color: \"#9A6BAD\" }}>YOU WROTE</div>\n                <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.5, color: \"#5B4B6B\" }}>{privateNote.length > 180 ? `${privateNote.slice(0, 180).trim()}…` : privateNote}</div>\n                <div style={{ marginTop: 7, fontSize: 11, fontWeight: 900, color: \"#A65DC1\" }}>View entry →</div>\n              </div>\n            ) : (\n              <div style={{ marginTop: 7 }}>\n                <div style={{ fontSize: 9.5, letterSpacing: \"0.08em\", fontWeight: 900, color: \"#9A6BAD\" }}>TODAY'S PROMPT</div>\n                <div style={{ marginTop: 3, fontSize: 13, lineHeight: 1.5, color: \"#6B5A7D\", fontStyle: \"italic\" }}>{reflectionPrompt}</div>\n                <div style={{ marginTop: 7, fontSize: 11, fontWeight: 900, color: \"#A65DC1\" }}>Write about this →</div>\n              </div>\n            )}'''
if old not in s:
    raise SystemExit('Expected PlushJournal home card block not found; refusing blind edit')
s = s.replace(old, new, 1)
p.write_text(s)
