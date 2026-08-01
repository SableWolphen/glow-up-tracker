const fs = require("fs");
const path = require("path");
const Babel = require("@babel/standalone");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const match = html.match(/<script id="app-source" type="text\/plain">([\s\S]*?)<\/script>/);

if (!match) throw new Error("Could not find the PlushLife app source in index.html");

Babel.transform(match[1], {
  presets: [["react", { runtime: "classic" }]],
  filename: "index.html",
});

console.log("App source compiles successfully.");
