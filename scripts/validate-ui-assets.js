const fs = require("node:fs");
const vm = require("node:vm");

const files = [
  "assets/care-upgrades.js",
  "assets/gentle-discovery-ui.js",
  "assets/plushlife-completion.js",
  "assets/plush-guide.js",
  "assets/plush-tools-fix.js",
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
  "plushlife-rescue-hidden",
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

const guide = fs.readFileSync("assets/plush-guide.js", "utf8");
for (const required of ["PLUSHGUIDE", "PlushRescue", "PlushProgress", "PlushGuardian"]) {
  if (!guide.includes(required)) throw new Error(`Missing PlushGuide integration marker: ${required}`);
}

const toolsFix = fs.readFileSync("assets/plush-tools-fix.js", "utf8");
for (const required of [
  "add all my tasks",
  "refresh rescue view",
  "return to my full day",
  "open plushprogress",
  "plushlife-rescue-restored",
]) {
  if (!toolsFix.includes(required)) throw new Error(`Missing Plush Tools repair marker: ${required}`);
}

const worker = fs.readFileSync("service-worker.js", "utf8");
if (!worker.includes("plushlife-completion.js") || !worker.includes("`${core}\\n;${completion}`")) {
  throw new Error("Service worker is not loading the completion layer");
}

console.log("UI asset validation passed");
