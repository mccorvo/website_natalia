import { createReadStream, existsSync, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"]
]);

function sendStatus(response, statusCode, message) {
  response.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    "x-content-type-options": "nosniff"
  });
  response.end(`${message}\n`);
}

function loadRedirects(root) {
  const redirectsPath = path.join(root, "_redirects");
  if (!existsSync(redirectsPath)) return [];

  return readFileSync(redirectsPath, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [source, destination, rawCode] = line.split(/\s+/u);
      const code = Number(rawCode || 302);
      return { source, destination, code };
    })
    .filter((rule) => rule.source && rule.destination && [301, 302, 303, 307, 308].includes(rule.code));
}

function matchesRedirectSource(source, pathname) {
  if (source.endsWith("/*")) {
    const prefix = source.slice(0, -1);
    return pathname.startsWith(prefix);
  }

  return pathname === source;
}

function findRedirect(redirects, requestUrl) {
  const url = new URL(requestUrl ?? "/", "http://localhost");
  let pathname;

  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }

  return redirects.find((rule) => matchesRedirectSource(rule.source, pathname)) || null;
}

function isInsideRoot(root, filePath) {
  return filePath === root || filePath.startsWith(`${root}${path.sep}`);
}

async function findStaticFile(root, requestUrl) {
  const url = new URL(requestUrl ?? "/", "http://localhost");
  let pathname;

  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return { status: 400 };
  }

  if (pathname.includes("\0")) {
    return { status: 400 };
  }

  const candidates = pathname.endsWith("/")
    ? [path.resolve(root, `.${pathname}`, "index.html")]
    : [path.resolve(root, `.${pathname}`)];

  for (const candidate of candidates) {
    if (!isInsideRoot(root, candidate)) {
      return { status: 404 };
    }

    const fileStat = await stat(candidate).catch((error) => {
      if (error?.code === "ENOENT" || error?.code === "ENOTDIR") {
        return null;
      }
      throw error;
    });

    if (fileStat?.isFile()) {
      return { status: 200, filePath: candidate, size: fileStat.size };
    }
  }

  return { status: 404 };
}

export function createStaticServer({ root = process.cwd() } = {}) {
  const resolvedRoot = path.resolve(root);
  const redirects = loadRedirects(resolvedRoot);

  return http.createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendStatus(response, 405, "Method not allowed");
      return;
    }

    const redirect = findRedirect(redirects, request.url);
    if (redirect) {
      response.writeHead(redirect.code, {
        "location": redirect.destination,
        "x-content-type-options": "nosniff"
      });
      response.end();
      return;
    }

    let result;
    try {
      result = await findStaticFile(resolvedRoot, request.url);
    } catch (error) {
      console.error(error);
      sendStatus(response, 500, "Internal server error");
      return;
    }

    if (result.status === 400) {
      sendStatus(response, 400, "Bad request");
      return;
    }

    if (result.status === 404 || !result.filePath) {
      sendStatus(response, 404, "Not found");
      return;
    }

    response.writeHead(200, {
      "content-length": result.size,
      "content-type": MIME_TYPES.get(path.extname(result.filePath).toLowerCase()) ?? "application/octet-stream",
      "x-content-type-options": "nosniff"
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(result.filePath).pipe(response);
  });
}

function readOption(args, name, fallback) {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1]) {
    return args[index + 1];
  }

  return fallback;
}

function startServer() {
  const args = process.argv.slice(2);
  const host = readOption(args, "host", process.env.HOST ?? "127.0.0.1");
  const port = Number(readOption(args, "port", process.env.PORT ?? "8787"));

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("Invalid port. Use --port 8787 or set PORT=8787.");
    process.exitCode = 1;
    return;
  }

  const server = createStaticServer({ root: process.cwd() });
  server.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });

  server.listen(port, host, () => {
    console.log(`Serving ${process.cwd()} at http://${host}:${port}/`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer();
}
