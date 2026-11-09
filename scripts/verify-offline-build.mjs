import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
if (!fs.existsSync(dist)) throw new Error("dist/ is missing; build before offline verification.");

const forbiddenHosts = [
  "firebase.google.com",
  "firebaseio.com",
  "firestore.googleapis.com",
  "securetoken.googleapis.com",
  "supabase.co",
  "i.ibb.co",
  "images.unsplash.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const files = walk(dist).filter((file) => /\.(js|css|html|json)$/i.test(file));
const violations = [];
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const host of forbiddenHosts) {
    if (content.includes(host)) violations.push({ file, host });
  }
}
if (violations.length) {
  console.error("External runtime dependencies found in built assets:", violations);
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
for (const name of [
  "firebase",
  "@supabase/supabase-js",
  "@lovable.dev/cloud-auth-js",
  "@capgo/capacitor-social-login",
]) {
  if (dependencies[name]) throw new Error("Online service dependency remains installed: " + name);
}
console.log("Offline bundle guard passed.");
