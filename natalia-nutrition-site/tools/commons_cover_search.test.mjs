import assert from "node:assert/strict";
import test from "node:test";

import { findCommonsCoverImage, normalizeCommonsSourceUrl } from "./lib/commons_cover_search.mjs";

function commonsPage({ title, descriptionUrl, url, license = "Public domain", artist = "Test contributor" }) {
  return {
    title,
    imageinfo: [{
      mime: "image/jpeg",
      mediatype: "BITMAP",
      url,
      thumburl: url,
      width: 1400,
      height: 900,
      descriptionurl: descriptionUrl,
      extmetadata: {
        LicenseShortName: { value: license },
        Artist: { value: artist },
      },
    }],
  };
}

test("findCommonsCoverImage skips cover URLs that were already published", async () => {
  const usedUrl = "https://commons.wikimedia.org/wiki/File:Good_Food_Display_-_NCI_Visuals_Online.jpg";
  const freshUrl = "https://commons.wikimedia.org/wiki/File:Pregnancy_healthy_meal.jpg";
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    return {
      ok: true,
      async json() {
        return {
          query: {
            pages: {
              1: commonsPage({
                title: "File:Good Food Display - NCI Visuals Online.jpg",
                descriptionUrl: usedUrl,
                url: "https://upload.wikimedia.org/good-food.jpg",
              }),
              2: commonsPage({
                title: "File:Pregnancy healthy meal.jpg",
                descriptionUrl: freshUrl,
                url: "https://upload.wikimedia.org/pregnancy-meal.jpg",
              }),
            },
          },
        };
      },
    };
  };

  const selected = await findCommonsCoverImage({
    query: "pregnancy healthy meal vegetables whole grain",
    slug: "cukrzyca-ciazowa-dieta",
    usedSourceUrls: new Set([normalizeCommonsSourceUrl(usedUrl)]),
    fetchImpl,
    userAgent: "test-agent",
    fallbackQueries: [],
  });

  assert.equal(selected.descriptionUrl, freshUrl);
  assert.equal(calls.length, 1);
});
