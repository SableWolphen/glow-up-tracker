#!/usr/bin/env node
// Builds www/ — the Capacitor Android app's bundled web assets — from the
// same static site that's deployed to GitHub Pages. The site itself has no
// build step (index.html compiles its own JSX in-browser via Babel
// Standalone), so this just copies the deployed files as-is, with one
// change: CDN <script> tags (unpkg/jsdelivr) are rewritten to load locally
// vendored copies instead. A packaged native app shouldn't depend on a CDN
// being reachable to load its own UI shell — Supabase network calls for data
// are still expected and unaffected. GitHub Pages keeps serving the
// CDN-based root files untouched; this only affects the Android bundle.

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

function rimraf(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function main() {
  rimraf(WWW);
  fs.mkdirSync(VENDOR, { recursive: true });

  for (const file of SITE_FILES) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) continue;
    let content = fs.readFileSync(src, "utf8").toString();
    if (/\.(html)$/.test(file)) {
      for (const [from, to] of CDN_REPLACEMENTS) content = content.split(from).join(to);
      fs.writeFileSync(path.join(WWW, file), content);
    } else {
      fs.copyFileSync(src, path.join(WWW, file));
    }
  }

  for (const { src, dest } of VENDOR_FILES) {
    const from = path.join(ROOT, src);
    if (!fs.existsSync(from)) {
      console.error(`Missing vendor source: ${src} — run "npm install" first.`);
      process.exitCode = 1;
      continue;
    }
    fs.copyFileSync(from, path.join(VENDOR, dest));
  }

  console.log(`www/ synced from repo root (${SITE_FILES.length} site files, ${VENDOR_FILES.length} vendored scripts).`);
}

main();
