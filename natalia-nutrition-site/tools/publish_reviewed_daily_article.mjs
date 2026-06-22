#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  AUTOMATION_STATE_RELATIVE,
  DEFAULT_DRAFT_BRANCH,
  DEFAULT_DRAFT_ROOT,
  REVIEWED_DAILY_QUEUE,
  assertCleanWorkingTree,
  assertSafeChangedFiles,
  buildDraftFileList,
  normalizeSourceUrl,
  planStateTransition,
  selectNextQueueItem,
} from "./lib/reviewed_daily_publisher.mjs";

const openaiModel = process.env.OPENAI_MODEL || "gpt-5.5";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => fail(error.message || String(error)));
}

async function main() {
  const cli = parseCli(process.argv.slice(2));
  const siteRoot = resolveSiteRoot();
  const repoRoot = git(["rev-parse", "--show-toplevel"], { cwd: siteRoot });
  const now = cli.dateOverride
    ? { date: cli.dateOverride, hour: cli.ignoreTime ? "09" : getDublinNow().hour }
    : getDublinNow();

  if (cli.mode === "record-commit") {
    const state = readState(siteRoot);
    const nextState = recordCommit(state, cli.slug, cli.recordCommit);
    writeState(siteRoot, nextState);
    console.log(`Recorded commit ${cli.recordCommit} for ${cli.slug}.`);
    output("changed", "true");
    output("published", "false");
    output("slug", cli.slug);
    return;
  }

  const state = readState(siteRoot);

  if (cli.mode !== "dry-run") {
    assertCleanWorkingTree(git(["status", "--porcelain"], { cwd: repoRoot }));
  }

  if (cli.mode === "skip") {
    const result = planStateTransition({
      state,
      mode: "skip",
      localDate: now.date,
      localHour: now.hour,
      skipSlug: cli.skipSlug,
      reason: cli.reason,
    });
    writeState(siteRoot, result.nextState);
    console.log(`Marked ${result.slug} as blocked_needs_editorial_revision: ${cli.reason}`);
    outputResult(result);
    return;
  }

  if (cli.mode === "publish" && now.hour !== "09") {
    const result = {
      status: "skipped",
      skipReason: "outside_publish_window",
      changed: false,
      published: false,
      nextState: state,
    };
    console.log("Skipping reviewed daily publisher: outside_publish_window.");
    outputResult(result);
    return;
  }
  if (cli.mode === "publish" && state.last_attempt_local_date === now.date) {
    const result = {
      status: "skipped",
      skipReason: "already_attempted_today",
      changed: false,
      published: false,
      nextState: state,
    };
    console.log("Skipping reviewed daily publisher: already_attempted_today.");
    outputResult(result);
    return;
  }

  const selected = selectNextQueueItem({
    queue: state.queue || REVIEWED_DAILY_QUEUE,
    published: state.published || [],
    blocked: state.blocked || [],
    forceSlug: cli.forceSlug,
  });
  if (!selected) {
    const result = {
      status: "skipped",
      skipReason: "queue_complete",
      changed: false,
      published: false,
      nextState: state,
    };
    console.log("Skipping reviewed daily publisher: queue is complete.");
    outputResult(result);
    return;
  }

  const draftPackage = loadDraftPackageFromGit({
    repoRoot,
    draftBranch: state.draft_branch || DEFAULT_DRAFT_BRANCH,
    draftRoot: state.draft_root || DEFAULT_DRAFT_ROOT,
    slug: selected.slug,
  });

  if (cli.mode === "publish" || cli.withEditorialReview) {
    draftPackage.editorialReview = await reviewEditorialWithOpenAI(draftPackage);
  }

  const result = planStateTransition({
    state,
    mode: cli.mode,
    localDate: now.date,
    localHour: now.hour,
    draftPackage,
    forceSlug: cli.forceSlug,
    usedImageSources: usedImageSources(state),
  });

  if (cli.mode === "dry-run") {
    reportDryRun(result);
    outputResult(result);
    return;
  }

  if (result.status === "blocked_needs_editorial_revision") {
    writeState(siteRoot, result.nextState);
    console.log(`Blocked ${result.slug}:`);
    for (const reason of result.reasons) console.log(`- ${reason}`);
    outputResult(result);
    return;
  }

  if (result.status !== "ready_to_publish") {
    console.log(`No publication changes: ${result.status}.`);
    outputResult(result);
    return;
  }

  writePublication({
    siteRoot,
    repoRoot,
    state: result.nextState,
    draftPackage,
    localDate: now.date,
    coverBytes: draftPackage.coverBytes,
  });
  const changedFiles = git(["diff", "--name-only"], { cwd: repoRoot }).split(/\r?\n/u).filter(Boolean);
  assertSafeChangedFiles(changedFiles);

  console.log(`Published one reviewed article into the working tree: ${result.slug}`);
  outputResult(result);
}

function parseCli(args) {
  const cli = {
    mode: null,
    forceSlug: "",
    skipSlug: "",
    reason: "",
    ignoreTime: false,
    dateOverride: "",
    withEditorialReview: false,
    recordCommit: "",
    slug: "",
  };

  for (const arg of args) {
    if (arg === "--dry-run") {
      cli.mode = setMode(cli.mode, "dry-run");
      continue;
    }
    if (arg === "--publish") {
      cli.mode = setMode(cli.mode, "publish");
      continue;
    }
    if (arg === "--ignore-time") {
      cli.ignoreTime = true;
      continue;
    }
    if (arg === "--with-editorial-review") {
      cli.withEditorialReview = true;
      continue;
    }
    if (arg.startsWith("--force-slug=")) {
      cli.forceSlug = arg.slice("--force-slug=".length);
      continue;
    }
    if (arg.startsWith("--skip-slug=")) {
      cli.mode = setMode(cli.mode, "skip");
      cli.skipSlug = arg.slice("--skip-slug=".length);
      continue;
    }
    if (arg.startsWith("--reason=")) {
      cli.reason = arg.slice("--reason=".length);
      continue;
    }
    if (arg.startsWith("--date=")) {
      const value = arg.slice("--date=".length);
      if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) fail(`Invalid --date value: ${value}. Use YYYY-MM-DD.`);
      cli.dateOverride = value;
      continue;
    }
    if (arg.startsWith("--record-commit=")) {
      cli.mode = setMode(cli.mode, "record-commit");
      cli.recordCommit = arg.slice("--record-commit=".length);
      continue;
    }
    if (arg.startsWith("--slug=")) {
      cli.slug = arg.slice("--slug=".length);
      continue;
    }
    fail(`Unknown argument: ${arg}`);
  }

  if (!cli.mode) fail("Use --dry-run, --publish, --skip-slug or --record-commit.");
  if (cli.mode === "record-commit" && (!/^[0-9a-f]{7,40}$/iu.test(cli.recordCommit) || !cli.slug)) {
    fail("--record-commit requires --slug and a git commit hash.");
  }
  return cli;
}

function setMode(current, next) {
  if (current && current !== next) fail("Choose exactly one mode.");
  return next;
}

function resolveSiteRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, "package.json")) && existsSync(path.join(cwd, "blog.html"))) return cwd;
  const nested = path.join(cwd, "natalia-nutrition-site");
  if (existsSync(path.join(nested, "package.json")) && existsSync(path.join(nested, "blog.html"))) return nested;
  fail("Run this script from the repo root or natalia-nutrition-site directory.");
}

function loadDraftPackageFromGit({ repoRoot, draftBranch, draftRoot, slug }) {
  const files = buildDraftFileList({ draftRoot, slug });
  const [articlePath, draftHtmlPath, qaPath, sourcesPath, coverPath] = files;
  const article = JSON.parse(gitShowText(repoRoot, draftBranch, articlePath));
  return {
    article,
    draftHtml: gitShowText(repoRoot, draftBranch, draftHtmlPath),
    qaText: gitShowText(repoRoot, draftBranch, qaPath),
    sourcesText: gitShowText(repoRoot, draftBranch, sourcesPath),
    coverBytes: gitShowBuffer(repoRoot, draftBranch, coverPath),
    files,
  };
}

async function reviewEditorialWithOpenAI({ article, qaText, sourcesText }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { status: "block", reason: "OPENAI_API_KEY is missing, so the required editorial review cannot run." };
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["status", "reason", "checks"],
    properties: {
      status: { type: "string", enum: ["pass", "block"] },
      reason: { type: "string" },
      checks: {
        type: "object",
        additionalProperties: false,
        required: ["nutrition_accuracy", "source_quality", "originality", "usefulness", "tone", "ymyl_safety", "seo_quality", "image_quality"],
        properties: {
          nutrition_accuracy: { type: "string" },
          source_quality: { type: "string" },
          originality: { type: "string" },
          usefulness: { type: "string" },
          tone: { type: "string" },
          ymyl_safety: { type: "string" },
          seo_quality: { type: "string" },
          image_quality: { type: "string" },
        },
      },
    },
  };

  const body = {
    model: openaiModel,
    reasoning: { effort: "high" },
    max_output_tokens: 3000,
    text: {
      format: {
        type: "json_schema",
        name: "reviewed_daily_article_gate",
        strict: true,
        schema,
      },
    },
    input: [
      {
        role: "developer",
        content: [{
          type: "input_text",
          text: [
            "You are the final editorial gate for a bilingual nutrition article on Natalia Corvo's website.",
            "This is YMYL health content. Block the article unless it is accurate, useful, original, source-backed, calm in tone, SEO-safe, and free of detox, cure, guaranteed outcome, medication-change, or overconfident medical claims.",
            "Also block if the image metadata looks generic, reused, weakly related, watermarked, logo-bearing, or dependent on a recognizable person.",
            "Return only JSON matching the schema.",
          ].join("\n"),
        }],
      },
      {
        role: "user",
        content: [{
          type: "input_text",
          text: JSON.stringify({
            article,
            qa_file: qaText,
            sources_file: sourcesText,
            required_decision: "status must be pass only if the article can be published today without manual editing",
          }),
        }],
      },
    ],
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { status: "block", reason: `OpenAI editorial review failed: HTTP ${response.status} ${JSON.stringify(data).slice(0, 400)}` };
    }
    const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((content) => content.type === "output_text")?.text;
    if (!text) return { status: "block", reason: "OpenAI editorial review returned no output text." };
    const parsed = JSON.parse(text);
    return parsed.status === "pass"
      ? parsed
      : { status: "block", reason: parsed.reason || "Editorial review blocked publication.", checks: parsed.checks || {} };
  } catch (error) {
    return { status: "block", reason: `OpenAI editorial review could not complete: ${error.message}` };
  }
}

function writePublication({ siteRoot, repoRoot, state, draftPackage, localDate, coverBytes }) {
  const { article } = draftPackage;
  const slug = article.slug;
  const articlePath = path.join(siteRoot, "articles", `${slug}.html`);
  const coverFile = `${slug}-cover.jpg`;
  const coverPath = path.join(siteRoot, "assets/images/blog", coverFile);
  if (existsSync(articlePath)) fail(`Refusing to overwrite existing article: articles/${slug}.html`);
  if (existsSync(coverPath)) fail(`Refusing to overwrite existing cover: assets/images/blog/${coverFile}`);

  const blogPath = path.join(siteRoot, "blog.html");
  const sitemapPath = path.join(siteRoot, "sitemap.xml");
  const blogHtml = readText(blogPath);
  const sitemapXml = readText(sitemapPath);
  if (blogContainsSlug(blogHtml, slug)) fail(`Blog already contains ${slug}.`);
  if (sitemapXml.includes(`https://nataliacorvo.com/articles/${slug}`)) fail(`Sitemap already contains ${slug}.`);

  mkdirSync(path.dirname(articlePath), { recursive: true });
  mkdirSync(path.dirname(coverPath), { recursive: true });
  writeFileSync(coverPath, coverBytes);
  writeFileSync(articlePath, renderArticlePage(article, coverFile, localDate));
  writeFileSync(blogPath, insertBlogCard(blogHtml, renderBlogCard(article, coverFile, localDate), slug));
  writeFileSync(sitemapPath, insertSitemapUrl(sitemapXml, slug, localDate));
  writeState(siteRoot, state);

  const changedFiles = git(["diff", "--name-only"], { cwd: repoRoot }).split(/\r?\n/u).filter(Boolean);
  assertSafeChangedFiles(changedFiles);
}

function renderArticlePage(article, coverFile, publishedDate) {
  const titlePl = article.seo?.meta_title_pl || article.topic?.pl || article.slug;
  const titleEn = article.seo?.meta_title_en || article.topic?.en || titlePl;
  const descriptionPl = article.seo?.meta_description_pl || article.content.pl.lead;
  const descriptionEn = article.seo?.meta_description_en || article.content.en.lead;
  const canonical = `https://nataliacorvo.com/articles/${article.slug}`;
  const imageUrl = `https://nataliacorvo.com/assets/images/blog/${coverFile}`;

  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(titlePl)} | Natural Healing</title>
  <meta name="description" content="${escapeAttribute(descriptionPl)}" data-description-pl="${escapeAttribute(descriptionPl)}" data-description-en="${escapeAttribute(descriptionEn)}">
  <meta name="robots" content="index, follow">
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../css/styles.css">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escapeAttribute(titlePl)} | Natural Healing" data-og-title-pl="${escapeAttribute(titlePl)} | Natural Healing" data-og-title-en="${escapeAttribute(titleEn)} | Natural Healing">
  <meta property="og:description" content="${escapeAttribute(descriptionPl)}" data-og-description-pl="${escapeAttribute(descriptionPl)}" data-og-description-en="${escapeAttribute(descriptionEn)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${imageUrl}">
</head>
<body class="lang-pl" data-title-pl="${escapeAttribute(titlePl)} | Natural Healing" data-title-en="${escapeAttribute(titleEn)} | Natural Healing">
<a class="skip-link" href="#main"><span class="lang-pl-content">Przejdź do treści</span><span class="lang-en-content">Skip to content</span></a>
${renderHeader("../")}
<main id="main">
<section class="page-hero article-hero">
  <div class="container article-hero-grid">
    <div class="stack">
      <a class="back-link" href="../blog.html"><span class="lang-pl-content">Wróć do bloga</span><span class="lang-en-content">Back to blog</span></a>
      <span class="eyebrow"><span class="lang-pl-content">${escapeHtml(article.topic?.category || "Żywienie")}</span><span class="lang-en-content">${escapeHtml(article.topic?.category || "Nutrition")}</span> • 8 min</span>
      <h1><span class="lang-pl-content">${escapeHtml(article.seo?.h1_pl || titlePl)}</span><span class="lang-en-content">${escapeHtml(article.seo?.h1_en || titleEn)}</span></h1>
      <p class="lead"><span class="lang-pl-content">${escapeHtml(article.content.pl.lead)}</span><span class="lang-en-content">${escapeHtml(article.content.en.lead)}</span></p>
      <p class="article-meta"><span class="lang-pl-content">Autorka: Natalia Corvo · Opublikowano</span><span class="lang-en-content">Author: Natalia Corvo · Published</span> <time datetime="${publishedDate}">${formatDatePl(publishedDate)}</time></p>
    </div>
    <figure class="article-cover">
      <img src="../assets/images/blog/${coverFile}" width="1200" height="675" loading="eager" fetchpriority="high" decoding="async" alt="${escapeAttribute(article.image.alt_pl)}" data-alt-pl="${escapeAttribute(article.image.alt_pl)}" data-alt-en="${escapeAttribute(article.image.alt_en)}">
      <figcaption><span class="lang-pl-content">Zdjęcie: <a href="${escapeAttribute(article.image.source_url)}" target="_blank" rel="noopener">${escapeHtml(article.image.attribution)}</a>.</span><span class="lang-en-content">Image: <a href="${escapeAttribute(article.image.source_url)}" target="_blank" rel="noopener">${escapeHtml(article.image.attribution)}</a>.</span></figcaption>
    </figure>
  </div>
</section>
<section class="section">
  <div class="container article-layout">
    <article class="article-body">
      <div class="article-summary-box">
        <strong><span class="lang-pl-content">Najważniejsze wnioski</span><span class="lang-en-content">Key takeaways</span></strong>
        <ul>${renderTakeaways(article.content.pl.takeaways, article.content.en.takeaways)}</ul>
      </div>
      <div class="lang-pl-content">${renderStructuredContent(article.content.pl)}</div>
      <div class="lang-en-content">${renderStructuredContent(article.content.en)}</div>
      <div class="disclaimer">
        <strong><span class="lang-pl-content">Nota bezpieczeństwa</span><span class="lang-en-content">Safety note</span></strong>
        <p><span class="lang-pl-content">${escapeHtml(article.safety_note_pl)}</span><span class="lang-en-content">${escapeHtml(article.safety_note_en)}</span></p>
      </div>
      <div class="source-box">
        <strong><span class="lang-pl-content">Źródła i dalsza lektura</span><span class="lang-en-content">Sources and further reading</span></strong>
        <ol>${article.sources.map((source) => `<li><a href="${escapeAttribute(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.title || source.url)}</a></li>`).join("")}</ol>
      </div>
      <div class="article-cta">
        <h2><span class="lang-pl-content">Chcesz dopasować ten temat do siebie?</span><span class="lang-en-content">Want to adapt this topic to you?</span></h2>
        <p><span class="lang-pl-content">Umów konsultację, jeśli potrzebujesz planu dopasowanego do zdrowia, badań i codzienności.</span><span class="lang-en-content">Book a consultation if you need a plan matched to your health, labs and real life.</span></p>
        <a class="btn btn-primary" href="../index.html#booking"><span class="lang-pl-content">Umów wizytę</span><span class="lang-en-content">Book a visit</span></a>
      </div>
    </article>
    <aside class="article-aside" aria-label="Article side information">
      <div class="side-box"><strong>Email</strong><p><a href="mailto:Dietolozki@gmail.com">Dietolozki@gmail.com</a></p></div>
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

function renderStructuredContent(content) {
  const sections = content.sections.map(([heading, body], index) => `<section class="article-section" id="section-${index + 1}">
  <h2>${escapeHtml(heading)}</h2>
  <p>${escapeHtml(body)}</p>
</section>`).join("\n");
  const faq = content.faq.map(([question, answer]) => `<h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p>`).join("\n");
  return `${sections}
<section class="article-section">
  <h2>FAQ</h2>
  ${faq}
</section>`;
}

function renderTakeaways(plItems, enItems) {
  return plItems.map((pl, index) => `<li><span class="lang-pl-content">${escapeHtml(pl)}</span><span class="lang-en-content">${escapeHtml(enItems[index] || pl)}</span></li>`).join("\n");
}

function renderBlogCard(article, coverFile, publishedDate) {
  const titlePl = article.seo?.h1_pl || article.topic?.pl || article.slug;
  const titleEn = article.seo?.h1_en || article.topic?.en || titlePl;
  return `<article class="card blog-card" data-article-slug="${escapeAttribute(article.slug)}">
  <a class="blog-card-media" href="articles/${escapeAttribute(article.slug)}.html" aria-label="${escapeAttribute(titlePl)}">
    <img src="assets/images/blog/${coverFile}" width="1200" height="675" loading="lazy" decoding="async" alt="${escapeAttribute(article.image.alt_pl)}" data-alt-pl="${escapeAttribute(article.image.alt_pl)}" data-alt-en="${escapeAttribute(article.image.alt_en)}">
  </a>
  <div class="card-kicker"><span><span class="lang-pl-content">${escapeHtml(article.topic?.category || "Żywienie")}</span><span class="lang-en-content">${escapeHtml(article.topic?.category || "Nutrition")}</span></span><span class="card-kicker-meta"><time class="blog-card-date" datetime="${publishedDate}"><span class="lang-pl-content">${formatDateShortPl(publishedDate)}</span><span class="lang-en-content">${formatDateShortEn(publishedDate)}</span></time><span>8 min</span></span></div>
  <h3><span class="lang-pl-content">${escapeHtml(titlePl)}</span><span class="lang-en-content">${escapeHtml(titleEn)}</span></h3>
  <p><span class="lang-pl-content">${escapeHtml(article.seo.meta_description_pl)}</span><span class="lang-en-content">${escapeHtml(article.seo.meta_description_en)}</span></p>
  <a class="read-more" href="articles/${escapeAttribute(article.slug)}.html"><span class="lang-pl-content">Czytaj artykuł</span><span class="lang-en-content">Read article</span></a>
</article>`;
}

function insertBlogCard(blogHtml, cardHtml, slug) {
  if (blogContainsSlug(blogHtml, slug)) fail(`Blog already contains ${slug}.`);
  const marker = '<div class="blog-grid blog-index-grid">\n';
  const index = blogHtml.indexOf(marker);
  if (index === -1) fail("Could not find blog grid insertion point.");
  return `${blogHtml.slice(0, index + marker.length)}${cardHtml}\n${blogHtml.slice(index + marker.length)}`;
}

function insertSitemapUrl(sitemapXml, slug, date) {
  const entry = `  <url>\n    <loc>https://nataliacorvo.com/articles/${slug}</loc>\n    <lastmod>${date}</lastmod>\n  </url>\n`;
  if (!sitemapXml.includes("</urlset>")) fail("Could not find sitemap insertion point.");
  return sitemapXml.replace("</urlset>", `${entry}</urlset>`);
}

function blogContainsSlug(blogHtml, slug) {
  return blogHtml.includes(`data-article-slug="${slug}"`) ||
    blogHtml.includes(`href="articles/${slug}"`) ||
    blogHtml.includes(`href="articles/${slug}.html"`) ||
    blogHtml.includes(`href="/articles/${slug}"`);
}

function usedImageSources(state) {
  return new Set([
    ...(state.published || []).map((item) => item.image?.source_url),
    ...(state.blocked || []).map((item) => item.image?.source_url),
  ].map(normalizeSourceUrl).filter(Boolean));
}

function readState(siteRoot) {
  const statePath = path.join(siteRoot, AUTOMATION_STATE_RELATIVE);
  return JSON.parse(readText(statePath));
}

function writeState(siteRoot, state) {
  writeFileSync(path.join(siteRoot, AUTOMATION_STATE_RELATIVE), `${JSON.stringify(state, null, 2)}\n`);
}

function recordCommit(state, slug, commit) {
  const updateItem = (item) => item.slug === slug ? { ...item, commit } : item;
  return {
    ...state,
    published: (state.published || []).map(updateItem),
    blocked: (state.blocked || []).map(updateItem),
  };
}

function reportDryRun(result) {
  if (result.status === "blocked_needs_editorial_revision") {
    console.log(`Dry run: ${result.slug} would be blocked_needs_editorial_revision.`);
    for (const reason of result.reasons) console.log(`- ${reason}`);
    return;
  }
  console.log(`Dry run: ${result.slug} reached ${result.status}. No files changed.`);
}

function outputResult(result) {
  output("changed", result.changed ? "true" : "false");
  output("published", result.published ? "true" : "false");
  output("status", result.status);
  output("slug", result.slug || "");
  output("skip_reason", result.skipReason || "");
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
  return `${day}.${month}.${year}`;
}

function formatDateShortPl(dateValue) {
  const [, month, day] = dateValue.split("-").map(Number);
  const months = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
  return `${day} ${months[month - 1]}`;
}

function formatDateShortEn(dateValue) {
  const [, month, day] = dateValue.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[month - 1]}`;
}

function renderHeader(prefix) {
  return `<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="${prefix}index.html" aria-label="Natural Healing - Natalia Corvo">
      <img src="${prefix}assets/logo.svg" alt="" aria-hidden="true">
      <span>Natural Healing<small>Natalia Corvo</small></span>
    </a>
    <nav class="nav" id="site-nav" aria-label="Main navigation">
      <div class="nav-links">
        <a href="${prefix}index.html"><span class="lang-pl-content">Start</span><span class="lang-en-content">Home</span></a>
        <a href="${prefix}book.html"><span class="lang-pl-content">e-Book</span><span class="lang-en-content">e-Book</span></a>
        <a href="${prefix}blog.html" aria-current="page">Blog</a>
        <a href="${prefix}autotest.html"><span class="lang-pl-content">Autotest</span><span class="lang-en-content">Self-check</span></a>
      </div>
    </nav>
  </div>
</header>`;
}

function renderFooter(prefix) {
  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div>
      <div class="footer-brand"><img src="${prefix}assets/logo.svg" alt="" aria-hidden="true"><strong>Natural Healing</strong></div>
      <p><span class="lang-pl-content">Treści edukacyjne nie zastępują indywidualnej diagnozy medycznej.</span><span class="lang-en-content">Educational content does not replace individual medical diagnosis.</span></p>
    </div>
    <div><strong>Email</strong><p><a href="mailto:Dietolozki@gmail.com">Dietolozki@gmail.com</a></p></div>
  </div>
</footer>`;
}

function gitShowText(repoRoot, branch, filePath) {
  return git(["show", `${branch}:${filePath}`], { cwd: repoRoot });
}

function gitShowBuffer(repoRoot, branch, filePath) {
  return execFileSync("git", ["show", `${branch}:${filePath}`], { cwd: repoRoot });
}

function git(args, { cwd }) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\n/g, " ")}\n`, { flag: "a" });
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#x60;");
}

function fail(message) {
  console.error(message);
  output("changed", "false");
  output("published", "false");
  output("status", "error");
  output("error", message);
  process.exit(1);
}
