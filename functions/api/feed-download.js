const ALLOWED_HOST = "api.elliott.diy";
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

  return value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 120);
};

const normalizeFilename = (value, extension) => {
  const clean = sanitizeFilename(value).replace(/\.(txt|json)$/i, "");
  const base = clean || "feed";
  return `${base}.${extension}`;
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
  const rawFeedUrl = requestUrl.searchParams.get("url");
  const requestedFilename = requestUrl.searchParams.get("filename");

  if (!rawFeedUrl) {
    return new Response("Missing feed url.", { status: 400 });
  }

  let feedUrl;
  try {
    feedUrl = new URL(rawFeedUrl);
  } catch {
    return new Response("Invalid feed url.", { status: 400 });
  }

  if (
    feedUrl.protocol !== "https:" ||
    feedUrl.hostname !== ALLOWED_HOST ||
    !ALLOWED_PATHS.has(feedUrl.pathname) ||
    !isAllowedQuery(feedUrl)
  ) {
    return new Response("Unsupported feed url.", { status: 400 });
  }

  const extension = feedUrl.searchParams.get("format") === "json" ? "json" : "txt";
  const filename = normalizeFilename(requestedFilename, extension);

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(feedUrl.toString(), { method: "GET" });
  } catch {
    return new Response("Failed to fetch feed.", { status: 502 });
  }

  if (!upstreamResponse.ok) {
    return new Response("Feed is unavailable.", { status: upstreamResponse.status });
  }

  const contentType =
    upstreamResponse.headers.get("content-type") ||
    (extension === "json" ? "application/json; charset=utf-8" : "text/plain; charset=utf-8");

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(upstreamResponse.body, {
    status: 200,
    headers,
  });
}
