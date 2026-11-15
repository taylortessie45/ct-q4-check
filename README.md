# CT Q4 Check

A mobile-first crypto Twitter quiz. People drop their X handle, answer eight quick questions, and share a **2026 Q4 Growth Card** with their score, progress, and Q4 mission.

There is **no X API** and **no usage cap**. The handle is only used to show a username and profile picture (via [unavatar](https://unavatar.io)). Scoring runs entirely in the browser.

## Run locally

You need Node.js 18 or newer.

```bash
cd ct-q4-check
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

Optional environment variable:

- `PORT` — server port (default `3000`). Render sets this for you.

## Deploy on Render (free tier)

1. Push this folder to a GitHub repo.
2. In [Render](https://render.com), click **New +** → **Web Service**.
3. Connect the repo and set:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Instance type:** Free
4. `PORT` is set by Render automatically. Do not hard-code it. No other environment variables are required.
5. Click **Deploy**. After the first deploy succeeds, copy the `https://….onrender.com` URL and share it.

If this service is already live from an earlier version, just push `main` and let Render redeploy. You can delete any old `X_BEARER_TOKEN`, `DATA_DIR`, `MAX_POSTS`, or `DAILY_CHECK_LIMIT` env vars — they are unused.

## How it works

1. Enter an X username (optional leading `@`, then 1–15 letters, digits, or underscores).
2. Answer 8 questions, one per screen: niches, exact follower count, consistency, average likes, 30-day engagement trend, what's holding you back, opportunities, and Q4 missions. Niche, blockers, opportunities, and missions are multi-select. Follower count is typed (16.2k, 17,000, or 850 all work) and shown compactly on the card. Blocker options include short explanations, a "Nothing — I'm doing good" choice, and a "Something else" write-in.
3. The site computes a Q4 score from 0–100 with a label: **Q4 Sleeper**, **Warming Up**, **Rising**, **Q4 Ready**, or **Q4 Giga Chad**.
4. The result card is titled **2026 · Your Q4 Growth Card** and shows the profile picture, handle, a large score badge, niche chips, followers, average likes, a 30-day progress note, what's holding you back, "open to" chips, Q4 missions, 2–3 tips, the site URL, and a **Built by @tenacious_ar** credit. The same credit also appears as a footer on every screen, with the handle linking to the X profile.

- Profile pictures load from `unavatar.io` through `/api/avatar`, with a letter-avatar fallback.
- **Download card** renders a crisp 1080×1350 PNG in the browser, sized for posting on X.
- **Share on X** opens `https://x.com/intent/post?text=...` with:

  `My 2026 Q4 Growth Card: SCORE (LABEL) 🚀 Q4 mission: MISSION. Get yours 👉 SITE_LINK`

## Project layout

- `server.js` — Express static server plus a tiny avatar proxy
- `public/index.html` — home, quiz, and result UI
- `public/styles.css` — dark, orange/pink theme
- `public/app.js` — quiz flow, scoring, and card actions
