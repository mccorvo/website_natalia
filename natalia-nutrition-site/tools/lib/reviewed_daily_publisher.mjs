export const REVIEWED_DAILY_QUEUE = [
  "straczki-bez-wzdec",
  "nabial-fermentowany-a-jelita",
  "kefir-czy-jogurt-naturalny",
  "ryby-w-puszce-w-zdrowej-diecie",
  "sardynki-jako-zrodlo-wapnia",
  "jak-ograniczyc-sol-w-kanapkach",
  "co-zamiast-slodkich-napojow",
  "przekaski-przy-pracy-biurowej",
  "jedzenie-przy-pms",
  "dieta-a-migrena-dzienniczek",
  "kawa-przed-sniadaniem",
  "czy-banan-tuczy",
  "pieczywo-przy-cukrzycy",
  "platki-sniadaniowe-jak-wybierac",
  "dieta-po-antybiotyku-rozsadnie",
  "kiedy-eliminowac-laktoze",
  "czy-gluten-powoduje-zmeczenie",
  "dieta-przy-kamicy-zolciowej-profilaktyka",
  "kamica-nerkowa-a-nawodnienie",
  "dna-moczanowa-co-ograniczyc",
  "dieta-seniora-z-malym-apetytem",
  "sarcopenia-bialko-i-ruch",
  "dieta-przy-tradziku-bez-skrajnosci",
  "dieta-przy-luszczycy-wsparcie",
  "dieta-antyhistaminowa-ostroznie",
  "napoje-energetyczne-a-apetyt",
  "jak-zmniejszyc-cukier-w-diecie-dziecka",
  "rodzinne-obiady-bez-dwoch-kuchni",
  "sniadanie-przed-treningiem-amatora",
  "regeneracja-po-treningu-bez-odzywek",
  "ile-wody-naprawde-pic",
  "elektrolity-a-biegunka",
  "dieta-roslinna-dla-poczatkujacych",
  "blonnik-rozpuszczalny-i-ldl",
  "psyllium-kiedy-ma-sens",
  "oliwa-rzepakowy-czy-maslo",
  "orzechy-w-diecie-redukcyjnej",
  "jak-nie-marnowac-warzyw",
  "tanie-obiady-z-kasza",
  "zamienniki-slodyczy-bez-obsesji",
];

export const DEFAULT_DRAFT_BRANCH = "origin/codex/draft-50-more-polish-nutrition-articles";
export const DEFAULT_DRAFT_ROOT = "natalia-nutrition-site/data/weekly-trend-publishing/drafts/2026-06";
export const AUTOMATION_STATE_RELATIVE = "data/weekly-trend-publishing/automation-state.json";

const unsafeMedicalClaim = /(?:wyleczy|leczy\s+(?:cukrzyc[eę]|chorob[eę])|gwarantuje\s+(?:spadek|efekt|wyleczenie|popraw[eę])|oczyszcza organizm|zast[eę]puje leki|odstaw leki|cures?\s+(?:diabetes|disease)|guaranteed\s+(?:weight|result|cure)|miracle\s+cure|replace medication)/iu;
const genericImageAlt = /(?:cover image|draft|zdj[eę]cie do szkicu|obraz z wikimedia commons|wikimedia commons image related|fallback|stock)/iu;
const imageRedFlags = /(?:watermark|logo|recognizable person|rozpoznawalna osoba|znak wodny)/iu;
const blockedPath = /(?:^|\/)(?:_remediation|checkpoint|node_modules|\.cache|tmp|temp)(?:\/|\.|$)|(?:^|\/).*\.log$|(?:^|\/)package-lock\.json$/iu;

export function selectNextQueueItem({ queue = REVIEWED_DAILY_QUEUE, published = [], blocked = [], forceSlug = "" }) {
  validateQueue(queue);
  const publishedSlugs = new Set(published.map((item) => item.slug));
  const blockedSlugs = new Set(blocked.map((item) => item.slug));

  if (forceSlug) {
    const queueIndex = queue.indexOf(forceSlug);
    if (queueIndex === -1) {
      throw new Error(`${forceSlug} is not in the reviewed 40-slug queue; the first 10/manual or unrelated drafts are excluded.`);
    }
    if (publishedSlugs.has(forceSlug)) {
      throw new Error(`${forceSlug} is already published and cannot be selected again.`);
    }
    return { slug: forceSlug, queueIndex };
  }

  const queueIndex = queue.findIndex((slug) => !publishedSlugs.has(slug) && !blockedSlugs.has(slug));
  if (queueIndex === -1) return null;
  return { slug: queue[queueIndex], queueIndex };
}

export function evaluateDraftGates({ article, qaText = "", usedImageSources = new Set(), editorialReview = null }) {
  const reasons = [];
  const articleText = JSON.stringify({
    seo: article?.seo,
    content: article?.content,
    safety_note_pl: article?.safety_note_pl,
    safety_note_en: article?.safety_note_en,
  });

  if (!article || typeof article !== "object") {
    reasons.push("Article JSON is missing or invalid.");
  }
  if (!article?.slug || typeof article.slug !== "string") {
    reasons.push("Article slug is missing.");
  }
  if (!hasBilingualContent(article?.content)) {
    reasons.push("Article must include useful PL and EN content, takeaways, sections and FAQ.");
  }
  if (!Array.isArray(article?.sources) || article.sources.length < 2) {
    reasons.push("Article must include at least two real, pertinent source URLs.");
  } else {
    for (const source of article.sources) {
      if (!isHttpUrl(source?.url)) reasons.push(`Source URL is missing or invalid: ${source?.url || "(empty)"}`);
      if (/pubmed\.ncbi\.nlm\.nih\.gov\/\?term=/iu.test(source.url)) reasons.push(`PubMed search-result URL is not an article source: ${source.url}`);
    }
  }
  if (!/topic-specific sources:\s*yes/iu.test(qaText)) {
    reasons.push("QA file does not confirm topic-specific sources.");
  }
  if (!/(ymyl safety note included:\s*yes|safety note)/iu.test(qaText) && !article?.safety_note_pl && !article?.safety_note_en) {
    reasons.push("Bilingual YMYL safety note is missing.");
  }
  if (unsafeMedicalClaim.test(articleText)) {
    reasons.push("Article contains unsupported medical, detox, cure or guarantee language.");
  }

  const imageReasons = evaluateImageGate(article?.image, qaText, usedImageSources);
  reasons.push(...imageReasons);

  if (editorialReview && editorialReview.status !== "pass") {
    reasons.push(`Editorial review did not pass: ${editorialReview.reason || "no reason supplied"}`);
  }

  return {
    status: reasons.length > 0 ? "blocked_needs_editorial_revision" : "ready_for_editorial_review",
    reasons,
  };
}

export function planStateTransition({
  state,
  mode,
  localDate,
  localHour,
  draftPackage = null,
  usedImageSources = new Set(),
  forceSlug = "",
  skipSlug = "",
  reason = "",
}) {
  const queue = state?.queue || REVIEWED_DAILY_QUEUE;
  validateQueue(queue);
  const currentState = normalizeState(state, queue);

  if (mode === "publish" && localHour !== "09") {
    return {
      status: "skipped",
      skipReason: "outside_publish_window",
      changed: false,
      published: false,
      nextState: currentState,
    };
  }

  if (mode === "publish" && hasAttemptedOnDate(currentState, localDate)) {
    return {
      status: "skipped",
      skipReason: "already_attempted_today",
      changed: false,
      published: false,
      nextState: currentState,
    };
  }

  if (mode === "skip") {
    if (!skipSlug) throw new Error("--skip-slug requires a slug.");
    if (!reason.trim()) throw new Error("--skip-slug requires --reason.");
    const selected = selectNextQueueItem({ queue, published: currentState.published, blocked: [], forceSlug: skipSlug });
    const nextState = recordBlocked(currentState, {
      slug: selected.slug,
      queueIndex: selected.queueIndex,
      localDate,
      reasons: [reason.trim()],
      source: "manual_skip",
    });
    return {
      status: "blocked_needs_editorial_revision",
      slug: selected.slug,
      changed: true,
      published: false,
      reasons: [reason.trim()],
      nextState,
    };
  }

  const selected = selectNextQueueItem({
    queue,
    published: currentState.published,
    blocked: currentState.blocked,
    forceSlug,
  });
  if (!selected) {
    return {
      status: "skipped",
      skipReason: "queue_complete",
      changed: false,
      published: false,
      nextState: currentState,
    };
  }

  if (!draftPackage?.article) {
    throw new Error(`Missing draft package for ${selected.slug}.`);
  }
  if (draftPackage.article.slug !== selected.slug) {
    throw new Error(`Draft package slug ${draftPackage.article.slug} does not match selected slug ${selected.slug}.`);
  }

  const editorialReview = mode === "publish"
    ? (draftPackage.editorialReview || { status: "block", reason: "Publish mode requires explicit passing editorial review." })
    : draftPackage.editorialReview;
  const gate = evaluateDraftGates({
    article: draftPackage.article,
    qaText: draftPackage.qaText || "",
    usedImageSources,
    editorialReview,
  });

  if (gate.status === "blocked_needs_editorial_revision") {
    if (mode === "dry-run") {
      return {
        status: gate.status,
        slug: selected.slug,
        changed: false,
        published: false,
        reasons: gate.reasons,
        nextState: currentState,
      };
    }
    const nextState = recordBlocked(currentState, {
      slug: selected.slug,
      queueIndex: selected.queueIndex,
      localDate,
      reasons: gate.reasons,
      source: "automated_qa",
    });
    return {
      status: gate.status,
      slug: selected.slug,
      changed: true,
      published: false,
      reasons: gate.reasons,
      nextState,
    };
  }

  if (mode === "dry-run") {
    return {
      status: "ready_for_editorial_review",
      slug: selected.slug,
      changed: false,
      published: false,
      reasons: [],
      nextState: state,
    };
  }

  const nextState = recordPublished(currentState, {
    slug: selected.slug,
    queueIndex: selected.queueIndex,
    localDate,
    article: draftPackage.article,
    editorialReview,
  });
  return {
    status: "ready_to_publish",
    slug: selected.slug,
    changed: true,
    published: true,
    reasons: [],
    nextState,
  };
}

export function evaluateImageGate(image, qaText = "", usedImageSources = new Set()) {
  const reasons = [];
  if (!image || typeof image !== "object") {
    return ["Image metadata is missing."];
  }

  const sourceUrl = normalizeSourceUrl(image.source_url);
  const used = new Set([...usedImageSources].map(normalizeSourceUrl).filter(Boolean));
  const imageText = Object.values(image).join(" ");

  if (!image.file || image.file !== "cover.jpg") reasons.push("Image package must include the dedicated draft cover.jpg.");
  if (!sourceUrl) reasons.push("Image source URL is missing.");
  if (sourceUrl && used.has(sourceUrl)) reasons.push(`Image source has already been used: ${sourceUrl}`);
  if (!image.license || !image.attribution) reasons.push("External image license and attribution are required.");
  if (!isHandwrittenAlt(image.alt_pl) || !isHandwrittenAlt(image.alt_en)) reasons.push("Image alt text must be specific, handwritten PL and EN text.");
  if (/shared nci fallback image:\s*(?:yes|used)/iu.test(qaText) || /shared nci fallback image/iu.test(imageText)) {
    reasons.push("Image appears to be a shared fallback rather than a dedicated cover.");
  }
  if (imageRedFlags.test(imageText)) {
    reasons.push("Image metadata mentions a logo, watermark or recognizable person.");
  }

  return reasons.map((reason) => `Image QA failed: ${reason}`);
}

export function hasAttemptedOnDate(state, localDate) {
  return state?.last_attempt_local_date === localDate;
}

export function buildDraftFileList({ draftRoot = DEFAULT_DRAFT_ROOT, slug }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug || "")) {
    throw new Error(`Invalid draft slug: ${slug}`);
  }
  const base = `${draftRoot.replace(/\/$/u, "")}/${slug}`;
  return [
    `${base}/article.json`,
    `${base}/draft.html`,
    `${base}/qa.md`,
    `${base}/sources.md`,
    `${base}/cover.jpg`,
  ];
}

export function assertSafeChangedFiles(files) {
  for (const file of files) {
    const normalized = String(file).replace(/\\/gu, "/");
    if (normalized.includes("/data/weekly-trend-publishing/drafts/")) {
      throw new Error(`Unsafe changed file: draft artifacts must not be committed (${file}).`);
    }
    if (blockedPath.test(normalized)) {
      throw new Error(`Unsafe changed file: cache, log, lockfile, checkpoint or temporary path (${file}).`);
    }
  }
}

export function assertCleanWorkingTree(statusOutput) {
  if (String(statusOutput || "").trim()) {
    throw new Error(`Refusing to publish: working tree is not clean.\n${statusOutput}`);
  }
}

export function normalizeSourceUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(String(value));
    url.hash = "";
    url.search = "";
    if (url.hostname === "commons.wikimedia.org" && url.pathname.startsWith("/wiki/File:")) {
      return `https://commons.wikimedia.org${decodeURI(url.pathname).replace(/\s+/gu, "_")}`;
    }
    return url.href;
  } catch {
    return String(value).trim();
  }
}

function validateQueue(queue) {
  if (!Array.isArray(queue) || queue.length !== 40) {
    throw new Error("Reviewed daily queue must contain exactly 40 slugs.");
  }
  if (new Set(queue).size !== queue.length) {
    throw new Error("Reviewed daily queue contains duplicate slugs.");
  }
}

function hasBilingualContent(content) {
  return hasLanguageContent(content?.pl) && hasLanguageContent(content?.en);
}

function hasLanguageContent(content) {
  return typeof content?.lead === "string" && content.lead.length >= 20 &&
    Array.isArray(content.takeaways) && content.takeaways.length >= 3 &&
    Array.isArray(content.sections) && content.sections.length >= 2 &&
    content.sections.every((section) => Array.isArray(section) && section[0] && String(section[1] || "").length >= 20) &&
    Array.isArray(content.faq) && content.faq.length >= 1;
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isHandwrittenAlt(value) {
  const text = String(value || "").trim();
  return text.length >= 20 && !genericImageAlt.test(text);
}

function normalizeState(state, queue) {
  return {
    ...state,
    queue,
    published: Array.isArray(state?.published) ? state.published : [],
    blocked: Array.isArray(state?.blocked) ? state.blocked : [],
    last_attempt_local_date: state?.last_attempt_local_date ?? null,
    next_slug: state?.next_slug ?? selectNextSlug(queue, state?.published || [], state?.blocked || []),
  };
}

function recordBlocked(state, { slug, queueIndex, localDate, reasons, source }) {
  const blocked = [
    ...state.blocked.filter((item) => item.slug !== slug),
    {
      queue_index: queueIndex,
      slug,
      status: "blocked_needs_editorial_revision",
      blocked_local_date: localDate,
      blocked_at_utc: new Date().toISOString(),
      source,
      reasons,
    },
  ];
  return {
    ...state,
    blocked,
    last_attempt_local_date: localDate,
    last_attempt_slug: slug,
    next_slug: selectNextSlug(state.queue, state.published, blocked),
    next_run_scheduled_for: nextDailyRunLabel(localDate),
  };
}

function recordPublished(state, { slug, queueIndex, localDate, article, editorialReview }) {
  const published = [
    ...state.published,
    {
      queue_index: queueIndex,
      slug,
      status: "published",
      published_local_date: localDate,
      published_at_utc: new Date().toISOString(),
      url: `https://nataliacorvo.com/articles/${slug}`,
      commit: null,
      image: {
        file: `${slug}-cover.jpg`,
        source_url: article.image.source_url,
        license: article.image.license,
        attribution: article.image.attribution,
        alt_pl: article.image.alt_pl,
        alt_en: article.image.alt_en,
        prompt: null,
      },
      editorial_review: editorialReview,
    },
  ];
  return {
    ...state,
    published,
    last_attempt_local_date: localDate,
    last_attempt_slug: slug,
    last_published_local_date: localDate,
    last_published_slug: slug,
    next_slug: selectNextSlug(state.queue, published, state.blocked),
    next_run_scheduled_for: nextDailyRunLabel(localDate),
  };
}

function selectNextSlug(queue, published, blocked) {
  return selectNextQueueItem({ queue, published, blocked })?.slug || null;
}

function nextDailyRunLabel(localDate) {
  const date = new Date(`${localDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + 1);
  return `${date.toISOString().slice(0, 10)}T09:00:00 Europe/Dublin`;
}
