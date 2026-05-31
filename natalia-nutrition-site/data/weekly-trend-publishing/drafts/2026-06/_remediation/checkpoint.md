# P1/P2 Remediation Checkpoint

Created: 2026-05-31T06:50:55.226Z

Status: paused by user for later resume.

## Counts

- Completed content/source/image rewrite pass: 18/50
- Still pending: 32/50
- Next slug: `jedzenie-przy-pms`

## Completed slugs

- `dieta-po-urlopie-bez-detoksu`
- `jak-czytac-etykiety-jogurtow`
- `kolacja-bialkowa-bez-miesa`
- `szybkie-obiady-z-mrozonek`
- `owsianka-przy-wysokim-cholesterolu`
- `talerz-dla-osoby-siedzacej`
- `dieta-przy-czestych-delegacjach`
- `jak-planowac-jedzenie-na-dyzur`
- `czy-trzeba-jesc-piec-posilkow`
- `zupy-w-redukcji-masy`
- `straczki-bez-wzdec`
- `nabial-fermentowany-a-jelita`
- `kefir-czy-jogurt-naturalny`
- `ryby-w-puszce-w-zdrowej-diecie`
- `sardynki-jako-zrodlo-wapnia`
- `jak-ograniczyc-sol-w-kanapkach`
- `co-zamiast-slodkich-napojow`
- `przekaski-przy-pracy-biurowej`

## Pending slugs

- `jedzenie-przy-pms`
- `dieta-a-migrena-dzienniczek`
- `kawa-przed-sniadaniem`
- `czy-banan-tuczy`
- `pieczywo-przy-cukrzycy`
- `platki-sniadaniowe-jak-wybierac`
- `dieta-po-antybiotyku-rozsadnie`
- `kiedy-eliminowac-laktoze`
- `czy-gluten-powoduje-zmeczenie`
- `dieta-przy-kamicy-zolciowej-profilaktyka`
- `kamica-nerkowa-a-nawodnienie`
- `dna-moczanowa-co-ograniczyc`
- `dieta-seniora-z-malym-apetytem`
- `sarcopenia-bialko-i-ruch`
- `dieta-przy-tradziku-bez-skrajnosci`
- `dieta-przy-luszczycy-wsparcie`
- `dieta-antyhistaminowa-ostroznie`
- `napoje-energetyczne-a-apetyt`
- `jak-zmniejszyc-cukier-w-diecie-dziecka`
- `rodzinne-obiady-bez-dwoch-kuchni`
- `sniadanie-przed-treningiem-amatora`
- `regeneracja-po-treningu-bez-odzywek`
- `ile-wody-naprawde-pic`
- `elektrolity-a-biegunka`
- `dieta-roslinna-dla-poczatkujacych`
- `blonnik-rozpuszczalny-i-ldl`
- `psyllium-kiedy-ma-sens`
- `oliwa-rzepakowy-czy-maslo`
- `orzechy-w-diecie-redukcyjnej`
- `jak-nie-marnowac-warzyw`
- `tanie-obiady-z-kasza`
- `zamienniki-slodyczy-bez-obsesji`

## Known image review needed

- `jak-czytac-etykiety-jogurtow`
- `czy-trzeba-jesc-piec-posilkow`
- `nabial-fermentowany-a-jelita`
- `przekaski-przy-pracy-biurowej`

## Resume

```bash
cd /Users/nataliawcislo/.config/superpowers/worktrees/website_natalia/codex-draft-50-more-polish-nutrition-articles
START_AT_SLUG=jedzenie-przy-pms node natalia-nutrition-site/data/weekly-trend-publishing/drafts/2026-06/_remediation/remediate_50_drafts.mjs
```

After the script finishes, run the hard QA guards, manually replace weak image matches, then run the project checks before final commit/push.
