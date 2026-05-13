#!/usr/bin/env node
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { extensionForMime, findCommonsCoverImage, normalizeCommonsSourceUrl } from "./lib/commons_cover_search.mjs";

const root = process.cwd();
const sourceHashesPath = path.join(root, "data/article-publishing/source_hashes.json");
const statePath = path.join(root, "data/article-publishing/state.json");
const imageSearchManifestPath = path.join(root, "data/article-publishing/image_search_manifest.json");
const blogPath = path.join(root, "blog.html");
const sitemapPath = path.join(root, "sitemap.xml");
const articlesDir = path.join(root, "articles");
const blogImagesDir = path.join(root, "assets/images/blog");

const sourcePackages = [
  {
    rootRelative: "data/article-publishing/nataliacorvo_codex_new_articles_sources",
    manifestFile: "ARTICLE_MANIFEST.md",
  },
  {
    rootRelative: "data/article-publishing/nataliacorvo_codex_articles_25_34",
    manifestFile: "ARTICLE_MANIFEST_25_34.md",
  },
  {
    rootRelative: "data/article-publishing/nataliacorvo_codex_articles_35_44_deep_v2",
    manifestFile: "ARTICLE_MANIFEST_35_44.md",
    sourceFilePrefix: "articles_md/",
  },
].map((sourcePackage) => ({
  ...sourcePackage,
  root: path.join(root, sourcePackage.rootRelative),
  sourceFilePrefix: sourcePackage.sourceFilePrefix || "",
}));

const sourceRootRelatives = sourcePackages.map((sourcePackage) => sourcePackage.rootRelative);
const expectedQueueTotal = 44;

const args = new Set(process.argv.slice(2));
const publishMode = args.has("--publish");
const dryRunMode = args.has("--dry-run");
const ignoreTime = args.has("--ignore-time") || dryRunMode;
const allowedPublishHours = new Set(["08", "09", "10"]);

if (publishMode === dryRunMode) {
  fail("Use exactly one mode: --publish or --dry-run.");
}

const requiredFrontmatterKeys = [
  "slug",
  "canonical_url",
  "datePublished",
  "dateModified",
  "language_mode",
  "inLanguage",
  "author",
  "publisher",
  "category_pl",
  "category_en",
  "title_pl",
  "title_en",
  "meta_title_pl",
  "meta_title_en",
  "meta_description_pl",
  "meta_description_en",
  "internal_links",
];

const slugAliases = new Map([
  ["dieta-dash-nadcisnienie", "dieta-dash-cisnienie-serce"],
  ["dieta-bezglutenowa-kiedy-potrzebna", "dieta-bezglutenowa-kiedy-stosowac"],
  ["dieta-srodziemnomorska-praktyka", "dieta-srodziemnomorska-praktycznie"],
]);

const fallbackReadAlso = [
  "talerz-zdrowego-zywienia",
  "dieta-przeciwzapalna-fakty",
  "insulinoopornosc-dieta-nawyki",
  "odchudzanie-bez-efektu-jojo",
  "dieta-dash-cisnienie-serce",
];

main().catch((error) => fail(error.message || String(error)));

async function main() {
  assertSourcePackageIntegrity();

  const now = getDublinNow();
  output("local_date", now.date);
  output("local_hour", now.hour);

  if (publishMode && !ignoreTime && !allowedPublishHours.has(now.hour)) {
    console.log(`Skipping publish: Europe/Dublin local hour is ${now.hour}, not 08, 09 or 10.`);
    output("changed", "false");
    output("skip_reason", "outside_publish_hour");
    return;
  }

  const manifest = parseManifest();
  const sourceBySlug = new Map(manifest.map((entry) => [entry.slug, loadSource(entry)]));
  const imageSearchManifest = readImageSearchManifest(manifest);
  const state = readJson(statePath);
  validateState(state, manifest);
  validatePublishedStateConsistency(state, manifest);

  if (publishMode && state.last_published_local_date === now.date) {
    console.log(`Skipping publish: one article was already published for ${now.date}.`);
    output("changed", "false");
    output("skip_reason", "already_published_today");
    return;
  }

  const nextEntry = manifest.find((entry) => !state.published.some((item) => item.slug === entry.slug));
  if (!nextEntry) {
    console.log("Skipping publish: all queued articles are already published.");
    output("changed", "false");
    output("skip_reason", "queue_complete");
    return;
  }

  const source = sourceBySlug.get(nextEntry.slug);
  const articlePath = path.join(articlesDir, `${source.meta.slug}.html`);
  const blogHtml = readText(blogPath);

  if (existsSync(articlePath) || blogContainsSlug(blogHtml, source.meta.slug)) {
    fail(`Refusing to publish ${source.meta.slug}: article file or blog card already exists outside committed publisher state.`);
  }

  const cover = await chooseCover(source, imageSearchManifest, state);
  const generated = buildPublication(source, state, sourceBySlug, cover, now.date);
  validateGeneratedPublication(generated, source);

  if (dryRunMode) {
    console.log(`Dry run passed. Next article would be order ${nextEntry.order}: ${nextEntry.slug}`);
    output("changed", "false");
    output("published_slug", nextEntry.slug);
    return;
  }

  mkdirSync(articlesDir, { recursive: true });
  writeFileSync(articlePath, generated.articleHtml);
  writeFileSync(blogPath, generated.blogHtml);
  writeFileSync(sitemapPath, generated.sitemapXml);

  const nextState = {
    ...state,
    last_published_order: nextEntry.order,
    last_published_slug: nextEntry.slug,
    last_published_local_date: now.date,
    published: [
      ...state.published,
      {
        order: nextEntry.order,
        slug: nextEntry.slug,
        source_root: nextEntry.sourceRootRelative,
        source_file: nextEntry.sourceFile,
        cover_image: cover.file,
        cover_source_url: cover.source_url,
        cover_license: cover.license,
        cover_attribution: cover.attribution,
        published_local_date: now.date,
        published_at_utc: new Date().toISOString(),
      },
    ],
  };
  writeFileSync(statePath, `${JSON.stringify(nextState, null, 2)}\n`);

  console.log(`Published one article into the working tree: ${nextEntry.slug}`);
  output("changed", "true");
  output("published_slug", nextEntry.slug);
  output("article_url", `https://nataliacorvo.com/articles/${nextEntry.slug}`);
}

function assertSourcePackageIntegrity() {
  const docs = [
    ["data/article-publishing/nataliacorvo_codex_new_articles_sources", "CODEX_PUBLISHING_INSTRUCTIONS.md"],
    ["data/article-publishing/nataliacorvo_codex_new_articles_sources", "ARTICLE_MANIFEST.md"],
    ["data/article-publishing/nataliacorvo_codex_new_articles_sources", "SEO_AI_CRAWLING_RULES.md"],
    ["data/article-publishing/nataliacorvo_codex_new_articles_sources", "ARTICLE_SOURCE_CONTRACT.md"],
    ["data/article-publishing/nataliacorvo_codex_articles_25_34", "ARTICLE_MANIFEST_25_34.md"],
    ["data/article-publishing/nataliacorvo_codex_articles_35_44_deep_v2", "ARTICLE_MANIFEST_35_44.md"],
    ["data/article-publishing/nataliacorvo_codex_articles_35_44_deep_v2", "SEO_RESEARCH_BRIEF_35_44.md"],
  ];
  for (const [rootRelative, doc] of docs) {
    const file = path.join(root, rootRelative, doc);
    if (!existsSync(file)) fail(`Missing required source document: ${file}`);
  }

  const sourceHashes = readJson(sourceHashesPath);
  if (sourceHashes.version !== 2 || !Array.isArray(sourceHashes.packages)) {
    fail("source_hashes.json must use version 2 and contain a packages array.");
  }

  const packagesByRoot = new Map(sourceHashes.packages.map((sourcePackage) => [sourcePackage.source_root, sourcePackage]));
  for (const sourcePackage of sourcePackages) {
    const packageHash = packagesByRoot.get(sourcePackage.rootRelative);
    if (!packageHash) fail(`source_hashes.json is missing package: ${sourcePackage.rootRelative}`);
    if (!packageHash.zip_file || !packageHash.zip_file.endsWith(".zip")) {
      fail(`source_hashes.json package ${sourcePackage.rootRelative} must record its ZIP file.`);
    }
    if (!packageHash.files || typeof packageHash.files !== "object" || Array.isArray(packageHash.files)) {
      fail(`source_hashes.json package ${sourcePackage.rootRelative} must contain a files object.`);
    }

    const expectedFiles = new Set(Object.keys(packageHash.files));
    for (const relativeFile of expectedFiles) {
      const filePath = path.join(sourcePackage.root, relativeFile);
      if (!existsSync(filePath)) fail(`Source package file is missing: ${sourcePackage.rootRelative}/${relativeFile}`);
      const actualHash = sha256File(filePath);
      if (actualHash !== packageHash.files[relativeFile]) {
        fail(`Source package file hash mismatch: ${sourcePackage.rootRelative}/${relativeFile}`);
      }
    }

    for (const relativeFile of listFiles(sourcePackage.root)) {
      if (!expectedFiles.has(relativeFile)) {
        fail(`Unexpected file in committed source package: ${sourcePackage.rootRelative}/${relativeFile}`);
      }
    }
  }
  for (const packageHash of sourceHashes.packages) {
    if (!sourceRootRelatives.includes(packageHash.source_root)) {
      fail(`source_hashes.json contains an unexpected package: ${packageHash.source_root}`);
    }
  }
}

function parseManifest() {
  const entries = [];

  for (const sourcePackage of sourcePackages) {
    const manifestPath = path.join(sourcePackage.root, sourcePackage.manifestFile);
    const text = readText(manifestPath);
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\|\s*(\d+)\s*\|\s*`([^`]+)`\s*\|.*\|\s*`([^`]+\.md)`\s*\|$/);
      if (!match) continue;
      entries.push({
        order: Number(match[1]),
        slug: match[2],
        status: "READY_FOR_CODEX",
        sourceFile: `${sourcePackage.sourceFilePrefix}${match[3]}`,
        sourceRoot: sourcePackage.root,
        sourceRootRelative: sourcePackage.rootRelative,
      });
    }
  }

  if (entries.length !== expectedQueueTotal) fail(`Expected ${expectedQueueTotal} manifest entries; found ${entries.length}.`);
  const seen = new Set();
  for (const [index, entry] of entries.entries()) {
    if (entry.order !== index + 1) fail(`Manifest order is not contiguous at ${entry.slug}.`);
    if (seen.has(entry.slug)) fail(`Duplicate manifest slug: ${entry.slug}`);
    if (entry.slug === "dieta-dash-nadcisnienie") fail("The old DASH draft must never be published.");
    seen.add(entry.slug);
  }
  return entries;
}

function readImageSearchManifest(manifest) {
  const imageManifest = readJson(imageSearchManifestPath);
  if (imageManifest.version !== 1 || imageManifest.provider !== "wikimedia_commons") {
    fail("image_search_manifest.json must use version 1 and provider wikimedia_commons.");
  }
  if (!imageManifest.articles || typeof imageManifest.articles !== "object") {
    fail("image_search_manifest.json must contain an articles object.");
  }
  for (const entry of manifest) {
    const imageEntry = imageManifest.articles[entry.slug];
    if (!imageEntry) fail(`image_search_manifest.json missing image query for ${entry.slug}.`);
    if (!imageEntry.query || !imageEntry.alt_pl || !imageEntry.alt_en) {
      fail(`image_search_manifest.json entry for ${entry.slug} must include query, alt_pl and alt_en.`);
    }
  }
  return imageManifest;
}

function loadSource(entry) {
  const filePath = path.join(entry.sourceRoot, entry.sourceFile);
  if (!existsSync(filePath)) fail(`Missing source article: ${entry.sourceRootRelative}/${entry.sourceFile}`);

  const raw = readText(filePath);
  const { meta, body } = parseFrontmatter(raw, entry.sourceFile);
  normalizeSourceMeta(meta);
  for (const key of requiredFrontmatterKeys) {
    if (!(key in meta)) fail(`${entry.sourceFile} missing required frontmatter key: ${key}`);
  }
  if (meta.production_status !== "READY_FOR_CODEX") fail(`${entry.sourceFile} is not READY_FOR_CODEX.`);
  if (meta.slug !== entry.slug) fail(`${entry.sourceFile} slug does not match manifest slug.`);
  if (meta.canonical_url !== `https://nataliacorvo.com/articles/${meta.slug}`) {
    fail(`${entry.sourceFile} canonical_url must use /articles/{slug}.`);
  }
  if (meta.language_mode !== "single_bilingual_page") fail(`${entry.sourceFile} has unexpected language_mode.`);
  if (!Array.isArray(meta.inLanguage) || !meta.inLanguage.includes("pl-PL") || !meta.inLanguage.includes("en-GB")) {
    fail(`${entry.sourceFile} must declare inLanguage pl-PL and en-GB.`);
  }
  if (meta.author !== "Natalia Wcisło" || meta.publisher !== "Natural Healing") {
    fail(`${entry.sourceFile} has unexpected author or publisher.`);
  }
  if (containsItalianMarker(raw)) fail(`${entry.sourceFile} contains Italian language or route markers.`);
  if (meta.slug === "dieta-dash-nadcisnienie") fail("The old DASH draft must never be published.");

  const visible = stripImplementationNotes(body);
  const parts = splitVisibleSource(visible, entry.sourceFile);
  const plFaq = extractFaq(parts.plMarkdown, ["FAQ", "FAQ PL"]);
  const enFaq = extractFaq(parts.enMarkdown, ["FAQ", "FAQ EN"]);
  if (plFaq.length === 0 || enFaq.length === 0) fail(`${entry.sourceFile} must contain PL and EN FAQ sections.`);

  const sources = extractSources(parts.sourcesMarkdown);
  if (sources.length === 0) fail(`${entry.sourceFile} must contain visible source URLs.`);

  if (!/Nie zastępuje/u.test(parts.safetyMarkdown) || !/does not replace/u.test(parts.safetyMarkdown)) {
    fail(`${entry.sourceFile} must keep the bilingual safety note.`);
  }

  return {
    entry,
    meta,
    parts,
    plFaq,
    enFaq,
    sources,
  };
}

function normalizeSourceMeta(meta) {
  if (meta.author === "Natalia Wcisło / Natural Healing") {
    meta.author = "Natalia Wcisło";
    meta.publisher = meta.publisher || "Natural Healing";
  }
  if (!meta.publisher && meta.author === "Natalia Wcisło") {
    meta.publisher = "Natural Healing";
  }
  if (!Array.isArray(meta.read_also)) {
    meta.read_also = Array.isArray(meta.internal_links) ? [...meta.internal_links] : [];
  }
}

function parseFrontmatter(raw, fileName) {
  if (!raw.startsWith("---\n")) fail(`${fileName} is missing YAML frontmatter.`);
  const end = raw.indexOf("\n---", 4);
  if (end === -1) fail(`${fileName} frontmatter is not closed.`);

  const frontmatter = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).trimStart();
  const meta = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) fail(`${fileName} has malformed frontmatter line: ${line}`);
    meta[match[1]] = parseYamlValue(match[2], fileName, match[1]);
  }
  return { meta, body };
}

function parseYamlValue(rawValue, fileName, key) {
  const value = rawValue.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      return JSON.parse(value);
    } catch {
      fail(`${fileName} has malformed array value for ${key}.`);
    }
  }
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  return value;
}

function stripImplementationNotes(body) {
  const jsonLdIndex = body.search(/^## JSON-LD suggested block$/m);
  return (jsonLdIndex === -1 ? body : body.slice(0, jsonLdIndex)).trim();
}

function splitVisibleSource(visible, fileName) {
  const plIndex = headingIndex(visible, "PL");
  const enIndex = headingIndex(visible, "EN");
  const safetyIndex = headingIndex(visible, "Nota bezpieczeństwa / Safety note");
  const sourcesIndex = headingIndexAny(visible, [
    "Źródła / Sources",
    "Źródła i dalsza lektura / Sources and further reading",
  ]);
  if (plIndex === -1 || enIndex === -1 || safetyIndex === -1 || sourcesIndex === -1) {
    fail(`${fileName} is missing one of the required rendered blocks.`);
  }
  if (!(plIndex < enIndex && enIndex < safetyIndex && safetyIndex < sourcesIndex)) {
    fail(`${fileName} rendered blocks are not in the required PL, EN, safety, sources order.`);
  }

  return {
    plMarkdown: visible.slice(visible.indexOf("\n", plIndex) + 1, enIndex).trim(),
    enMarkdown: visible.slice(visible.indexOf("\n", enIndex) + 1, safetyIndex).trim(),
    safetyMarkdown: visible.slice(visible.indexOf("\n", safetyIndex) + 1, sourcesIndex).trim(),
    sourcesMarkdown: visible.slice(visible.indexOf("\n", sourcesIndex) + 1).replace(/\n---[\s\S]*$/u, "").trim(),
  };
}

function headingIndex(text, heading) {
  const match = new RegExp(`^## ${escapeRegExp(heading)}$`, "m").exec(text);
  return match ? match.index : -1;
}

function headingIndexAny(text, headings) {
  const indexes = headings
    .map((heading) => headingIndex(text, heading))
    .filter((index) => index !== -1);
  return indexes.length > 0 ? Math.min(...indexes) : -1;
}

function buildPublication(source, state, sourceBySlug, cover, publishedDate) {
  const articleLinks = chooseArticleLinks(source.meta, state, sourceBySlug);
  const plQuick = firstSectionText(source.parts.plMarkdown, "Krótka odpowiedź");
  const enQuick = firstSectionText(source.parts.enMarkdown, "Quick answer");
  if (!plQuick || !enQuick) fail(`${source.entry.sourceFile} must include PL and EN answer-first sections.`);

  const articleHtml = renderArticlePage({
    source,
    cover,
    articleLinks,
    plQuick,
    enQuick,
    publishedDate,
  });
  const cardHtml = renderBlogCard(source, cover, publishedDate);
  const featureHtml = renderBlogFeature(source, cover);
  const currentBlogHtml = readText(blogPath);
  const blogWithCard = insertBlogCard(currentBlogHtml, cardHtml, source.meta.slug);
  const blogHtml = replaceBlogFeature(blogWithCard, featureHtml);
  const sitemapXml = insertSitemapUrl(readText(sitemapPath), source.meta.slug, publishedDate);

  return { articleHtml, blogHtml, sitemapXml };
}

async function chooseCover(source, imageSearchManifest, state) {
  const imageEntry = imageSearchManifest.articles[source.meta.slug];
  const existing = findExistingCover(source.meta.slug);
  if (existing) {
    return {
      file: existing,
      alt_pl: imageEntry.alt_pl,
      alt_en: imageEntry.alt_en,
      attribution: "Existing committed cover image",
      license: "local",
      source_url: `assets/images/blog/${existing}`,
    };
  }
  if (dryRunMode) {
    return {
      file: `${source.meta.slug}-cover.jpg`,
      alt_pl: imageEntry.alt_pl,
      alt_en: imageEntry.alt_en,
      attribution: "Wikimedia Commons image to be selected at publish time",
      license: "pending",
      source_url: "",
    };
  }

  const selected = await findCommonsCoverImage({
    query: imageEntry.query,
    slug: source.meta.slug,
    usedSourceUrls: usedCoverSourceUrls(state, imageEntry),
    userAgent: "nataliacorvo-daily-article-publisher/1.0 (https://nataliacorvo.com/)",
  });
  const extension = extensionForMime(selected.mime);
  const file = `${source.meta.slug}-cover.${extension}`;
  const destination = path.join(blogImagesDir, file);
  if (existsSync(destination)) fail(`Refusing to overwrite existing cover image: assets/images/blog/${file}`);

  const imageResponse = await fetch(selected.downloadUrl, {
    headers: { "User-Agent": "nataliacorvo-daily-article-publisher/1.0 (https://nataliacorvo.com/)" },
  });
  if (!imageResponse.ok) {
    fail(`Could not download Wikimedia Commons image for ${source.meta.slug}: HTTP ${imageResponse.status}`);
  }
  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  if (bytes.length < 5000) fail(`Downloaded cover image for ${source.meta.slug} is unexpectedly small.`);
  mkdirSync(blogImagesDir, { recursive: true });
  writeFileSync(destination, bytes);

  return {
    file,
    alt_pl: imageEntry.alt_pl,
    alt_en: imageEntry.alt_en,
    attribution: selected.attribution,
    license: selected.license,
    source_url: selected.descriptionUrl,
  };
}

function findExistingCover(slug) {
  if (!existsSync(blogImagesDir)) return null;
  const prefix = `${slug}-cover.`;
  return readdirSync(blogImagesDir).find((file) => file.startsWith(prefix)) || null;
}

function usedCoverSourceUrls(state, imageEntry) {
  const used = new Set();
  for (const item of state.published || []) {
    const normalized = normalizeCommonsSourceUrl(item.cover_source_url);
    if (normalized) used.add(normalized);
  }
  for (const sourceUrl of imageEntry.avoid_source_urls || []) {
    const normalized = normalizeCommonsSourceUrl(sourceUrl);
    if (normalized) used.add(normalized);
  }
  return used;
}

function chooseArticleLinks(meta, state, sourceBySlug) {
  const candidates = [...meta.internal_links, ...meta.read_also, ...fallbackReadAlso];
  const links = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const resolvedSlug = resolveSlug(candidate);
    if (resolvedSlug === meta.slug || seen.has(resolvedSlug)) continue;
    if (!isPublishedOrExisting(resolvedSlug, state)) continue;
    const title = getArticleTitle(resolvedSlug, sourceBySlug);
    links.push({ slug: resolvedSlug, ...title });
    seen.add(resolvedSlug);
    if (links.length === 4) break;
  }
  if (links.length < 2) fail(`${meta.slug} needs at least two safe internal links.`);
  return links;
}

function resolveSlug(rawSlug) {
  const aliased = slugAliases.get(rawSlug) || rawSlug;
  const filePath = path.join(articlesDir, `${aliased}.html`);
  if (!existsSync(filePath)) return aliased;

  const html = readText(filePath);
  const canonical = html.match(/<link rel="canonical" href="https:\/\/nataliacorvo\.com\/articles\/([^"\/.]+)(?:\.html)?">/u);
  if (canonical) return slugAliases.get(canonical[1]) || canonical[1];
  return aliased;
}

function isPublishedOrExisting(slug, state) {
  if (existsSync(path.join(articlesDir, `${slug}.html`))) return true;
  return state.published.some((item) => item.slug === slug);
}

function getArticleTitle(slug, sourceBySlug) {
  const existingPath = path.join(articlesDir, `${slug}.html`);
  if (existsSync(existingPath)) {
    const html = readText(existingPath);
    const h1 = html.match(/<h1><span class="lang-pl-content">([\s\S]*?)<\/span><span class="lang-en-content">([\s\S]*?)<\/span><\/h1>/u);
    if (h1) return { title_pl: decodeBasicEntities(stripTags(h1[1])), title_en: decodeBasicEntities(stripTags(h1[2])) };
  }
  const source = sourceBySlug.get(slug);
  if (source) return { title_pl: source.meta.title_pl, title_en: source.meta.title_en };
  fail(`Cannot resolve title for internal link slug: ${slug}`);
}

function renderArticlePage({ source, cover, articleLinks, plQuick, enQuick, publishedDate }) {
  const { meta } = source;
  const metaTitlePl = meta.meta_title_pl || `${meta.title_pl} | Natural Healing`;
  const metaTitleEn = meta.meta_title_en || `${meta.title_en} | Natural Healing`;
  const canonical = `https://nataliacorvo.com/articles/${meta.slug}`;
  const imageUrl = `https://nataliacorvo.com/assets/images/blog/${cover.file}`;
  const datePl = formatDatePl(publishedDate);
  const modifiedPl = formatDatePl(publishedDate);
  const plSummary = splitSentences(plQuick).slice(0, 3);
  const enSummary = splitSentences(enQuick).slice(0, 3);
  const summaryItems = plSummary.map((pl, index) => ({
    pl,
    en: enSummary[index] || enQuick,
  }));
  const relatedInline = renderInlineLinks(articleLinks);
  const readAlso = renderReadAlso(articleLinks.slice(0, 3));
  const faqSchema = buildFaqSchema(source.plFaq, source.enFaq);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Natural Healing - Natalia Corvo",
    email: "Dietolozki@gmail.com",
    image: "../assets/images/natalia-hero.jpg",
    areaServed: ["Dublin", "Ireland", "Online"],
    availableLanguage: ["pl", "en"],
    sameAs: [
      "https://www.instagram.com/natural.healing.dublin?igsh=MXYxMmticzFsam10eg%3D%3D",
      "https://www.facebook.com/people/Natural-Healing/61572266563392/?mibextid=wwXIfr&rdid=RKUIF0cw8DOPcoCm&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1GhXD36Qzc%2F%3Fmibextid%3DwwXIfr%26ref%3D1",
    ],
    description: "Polish and English nutrition support in Dublin and online.",
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: `${meta.title_pl} / ${meta.title_en}`,
    alternativeHeadline: meta.title_en,
    description: meta.meta_description_pl,
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    datePublished: publishedDate,
    dateModified: publishedDate,
    inLanguage: ["pl-PL", "en-GB"],
    keywords: [...(meta.keywords_pl || []), ...(meta.keywords_en || [])],
    articleSection: meta.category_pl,
    author: { "@type": "Person", name: "Natalia Corvo" },
    publisher: { "@type": "Organization", name: "Natural Healing" },
    image: imageUrl,
  };

  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(metaTitlePl)}</title>
  <meta name="description" content="${escapeAttribute(meta.meta_description_pl)}" data-description-pl="${escapeAttribute(meta.meta_description_pl)}" data-description-en="${escapeAttribute(meta.meta_description_en)}">
  <meta name="robots" content="index, follow">
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../css/styles.css">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escapeAttribute(metaTitlePl)}" data-og-title-pl="${escapeAttribute(metaTitlePl)}" data-og-title-en="${escapeAttribute(metaTitleEn)}">
  <meta property="og:description" content="${escapeAttribute(meta.meta_description_pl)}" data-og-description-pl="${escapeAttribute(meta.meta_description_pl)}" data-og-description-en="${escapeAttribute(meta.meta_description_en)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="pl_PL" data-og-locale>
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttribute(metaTitlePl)}" data-twitter-title-pl="${escapeAttribute(metaTitlePl)}" data-twitter-title-en="${escapeAttribute(metaTitleEn)}">
  <meta name="twitter:description" content="${escapeAttribute(meta.meta_description_pl)}" data-twitter-description-pl="${escapeAttribute(meta.meta_description_pl)}" data-twitter-description-en="${escapeAttribute(meta.meta_description_en)}">
  <meta name="twitter:image" content="${imageUrl}">
  <script type="application/ld+json">${JSON.stringify(serviceSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
</head>
<body class="lang-pl" data-title-pl="${escapeAttribute(metaTitlePl)}" data-title-en="${escapeAttribute(metaTitleEn)}">

<a class="skip-link" href="#main"><span class="lang-pl-content">Przejdź do treści</span><span class="lang-en-content">Skip to content</span></a>
${renderHeader("../")}
<main id="main">

<section class="page-hero article-hero">
  <div class="container article-hero-grid">
    <div class="stack">
      <a class="back-link" href="../blog.html"><span class="lang-pl-content">Wróć do bloga</span><span class="lang-en-content">Back to blog</span></a>
      <span class="eyebrow"><span class="lang-pl-content">${escapeHtml(meta.category_pl)}</span><span class="lang-en-content">${escapeHtml(meta.category_en)}</span> • 10 min</span>
      <h1><span class="lang-pl-content">${escapeHtml(meta.title_pl)}</span><span class="lang-en-content">${escapeHtml(meta.title_en)}</span></h1>
      <p class="lead"><span class="lang-pl-content">${escapeHtml(plQuick)}</span><span class="lang-en-content">${escapeHtml(enQuick)}</span></p>
      <p class="article-meta"><span class="lang-pl-content">Autorka: Natalia Corvo · Opublikowano</span><span class="lang-en-content">Author: Natalia Corvo · Published</span> <time datetime="${publishedDate}">${datePl}</time> · <span class="lang-pl-content">Aktualizacja</span><span class="lang-en-content">Updated</span> <time datetime="${publishedDate}">${modifiedPl}</time></p>
    </div>
    <figure class="article-cover">
      <img src="../assets/images/blog/${cover.file}" width="1200" height="675" loading="eager" fetchpriority="high" decoding="async" alt="${escapeAttribute(cover.alt_pl)}" data-alt-pl="${escapeAttribute(cover.alt_pl)}" data-alt-en="${escapeAttribute(cover.alt_en)}">
      ${renderCoverCredit(cover)}
    </figure>
  </div>
</section>
<section class="section">
  <div class="container article-layout">
    <article class="article-body">
      <div class="article-summary-box">
        <strong><span class="lang-pl-content">Najważniejsze wnioski</span><span class="lang-en-content">Key takeaways</span></strong>
        <ul>${summaryItems.map((item) => `<li><span class="lang-pl-content">${escapeHtml(item.pl)}</span><span class="lang-en-content">${escapeHtml(item.en)}</span></li>`).join("\n")}</ul>
      </div>
      ${relatedInline}
      <div class="lang-pl-content">
${renderMarkdown(source.parts.plMarkdown, "pl")}
      </div>
      <div class="lang-en-content">
${renderMarkdown(source.parts.enMarkdown, "en")}
      </div>
      <div class="disclaimer">
        <strong><span class="lang-pl-content">Nota bezpieczeństwa</span><span class="lang-en-content">Safety note</span></strong>
${renderSafety(source.parts.safetyMarkdown)}
      </div>
      <div class="source-box">
        <strong><span class="lang-pl-content">Źródła i dalsza lektura</span><span class="lang-en-content">Sources and further reading</span></strong>
        <ol>${source.sources.map((sourceItem) => `<li><a href="${escapeAttribute(sourceItem.url)}" target="_blank" rel="noopener">${escapeHtml(sourceItem.label)}</a></li>`).join("")}</ol>
      </div>
      <div class="article-cta">
        <h2><span class="lang-pl-content">Chcesz dopasować ten temat do siebie?</span><span class="lang-en-content">Want to adapt this topic to you?</span></h2>
        <p><span class="lang-pl-content">Wyślij krótkie zapytanie i opisz, czego potrzebujesz w konsultacji. Natalia pomoże przełożyć wiedzę na plan możliwy do wykonania.</span><span class="lang-en-content">Send a short enquiry and describe what you need. Natalia can help turn the information into a plan that fits real life.</span></p>
        <a class="btn btn-primary" href="../index.html#booking"><span class="lang-pl-content">Umów wizytę</span><span class="lang-en-content">Book a visit</span></a>
      </div>
    </article>
    <aside class="article-aside" aria-label="Article side information">
      <div class="side-box">
        <strong><span class="lang-pl-content">Temat</span><span class="lang-en-content">Topic</span></strong>
        <p><span class="lang-pl-content">${escapeHtml(meta.category_pl)}</span><span class="lang-en-content">${escapeHtml(meta.category_en)}</span></p>
      </div>
      <div class="side-box">
        <strong><span class="lang-pl-content">Czytaj także</span><span class="lang-en-content">Read also</span></strong>
        ${readAlso}
      </div>
      <div class="side-box">
        <strong>Email</strong>
        <p><a href="mailto:Dietolozki@gmail.com">Dietolozki@gmail.com</a></p>
      </div>
    </aside>
  </div>
</section>

</main>

${renderFooter("../")}
<script src="../js/main.js"></script>
</body>
</html>
`;
}

function renderHeader(prefix) {
  return `<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="${prefix}index.html" aria-label="Natural Healing - Natalia Corvo">
      <img src="${prefix}assets/logo.svg" alt="" aria-hidden="true">
      <span>Natural Healing<small>Natalia Corvo</small></span>
    </a>
    <button class="nav-toggle" type="button" aria-controls="site-nav" aria-expanded="false">
      <span class="nav-toggle-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      <span><span class="lang-pl-content">Menu</span><span class="lang-en-content">Menu</span></span>
    </button>
    <nav class="nav" id="site-nav" aria-label="Main navigation">
      <div class="nav-links">
        <a href="${prefix}index.html"><span class="lang-pl-content">Start</span><span class="lang-en-content">Home</span></a>
        <a href="${prefix}book.html"><span class="lang-pl-content">e-Book</span><span class="lang-en-content">e-Book</span></a>
        <a href="${prefix}blog.html" aria-current="page"><span class="lang-pl-content">Blog</span><span class="lang-en-content">Blog</span></a>
        <a href="${prefix}autotest.html"><span class="lang-pl-content">Autotest</span><span class="lang-en-content">Self-check</span></a>
        <a href="${prefix}children-eating-difficulties/"><span class="lang-pl-content">Dzieci</span><span class="lang-en-content">Children</span></a>
      </div>
      <div class="nav-actions">
        <div class="lang-switch" data-lang-menu>
          <button class="lang-toggle" type="button" data-lang-menu-toggle aria-haspopup="listbox" aria-expanded="false" aria-label="Language switcher">
            <span data-current-lang>PL</span>
            <span class="lang-chevron" aria-hidden="true"></span>
          </button>
          <div class="lang-menu" data-lang-menu-panel role="listbox" aria-label="Language switcher">
            <button class="lang-option" type="button" data-set-lang="pl" role="option" aria-selected="true">PL</button>
            <button class="lang-option" type="button" data-set-lang="en" role="option" aria-selected="false">EN</button>
          </div>
        </div>
        <a class="nav-cta" href="${prefix}index.html#booking"><span class="lang-pl-content">Umów wizytę</span><span class="lang-en-content">Book a visit</span></a>
      </div>
    </nav>
  </div>
</header>`;
}

function renderCoverCredit(cover) {
  if (!cover.source_url) {
    return `<figcaption><span class="lang-pl-content">Zdjęcie zostanie wybrane z Wikimedia Commons podczas publikacji.</span><span class="lang-en-content">The image will be selected from Wikimedia Commons at publish time.</span></figcaption>`;
  }
  return `<figcaption><span class="lang-pl-content">Zdjęcie: <a href="${escapeAttribute(cover.source_url)}" target="_blank" rel="noopener">${escapeHtml(cover.attribution)}</a>.</span><span class="lang-en-content">Image: <a href="${escapeAttribute(cover.source_url)}" target="_blank" rel="noopener">${escapeHtml(cover.attribution)}</a>.</span></figcaption>`;
}

function renderFooter(prefix) {
  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div>
      <div class="footer-brand"><img src="${prefix}assets/logo.svg" alt="" aria-hidden="true"><strong>Natural Healing</strong></div>
      <p><span class="lang-pl-content">Wsparcie żywieniowe Natalii Corvo w Dublinie i online. Treści na stronie mają charakter edukacyjny i nie zastępują indywidualnej diagnozy medycznej.</span><span class="lang-en-content">Nutrition support by Natalia Corvo in Dublin and online. Website content is educational and does not replace individual medical diagnosis.</span></p>
    </div>
    <div>
      <strong><span class="lang-pl-content">Strony</span><span class="lang-en-content">Pages</span></strong>
      <ul class="footer-links">
        <li><a href="${prefix}index.html"><span class="lang-pl-content">Start</span><span class="lang-en-content">Home</span></a></li>
        <li><a href="${prefix}book.html"><span class="lang-pl-content">e-Book</span><span class="lang-en-content">e-Book</span></a></li>
        <li><a href="${prefix}blog.html">Blog</a></li>
        <li><a href="${prefix}autotest.html"><span class="lang-pl-content">Autotest</span><span class="lang-en-content">Self-check</span></a></li>
      </ul>
    </div>
    <div>
      <strong><span class="lang-pl-content">Napisz</span><span class="lang-en-content">Get in touch</span></strong>
      <ul class="footer-links">
        <li><a href="mailto:Dietolozki@gmail.com">Dietolozki@gmail.com</a></li>
        <li><a href="https://www.instagram.com/natural.healing.dublin?igsh=MXYxMmticzFsam10eg%3D%3D" target="_blank" rel="noopener">Instagram</a></li>
        <li><a href="https://www.facebook.com/people/Natural-Healing/61572266563392/?mibextid=wwXIfr&rdid=RKUIF0cw8DOPcoCm&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1GhXD36Qzc%2F%3Fmibextid%3DwwXIfr%26ref%3D1" target="_blank" rel="noopener">Facebook</a></li>
      </ul>
    </div>
  </div>
  <div class="container footer-bottom">
    <span>© 2026 Natural Healing. Natalia Corvo.</span>
    <span><span class="lang-pl-content">Przed publikacją formularza produkcyjnego dodaj politykę prywatności i informacje RODO/GDPR.</span><span class="lang-en-content">Before publishing a production form, add a privacy policy and GDPR information.</span></span>
  </div>
</footer>`;
}

function renderMarkdown(markdown, lang) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let listItems = [];
  let openSection = false;
  let sectionCount = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    html.push(`<p>${paragraph.join(" ").replace(/<br> /g, "<br>")}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (listItems.length === 0) return;
    html.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
    listItems = [];
  };
  const closeSection = () => {
    flushParagraph();
    flushList();
    if (openSection) html.push("      </section>");
    openSection = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      closeSection();
      sectionCount += 1;
      html.push(`      <section class="article-section" id="${lang}-section-${sectionCount}">`);
      html.push(`        <h2>${renderInlineMarkdown(line.slice(3))}</h2>`);
      openSection = true;
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      html.push(`        <h3>${renderInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(renderInlineMarkdown(line.slice(2)));
      continue;
    }
    const withBreak = rawLine.endsWith("  ") ? `${line.trimEnd()}<br>` : line;
    paragraph.push(renderInlineMarkdown(withBreak));
  }
  closeSection();
  return html.join("\n");
}

function renderInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/&lt;br&gt;/g, "<br>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => `<a href="${escapeAttribute(normalizeRenderedHref(href))}">${escapeHtml(text)}</a>`);
}

function normalizeRenderedHref(href) {
  if (/^(?:#|mailto:|tel:|https?:\/\/|data:)/u.test(href)) return href;
  const [base, suffix = ""] = href.split(/(?=[?#])/u, 2);
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(base)) return `${articleFileHref(resolveSlug(base))}${suffix}`;
  if (/^articles\/[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(base)) {
    const slug = base.replace(/^articles\//u, "");
    return `articles/${resolveSlug(slug)}.html${suffix}`;
  }
  if (/^\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(base)) {
    const slug = base.replace(/^\/articles\//u, "");
    return `/articles/${resolveSlug(slug)}.html${suffix}`;
  }
  return href;
}

function articleFileHref(slug) {
  return `${slug}.html`;
}

function renderSafety(markdown) {
  const pl = markdown.match(/^PL:\s*(.+)$/m)?.[1];
  const en = markdown.match(/^EN:\s*(.+)$/m)?.[1];
  if (!pl || !en) fail("Safety note must contain PL: and EN: lines.");
  return `        <p><span class="lang-pl-content">${escapeHtml(pl)}</span><span class="lang-en-content">${escapeHtml(en)}</span></p>`;
}

function renderInlineLinks(links) {
  const plLinks = links.map((link) => `<a href="${escapeAttribute(articleFileHref(link.slug))}">${escapeHtml(link.title_pl)}</a>`).join(", ");
  const enLinks = links.map((link) => `<a href="${escapeAttribute(articleFileHref(link.slug))}">${escapeHtml(link.title_en)}</a>`).join(", ");
  return `<p class="article-meta"><span class="lang-pl-content"><strong>Czytaj także:</strong> ${plLinks}</span><span class="lang-en-content"><strong>Read also:</strong> ${enLinks}</span></p>`;
}

function renderReadAlso(links) {
  return `<ul class="related-list">${links.map((link) => `<li><a href="${escapeAttribute(articleFileHref(link.slug))}"><span class="lang-pl-content">${escapeHtml(link.title_pl)}</span><span class="lang-en-content">${escapeHtml(link.title_en)}</span></a></li>`).join("")}</ul>`;
}

function renderBlogCard(source, cover, publishedDate = source.meta.datePublished) {
  const { meta } = source;
  const datePl = formatDateShortPl(publishedDate);
  const dateEn = formatDateShortEn(publishedDate);
  return `<article class="card blog-card" data-article-slug="${escapeAttribute(meta.slug)}">
  <a class="blog-card-media" href="articles/${escapeAttribute(meta.slug)}.html" aria-label="${escapeAttribute(meta.title_pl)}">
    <img src="assets/images/blog/${cover.file}" width="1200" height="675" loading="lazy" decoding="async" alt="${escapeAttribute(cover.alt_pl)}" data-alt-pl="${escapeAttribute(cover.alt_pl)}" data-alt-en="${escapeAttribute(cover.alt_en)}">
  </a>
  <div class="card-kicker"><span><span class="lang-pl-content">${escapeHtml(meta.category_pl)}</span><span class="lang-en-content">${escapeHtml(meta.category_en)}</span></span><span class="card-kicker-meta"><time class="blog-card-date" datetime="${publishedDate}"><span class="lang-pl-content">${datePl}</span><span class="lang-en-content">${dateEn}</span></time><span>10 min</span></span></div>
  <h3><span class="lang-pl-content">${escapeHtml(meta.title_pl)}</span><span class="lang-en-content">${escapeHtml(meta.title_en)}</span></h3>
  <p><span class="lang-pl-content">${escapeHtml(meta.meta_description_pl)}</span><span class="lang-en-content">${escapeHtml(meta.meta_description_en)}</span></p>
  <a class="read-more" href="articles/${escapeAttribute(meta.slug)}.html"><span class="lang-pl-content">Czytaj artykuł</span><span class="lang-en-content">Read article</span></a>
</article>`;
}

function renderBlogFeature(source, cover) {
  const { meta } = source;
  return `    <article class="blog-hero-feature">
      <a class="blog-hero-feature-link" href="articles/${escapeAttribute(meta.slug)}.html" aria-label="${escapeAttribute(meta.title_pl)}">
        <img src="assets/images/blog/${cover.file}" width="1200" height="675" loading="eager" fetchpriority="high" decoding="async" alt="${escapeAttribute(cover.alt_pl)}" data-alt-pl="${escapeAttribute(cover.alt_pl)}" data-alt-en="${escapeAttribute(cover.alt_en)}">
        <div>
          <span class="eyebrow"><span class="lang-pl-content">Nowy artykuł</span><span class="lang-en-content">New article</span></span>
          <h2><span class="lang-pl-content">${escapeHtml(meta.title_pl)}</span><span class="lang-en-content">${escapeHtml(meta.title_en)}</span></h2>
          <p><span class="lang-pl-content">${escapeHtml(meta.meta_description_pl)}</span><span class="lang-en-content">${escapeHtml(meta.meta_description_en)}</span></p>
          <span class="read-more"><span class="lang-pl-content">Otwórz artykuł</span><span class="lang-en-content">Open article</span></span>
        </div>
      </a>
    </article>`;
}

function replaceBlogFeature(blogHtml, featureHtml) {
  const featurePattern = /    <article class="blog-hero-feature">[\s\S]*?    <\/article>/u;
  if (!featurePattern.test(blogHtml)) fail("Could not find blog hero feature block.");
  return blogHtml.replace(featurePattern, featureHtml);
}

function insertBlogCard(blogHtml, cardHtml, slug) {
  if (blogContainsSlug(blogHtml, slug)) fail(`Blog already contains a card for ${slug}.`);
  const marker = '<div class="blog-grid blog-index-grid">\n';
  const index = blogHtml.indexOf(marker);
  if (index === -1) fail("Could not find blog grid insertion point.");
  return `${blogHtml.slice(0, index + marker.length)}${cardHtml}\n${blogHtml.slice(index + marker.length)}`;
}

function insertSitemapUrl(sitemapXml, slug, date) {
  const loc = `https://nataliacorvo.com/articles/${slug}`;
  if (sitemapXml.includes(`<loc>${loc}</loc>`) || sitemapXml.includes(`<loc>${loc}.html</loc>`)) {
    fail(`Sitemap already contains ${slug}.`);
  }
  const entry = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${date}</lastmod>\n  </url>\n`;
  if (!sitemapXml.includes("</urlset>")) fail("Could not find sitemap insertion point.");
  return sitemapXml.replace("</urlset>", `${entry}</urlset>`);
}

function validateGeneratedPublication(generated, source) {
  const { articleHtml, blogHtml, sitemapXml } = generated;
  const { meta } = source;
  if (containsItalianMarker(articleHtml) || containsItalianMarker(blogHtml)) {
    fail(`Generated output for ${meta.slug} contains Italian language or route markers.`);
  }
  if ((articleHtml.match(/<h1\b/g) || []).length !== 1) fail(`${meta.slug} must render exactly one H1.`);
  if (!articleHtml.includes(`<link rel="canonical" href="https://nataliacorvo.com/articles/${meta.slug}">`)) {
    fail(`${meta.slug} canonical URL is incorrect.`);
  }
  if (/noindex/u.test(articleHtml)) fail(`${meta.slug} must not be noindex.`);
  if (!/Nota bezpieczeństwa/u.test(articleHtml) || !/Safety note/u.test(articleHtml)) fail(`${meta.slug} safety note is missing.`);
  if (!/Źródła i dalsza lektura/u.test(articleHtml) || !/Sources and further reading/u.test(articleHtml)) {
    fail(`${meta.slug} sources block is missing.`);
  }
  if (!/"FAQPage"/u.test(articleHtml)) fail(`${meta.slug} FAQPage JSON-LD is missing.`);
  if (!articleHtml.includes(`assets/images/blog/${meta.slug}-cover.`)) fail(`${meta.slug} must use an SEO-named cover image.`);
  if (!articleHtml.includes("Wikimedia Commons")) fail(`${meta.slug} must include cover image attribution.`);
  if (/(?:href|content)=["'](?:https:\/\/nataliacorvo\.com)?\/(?:pl|en|it)\b/u.test(articleHtml)) {
    fail(`${meta.slug} must not create /pl, /en or /it routes.`);
  }
  for (const script of articleHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(script[1]);
    } catch {
      fail(`${meta.slug} contains malformed JSON-LD.`);
    }
  }
  if (!blogContainsSlug(blogHtml, meta.slug)) fail(`Generated blog card for ${meta.slug} was not inserted.`);
  if (!sitemapXml.includes(`https://nataliacorvo.com/articles/${meta.slug}`)) fail(`Generated sitemap entry for ${meta.slug} was not inserted.`);
}

function validateState(state, manifest) {
  if (state.version !== 1 && state.version !== 2) fail("state.json has an unsupported version.");
  if (state.version === 1 && state.source_root !== sourceRootRelatives[0]) {
    fail("state.json source_root does not match the configured source path.");
  }
  if (state.version === 2) {
    if (!Array.isArray(state.source_roots) || state.source_roots.join("\n") !== sourceRootRelatives.join("\n")) {
      fail("state.json source_roots do not match the configured source package paths.");
    }
    if (state.queue_total !== expectedQueueTotal) {
      fail("state.json queue_total does not match the configured publishing queue.");
    }
  }
  if (!Array.isArray(state.published)) fail("state.json published must be an array.");

  const byOrder = new Map(manifest.map((entry) => [entry.order, entry]));
  const seen = new Set();
  let maxOrder = 0;
  for (const item of state.published) {
    const manifestEntry = byOrder.get(item.order);
    if (!manifestEntry || manifestEntry.slug !== item.slug) fail(`state.json contains invalid published item: ${JSON.stringify(item)}`);
    if (seen.has(item.slug)) fail(`state.json contains duplicate published slug: ${item.slug}`);
    seen.add(item.slug);
    maxOrder = Math.max(maxOrder, item.order);
  }
  if (state.last_published_order !== maxOrder) fail("state.json last_published_order does not match published history.");
  if (maxOrder === 0 && (state.last_published_slug !== null || state.last_published_local_date !== null)) {
    fail("state.json initial state is inconsistent.");
  }
}

function validatePublishedStateConsistency(state, manifest) {
  const stateSlugs = new Set(state.published.map((item) => item.slug));
  const blogHtml = readText(blogPath);

  for (const item of state.published) {
    const articlePath = path.join(articlesDir, `${item.slug}.html`);
    if (!existsSync(articlePath)) fail(`state.json marks ${item.slug} as published, but its article file is missing.`);
    if (!blogContainsSlug(blogHtml, item.slug)) fail(`state.json marks ${item.slug} as published, but its blog card is missing.`);
    if (!item.cover_image || !existsSync(path.join(blogImagesDir, item.cover_image))) {
      fail(`state.json marks ${item.slug} as published, but its cover image is missing.`);
    }
  }

  for (const entry of manifest) {
    if (stateSlugs.has(entry.slug)) continue;
    const articleExists = existsSync(path.join(articlesDir, `${entry.slug}.html`));
    const cardExists = blogContainsSlug(blogHtml, entry.slug);
    const coverExists = findExistingCover(entry.slug);
    if (articleExists || cardExists || coverExists) {
      fail(`Queued article ${entry.slug} exists outside publisher state. Refusing to guess or republish.`);
    }
  }
}

function blogContainsSlug(blogHtml, slug) {
  return blogHtml.includes(`data-article-slug="${slug}"`) ||
    blogHtml.includes(`href="articles/${slug}"`) ||
    blogHtml.includes(`href="articles/${slug}.html"`) ||
    blogHtml.includes(`href="/articles/${slug}"`);
}

function extractFaq(markdown, headings = ["FAQ"]) {
  const faqIndex = headingIndexAny(markdown, headings);
  if (faqIndex === -1) return [];
  const faqText = markdown.slice(faqIndex).replace(/^## FAQ(?:\s+(?:PL|EN))?\s*/u, "").trim();
  const questions = [];
  const matches = [...faqText.matchAll(/^###\s+(.+)$/gm)];
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const answerStart = current.index + current[0].length;
    const answerEnd = next ? next.index : faqText.length;
    const answer = faqText.slice(answerStart, answerEnd).trim().replace(/\s+/g, " ");
    if (current[1] && answer) questions.push({ question: current[1].trim(), answer });
  }
  return questions;
}

function extractSources(markdown) {
  const sources = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^-\s*(.+?):\s*(https?:\/\/\S+)$/u) || line.match(/^-\s*(https?:\/\/\S+)$/u);
    if (!match) continue;
    if (match.length === 3) sources.push({ label: match[1], url: match[2] });
    else sources.push({ label: match[1], url: match[1] });
  }
  return sources;
}

function buildFaqSchema(plFaq, enFaq) {
  const mainEntity = [
    ...plFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
    ...enFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  ];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: ["pl-PL", "en-GB"],
    mainEntity,
  };
}

function firstSectionText(markdown, heading) {
  const index = headingIndex(markdown, heading);
  if (index === -1) return "";
  const afterHeading = markdown.slice(markdown.indexOf("\n", index) + 1);
  const nextHeading = afterHeading.search(/^##\s+/m);
  const section = (nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading)).trim();
  return stripMarkdown(section.split(/\n\s*\n/u)[0] || "").trim();
}

function splitSentences(value) {
  return value.split(/(?<=[.!?])\s+/u).map((item) => item.trim()).filter(Boolean);
}

function stripMarkdown(value) {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ");
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, "");
}

function decodeBasicEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function containsItalianMarker(value) {
  return /(?:lang=["']it["']|data-set-lang=["']it["']|lang-it|\/it(?:\/|["'#?])|Italiano|italiano)/u.test(value);
}

function getDublinNow() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: parts.hour,
  };
}

function formatDatePl(dateValue) {
  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) fail(`Invalid date: ${dateValue}`);
  return `${day}.${month}.${year}`;
}

function formatDateShortPl(dateValue) {
  const [, month, day] = dateValue.split("-").map(Number);
  const months = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
  if (!month || !day || !months[month - 1]) fail(`Invalid date: ${dateValue}`);
  return `${day} ${months[month - 1]}`;
}

function formatDateShortEn(dateValue) {
  const [, month, day] = dateValue.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!month || !day || !months[month - 1]) fail(`Invalid date: ${dateValue}`);
  return `${day} ${months[month - 1]}`;
}

function readJson(filePath) {
  try {
    return JSON.parse(readText(filePath));
  } catch (error) {
    fail(`Could not parse JSON file ${filePath}: ${error.message}`);
  }
}

function readText(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    fail(`Could not read ${filePath}: ${error.message}`);
  }
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function listFiles(directory, base = directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, base));
      continue;
    }
    if (entry.isFile()) {
      files.push(path.relative(base, fullPath).split(path.sep).join("/"));
    }
  }
  return files.sort();
}

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value)}\n`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#x60;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fail(message) {
  console.error(message);
  output("changed", "false");
  output("error", message.replace(/\n/g, " "));
  process.exit(1);
}
