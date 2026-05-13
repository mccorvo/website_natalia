# SEO, organic positioning and AI-crawling rules for this content pack

## Strategic goal

The site already has broad foundation articles. This pack expands the blog into patient-intent nutrition content for a Poland-first audience while preserving the calm PL/EN educational style.

The content should help organic SEO by building topical depth around:

- endocrine/metabolic conditions;
- digestive symptoms and conditions;
- pregnancy/life-stage nutrition;
- deficiencies and bone health;
- kidney, uric acid and stone prevention topics.

## What not to do

Do not create 50 thin URLs from the old 11–60 material. This package consolidates the usable material into 24 strong, distinct article URLs.

Do not publish duplicate articles with near-identical intent. In particular:

- keep the live DASH article as the canonical DASH topic;
- use the new hypertension article for `dieta przy nadciśnieniu`;
- keep the live general gluten-free article as general gluten-free education;
- use the new celiac article only for confirmed celiac disease and strict lifelong gluten-free treatment;
- keep lactose intolerance separate from IBS/low FODMAP;
- keep CKD separate from kidney stones and gout, but cross-link them.

## Search intent rules

Every page must answer its primary query in the first 1–2 paragraphs.

Use “what to eat / what to avoid / when to see a clinician” patterns because these match patient searches in Polish.

Do not write purely academic intros. Lead with practical answer-first content.

## E-E-A-T rules

Every article should visibly include:

- author name;
- educational disclaimer;
- source list;
- last updated date;
- practical limits and red flags;
- no miracle claims;
- clear distinction between diet as treatment, diet as support and diet as prevention.

## Schema rules

Use `BlogPosting` for all articles. Use `FAQPage` for rendered FAQ sections. For clinical pages, `MedicalWebPage` can be added if supported by the codebase.

## Crawlability rules

Important article text must be present in initial HTML. Do not render the primary body only after user interaction. FAQ can be collapsible only if text remains present in the HTML and accessible.

## Internal linking clusters

Metabolic:
Hashimoto → insulin resistance, anti-inflammatory, protein
PCOS → insulin resistance, weight management, anti-inflammatory
Type 2 diabetes → insulin resistance, healthy plate, breakfast
Fatty liver → Mediterranean, weight management, cholesterol

GI:
Reflux → gut/microbiota, meal planning
Low FODMAP → gut/microbiota, gluten-free distinction, lactose
Constipation → gut/microbiota, lactose, senior
IBD → gut/microbiota, anaemia, low FODMAP caveat
Celiac → gluten-free general, anaemia, lactose

Life stage:
Pregnancy → GDM, anaemia, lactation
Lactation → pregnancy, anaemia
Menopause → osteoporosis, cholesterol, DASH
Senior → osteoporosis, constipation, protein

Kidney/uric:
Gout → kidney stones, CKD, hypertension
CKD → hypertension, diabetes, kidney stones
Kidney stones → gout, hydration, CKD

## Title and meta rules

PL title can be longer if needed, but the meta title should remain concise.
English title should be natural, not a literal machine translation if awkward.

Avoid titles that are too close to live articles.

## Source handling

Keep sources visible. Prefer official Polish sources first, then major medical guidelines or public-health organizations.

Do not insert fake volume data. Where search demand is referenced in editorial docs, it remains a proxy, not a measured monthly-volume claim.
