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

const requiredRegressionMarkers = [
  'const [onboardingMode, setOnboardingMode] = useState(null);',
  'onboardingMode === "supporter"',
  '.from("weekly_intentions")',
  'Open Guardian invitations 💛',
  'pendingInviteAutoOpenedFor',
  'const invitation = supportLinks.find((link) => link.id === linkId);',
];

for (const marker of requiredRegressionMarkers) {
  if (!match[1].includes(marker)) {
    throw new Error(`Missing onboarding/weekly-intention regression marker: ${marker}`);
  }
}

console.log("App source compiles successfully.");
