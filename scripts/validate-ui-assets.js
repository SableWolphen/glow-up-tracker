const fs = require("node:fs");
const vm = require("node:vm");

const files = [
  "assets/care-upgrades.js",
  "assets/gentle-discovery-ui.js",
  "service-worker.js",
];

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  try {
    new vm.Script(source, { filename: file });
  } catch (error) {
    console.error(`Syntax validation failed for ${file}`);
    throw error;
  }
}

const ui = fs.readFileSync("assets/gentle-discovery-ui.js", "utf8");
for (const required of [
  "plushlife-save-status",
  "data-plushlife-rescue-hidden",
  "PlushInsights",
  "PLUSHGUARDIAN QUICK REPLIES",
  "discoveryDismissed",
]) {
  if (!ui.includes(required)) throw new Error(`Missing required UI integration marker: ${required}`);
}

console.log("UI asset validation passed");
