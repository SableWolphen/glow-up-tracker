#!/usr/bin/env node
// Builds www/ — the Capacitor Android app and Cloudflare static deployment —
// from the same static source files kept at the repository root.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WWW = path.join(ROOT, "www");
const VENDOR = path.join(WWW, "vendor");

const SITE_FILES = [
  "index.html",
  "login.html",
  "oauth.html",
  "legal.html",
  "support.html",
  "account-deletion.html",
  "service-worker.js",
  "manifest.webmanifest",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-192.png",
  "icon-maskable-512.png",
  "social-preview.png",
  "social-preview.svg",
];

const SITE_DIRECTORIES = ["assets"];

const VENDOR_FILES = [
  { src: "node_modules/react/umd/react.production.min.js", dest: "react.production.min.js" },
  { src: "node_modules/react-dom/umd/react-dom.production.min.js", dest: "react-dom.production.min.js" },
  { src: "node_modules/@babel/standalone/babel.min.js", dest: "babel.min.js" },
  { src: "node_modules/@supabase/supabase-js/dist/umd/supabase.js", dest: "supabase.min.js" },
];

const CDN_REPLACEMENTS = [
  ["https://unpkg.com/react@18/umd/react.production.min.js", "./vendor/react.production.min.js"],
  ["https://unpkg.com/react-dom@18/umd/react-dom.production.min.js", "./vendor/react-dom.production.min.js"],
  ["https://unpkg.com/@babel/standalone/babel.min.js", "./vendor/babel.min.js"],
  ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/dist/umd/supabase.min.js", "./vendor/supabase.min.js"],
];

const GENERATED_INDEX_SCRIPTS = [
  '<script src="./assets/cloudflare-primary.js"></script>',
  '<script src="./assets/plush-guide.js"></script>',
];

function rimraf(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) return false;
  fs.cpSync(source, destination, { recursive: true });
  return true;
}

function prepareHtml(file, source) {
  let content = source;
  for (const [from, to] of CDN_REPLACEMENTS) content = content.split(from).join(to);

  // Cloudflare and Android use the generated www/ build. Inject hosting
  // compatibility and the non-destructive feature guide there while leaving
  // the GitHub Pages source untouched as an independently deployable backup.
  if (file === "index.html") {
    for (const script of GENERATED_INDEX_SCRIPTS) {
      if (!content.includes(script)) content = content.replace("</body>", `  ${script}\n</body>`);
    }
  }

  return content;
}

function main() {
  rimraf(WWW);
  fs.mkdirSync(VENDOR, { recursive: true });

  let copiedFiles = 0;
  for (const file of SITE_FILES) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) continue;
    const destination = path.join(WWW, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (/\.html$/.test(file)) {
      const content = prepareHtml(file, fs.readFileSync(src, "utf8"));
      fs.writeFileSync(destination, content);
    } else {
      fs.copyFileSync(src, destination);
    }
    copiedFiles += 1;
  }

  let copiedDirectories = 0;
  for (const directory of SITE_DIRECTORIES) {
    if (copyDirectory(path.join(ROOT, directory), path.join(WWW, directory))) copiedDirectories += 1;
  }

  let missingVendorFiles = false;
  for (const { src, dest } of VENDOR_FILES) {
    const from = path.join(ROOT, src);
    if (!fs.existsSync(from)) {
      console.error(`Missing vendor source: ${src} — run "npm install" first.`);
      missingVendorFiles = true;
      continue;
    }
    fs.copyFileSync(from, path.join(VENDOR, dest));
  }

  if (missingVendorFiles) process.exitCode = 1;
  console.log(`www/ synced (${copiedFiles} files, ${copiedDirectories} directories, ${VENDOR_FILES.length} vendored scripts).`);
}

main();
