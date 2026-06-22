import assert from "node:assert/strict";
import test from "node:test";

import {
  REVIEWED_DAILY_QUEUE,
  assertCleanWorkingTree,
  assertSafeChangedFiles,
  buildDraftFileList,
  evaluateDraftGates,
  hasAttemptedOnDate,
  planStateTransition,
  selectNextQueueItem,
} from "./lib/reviewed_daily_publisher.mjs";

function passingArticle(overrides = {}) {
  return {
    slug: "straczki-bez-wzdec",
    topic: {
      pl: "Straczki bez wzdec",
      en: "Legumes without bloating",
      category: "jelita",
      search_intent: "praktyczne wprowadzanie straczkow",
    },
    seo: {
      meta_description_pl: "Praktyczne wskazowki bez obietnic leczenia.",
      meta_description_en: "Practical guidance without treatment promises.",
    },
    content: {
      pl: {
        lead: "Edukacyjny wstep z praktycznym kontekstem.",
        takeaways: ["Zacznij spokojnie.", "Obserwuj tolerancje.", "Nie eliminuj wszystkiego naraz."],
        sections: [
          ["Po co ten temat", "Praktyczny akapit o jedzeniu i obserwacji objawow."],
          ["Kiedy skonsultowac", "Silny bol, krew w stolcu albo chudniecie wymagaja konsultacji."],
        ],
        faq: [["Od czego zaczac?", "Od malej porcji i obserwacji."]],
      },
      en: {
        lead: "Educational introduction with practical context.",
        takeaways: ["Start gently.", "Watch tolerance.", "Avoid changing everything at once."],
        sections: [
          ["Why it matters", "A practical paragraph about meals and symptom tracking."],
          ["When to seek help", "Severe pain, blood in stool or weight loss require consultation."],
        ],
        faq: [["Where to start?", "With a small portion and observation."]],
      },
    },
    sources: [
      { title: "WHO: Healthy diet", url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet" },
      { title: "NCEZ: Talerz Zdrowego Zywnienia", url: "https://ncez.pzh.gov.pl/abc-zywienia/talerz-zdrowego-zywienia/" },
    ],
    internal_links: [
      { title_pl: "Jelita", title_en: "Gut", url: "https://nataliacorvo.com/articles/jelita-mikrobiota-trawienie.html" },
    ],
    image: {
      file: "cover.jpg",
      alt_pl: "Miska soczewicy, ciecierzycy i ziol na jasnym kuchennym blacie.",
      alt_en: "A bowl of lentils, chickpeas and herbs on a bright kitchen counter.",
      source_url: "https://commons.wikimedia.org/wiki/File:Legumes_Test_Image.jpg",
      license: "CC BY-SA 4.0",
      attribution: "Test Contributor, CC BY-SA 4.0, Wikimedia Commons",
      selection_note: "Topic-specific editorial image for this slug.",
    },
    safety_note_pl: "Artykul edukacyjny i nie zastepuje konsultacji medycznej.",
    safety_note_en: "This article is educational and does not replace medical advice.",
    ...overrides,
  };
}

test("reviewed queue contains exactly the remaining 40 slugs and rejects draft slugs outside it", () => {
  assert.equal(REVIEWED_DAILY_QUEUE.length, 40);
  assert.equal(REVIEWED_DAILY_QUEUE[0], "straczki-bez-wzdec");
  assert.equal(REVIEWED_DAILY_QUEUE.at(-1), "zamienniki-slodyczy-bez-obsesji");
  assert.equal(new Set(REVIEWED_DAILY_QUEUE).size, REVIEWED_DAILY_QUEUE.length);

  assert.throws(
    () => selectNextQueueItem({
      queue: REVIEWED_DAILY_QUEUE,
      published: [],
      blocked: [],
      forceSlug: "anemia-w-ciazy-zelazo",
    }),
    /not in the reviewed 40-slug queue/u,
  );
});

test("selectNextQueueItem skips published and blocked entries in order", () => {
  const selected = selectNextQueueItem({
    queue: REVIEWED_DAILY_QUEUE,
    published: [{ slug: "straczki-bez-wzdec" }],
    blocked: [{ slug: "nabial-fermentowany-a-jelita" }],
  });

  assert.equal(selected.slug, "kefir-czy-jogurt-naturalny");
  assert.equal(selected.queueIndex, 2);
});

test("content QA failure blocks instead of publishing", () => {
  const result = evaluateDraftGates({
    article: passingArticle({ sources: [] }),
    qaText: "Topic-specific sources: no.",
    usedImageSources: new Set(),
  });

  assert.equal(result.status, "blocked_needs_editorial_revision");
  assert.match(result.reasons.join("\n"), /source/i);
});

test("image QA rejects reused or generic covers", () => {
  const result = evaluateDraftGates({
    article: passingArticle({
      image: {
        file: "cover.jpg",
        alt_pl: "Zdjecie do szkicu: straczki bez wzdec.",
        alt_en: "Cover image for draft: legumes without bloating.",
        source_url: "https://commons.wikimedia.org/wiki/File:Used.jpg",
        license: "CC BY-SA 3.0",
        attribution: "Contributor, CC BY-SA 3.0, Wikimedia Commons",
        selection_note: "Shared NCI fallback image.",
      },
    }),
    qaText: "Shared NCI fallback image: not used.",
    usedImageSources: new Set(["https://commons.wikimedia.org/wiki/File:Used.jpg"]),
  });

  assert.equal(result.status, "blocked_needs_editorial_revision");
  assert.match(result.reasons.join("\n"), /image/i);
});

test("passing deterministic QA can proceed to editorial review", () => {
  const result = evaluateDraftGates({
    article: passingArticle(),
    qaText: [
      "Topic-specific sources: yes.",
      "Shared NCI fallback image: not used.",
      "YMYL safety note included: yes.",
      "Cure, detox, guaranteed disease-treatment or guaranteed weight-loss claims: none.",
    ].join("\n"),
    usedImageSources: new Set(),
  });

  assert.equal(result.status, "ready_for_editorial_review");
  assert.deepEqual(result.reasons, []);
});

test("hasAttemptedOnDate prevents more than one automated run per day", () => {
  assert.equal(hasAttemptedOnDate({ last_attempt_local_date: "2026-06-23" }, "2026-06-23"), true);
  assert.equal(hasAttemptedOnDate({ last_attempt_local_date: "2026-06-22" }, "2026-06-23"), false);
});

test("buildDraftFileList reads only the requested slug package and excludes remediation artifacts", () => {
  const files = buildDraftFileList({
    draftRoot: "natalia-nutrition-site/data/weekly-trend-publishing/drafts/2026-06",
    slug: "straczki-bez-wzdec",
  });

  assert.deepEqual(files, [
    "natalia-nutrition-site/data/weekly-trend-publishing/drafts/2026-06/straczki-bez-wzdec/article.json",
    "natalia-nutrition-site/data/weekly-trend-publishing/drafts/2026-06/straczki-bez-wzdec/draft.html",
    "natalia-nutrition-site/data/weekly-trend-publishing/drafts/2026-06/straczki-bez-wzdec/qa.md",
    "natalia-nutrition-site/data/weekly-trend-publishing/drafts/2026-06/straczki-bez-wzdec/sources.md",
    "natalia-nutrition-site/data/weekly-trend-publishing/drafts/2026-06/straczki-bez-wzdec/cover.jpg",
  ]);
});

test("assertSafeChangedFiles rejects drafts, remediation, checkpoints, caches and logs", () => {
  assert.doesNotThrow(() => assertSafeChangedFiles([
    "natalia-nutrition-site/blog.html",
    "natalia-nutrition-site/articles/straczki-bez-wzdec.html",
    "natalia-nutrition-site/assets/images/blog/straczki-bez-wzdec-cover.jpg",
    "natalia-nutrition-site/data/weekly-trend-publishing/automation-state.json",
  ]));

  assert.throws(
    () => assertSafeChangedFiles([
      "natalia-nutrition-site/data/weekly-trend-publishing/drafts/2026-06/straczki-bez-wzdec/draft.html",
    ]),
    /draft/i,
  );
  assert.throws(() => assertSafeChangedFiles(["natalia-nutrition-site/.cache/tmp.json"]), /cache/i);
  assert.throws(() => assertSafeChangedFiles(["natalia-nutrition-site/publish.log"]), /log/i);
});

test("assertCleanWorkingTree refuses to start publishing from local dirt", () => {
  assert.doesNotThrow(() => assertCleanWorkingTree(""));
  assert.throws(() => assertCleanWorkingTree(" M natalia-nutrition-site/blog.html"), /working tree is not clean/u);
});

test("dry-run reports the next slug without changing state", () => {
  const state = {
    queue: REVIEWED_DAILY_QUEUE,
    published: [],
    blocked: [],
    last_attempt_local_date: null,
  };

  const result = planStateTransition({
    state,
    mode: "dry-run",
    localDate: "2026-06-23",
    localHour: "12",
    draftPackage: { article: passingArticle(), qaText: "Topic-specific sources: yes.\nYMYL safety note included: yes.\nShared NCI fallback image: not used." },
    usedImageSources: new Set(),
  });

  assert.equal(result.status, "ready_for_editorial_review");
  assert.equal(result.slug, "straczki-bez-wzdec");
  assert.equal(result.changed, false);
  assert.equal(result.nextState, state);
});

test("publish skips outside the exact 09 Europe/Dublin hour", () => {
  const result = planStateTransition({
    state: { queue: REVIEWED_DAILY_QUEUE, published: [], blocked: [] },
    mode: "publish",
    localDate: "2026-06-23",
    localHour: "08",
    draftPackage: { article: passingArticle(), qaText: "Topic-specific sources: yes." },
    usedImageSources: new Set(),
  });

  assert.equal(result.status, "skipped");
  assert.equal(result.skipReason, "outside_publish_window");
  assert.equal(result.changed, false);
});

test("skip-slug records a blocked item and advances the queue", () => {
  const state = { queue: REVIEWED_DAILY_QUEUE, published: [], blocked: [] };

  const result = planStateTransition({
    state,
    mode: "skip",
    localDate: "2026-06-23",
    localHour: "09",
    skipSlug: "straczki-bez-wzdec",
    reason: "Needs manual rewrite before publication.",
  });

  assert.equal(result.status, "blocked_needs_editorial_revision");
  assert.equal(result.changed, true);
  assert.equal(result.nextState.blocked[0].slug, "straczki-bez-wzdec");
  assert.equal(result.nextState.next_slug, "nabial-fermentowany-a-jelita");
});

test("publish records blocked QA failures instead of touching publication state", () => {
  const result = planStateTransition({
    state: { queue: REVIEWED_DAILY_QUEUE, published: [], blocked: [], last_attempt_local_date: null },
    mode: "publish",
    localDate: "2026-06-23",
    localHour: "09",
    draftPackage: { article: passingArticle({ sources: [] }), qaText: "Topic-specific sources: no." },
    usedImageSources: new Set(),
  });

  assert.equal(result.status, "blocked_needs_editorial_revision");
  assert.equal(result.changed, true);
  assert.equal(result.published, false);
  assert.equal(result.nextState.published.length, 0);
  assert.equal(result.nextState.blocked[0].slug, "straczki-bez-wzdec");
  assert.equal(result.nextState.last_attempt_local_date, "2026-06-23");
});

test("publish requires an explicit passing editorial review", () => {
  const result = planStateTransition({
    state: { queue: REVIEWED_DAILY_QUEUE, published: [], blocked: [], last_attempt_local_date: null },
    mode: "publish",
    localDate: "2026-06-23",
    localHour: "09",
    draftPackage: {
      article: passingArticle(),
      qaText: "Topic-specific sources: yes.\nYMYL safety note included: yes.\nShared NCI fallback image: not used.",
      editorialReview: { status: "pass", reason: "Clear, useful and safe." },
    },
    usedImageSources: new Set(),
  });

  assert.equal(result.status, "ready_to_publish");
  assert.equal(result.changed, true);
  assert.equal(result.published, true);
  assert.equal(result.nextState.published[0].slug, "straczki-bez-wzdec");
  assert.equal(result.nextState.next_slug, "nabial-fermentowany-a-jelita");
});
