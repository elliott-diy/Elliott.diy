const ALLOWED_HOST = "api.elliott.diy";
const MAX_URL_LENGTH = 400;
const MAX_FILENAME_LENGTH = 120;
const UPSTREAM_TIMEOUT_MS = 8000;
const ALLOWED_PATHS = new Set([
  "/v1/vpn/all",
  "/v1/vpn/pia",
  "/v1/vpn/mullvad",
  "/v1/vpn/windscribe",
  "/v1/vpn/ivpn",
  "/v1/vpn/nordvpn",
  "/v1/tor/exit",
  "/v1/tor/obfs4",
  "/v1/tor/vanilla",
  "/v1/tor/webtunnel",
  "/v1/tor/snowflake",
  "/v1/tor/meek",
]);

const sanitizeFilename = (value) => {
  if (!value) {
    return "";
  }

  return value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, MAX_FILENAME_LENGTH);
};

const normalizeFilename = (value, extension) => {
  const clean = sanitizeFilename(value).replace(/\.(txt|json)$/i, "");
  const base = clean || "feed";
  return `${base}.${extension}`;
};

const toSafeHttpStatus = (status, fallback = 502) => {
  return Number.isInteger(status) && status >= 200 && status <= 599 ? status : fallback;
};

const safeSetHeader = (headers, name, value) => {
  if (!value) {
    return false;
  }

  try {
    headers.set(name, value);
    return true;
  } catch {
    return false;
  }
};

const buildDirectRedirect = (feedUrl) => {
  const response = Response.redirect(feedUrl.toString(), 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
};

const isAllowedQuery = (url) => {
  if ([...url.searchParams.keys()].length === 0) {
    return true;
  }

  const format = url.searchParams.get("format");
  return [...url.searchParams.keys()].length === 1 && format === "json";
};

export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const queryKeys = [...requestUrl.searchParams.keys()];
  const rawFeedUrl = requestUrl.searchParams.get("url");
  const requestedFilename = requestUrl.searchParams.get("filename");

  if (queryKeys.some((key) => key !== "url" && key !== "filename")) {
    return new Response("Unsupported query parameters.", { status: 400 });
  }

  if (!rawFeedUrl) {
    return new Response("Missing feed url.", { status: 400 });
  }

  if (rawFeedUrl.length > MAX_URL_LENGTH) {
    return new Response("Feed url is too long.", { status: 400 });
  }

  let feedUrl;
  try {
    feedUrl = new URL(rawFeedUrl);
  } catch {
    return new Response("Invalid feed url.", { status: 400 });
  }

  if (
    feedUrl.protocol !== "https:" ||
    !!feedUrl.username ||
    !!feedUrl.password ||
    feedUrl.hostname !== ALLOWED_HOST ||
    !ALLOWED_PATHS.has(feedUrl.pathname) ||
    !isAllowedQuery(feedUrl)
  ) {
    return new Response("Unsupported feed url.", { status: 400 });
  }

  const extension = feedUrl.searchParams.get("format") === "json" ? "json" : "txt";
  const filename = normalizeFilename(requestedFilename, extension);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  let upstreamResponse;
  try {
    upstreamResponse = await fetch(feedUrl.toString(), {
      method: "GET",
      redirect: "error",
      headers: {
        "accept-encoding": "identity",
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new Response("Feed request timed out.", { status: 504 });
    }
    return buildDirectRedirect(feedUrl);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!upstreamResponse.ok) {
    if (upstreamResponse.status >= 500) {
      return buildDirectRedirect(feedUrl);
    }

    return new Response("Feed is unavailable.", {
      status: toSafeHttpStatus(upstreamResponse.status, 502),
    });
  }

  let body;
  try {
    body = await upstreamResponse.arrayBuffer();
  } catch {
    return new Response("Failed to read feed.", { status: 502 });
  }

  const headers = new Headers();
  const defaultContentType = extension === "json" ? "application/json; charset=utf-8" : "text/plain; charset=utf-8";
  const upstreamContentType = upstreamResponse.headers.get("content-type");
  const hasContentType = safeSetHeader(headers, "Content-Type", upstreamContentType);
  if (!hasContentType) {
    headers.set("Content-Type", defaultContentType);
  }
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

  return new Response(body, {
    status: 200,
    headers,
  });
}
