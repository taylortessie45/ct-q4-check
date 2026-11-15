"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const { analyze, buildDemo, enlargePfp } = require("./analyze");

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const CACHE_FILE = path.join(DATA_DIR, "cache.json");
const USAGE_FILE = path.join(DATA_DIR, "usage.json");
const BEARER = (process.env.X_BEARER_TOKEN || "").trim();
const MAX_POSTS = clampInt(process.env.MAX_POSTS, 30, 5, 100);
const DAILY_CHECK_LIMIT = clampInt(process.env.DAILY_CHECK_LIMIT, 200, 1, 100000);
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const X_API = "https://api.twitter.com/2";
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
const AVATAR_HOSTS = new Set([
  "pbs.twimg.com",
  "abs.twimg.com",
  "unavatar.io",
  "cdn.unavatar.io",
]);

const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "16kb" }));
app.use(express.static(path.join(__dirname, "public")));

const memCache = new Map();
const rateBuckets = new Map();

function clampInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function clientIp(req) {
  const raw = (req.ip || req.socket.remoteAddress || "").replace("::ffff:", "");
  return raw || "unknown";
}

function rateLimit(req, res, next) {
  const ip = clientIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 20;
  let bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.start >= windowMs) {
    bucket = { start: now, count: 0 };
    rateBuckets.set(ip, bucket);
  }
  bucket.count += 1;
  if (bucket.count > max) {
    return res.status(429).json({
      error: "Slow down a little. Try again in a minute.",
      code: "rate_limit",
    });
  }
  next();
}

function normalizeHandle(input) {
  if (typeof input !== "string") return null;
  const handle = input.trim().replace(/^@+/, "");
  if (!HANDLE_RE.test(handle)) return null;
  return handle;
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function atomicWrite(file, data) {
  ensureStore();
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

function loadCacheFromDisk() {
  ensureStore();
  if (!fs.existsSync(CACHE_FILE)) return;
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    const handles = (raw && raw.handles) || {};
    const now = Date.now();
    for (const [key, entry] of Object.entries(handles)) {
      if (!entry || !entry.cachedAt || !entry.result) continue;
      const ts = Date.parse(entry.cachedAt);
      if (!Number.isFinite(ts) || now - ts >= CACHE_TTL_MS) continue;
      memCache.set(key, { cachedAt: ts, result: entry.result });
    }
  } catch {
    // Start with an empty cache if the file is broken.
  }
}

function persistCache() {
  const handles = {};
  const now = Date.now();
  for (const [key, entry] of memCache.entries()) {
    if (!entry || now - entry.cachedAt >= CACHE_TTL_MS) continue;
    handles[key] = {
      cachedAt: new Date(entry.cachedAt).toISOString(),
      result: entry.result,
    };
  }
  atomicWrite(CACHE_FILE, { handles });
}

function getCached(handleLower) {
  const entry = memCache.get(handleLower);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt >= CACHE_TTL_MS) {
    memCache.delete(handleLower);
    return null;
  }
  return entry;
}

function setCached(handleLower, result) {
  memCache.set(handleLower, { cachedAt: Date.now(), result });
  try {
    persistCache();
  } catch (err) {
    console.error("Failed to persist cache:", err.message);
  }
}

function utcDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function readUsage() {
  ensureStore();
  const today = utcDay();
  if (!fs.existsSync(USAGE_FILE)) return { day: today, count: 0 };
  try {
    const raw = JSON.parse(fs.readFileSync(USAGE_FILE, "utf8"));
    if (!raw || raw.day !== today) return { day: today, count: 0 };
    return { day: today, count: Number(raw.count) || 0 };
  } catch {
    return { day: today, count: 0 };
  }
}

function canFetchLive() {
  return readUsage().count < DAILY_CHECK_LIMIT;
}

function recordLiveFetch() {
  const usage = readUsage();
  usage.count += 1;
  atomicWrite(USAGE_FILE, usage);
  return usage;
}

async function xFetch(url) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 12000);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${BEARER}` },
      signal: ac.signal,
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { res, body };
  } finally {
    clearTimeout(timer);
  }
}

function xError(res, body) {
  const status = res.status;
  const title =
    (body && body.title) ||
    (body && body.detail) ||
    (body && body.errors && body.errors[0] && body.errors[0].message) ||
    "";
  if (status === 404) {
    return { status: 404, error: "We couldn't find that X account.", code: "not_found" };
  }
  if (status === 429) {
    return {
      status: 429,
      error: "The X data quota is tight right now. Try again later.",
      code: "quota",
    };
  }
  if (status === 401) {
    return {
      status: 502,
      error: "This site isn't connected to X correctly. Ask the owner to check the API key.",
      code: "bad_key",
    };
  }
  if (status === 403) {
    const text = String(title).toLowerCase();
    if (text.includes("protect") || text.includes("not authorized")) {
      return {
        status: 403,
        error: "That account is protected, so we can't read the posts.",
        code: "protected",
      };
    }
    if (text.includes("suspend")) {
      return { status: 404, error: "We couldn't find that X account.", code: "not_found" };
    }
    return {
      status: 403,
      error: "X blocked that request. The account may be protected or restricted.",
      code: "forbidden",
    };
  }
  return {
    status: 502,
    error: "Couldn't read that account from X right now. Try again.",
    code: "upstream",
  };
}

async function fetchUser(handle) {
  const fields = "public_metrics,created_at,description,profile_image_url,protected";
  const url = `${X_API}/users/by/username/${encodeURIComponent(handle)}?user.fields=${fields}`;
  return xFetch(url);
}

async function fetchTweets(userId) {
  const params = new URLSearchParams({
    max_results: String(MAX_POSTS),
    exclude: "retweets",
    "tweet.fields": "created_at,public_metrics,attachments,entities,conversation_id,in_reply_to_user_id,text",
    expansions: "attachments.media_keys",
  });
  const url = `${X_API}/users/${encodeURIComponent(userId)}/tweets?${params}`;
  return xFetch(url);
}

function mapResult(result, { demo, cached }) {
  return {
    ok: true,
    demo: Boolean(demo),
    cached: Boolean(cached),
    you: result.you,
    score: result.score,
    label: result.label,
    niches: result.niches,
    metrics: result.metrics,
    strength: result.strength,
    tips: result.tips,
  };
}

app.get("/api/health", (_req, res) => {
  const usage = readUsage();
  res.json({
    ok: true,
    demo: !BEARER,
    maxPosts: MAX_POSTS,
    dailyCheckLimit: DAILY_CHECK_LIMIT,
    dailyUsed: usage.count,
  });
});

app.post("/api/analyze", rateLimit, async (req, res) => {
  const handle = normalizeHandle(req.body && req.body.handle);
  if (!handle) {
    return res.status(400).json({
      error: "Enter a valid X username (1–15 letters, numbers, or underscores).",
      code: "invalid_handle",
    });
  }

  const key = handle.toLowerCase();
  const cached = getCached(key);
  if (cached) {
    const payload = mapResult(cached.result, { demo: false, cached: true });
    payload.you = { ...payload.you, handle: cached.result.you.handle || handle };
    return res.json(payload);
  }

  if (!BEARER) {
    const result = buildDemo(handle);
    result.you.handle = handle;
    return res.json(mapResult(result, { demo: true, cached: false }));
  }

  if (!canFetchLive()) {
    return res.status(429).json({
      error: "We're busy today. Try again tomorrow.",
      code: "daily_limit",
    });
  }

  try {
    recordLiveFetch();
    const userResp = await fetchUser(handle);
    if (!userResp.res.ok || !userResp.body || !userResp.body.data) {
      const mapped = xError(userResp.res, userResp.body);
      if (userResp.res.status === 404 || (mapped && mapped.code === "not_found")) {
        return res.status(404).json({
          error: "We couldn't find that X account.",
          code: "not_found",
        });
      }
      return res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
    }

    const user = userResp.body.data;
    if (user.protected) {
      return res.status(403).json({
        error: "That account is protected, so we can't read the posts.",
        code: "protected",
      });
    }

    const tweetResp = await fetchTweets(user.id);

    if (tweetResp.res.status === 429) {
      return res.status(429).json({
        error: "The X data quota is tight right now. Try again later.",
        code: "quota",
      });
    }
    if (!tweetResp.res.ok && tweetResp.res.status !== 404) {
      const mapped = xError(tweetResp.res, tweetResp.body);
      return res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
    }

    const tweets = (tweetResp.body && tweetResp.body.data) || [];
    if (!tweets.length) {
      return res.status(404).json({
        error: "That account hasn't posted enough public posts to score.",
        code: "no_posts",
      });
    }

    user.username = user.username || handle;
    user.profile_image_url = enlargePfp(user.profile_image_url || "");
    const result = analyze(user, tweets.slice(0, MAX_POSTS));
    setCached(key, result);
    return res.json(mapResult(result, { demo: false, cached: false }));
  } catch (err) {
    if (err && err.name === "AbortError") {
      return res.status(504).json({
        error: "X is taking too long. Try again.",
        code: "timeout",
      });
    }
    console.error("analyze failed:", err.message);
    return res.status(502).json({
      error: "Couldn't read that account from X right now. Try again.",
      code: "upstream",
    });
  }
});

app.get("/api/avatar", rateLimit, async (req, res) => {
  const handle = normalizeHandle(req.query.handle || "");
  let target = typeof req.query.url === "string" ? req.query.url.trim() : "";

  if (!target && handle) {
    target = `https://unavatar.io/x/${encodeURIComponent(handle)}`;
  }
  if (!target) {
    return svgAvatar(res, handle || "?");
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return svgAvatar(res, handle || "?");
  }
  if (parsed.protocol !== "https:" || !AVATAR_HOSTS.has(parsed.hostname)) {
    return svgAvatar(res, handle || "?");
  }

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    const upstream = await fetch(parsed.toString(), {
      signal: ac.signal,
      headers: { "User-Agent": "ct-q4-check/1.0" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!upstream.ok) return svgAvatar(res, handle || "?");
    const ctype = upstream.headers.get("content-type") || "image/jpeg";
    if (!ctype.startsWith("image/")) return svgAvatar(res, handle || "?");
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", ctype);
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(buf);
  } catch {
    return svgAvatar(res, handle || "?");
  }
});

function svgAvatar(res, handle) {
  const letter = String(handle || "?").replace(/^@/, "").charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ff7a1a"/><stop offset="100%" stop-color="#ff4d8d"/>
  </linearGradient></defs>
  <rect width="200" height="200" fill="url(#g)"/>
  <text x="100" y="118" text-anchor="middle" font-family="Arial,sans-serif" font-size="96" font-weight="700" fill="#1a0d08">${letter}</text>
</svg>`;
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.send(svg);
}

app.listen(PORT, "0.0.0.0", () => {
  ensureStore();
  loadCacheFromDisk();
  const mode = BEARER ? "live" : "demo";
  console.log(`CT Q4 Check running on http://localhost:${PORT} (${mode} mode, max posts ${MAX_POSTS}, daily cap ${DAILY_CHECK_LIMIT})`);
});
