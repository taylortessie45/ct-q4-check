# CT Q4 Check

A mobile-first crypto Twitter tool. People drop their X handle, get a Q4 score based on public posts, and share a card with their niche, top strength, and a few focus tips.

If `X_BEARER_TOKEN` is missing, the site runs in **demo mode** and returns realistic sample data with a small "Demo data" badge. That is enough to test the UI without an API key.

## Run locally

You need Node.js 18 or newer.

```bash
cd ct-q4-check
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Default | What it does |
| --- | --- | --- |
| `PORT` | `3000` | Server port. Render sets this for you. |
| `DATA_DIR` | `./data` | Folder for the 24-hour cache and the daily usage counter. |
| `X_BEARER_TOKEN` | unset | X API v2 bearer token. If empty, the site uses demo data. |
| `MAX_POSTS` | `30` | How many original (non-retweet) posts to fetch per handle, 5–100. Keep this low — X bills per post read. |
| `DAILY_CHECK_LIMIT` | `200` | Max **uncached** live lookups per UTC day. Cached hits do not count. When the cap is hit, new handles see a friendly "We're busy today. Try again tomorrow." message. |

Example:

```bash
PORT=4000 DATA_DIR=/var/data X_BEARER_TOKEN=your_token MAX_POSTS=30 DAILY_CHECK_LIMIT=200 npm start
```

## Deploy on Render (free tier)

1. Push this folder to a GitHub repo.
2. In [Render](https://render.com), click **New +** → **Web Service**.
3. Connect the repo and set:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Instance type:** Free
4. Add environment variables:
   - `X_BEARER_TOKEN` = your X API bearer token (needed for live scores; skip this to launch in demo mode)
   - `DATA_DIR` = `/opt/render/project/src/data` (optional)
   - `MAX_POSTS` = `30` (optional)
   - `DAILY_CHECK_LIMIT` = `200` (optional)
   - `PORT` is set by Render automatically. Do not hard-code it.
5. Click **Deploy**. After the first deploy succeeds, copy the `https://….onrender.com` URL and share it.

### Cost and caching

X API reads are pay-per-use (user lookup + each post). To keep the bill in check:

- The server fetches **at most `MAX_POSTS` original posts** (default 30), not a full 100.
- Results are **cached for 24 hours** in memory and as JSON under `DATA_DIR`. Repeat checks of the same handle are free.
- After `DAILY_CHECK_LIMIT` uncached live lookups in a UTC day (default 200), new live fetches are paused until tomorrow. Cached handles still work.

Render's free web services use an **ephemeral filesystem**. The cache file under `DATA_DIR` is wiped whenever the service restarts, sleeps, or redeploys. The in-memory cache also resets on restart. That can spend API credits again for handles that were already checked.

## How it works

- `POST /api/analyze` accepts `{ "handle": "username" }`, looks up the public X profile, pulls the latest original posts, and returns a Q4 score.
- Handles are validated (optional leading `@`, then 1–15 letters, digits, or underscores). Requests are rate-limited to 20 per IP per minute.
- Analysis is deterministic (no LLM): niche from keywords in the bio and posts, engagement rate vs followers, posts per week, 30-day trend, best post type, and best posting hour.
- The Q4 score is 0–100 with labels: **Q4 Sleeper**, **Warming Up**, **Rising**, **Q4 Ready**, **Q4 Giga Chad**.
- Profile pictures use the official `profile_image_url` when live, falling back to `unavatar.io` or a letter avatar. `/api/avatar` proxies them so the card can be downloaded.
- **Download card** renders the result to a PNG in the browser.
- **Share on X** opens `https://x.com/intent/post?text=...` with:

  `My Q4 score is SCORE (LABEL) 🚀 Niche: NICHE. Check yours 👉 SITE_LINK`

Friendly errors cover a missing account, a protected account, no public posts, a tight API quota, a missing or bad API key, and the daily lookup cap.

## Project layout

- `server.js` — Express API, cache, daily cap, and static file server
- `analyze.js` — scoring, niche detection, tips, and demo data
- `public/index.html` — home + result UI
- `public/styles.css` — dark, orange/pink theme
- `public/app.js` — front-end logic
- `data/cache.json` and `data/usage.json` — created at runtime (not committed)
