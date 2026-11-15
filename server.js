"use strict";

const express = require("express");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

const app = express();
app.set("trust proxy", true);
app.use(express.static(path.join(__dirname, "public")));

function normalizeHandle(input) {
  if (typeof input !== "string") return null;
  const handle = input.trim().replace(/^@+/, "");
  if (!HANDLE_RE.test(handle)) return null;
  return handle;
}

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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/avatar", async (req, res) => {
  const handle = normalizeHandle(req.query.handle || "");
  if (!handle) return svgAvatar(res, "?");

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    const url = `https://unavatar.io/x/${encodeURIComponent(handle)}?fallback=false`;
    const upstream = await fetch(url, {
      signal: ac.signal,
      headers: { "User-Agent": "ct-q4-check/1.0" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!upstream.ok) return svgAvatar(res, handle);
    const ctype = upstream.headers.get("content-type") || "image/jpeg";
    if (!ctype.startsWith("image/")) return svgAvatar(res, handle);
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", ctype);
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(buf);
  } catch {
    return svgAvatar(res, handle);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CT Q4 Check running on http://localhost:${PORT}`);
});
