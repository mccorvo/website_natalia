const allowedImageLicenses = [
  "cc0",
  "public domain",
  "pd",
  "cc by",
  "cc-by",
  "cc by-sa",
  "cc-by-sa",
];

const defaultFallbackQueries = [
  "healthy food vegetables",
  "salad vegetables",
  "mediterranean diet food",
];

export async function findCommonsCoverImage({
  query,
  slug,
  usedSourceUrls = new Set(),
  fetchImpl = fetch,
  userAgent,
  fallbackQueries = defaultFallbackQueries,
}) {
  const normalizedUsed = new Set([...usedSourceUrls].map(normalizeCommonsSourceUrl).filter(Boolean));
  const queries = [...new Set([query, ...fallbackQueries].filter(Boolean))];
  for (const searchQuery of queries) {
    const selected = await searchCommonsCoverImage({
      query: searchQuery,
      usedSourceUrls: normalizedUsed,
      fetchImpl,
      userAgent,
    });
    if (selected) return selected;
  }
  throw new Error(`No suitable unused freely licensed Wikimedia Commons cover image found for ${slug} using query: ${query}`);
}

export async function searchCommonsCoverImage({ query, usedSourceUrls = new Set(), fetchImpl = fetch, userAgent }) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("generator", "search");
  api.searchParams.set("gsrnamespace", "6");
  api.searchParams.set("gsrsearch", query);
  api.searchParams.set("gsrlimit", "30");
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime|mediatype|size|extmetadata");
  api.searchParams.set("iiurlwidth", "1400");
  api.searchParams.set("origin", "*");

  const response = await fetchImpl(api, {
    headers: userAgent ? { "User-Agent": userAgent } : {},
  });
  if (!response.ok) throw new Error(`Wikimedia Commons search failed for "${query}": HTTP ${response.status}`);

  const data = await response.json();
  const pages = Object.values(data.query?.pages || {});
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const candidate = normalizeCommonsImageInfo(info, page.title);
    if (!candidate) continue;
    if (candidate.sourceKeys.some((sourceUrl) => usedSourceUrls.has(sourceUrl))) continue;
    return candidate;
  }
  return null;
}

export function normalizeCommonsImageInfo(info, title = "") {
  const mime = String(info.mime || "").toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) return null;
  if (info.mediatype && info.mediatype !== "BITMAP") return null;

  const metadata = info.extmetadata || {};
  const license = cleanMetadata(metadata.LicenseShortName?.value || metadata.License?.value || "");
  const licenseLower = license.toLowerCase();
  if (!allowedImageLicenses.some((allowed) => licenseLower.includes(allowed))) return null;
  if (/(?:non-?commercial|\bnc\b|no derivatives|\bnd\b|fair use)/iu.test(license)) return null;

  const artist = cleanMetadata(metadata.Artist?.value || metadata.Credit?.value || "Wikimedia Commons contributor");
  const descriptionUrl = info.descriptionurl || info.descriptionshorturl || info.url;
  const titlePath = title.startsWith("File:") ? title.replace(/\s+/gu, "_") : "";
  const titleUrl = titlePath
    ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(titlePath).replace(/%3A/u, ":")}`
    : "";
  const sourceKeys = [descriptionUrl, titleUrl].map(normalizeCommonsSourceUrl).filter(Boolean);

  return {
    mime,
    downloadUrl: info.thumburl || info.url,
    descriptionUrl,
    license,
    attribution: `${artist}, ${license}, Wikimedia Commons`,
    sourceKeys,
  };
}

export function normalizeCommonsSourceUrl(value) {
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

export function extensionForMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
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
