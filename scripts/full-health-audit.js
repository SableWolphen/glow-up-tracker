const fs = require('fs');
const path = require('path');
const Babel = require('@babel/standalone');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const match = html.match(/<script id="app-source" type="text\/plain">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Could not find app-source');
const source = match[1];
Babel.transform(source, { presets: [['react', { runtime: 'classic' }]], filename: 'index.html' });

const problems = [];
const warnings = [];
const buttonStarts = [...source.matchAll(/<button\b/g)].map(m => m.index);
for (let i = 0; i < buttonStarts.length; i++) {
  const start = buttonStarts[i];
  const close = source.indexOf('</button>', start);
  const next = buttonStarts[i + 1] ?? source.length;
  const end = close >= 0 && close < next ? close : Math.min(next, start + 2500);
  const block = source.slice(start, end);
  if (!/onClick\s*=/.test(block) && !/type\s*=\s*["']submit["']/.test(block)) {
    const line = source.slice(0, start).split('\n').length;
    problems.push(`Button near app-source line ${line} has no onClick or submit behavior`);
  }
}

for (const m of source.matchAll(/href\s*=\s*["']#["']/g)) {
  const line = source.slice(0, m.index).split('\n').length;
  warnings.push(`Anchor with href=# near app-source line ${line}`);
}

for (const bad of ['onClick={undefined}', 'onClick={() => {}}', 'onClick={() => null}']) {
  if (source.includes(bad)) problems.push(`Found inert handler pattern: ${bad}`);
}

const literalIds = [...source.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
const dupIds = literalIds.filter((id, i) => literalIds.indexOf(id) !== i);
if (dupIds.length) warnings.push(`Duplicate literal DOM ids: ${[...new Set(dupIds)].join(', ')}`);

const staleText = ['🛡️ Break a habit', '>Break a habit<'];
for (const text of staleText) if (source.includes(text)) warnings.push(`Stale habit wording remains: ${text}`);

console.log(`Checked ${buttonStarts.length} JSX buttons.`);
if (warnings.length) {
  console.log('WARNINGS:');
  warnings.forEach(w => console.log(`- ${w}`));
}
if (problems.length) {
  console.error('PROBLEMS:');
  problems.forEach(p => console.error(`- ${p}`));
  process.exit(1);
}
console.log('Interaction wiring audit passed.');
