import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const articleFiles = readdirSync(path.join(root, "articles"))
  .filter((file) => file.endsWith(".html"))
  .sort()
  .map((file) => `articles/${file}`);

const htmlFiles = [
  "index.html",
  "en/index.html",
  "pl/index.html",
  "book.html",
  "blog.html",
  "autotest.html",
  "children-eating-difficulties/index.html",
  "testimonials/anna-k/index.html",
  "testimonials/konrad-s/index.html",
  "testimonials/piotr-m/index.html",
  ...articleFiles,
];

const requiredFiles = [
  ".assetsignore",
  "README.md",
  "4e1fd93f8849388e2322e32b45921a4a.txt",
  "robots.txt",
  "sitemap.xml",
  "css/styles.css",
  "css/autotest.css",
  "css/children-eating-difficulties.css",
  "js/main.js",
  "js/autotest-config.mjs",
  "js/autotest.js",
  "js/children-eating-difficulties.js",
  "assets/logo.svg",
  "assets/favicon.svg",
  "assets/images/Natalia_Corvo.png",
  "assets/images/Natalia_Corvo_3.png",
  "assets/images/depression-food-japan-cover.png",
  "assets/images/natalia-hero.jpg",
  "assets/images/natalia-hero-cutout.png",
  "images/testimonials/foto_1.jpg",
  "images/testimonials/foto_2.jpg",
  "images/testimonials/foto_3.jpg",
  ...htmlFiles,
];

const errors = [];

function fileExists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

function assertFile(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath)) {
    errors.push(`Missing file: ${relativePath}`);
    return;
  }
  if (!statSync(fullPath).isFile()) {
    errors.push(`Not a file: ${relativePath}`);
  }
}

function normalizeReference(rawReference, fromFile) {
  if (
    rawReference.startsWith("#") ||
    rawReference.startsWith("mailto:") ||
    rawReference.startsWith("tel:") ||
    rawReference.startsWith("http://") ||
    rawReference.startsWith("https://") ||
    rawReference.startsWith("data:")
  ) {
    return null;
  }

  const withoutQuery = rawReference.split(/[?#]/, 1)[0];
  if (!withoutQuery) return null;

  const baseDir = path.posix.dirname(fromFile);
  const resolved = withoutQuery.startsWith("/")
    ? withoutQuery.slice(1)
    : path.posix.normalize(path.posix.join(baseDir, withoutQuery));

  if (resolved.endsWith("/")) return `${resolved}index.html`;
  return resolved;
}

function checkHtmlReferences(relativePath) {
  const html = readFileSync(path.join(root, relativePath), "utf8");
  const referencePattern = /\b(?:href|src)=["']([^"']+)["']/g;
  for (const match of html.matchAll(referencePattern)) {
    const reference = normalizeReference(match[1], relativePath);
    if (!reference) continue;
    if (!fileExists(reference)) {
      errors.push(`${relativePath} references missing file: ${match[1]} -> ${reference}`);
    }
  }
}

for (const file of requiredFiles) {
  assertFile(file);
}

for (const file of htmlFiles) {
  if (fileExists(file)) checkHtmlReferences(file);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML pages and ${requiredFiles.length} required files.`);
