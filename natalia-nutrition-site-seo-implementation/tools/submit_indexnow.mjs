import { readFileSync } from "node:fs";

const host = "nataliacorvo.com";
const key = "cd0ca4b412175b7c0fe92b10bd43f866";
const endpoint = "https://api.indexnow.org/indexnow";
const sitemap = readFileSync("sitemap.xml", "utf8");
const urlList = [...sitemap.matchAll(/<loc>(https:\/\/nataliacorvo\.com\/[^<]*)<\/loc>/g)]
  .map((match) => match[1]);

if (urlList.length === 0) {
  console.error("No canonical URLs found in sitemap.xml.");
  process.exit(1);
}

const payload = {
  host,
  key,
  keyLocation: `https://${host}/${key}.txt`,
  urlList,
};

if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(payload),
});

if (!response.ok && response.status !== 202) {
  const text = await response.text();
  console.error(`IndexNow submission failed: ${response.status} ${response.statusText}`);
  if (text) console.error(text);
  process.exit(1);
}

console.log(`Submitted ${urlList.length} URL(s) to IndexNow.`);
