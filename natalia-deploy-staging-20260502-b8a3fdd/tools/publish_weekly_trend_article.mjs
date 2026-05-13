#!/usr/bin/env node
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const statePath = path.join(root, "data/weekly-trend-publishing/state.json");
const researchDir = path.join(root, "data/weekly-trend-publishing/research");
const blogPath = path.join(root, "blog.html");
const sitemapPath = path.join(root, "sitemap.xml");
const articlesDir = path.join(root, "articles");
const blogImagesDir = path.join(root, "assets/images/blog");

const args = new Set(process.argv.slice(2));
const publishMode = args.has("--publish");
const dryRunMode = args.has("--dry-run");
const ignoreTime = args.has("--ignore-time") || dryRunMode;

const openaiModel = "gpt-5.5";
const reasoningEffort = "xhigh";
const publishWeekday = "Tue";
const publishHour = "09";

if (publishMode === dryRunMode) {
  fail("Use exactly one mode: --publish or --dry-run.");
}

const italianMarker = /(?:lang=["']it["']|data-set-lang=["']it["']|lang-it|\/it(?:\/|["'#?])|Italiano|italiano)/u;
const unsafeMedicalClaim = /(?:wyleczy|leczy cukrzycę|leczy chorobę|gwarantuje|cudown|detoks|oczyszcza organizm|zastępuje leki|odstaw leki)/iu;
const allowedImageLicenses = ["cc0", "public domain", "pd", "cc by", "cc-by", "cc by-sa", "cc-by-sa"];

main().catch((error) => fail(error.message || String(error)));

async function main() {
  const now = getDublinNow();
  output("local_date", now.date);
  output("local_hour", now.hour);
  output("iso_week", now.isoWeek);

  if (publishMode && !ignoreTime && (now.weekday !== publishWeekday || now.hour !== publishHour)) {
    console.log(`Skipping publish: Europe/Dublin time is ${now.weekday} ${now.hour}:xx, not ${publishWeekday} ${publishHour}:xx.`);
    output("changed", "false");
    output("skip_reason", "outside_publish_window");
    return;
  }

  const state = readJson(statePath);
  validateState(state);

  if (publishMode && state.last_published_iso_week === now.isoWeek) {
    console.log(`Skipping publish: a weekly trend article was already published for ${now.isoWeek}.`);
    output("changed", "false");
    output("skip_reason", "already_published_this_week");
    return;
  }

  const research = await collectWeeklyResearch(now);
  const generated = dryRunMode && args.has("--skip-openai")
    ? buildDryRunArticle(now, research)
    : await generateArticleWithOpenAI(now, research, state);
  normalizeGeneratedArticle(generated, now);
  validateGeneratedArticle(generated, state);

  const existingSlugs = getExistingArticleSlugs();
  if (existingSlugs.has(generated.slug)) fail(`Refusing to publish duplicate article slug: ${generated.slug}`);
  if (blogContainsSlug(readText(blogPath), generated.slug)) fail(`Blog already contains weekly article slug: ${generated.slug}`);

  const cover = await chooseCover(generated);
  const articleHtml = renderArticlePage(generated, cover, now);
  const blogHtml = insertBlogCard(readText(blogPath), renderBlogCard(generated, cover), generated.slug);
  const sitemapXml = insertSitemapUrl(readText(sitemapPath), generated.slug, now.date);
  validateRenderedOutput(generated, articleHtml, blogHtml, sitemapXml);

  if (dryRunMode) {
    console.log(`Dry run passed. Weekly trend article would be: ${generated.slug}`);
    output("changed", "false");
    output("published_slug", generated.slug);
    output("article_url", `https://nataliacorvo.com/articles/${generated.slug}`);
    return;
  }

  mkdirSync(articlesDir, { recursive: true });
  mkdirSync(researchDir, { recursive: true });
  writeFileSync(path.join(articlesDir, `${generated.slug}.html`), articleHtml);
  writeFileSync(blogPath, blogHtml);
  writeFileSync(sitemapPath, sitemapXml);

  const nextState = {
    ...state,
    last_published_iso_week: now.isoWeek,
    last_published_slug: generated.slug,
    published: [
      ...state.published,
      {
        slug: generated.slug,
        title_pl: generated.title_pl,
        title_en: generated.title_en,
        topic_summary: generated.topic_summary,
        iso_week: now.isoWeek,
        published_local_date: now.date,
        published_at_utc: new Date().toISOString(),
        model: openaiModel,
        reasoning_effort: reasoningEffort,
        cover_image: cover.file,
        cover_source_url: cover.source_url,
        cover_license: cover.license,
      },
    ],
  };
  writeFileSync(statePath, `${JSON.stringify(nextState, null, 2)}\n`);
  writeFileSync(path.join(researchDir, `${generated.slug}.json`), `${JSON.stringify({ generated_at: new Date().toISOString(), now, research, generated }, null, 2)}\n`);

  console.log(`Published weekly trend article into the working tree: ${generated.slug}`);
  output("changed", "true");
  output("published_slug", generated.slug);
  output("article_url", `https://nataliacorvo.com/articles/${generated.slug}`);
}

async function collectWeeklyResearch(now) {
  const feeds = [
    "https://trends.google.com/trending/rss?geo=PL",
    "https://news.google.com/rss/search?q=dieta%20OR%20%C5%BCywienie%20OR%20od%C5%BCywianie%20when%3A7d&hl=pl&gl=PL&ceid=PL%3Apl",
    "https://news.google.com/rss/search?q=insulinooporno%C5%9B%C4%87%20OR%20cukrzyca%20OR%20cholesterol%20OR%20jelita%20when%3A7d&hl=pl&gl=PL&ceid=PL%3Apl",
    "https://news.google.com/rss/search?q=bia%C5%82ko%20OR%20suplementacja%20OR%20odchudzanie%20OR%20dieta%20ro%C5%9Blinna%20when%3A7d&hl=pl&gl=PL&ceid=PL%3Apl",
  ];
  const items = [];
  for (const feed of feeds) {
    try {
      const response = await fetch(feed, { headers: { "User-Agent": "nataliacorvo-weekly-trend-publisher/1.0" } });
      if (!response.ok) continue;
      const xml = await response.text();
      items.push(...parseRssItems(xml, feed));
    } catch {
      continue;
    }
  }

  const seen = new Set();
  const filtered = items
    .map((item) => ({ ...item, score: scoreResearchItem(item) }))
    .filter((item) => item.score > 0)
    .filter((item) => {
      const key = `${item.title}|${item.link}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);

  if (filtered.length < 5) {
    fail("Weekly online research returned too few nutrition-related items. Refusing to generate an article.");
  }

  return {
    week: now.isoWeek,
    region: "Poland-first, Polish-language search intent",
    feeds,
    items: filtered,
    top_terms: extractTopTerms(filtered),
    existing_slugs: [...getExistingArticleSlugs()].sort(),
  };
}

function parseRssItems(xml, feedUrl) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gu)].map((match) => {
    const item = match[1];
    return {
      title: decodeXml(extractXml(item, "title")),
      link: decodeXml(extractXml(item, "link")),
      source: decodeXml(extractXml(item, "source")) || new URL(feedUrl).hostname,
      published: decodeXml(extractXml(item, "pubDate")),
      feed: feedUrl,
    };
  }).filter((item) => item.title && item.link);
}

function scoreResearchItem(item) {
  const value = `${item.title} ${item.source}`.toLowerCase();
  const strong = ["dieta", "dietety", "żywien", "odżyw", "jedzenie", "posił", "białko", "suplement", "cukrzy", "insulino", "cholesterol", "jelit", "mikrobi", "odchudz", "otyło", "pcos", "tarczy", "trawien", "gluko"];
  const weak = ["zdrow", "kobiet", "dzieci", "senior", "ciąży", "sport", "energia"];
  let score = 0;
  for (const word of strong) if (value.includes(word)) score += 3;
  for (const word of weak) if (value.includes(word)) score += 1;
  if (item.feed.includes("trends.google.com")) score += 2;
  if (/quiz|horoskop|plotk|celebryt/iu.test(value)) score -= 6;
  return score;
}

function extractTopTerms(items) {
  const stop = new Set(["dieta", "diety", "oraz", "jest", "jak", "dla", "czy", "nie", "przy", "bez", "się", "tym", "ten", "tego", "które", "może", "warto"]);
  const counts = new Map();
  for (const item of items) {
    for (const raw of item.title.toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}]+/u)) {
      if (raw.length < 4 || stop.has(raw)) continue;
      counts.set(raw, (counts.get(raw) || 0) + item.score);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([term, score]) => ({ term, score }));
}

async function generateArticleWithOpenAI(now, research, state) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) fail("OPENAI_API_KEY is required for weekly GPT-5.5 article generation.");

  const body = {
    model: openaiModel,
    reasoning: { effort: reasoningEffort },
    tools: [{
      type: "web_search",
      user_location: { type: "approximate", country: "PL", timezone: "Europe/Warsaw" },
    }],
    tool_choice: "auto",
    include: ["web_search_call.action.sources"],
    max_output_tokens: 16000,
    text: {
      format: {
        type: "json_schema",
        name: "weekly_bilingual_nutrition_article",
        strict: true,
        schema: articleSchema(),
      },
    },
    input: [
      {
        role: "developer",
        content: [{
          type: "input_text",
          text: [
            "Jesteś redaktorem SEO i dietetycznym research assistantem dla bloga Natural Healing Natalii Corvo.",
            "Najpierw wybierz jeden temat z ostatnich 7 dni, bazując na dostarczonych sygnałach oraz własnym web searchu.",
            "Pisz najpierw natywnie po polsku: jasno, prosto, spokojnie, bez kalk angielskich.",
            "Następnie przygotuj naturalną wersję angielską na tę samą stronę. Angielski ma być adaptacją dla czytelnika EN, nie mechanicznym tłumaczeniem.",
            "To treść YMYL. Nie obiecuj leczenia, nie zalecaj zmiany leków, nie przesadzaj z suplementami.",
            "Nie twórz treści włoskich. Nie twórz tras /pl, /en ani /it.",
            "Unikaj kanibalizacji istniejących slugów; jeśli temat jest podobny, zawęź go do aktualnego, świeżego kąta.",
            "Źródła muszą być realnymi URL-ami. Preferuj oficjalne i medycznie wiarygodne źródła: NCEZ/PZH, Pacjent.gov.pl, WHO, EFSA, NHS, PubMed, towarzystwa naukowe.",
            "Zwróć wyłącznie JSON zgodny ze schematem.",
          ].join("\n"),
        }],
      },
      {
        role: "user",
        content: [{
          type: "input_text",
          text: JSON.stringify({
            requested_process: [
              "Research weekly high-interest nutrition topics.",
              "Create one native Polish article with SEO and AI-crawling readiness.",
              "Create a natural English version for the same URL, preserving the same structure, safety notes, FAQ, sources and CTA.",
              "Make it simple, clear and pleasant to read.",
            ],
            publication_week: now.isoWeek,
            existing_and_forbidden_slugs: research.existing_slugs,
            already_published_weekly_slugs: state.published.map((item) => item.slug),
            online_research_signals: research,
          }, null, 2),
        }],
      },
    ],
  };

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
    fail(`OpenAI Responses API failed: HTTP ${response.status} ${JSON.stringify(data).slice(0, 1000)}`);
  }
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((content) => content.type === "output_text")?.text;
  if (!text) fail("OpenAI response did not contain output text.");
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`OpenAI response was not valid JSON: ${error.message}`);
  }
}

function articleSchema() {
  const bilingualSection = {
    type: "object",
    additionalProperties: false,
    required: ["heading_pl", "heading_en", "paragraphs_pl", "paragraphs_en", "bullets_pl", "bullets_en"],
    properties: {
      heading_pl: { type: "string" },
      heading_en: { type: "string" },
      paragraphs_pl: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } },
      paragraphs_en: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } },
      bullets_pl: { type: "array", minItems: 0, maxItems: 6, items: { type: "string" } },
      bullets_en: { type: "array", minItems: 0, maxItems: 6, items: { type: "string" } },
    },
  };
  const bilingualFaq = {
    type: "object",
    additionalProperties: false,
    required: ["question_pl", "question_en", "answer_pl", "answer_en"],
    properties: {
      question_pl: { type: "string" },
      question_en: { type: "string" },
      answer_pl: { type: "string" },
      answer_en: { type: "string" },
    },
  };
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "topic_summary", "slug",
      "category_pl", "category_en",
      "title_pl", "title_en",
      "meta_title_pl", "meta_title_en",
      "meta_description_pl", "meta_description_en",
      "lead_pl", "lead_en",
      "key_takeaways_pl", "key_takeaways_en",
      "sections", "faq",
      "safety_note_pl", "safety_note_en",
      "sources", "read_also_slugs",
      "keywords_pl", "keywords_en",
      "cover_query", "cover_alt_pl", "cover_alt_en",
      "card_description_pl", "card_description_en",
    ],
    properties: {
      topic_summary: { type: "string", minLength: 20 },
      slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      category_pl: { type: "string" },
      category_en: { type: "string" },
      title_pl: { type: "string", minLength: 20 },
      title_en: { type: "string", minLength: 20 },
      meta_title_pl: { type: "string", minLength: 20, maxLength: 70 },
      meta_title_en: { type: "string", minLength: 20, maxLength: 70 },
      meta_description_pl: { type: "string", minLength: 90, maxLength: 170 },
      meta_description_en: { type: "string", minLength: 90, maxLength: 170 },
      lead_pl: { type: "string", minLength: 120 },
      lead_en: { type: "string", minLength: 120 },
      key_takeaways_pl: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
      key_takeaways_en: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
      sections: { type: "array", minItems: 5, maxItems: 8, items: bilingualSection },
      faq: { type: "array", minItems: 3, maxItems: 5, items: bilingualFaq },
      safety_note_pl: { type: "string", minLength: 90 },
      safety_note_en: { type: "string", minLength: 90 },
      sources: {
        type: "array",
        minItems: 4,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label", "url"],
          properties: {
            label: { type: "string" },
            url: { type: "string" },
          },
        },
      },
      read_also_slugs: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
      keywords_pl: { type: "array", minItems: 4, maxItems: 10, items: { type: "string" } },
      keywords_en: { type: "array", minItems: 4, maxItems: 10, items: { type: "string" } },
      cover_query: { type: "string" },
      cover_alt_pl: { type: "string", minLength: 20 },
      cover_alt_en: { type: "string", minLength: 20 },
      card_description_pl: { type: "string", minLength: 80, maxLength: 180 },
      card_description_en: { type: "string", minLength: 80, maxLength: 180 },
    },
  };
}

function normalizeGeneratedArticle(article, now) {
  article.slug = slugify(article.slug || article.title_pl);
  article.datePublished = now.date;
  article.dateModified = now.date;
  article.reading_time_minutes = Math.max(7, Math.min(12, Math.round((article.sections || []).length * 1.3)));
  article.read_also_slugs = [...new Set((article.read_also_slugs || []).map(slugify))].filter((slug) => existsSync(path.join(articlesDir, `${slug}.html`))).slice(0, 4);
  if (article.read_also_slugs.length < 2) {
    for (const fallback of ["talerz-zdrowego-zywienia", "dieta-przeciwzapalna-fakty", "insulinoopornosc-dieta-nawyki", "odchudzanie-bez-efektu-jojo"]) {
      if (!article.read_also_slugs.includes(fallback) && existsSync(path.join(articlesDir, `${fallback}.html`))) article.read_also_slugs.push(fallback);
      if (article.read_also_slugs.length === 3) break;
    }
  }
}

function validateGeneratedArticle(article, state) {
  if (italianMarker.test(JSON.stringify(article))) fail("Generated weekly article contains Italian markers.");
  if (unsafeMedicalClaim.test(JSON.stringify(article))) fail("Generated weekly article contains unsafe medical claim markers.");
  if (!article.slug || state.published.some((item) => item.slug === article.slug)) fail(`Weekly slug already exists in state: ${article.slug}`);
  if (!article.title_pl || !article.title_en || !article.meta_title_pl || !article.meta_title_en || !article.meta_description_pl || !article.meta_description_en || !article.lead_pl || !article.lead_en) fail("Generated weekly article is missing required bilingual SEO fields.");
  if (!Array.isArray(article.key_takeaways_pl) || !Array.isArray(article.key_takeaways_en) || article.key_takeaways_pl.length < 3 || article.key_takeaways_en.length < 3) fail("Generated weekly article needs bilingual key takeaways.");
  if (!Array.isArray(article.sections) || article.sections.length < 5) fail("Generated weekly article needs at least five sections.");
  for (const section of article.sections) {
    if (!section.heading_pl || !section.heading_en) fail("Generated weekly article section is missing a bilingual heading.");
    if (!Array.isArray(section.paragraphs_pl) || !Array.isArray(section.paragraphs_en) || section.paragraphs_pl.length < 1 || section.paragraphs_en.length < 1) fail("Generated weekly article section is missing bilingual paragraphs.");
    if (!Array.isArray(section.bullets_pl) || !Array.isArray(section.bullets_en)) fail("Generated weekly article section bullets must be bilingual arrays.");
    if (section.paragraphs_pl.length !== section.paragraphs_en.length || section.bullets_pl.length !== section.bullets_en.length) fail("Generated weekly article sections must align Polish and English items.");
  }
  if (!Array.isArray(article.faq) || article.faq.length < 3) fail("Generated weekly article needs at least three FAQ items.");
  for (const item of article.faq) {
    if (!item.question_pl || !item.question_en || !item.answer_pl || !item.answer_en) fail("Generated weekly article FAQ is missing bilingual content.");
  }
  if (!Array.isArray(article.sources) || article.sources.length < 4) fail("Generated weekly article needs at least four sources.");
  if (article.key_takeaways_pl.length !== article.key_takeaways_en.length) fail("Generated weekly article key takeaways must align Polish and English items.");
  for (const source of article.sources) {
    if (!/^https?:\/\//u.test(source.url)) fail(`Generated source URL is invalid: ${source.url}`);
  }
  if (!/nie zastępuje|nie jest poradą|skonsultuj/iu.test(article.safety_note_pl)) fail("Generated weekly article safety note is too weak.");
  if (!/does not replace|not a substitute|consult/iu.test(article.safety_note_en)) fail("Generated weekly article English safety note is too weak.");
  if (article.read_also_slugs.length < 2) fail("Generated weekly article needs at least two valid internal links.");
}

async function chooseCover(article) {
  if (dryRunMode) {
    return {
      file: `${article.slug}-cover.jpg`,
      alt_pl: article.cover_alt_pl,
      alt_en: article.cover_alt_en,
      attribution: "Wikimedia Commons image to be selected at publish time",
      license: "pending",
      source_url: "https://commons.wikimedia.org/",
    };
  }
  const selected = await findCommonsCoverImage(article.cover_query || article.title_pl, article.slug);
  const extension = extensionForMime(selected.mime);
  const file = `${article.slug}-cover.${extension}`;
  const destination = path.join(blogImagesDir, file);
  if (existsSync(destination)) fail(`Refusing to overwrite existing cover image: assets/images/blog/${file}`);
  const imageResponse = await fetch(selected.downloadUrl, { headers: { "User-Agent": "nataliacorvo-weekly-trend-publisher/1.0" } });
  if (!imageResponse.ok) fail(`Could not download Wikimedia Commons image for ${article.slug}: HTTP ${imageResponse.status}`);
  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  if (bytes.length < 5000) fail(`Downloaded cover image for ${article.slug} is unexpectedly small.`);
  mkdirSync(blogImagesDir, { recursive: true });
  writeFileSync(destination, bytes);
  return { file, alt_pl: article.cover_alt_pl, alt_en: article.cover_alt_en, attribution: selected.attribution, license: selected.license, source_url: selected.descriptionUrl };
}

async function findCommonsCoverImage(query, slug) {
  const queries = [...new Set([query, "healthy food nutrition vegetables", "balanced meal vegetables", "mediterranean diet food"])];
  for (const searchQuery of queries) {
    const selected = await searchCommonsCoverImage(searchQuery);
    if (selected) return selected;
  }
  fail(`No suitable freely licensed Wikimedia Commons cover image found for ${slug}.`);
}

async function searchCommonsCoverImage(query) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("generator", "search");
  api.searchParams.set("gsrnamespace", "6");
  api.searchParams.set("gsrsearch", query);
  api.searchParams.set("gsrlimit", "20");
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime|mediatype|extmetadata");
  api.searchParams.set("iiurlwidth", "1400");
  api.searchParams.set("origin", "*");

  const response = await fetch(api, { headers: { "User-Agent": "nataliacorvo-weekly-trend-publisher/1.0" } });
  if (!response.ok) fail(`Wikimedia Commons search failed for "${query}": HTTP ${response.status}`);
  const data = await response.json();
  for (const page of Object.values(data.query?.pages || {})) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const candidate = normalizeCommonsImageInfo(info);
    if (candidate) return candidate;
  }
  return null;
}

function normalizeCommonsImageInfo(info) {
  const mime = String(info.mime || "").toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) return null;
  if (info.mediatype && info.mediatype !== "BITMAP") return null;
  const metadata = info.extmetadata || {};
  const license = cleanMetadata(metadata.LicenseShortName?.value || metadata.License?.value || "");
  const licenseLower = license.toLowerCase();
  if (!allowedImageLicenses.some((allowed) => licenseLower.includes(allowed))) return null;
  if (/(?:non-?commercial|\bnc\b|no derivatives|\bnd\b|fair use)/iu.test(license)) return null;
  const artist = cleanMetadata(metadata.Artist?.value || metadata.Credit?.value || "Wikimedia Commons contributor");
  return {
    mime,
    downloadUrl: info.thumburl || info.url,
    descriptionUrl: info.descriptionurl || info.descriptionshorturl || info.url,
    license,
    attribution: `${artist}, ${license}, Wikimedia Commons`,
  };
}

function renderArticlePage(article, cover, now) {
  const canonical = `https://nataliacorvo.com/articles/${article.slug}`;
  const imageUrl = `https://nataliacorvo.com/assets/images/blog/${cover.file}`;
  const professionalServiceSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Natural Healing - Natalia Corvo",
    email: "Dietolozki@gmail.com",
    image: "../assets/images/natalia-hero.jpg",
    areaServed: ["Dublin", "Ireland", "United Kingdom", "Poland", "Online"],
    availableLanguage: ["pl", "en"],
    sameAs: [
      "https://www.instagram.com/natural.healing.dublin?igsh=MXYxMmticzFsam10eg%3D%3D",
      "https://www.facebook.com/people/Natural-Healing/61572266563392/?mibextid=wwXIfr&rdid=RKUIF0cw8DOPcoCm&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1GhXD36Qzc%2F%3Fmibextid%3DwwXIfr%26ref%3D1",
    ],
    description: "Polish and English nutrition support in Dublin, Ireland, the United Kingdom, Poland and online.",
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: ["pl", "en"],
    mainEntity: article.faq.flatMap((item) => [
      { "@type": "Question", inLanguage: "pl", name: item.question_pl, acceptedAnswer: { "@type": "Answer", text: item.answer_pl } },
      { "@type": "Question", inLanguage: "en", name: item.question_en, acceptedAnswer: { "@type": "Answer", text: item.answer_en } },
    ]),
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title_pl,
    alternativeHeadline: article.title_en,
    description: article.meta_description_pl,
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    inLanguage: ["pl", "en"],
    keywords: [...article.keywords_pl, ...article.keywords_en],
    articleSection: article.category_pl,
    author: { "@type": "Person", name: "Natalia Corvo" },
    publisher: { "@type": "Organization", name: "Natural Healing" },
    image: imageUrl,
  };
  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(article.meta_title_pl)}</title>
  <meta name="description" content="${escapeAttribute(article.meta_description_pl)}" data-description-pl="${escapeAttribute(article.meta_description_pl)}" data-description-en="${escapeAttribute(article.meta_description_en)}">
  <meta name="robots" content="index, follow">
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../css/styles.css">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escapeAttribute(article.meta_title_pl)}" data-og-title-pl="${escapeAttribute(article.meta_title_pl)}" data-og-title-en="${escapeAttribute(article.meta_title_en)}">
  <meta property="og:description" content="${escapeAttribute(article.meta_description_pl)}" data-og-description-pl="${escapeAttribute(article.meta_description_pl)}" data-og-description-en="${escapeAttribute(article.meta_description_en)}">
  <meta property="og:image" content="../assets/images/blog/${cover.file}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="pl_PL" data-og-locale>
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttribute(article.meta_title_pl)}" data-twitter-title-pl="${escapeAttribute(article.meta_title_pl)}" data-twitter-title-en="${escapeAttribute(article.meta_title_en)}">
  <meta name="twitter:description" content="${escapeAttribute(article.meta_description_pl)}" data-twitter-description-pl="${escapeAttribute(article.meta_description_pl)}" data-twitter-description-en="${escapeAttribute(article.meta_description_en)}">
  <meta name="twitter:image" content="../assets/images/blog/${cover.file}">
  <script type="application/ld+json">${JSON.stringify(professionalServiceSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
</head>
<body class="lang-pl" data-title-pl="${escapeAttribute(article.meta_title_pl)}" data-title-en="${escapeAttribute(article.meta_title_en)}">
<a class="skip-link" href="#main">${langPair("Przejdź do treści", "Skip to content")}</a>
${renderHeader("../")}
<main id="main">
<section class="page-hero article-hero">
  <div class="container article-hero-grid">
    <div class="stack">
      <a class="back-link" href="../blog.html">${langPair("Wróć do bloga", "Back to blog")}</a>
      <span class="eyebrow">${langPair(article.category_pl, article.category_en)} • ${article.reading_time_minutes} min • ${langPair("trend tygodnia", "weekly trend")}</span>
      <h1>${langPair(article.title_pl, article.title_en)}</h1>
      <p class="lead">${langPair(article.lead_pl, article.lead_en)}</p>
      <p class="article-meta">${langPair("Autorka: Natalia Corvo · Opublikowano", "Author: Natalia Corvo · Published")} <time datetime="${article.datePublished}">${formatDatePl(article.datePublished)}</time> · ${langPair("Aktualizacja", "Updated")} <time datetime="${article.dateModified}">${formatDatePl(article.dateModified)}</time></p>
    </div>
    <figure class="article-cover">
      <img src="../assets/images/blog/${cover.file}" width="1200" height="675" loading="eager" fetchpriority="high" decoding="async" alt="${escapeAttribute(cover.alt_pl)}" data-alt-pl="${escapeAttribute(cover.alt_pl)}" data-alt-en="${escapeAttribute(cover.alt_en)}">
      <figcaption>Zdjęcie: <a href="${escapeAttribute(cover.source_url)}" target="_blank" rel="noopener">${escapeHtml(cover.attribution)}</a>.</figcaption>
    </figure>
  </div>
</section>
<section class="section">
  <div class="container article-layout">
    <article class="article-body">
      <div class="article-summary-box">
        <strong>${langPair("Najważniejsze wnioski", "Key takeaways")}</strong>
        <ul>${article.key_takeaways_pl.map((item, index) => `<li>${langPair(item, article.key_takeaways_en[index])}</li>`).join("")}</ul>
      </div>
      ${renderReadAlsoInline(article.read_also_slugs)}
      ${article.sections.map(renderSection).join("\n")}
      <section class="article-section" id="faq">
        <h2>FAQ</h2>
        ${article.faq.map((item) => `<h3>${langPair(item.question_pl, item.question_en)}</h3><p>${langPair(item.answer_pl, item.answer_en)}</p>`).join("\n")}
      </section>
      <div class="disclaimer">
        <strong>${langPair("Nota bezpieczeństwa", "Safety note")}</strong>
        <p>${langPair(article.safety_note_pl, article.safety_note_en)}</p>
      </div>
      <div class="source-box">
        <strong>${langPair("Źródła i dalsza lektura", "Sources and further reading")}</strong>
        <ol>${article.sources.map((source) => `<li><a href="${escapeAttribute(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a></li>`).join("")}</ol>
      </div>
      <div class="article-cta">
        <h2>${langPair("Chcesz dopasować ten temat do siebie?", "Want to adapt this topic to you?")}</h2>
        <p>${langPair("Wyślij krótkie zapytanie i opisz, czego potrzebujesz w konsultacji. Natalia pomoże przełożyć wiedzę na plan możliwy do wykonania.", "Send a short enquiry and describe what you need. Natalia can help turn the information into a plan that fits real life.")}</p>
        <a class="btn btn-primary" href="../index.html#booking">${langPair("Umów wizytę", "Book a visit")}</a>
      </div>
    </article>
    <aside class="article-aside" aria-label="Article side information">
      <div class="side-box"><strong>${langPair("Temat", "Topic")}</strong><p>${langPair(article.category_pl, article.category_en)}</p></div>
      <div class="side-box article-toc"><strong>${langPair("W artykule", "In this guide")}</strong><ol>${article.sections.map((section, index) => `<li><a href="#section-${index + 1}">${langPair(section.heading_pl, section.heading_en)}</a></li>`).join("")}</ol></div>
      <div class="side-box"><strong>${langPair("Dlaczego teraz?", "Why now?")}</strong><p>${escapeHtml(article.topic_summary)}</p></div>
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

function renderSection(section, index) {
  return `<section class="article-section" id="section-${index + 1}">
  <h2>${langPair(section.heading_pl, section.heading_en)}</h2>
  ${section.paragraphs_pl.map((paragraph, paragraphIndex) => `<p>${langPair(paragraph, section.paragraphs_en[paragraphIndex])}</p>`).join("\n")}
  ${section.bullets_pl.length ? `<ul>${section.bullets_pl.map((item, bulletIndex) => `<li>${langPair(item, section.bullets_en[bulletIndex])}</li>`).join("")}</ul>` : ""}
</section>`;
}

function renderBlogCard(article, cover) {
  const datePl = formatDateShortPl(article.datePublished);
  const dateEn = formatDateShortEn(article.datePublished);
  return `<article class="card blog-card" data-article-slug="${escapeAttribute(article.slug)}">
  <a class="blog-card-media" href="articles/${escapeAttribute(article.slug)}.html" aria-label="${escapeAttribute(article.title_pl)}">
    <img src="assets/images/blog/${cover.file}" width="1200" height="675" loading="lazy" decoding="async" alt="${escapeAttribute(cover.alt_pl)}" data-alt-pl="${escapeAttribute(cover.alt_pl)}" data-alt-en="${escapeAttribute(cover.alt_en)}">
  </a>
  <div class="card-kicker"><span>${langPair(article.category_pl, article.category_en)}</span><span class="card-kicker-meta"><time class="blog-card-date" datetime="${article.datePublished}">${langPair(datePl, dateEn)}</time><span>${article.reading_time_minutes} min</span></span></div>
  <h3>${langPair(article.title_pl, article.title_en)}</h3>
  <p>${langPair(article.card_description_pl, article.card_description_en)}</p>
  <a class="read-more" href="articles/${escapeAttribute(article.slug)}.html">${langPair("Czytaj artykuł", "Read article")}</a>
</article>`;
}

function renderReadAlsoInline(slugs) {
  const links = slugs.map((slug) => {
    const title = getArticleTitlePair(slug);
    return `<a href="${escapeAttribute(slug)}.html">${langPair(title.pl, title.en)}</a>`;
  }).join(", ");
  return `<p class="article-meta"><strong>${langPair("Czytaj także:", "Read also:")}</strong> ${links}</p>`;
}

function langPair(pl, en) {
  return `<span class="lang-pl-content">${escapeHtml(pl)}</span><span class="lang-en-content">${escapeHtml(en || pl)}</span>`;
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
  return sitemapXml.replace("</urlset>", `${entry}</urlset>`);
}

function validateRenderedOutput(article, articleHtml, blogHtml, sitemapXml) {
  if (italianMarker.test(`${articleHtml}\n${blogHtml}`)) fail("Rendered weekly article contains Italian markers.");
  if ((articleHtml.match(/<h1\b/g) || []).length !== 1) fail("Rendered weekly article must contain exactly one H1.");
  if (!articleHtml.includes(`<link rel="canonical" href="https://nataliacorvo.com/articles/${article.slug}">`)) fail("Rendered canonical is incorrect.");
  if (!/"FAQPage"/u.test(articleHtml)) fail("Rendered weekly article is missing FAQPage JSON-LD.");
  if (!/Nota bezpieczeństwa/u.test(articleHtml)) fail("Rendered weekly article is missing safety note.");
  if (!/Safety note/u.test(articleHtml)) fail("Rendered weekly article is missing English safety note.");
  if (!/lang-en-content/u.test(articleHtml) || !/lang-en-content/u.test(blogHtml)) fail("Rendered weekly article is missing English language spans.");
  if (!/source-box/u.test(articleHtml)) fail("Rendered weekly article is missing sources.");
  if (!blogContainsSlug(blogHtml, article.slug)) fail("Rendered blog card was not inserted.");
  if (!sitemapXml.includes(`https://nataliacorvo.com/articles/${article.slug}`)) fail("Rendered sitemap was not updated.");
  for (const script of articleHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(script[1]);
    } catch {
      fail("Rendered weekly article contains malformed JSON-LD.");
    }
  }
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
      <span>${langPair("Menu", "Menu")}</span>
    </button>
    <nav class="nav" id="site-nav" aria-label="Main navigation">
      <div class="nav-links">
        <a href="${prefix}index.html">${langPair("Start", "Home")}</a>
        <a href="${prefix}book.html">${langPair("e-Book", "e-Book")}</a>
        <a href="${prefix}blog.html" aria-current="page">${langPair("Blog", "Blog")}</a>
        <a href="${prefix}autotest.html">${langPair("Autotest", "Self-check")}</a>
        <a href="${prefix}children-eating-difficulties/">${langPair("Dzieci", "Children")}</a>
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
        <a class="nav-cta" href="${prefix}index.html#booking">${langPair("Umów wizytę", "Book a visit")}</a>
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
      <p>${langPair("Wsparcie żywieniowe Natalii Corvo w Dublinie i online. Treści na stronie mają charakter edukacyjny i nie zastępują indywidualnej diagnozy medycznej.", "Nutrition support by Natalia Corvo in Dublin and online. Website content is educational and does not replace individual medical diagnosis.")}</p>
    </div>
    <div>
      <strong>${langPair("Strony", "Pages")}</strong>
      <ul class="footer-links">
        <li><a href="${prefix}index.html">${langPair("Start", "Home")}</a></li>
        <li><a href="${prefix}book.html">${langPair("e-Book", "e-Book")}</a></li>
        <li><a href="${prefix}blog.html">Blog</a></li>
        <li><a href="${prefix}autotest.html">${langPair("Autotest", "Self-check")}</a></li>
      </ul>
    </div>
    <div>
      <strong>${langPair("Napisz", "Get in touch")}</strong>
      <ul class="footer-links">
        <li><a href="mailto:Dietolozki@gmail.com">Dietolozki@gmail.com</a></li>
        <li><a href="https://www.instagram.com/natural.healing.dublin?igsh=MXYxMmticzFsam10eg%3D%3D" target="_blank" rel="noopener">Instagram</a></li>
        <li><a href="https://www.facebook.com/people/Natural-Healing/61572266563392/?mibextid=wwXIfr&rdid=RKUIF0cw8DOPcoCm&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1GhXD36Qzc%2F%3Fmibextid%3DwwXIfr%26ref%3D1" target="_blank" rel="noopener">Facebook</a></li>
      </ul>
    </div>
  </div>
  <div class="container footer-bottom">
    <span>© 2026 Natural Healing. Natalia Corvo.</span>
    <span>${langPair("Przed publikacją formularza produkcyjnego dodaj politykę prywatności i informacje RODO/GDPR.", "Before publishing a production form, add a privacy policy and GDPR information.")}</span>
  </div>
</footer>`;
}

function buildDryRunArticle(now) {
  return {
    topic_summary: "Próbny temat do sprawdzenia mechaniki automatyzacji bez wywołania OpenAI.",
    slug: `test-tygodniowy-trend-zywieniowy-${now.isoWeek.toLowerCase()}`,
    category_pl: "Trendy żywieniowe",
    category_en: "Nutrition trends",
    title_pl: "Testowy trend żywieniowy tygodnia: jak czytać modne porady bez paniki",
    title_en: "Test weekly nutrition trend: how to read popular advice without panic",
    meta_title_pl: "Testowy trend żywieniowy tygodnia | Natural Healing",
    meta_title_en: "Test weekly nutrition trend | Natural Healing",
    meta_description_pl: "Testowy szkic artykułu sprawdzający mechanikę publikacji trendu tygodnia, bez publikowania treści produkcyjnej.",
    meta_description_en: "A test article draft that checks the weekly trend publishing flow without publishing production content.",
    lead_pl: "To próbny tekst używany wyłącznie do suchego przebiegu automatyzacji i walidacji struktury strony.",
    lead_en: "This is a test text used only for a dry run of the automation and page-structure validation.",
    key_takeaways_pl: ["Sprawdzamy strukturę.", "Nie publikujemy tego tekstu.", "Mechanika pozostaje fail-closed."],
    key_takeaways_en: ["We check the structure.", "We do not publish this text.", "The mechanism remains fail-closed."],
    sections: Array.from({ length: 5 }, (_, index) => ({
      heading_pl: `Sekcja testowa ${index + 1}`,
      heading_en: `Test section ${index + 1}`,
      paragraphs_pl: ["Krótki akapit testowy bez zaleceń medycznych."],
      paragraphs_en: ["A short test paragraph without medical recommendations."],
      bullets_pl: [],
      bullets_en: [],
    })),
    faq: [
      { question_pl: "Czy to publikacja?", question_en: "Is this a publication?", answer_pl: "Nie, to suchy test automatyzacji.", answer_en: "No, this is a dry automation test." },
      { question_pl: "Czy używa OpenAI?", question_en: "Does it use OpenAI?", answer_pl: "Nie w trybie --skip-openai.", answer_en: "Not in --skip-openai mode." },
      { question_pl: "Czy zastępuje konsultację?", question_en: "Does it replace a consultation?", answer_pl: "Nie.", answer_en: "No." },
    ],
    safety_note_pl: "Ten test ma charakter techniczny i nie zastępuje diagnozy, leczenia ani indywidualnej konsultacji medycznej lub dietetycznej.",
    safety_note_en: "This technical test does not replace diagnosis, treatment or an individual medical or nutrition consultation.",
    sources: [
      { label: "WHO healthy diet", url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet" },
      { label: "NCEZ", url: "https://ncez.pzh.gov.pl/" },
      { label: "Pacjent.gov.pl", url: "https://pacjent.gov.pl/" },
      { label: "EFSA", url: "https://www.efsa.europa.eu/" },
    ],
    read_also_slugs: ["talerz-zdrowego-zywienia", "dieta-przeciwzapalna-fakty"],
    keywords_pl: ["trend żywieniowy", "dieta", "zdrowe odżywianie", "edukacja żywieniowa"],
    keywords_en: ["nutrition trend", "diet", "healthy eating", "nutrition education"],
    cover_query: "healthy food vegetables",
    cover_alt_pl: "Kolorowy posiłek z warzywami jako ilustracja trendu żywieniowego",
    cover_alt_en: "A colourful meal with vegetables illustrating a nutrition trend",
    card_description_pl: "Testowy opis karty używany tylko w suchym przebiegu automatyzacji.",
    card_description_en: "A test card description used only in the automation dry run.",
  };
}

function validateState(state) {
  if (state.version !== 1) fail("Weekly state has an unsupported version.");
  if (!Array.isArray(state.published)) fail("Weekly state published must be an array.");
  const seen = new Set();
  for (const item of state.published) {
    if (!item.slug || !item.iso_week) fail(`Weekly state item is malformed: ${JSON.stringify(item)}`);
    if (seen.has(item.slug)) fail(`Weekly state contains duplicate slug: ${item.slug}`);
    seen.add(item.slug);
  }
}

function getExistingArticleSlugs() {
  if (!existsSync(articlesDir)) return new Set();
  return new Set(readdirSync(articlesDir).filter((file) => file.endsWith(".html")).map((file) => file.replace(/\.html$/u, "")));
}

function getArticleTitlePair(slug) {
  const file = path.join(articlesDir, `${slug}.html`);
  if (!existsSync(file)) return { pl: slug, en: slug };
  const html = readText(file);
  const h1 = html.match(/<h1>([\s\S]*?)<\/h1>/u);
  if (!h1) return { pl: slug, en: slug };
  const pl = extractLangContent(h1[1], "pl") || decodeBasicEntities(stripTags(h1[1])).replace(/\s+/g, " ").trim();
  const en = extractLangContent(h1[1], "en") || pl;
  return { pl, en };
}

function extractLangContent(html, lang) {
  const match = new RegExp(`<span class=["']lang-${lang}-content["']>([\\s\\S]*?)<\\/span>`, "u").exec(html);
  return match ? decodeBasicEntities(stripTags(match[1])).replace(/\s+/g, " ").trim() : "";
}

function blogContainsSlug(blogHtml, slug) {
  return blogHtml.includes(`data-article-slug="${slug}"`) ||
    blogHtml.includes(`href="articles/${slug}"`) ||
    blogHtml.includes(`href="articles/${slug}.html"`) ||
    blogHtml.includes(`href="/articles/${slug}"`);
}

function getDublinNow() {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const localDate = `${parts.year}-${parts.month}-${parts.day}`;
  return { date: localDate, weekday: parts.weekday, hour: parts.hour, minute: parts.minute, isoWeek: isoWeek(localDate) };
}

function isoWeek(dateValue) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function formatDatePl(dateValue) {
  const [year, month, day] = dateValue.split("-");
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

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 84);
}

function extensionForMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
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

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value)}\n`);
}

function extractXml(xml, tag) {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "u").exec(xml);
  return match ? match[1].replace(/^<!\[CDATA\[|\]\]>$/gu, "").trim() : "";
}

function decodeXml(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanMetadata(value) {
  return decodeBasicEntities(stripTags(String(value))).replace(/\s+/g, " ").trim();
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

function fail(message) {
  console.error(message);
  output("changed", "false");
  output("error", message.replace(/\n/g, " "));
  process.exit(1);
}
