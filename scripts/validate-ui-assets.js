const fs = require("node:fs");
const vm = require("node:vm");

const files = [
  "assets/care-upgrades.js",
  "assets/gentle-discovery-ui.js",
  "assets/plushlife-completion.js",
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
  "plushlife-rescue-hidden",
  "PlushInsights",
  "No document-wide MutationObserver",
]) {
  if (!ui.includes(required)) throw new Error(`Missing required UI integration marker: ${required}`);
}
if (/new MutationObserver/.test(ui)) throw new Error("Gentle UI must not install a document-wide MutationObserver");

const completion = fs.readFileSync("assets/plushlife-completion.js", "utf8");
for (const required of [
  "PLUSHQA · ADMIN ONLY",
  "plushlife-context-feedback",
  "plushlife-offline-draft",
  "ADMIN_EMAILS",
  "No failed requests captured",
  "send feedback",
  "No document-wide MutationObserver",
]) {
  if (!completion.includes(required)) throw new Error(`Missing completion integration marker: ${required}`);
}
if (/new MutationObserver/.test(completion)) throw new Error("Completion layer must not install a document-wide MutationObserver");

const worker = fs.readFileSync("service-worker.js", "utf8");
if (!worker.includes("plushlife-completion.js") || !worker.includes("`${core}\\n;${completion}`")) {
  throw new Error("Service worker is not loading the completion layer");
}

console.log("UI asset validation passed");
