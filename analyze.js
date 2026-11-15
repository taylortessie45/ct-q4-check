"use strict";

const NICHE_BUCKETS = [
  {
    name: "NFTs",
    weight: 1,
    patterns: [
      /\bnfts?\b/i,
      /\bmints?(?:ing|ed)?\b/i,
      /\bfloor\b/i,
      /\bpfps?\b/i,
      /\bjpegs?\b/i,
      /\bopensea\b/i,
      /\bblur\b/i,
      /\bwhitelist\b/i,
      /\ballowlist\b/i,
      /\bgtd\b/i,
      /\bwl\b/i,
      /\bcollection\b/i,
      /\brarity\b/i,
      /\btraits?\b/i,
      /\breveal\b/i,
      /\bfree mint\b/i,
      /\bmetadata\b/i,
    ],
  },
  {
    name: "Memecoins",
    weight: 1,
    patterns: [
      /\bmemecoins?\b/i,
      /\bmeme coins?\b/i,
      /\bdoge\b/i,
      /\bpepe\b/i,
      /\bbonk\b/i,
      /\bwif\b/i,
      /\bpump\.?fun\b/i,
      /\bpumpfun\b/i,
      /\bshitcoins?\b/i,
      /\bmcap\b/i,
      /\bmarket ?cap\b/i,
      /\bticker\b/i,
      /\bjust a meme\b/i,
    ],
  },
  {
    name: "DeFi",
    weight: 1,
    patterns: [
      /\bdefi\b/i,
      /\byield\b/i,
      /\bliquidity\b/i,
      /\btvl\b/i,
      /\blending\b/i,
      /\baave\b/i,
      /\buniswap\b/i,
      /\bdex\b/i,
      /\bap[ry]\b/i,
      /\bstablecoins?\b/i,
      /\brestake(?:ing)?\b/i,
      /\beigenlayer\b/i,
      /\blido\b/i,
      /\bpendle\b/i,
      /\bperps?\b/i,
      /\bfunding rate\b/i,
    ],
  },
  {
    name: "Alpha/Calls",
    weight: 1,
    patterns: [
      /\balpha\b/i,
      /\bcalls?\b/i,
      /\baped?\b/i,
      /\bentry\b/i,
      /\bnfa\b/i,
      /\bnot financial advice\b/i,
      /\blow ?cap\b/i,
      /\bthesis\b/i,
      /\bdon'?t fade\b/i,
      /\bstill early\b/i,
      /\bthis is the (?:one|call)\b/i,
    ],
  },
  {
    name: "Airdrops",
    weight: 1,
    patterns: [
      /\bairdrops?\b/i,
      /\bsnapshot\b/i,
      /\bpoints program\b/i,
      /\bfarming\b/i,
      /\bsybil\b/i,
      /\bclaim portal\b/i,
      /\btestnet farm\b/i,
      /\bdrop soon\b/i,
      /\beligible\b/i,
    ],
  },
  {
    name: "Gaming",
    weight: 1,
    patterns: [
      /\bgamefi\b/i,
      /\bplay ?2 ?earn\b/i,
      /\bplay to earn\b/i,
      /\bp2e\b/i,
      /\bweb3 games?\b/i,
      /\bonchain games?\b/i,
      /\bquests?\b/i,
      /\bguild\b/i,
    ],
  },
  {
    name: "AI",
    weight: 1,
    patterns: [
      /\bai\b/i,
      /\bllms?\b/i,
      /\bgpt\b/i,
      /\bchatgpt\b/i,
      /\bclaude\b/i,
      /\bagentic\b/i,
      /\bmidjourney\b/i,
      /\bstable diffusion\b/i,
      /\bai agents?\b/i,
      /\bgrok\b/i,
    ],
  },
  {
    name: "Builder/Dev",
    weight: 1,
    patterns: [
      /\bbuilding\b/i,
      /\b(?:just |we )?shipped\b/i,
      /\bdeployed\b/i,
      /\bsolidity\b/i,
      /\brust\b/i,
      /\bgithub\b/i,
      /\bsmart contracts?\b/i,
      /\bmainnet\b/i,
      /\btestnet\b/i,
      /\bdevlog\b/i,
      /\bopen source\b/i,
      /\binfra\b/i,
    ],
  },
  {
    name: "Giveaways",
    weight: 1,
    patterns: [
      /\bgiveaways?\b/i,
      /\braffle\b/i,
      /\brt to enter\b/i,
      /\bdrop your\b/i,
      /\btag (?:friends|3)\b/i,
      /\bfree wl\b/i,
      /\bwl spots?\b/i,
      /\bwinning wallet\b/i,
    ],
  },
  {
    name: "Shitposter",
    weight: 0.5,
    patterns: [
      /\blmao\b/i,
      /\blmfao\b/i,
      /\bngmi\b/i,
      /\bwagmi\b/i,
      /\bratio\b/i,
      /\bcopium\b/i,
      /\bit'?s so over\b/i,
      /\bwe are so back\b/i,
      /\bbased\b/i,
      /\btouch grass\b/i,
      /\bfew understand\b/i,
      /\bprobably nothing\b/i,
    ],
  },
];

const POST_TYPES = [
  { id: "media", label: "Media" },
  { id: "threads", label: "Threads" },
  { id: "links", label: "Links" },
  { id: "short", label: "Short posts" },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function engagement(metrics) {
  const m = metrics || {};
  return (
    (m.like_count || 0) +
    (m.retweet_count || 0) +
    (m.reply_count || 0) +
    (m.quote_count || 0)
  );
}

function classifyNiches(bio, texts) {
  const scores = NICHE_BUCKETS.map((bucket) => {
    let hits = 0;
    const bioHits = bucket.patterns.reduce(
      (n, re) => n + (bio && re.test(bio) ? 1 : 0),
      0
    );
    hits += bioHits * 3;
    for (const text of texts) {
      hits += bucket.patterns.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
    }
    return { name: bucket.name, score: hits * bucket.weight };
  }).sort((a, b) => b.score - a.score);

  const total = scores.reduce((s, x) => s + x.score, 0);
  const top = scores[0] && scores[0].score > 0 ? scores[0] : null;
  const secondary =
    scores[1] && scores[1].score > 0 && scores[1].score >= (top ? top.score * 0.25 : 1)
      ? scores[1]
      : null;

  return {
    top: top ? top.name : "Crypto Twitter",
    secondary: secondary ? secondary.name : null,
    concentration: total > 0 && top ? top.score / total : 0,
    totalHits: total,
  };
}

function postTypeFlags(tweet, authorId, threadIds) {
  const hasMedia = Boolean(
    tweet.attachments &&
      Array.isArray(tweet.attachments.media_keys) &&
      tweet.attachments.media_keys.length
  );
  const urls = (tweet.entities && tweet.entities.urls) || [];
  const hasLink = urls.some((u) => {
    const hay = `${u.expanded_url || ""} ${u.display_url || ""} ${u.url || ""}`.toLowerCase();
    return !/pic\.twitter\.com|twimg\.com|previews?\/media|x\.com\/.+\/status/.test(hay);
  });
  const isSelfReply = tweet.in_reply_to_user_id && tweet.in_reply_to_user_id === authorId;
  const inThread = threadIds.has(tweet.conversation_id) || isSelfReply;
  const isReplyToOther =
    tweet.in_reply_to_user_id && tweet.in_reply_to_user_id !== authorId;
  const text = tweet.text || "";
  const isShort =
    !hasMedia &&
    !hasLink &&
    !inThread &&
    !isReplyToOther &&
    text.replace(/https?:\/\/\S+/g, "").trim().length <= 140;

  return { media: hasMedia, threads: inThread, links: hasLink, short: isShort };
}

function findThreadIds(tweets, authorId) {
  const counts = new Map();
  for (const t of tweets) {
    const id = t.conversation_id || t.id;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  const threadIds = new Set();
  for (const [id, n] of counts) {
    if (n >= 2) threadIds.add(id);
  }
  for (const t of tweets) {
    if (t.in_reply_to_user_id && t.in_reply_to_user_id === authorId && t.conversation_id) {
      threadIds.add(t.conversation_id);
    }
  }
  return threadIds;
}

function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function scoreLabel(score) {
  if (score >= 80) return "Q4 Giga Chad";
  if (score >= 60) return "Q4 Ready";
  if (score >= 45) return "Rising";
  if (score >= 30) return "Warming Up";
  return "Q4 Sleeper";
}

function scoreEngagementRate(pct) {
  if (pct <= 0) return 0;
  return clamp(Math.round(30 * (1 - Math.exp(-pct / 1.4))), 0, 30);
}

function scoreFrequency(postsPerWeek) {
  if (postsPerWeek <= 0) return 0;
  if (postsPerWeek < 5) return Math.round(20 * (postsPerWeek / 5));
  if (postsPerWeek <= 14) return 20;
  if (postsPerWeek <= 21) return 16;
  return 12;
}

function scoreTrend(pct) {
  if (pct == null || Number.isNaN(pct)) return 12;
  return clamp(Math.round(12 + pct * 0.13), 4, 25);
}

function scoreNiche(concentration, totalHits) {
  if (totalHits <= 0) return 4;
  return clamp(Math.round(4 + concentration * 7), 4, 10);
}

function scoreVolume(postCount, hasBestType) {
  let s = 3;
  if (postCount >= 25) s = 10;
  else if (postCount >= 15) s = 8;
  else if (postCount >= 8) s = 6;
  if (hasBestType) s += 5;
  return Math.min(15, s);
}

function formatHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h >= 12 ? "PM" : "AM";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${suffix} UTC`;
}

function buildTips({ er, postsPerWeek, trendPct, niches, bestType, bestHour, typeShare }) {
  const tips = [];

  if (postsPerWeek < 3) {
    tips.push("Post at least 4 times a week so the algo keeps you in the feed.");
  }
  if (trendPct != null && trendPct < -10) {
    const typ = bestType ? bestType.label.toLowerCase() : "best format";
    tips.push(
      `Your last 30 days are down ${Math.abs(Math.round(trendPct))}% — bounce back with more of your best format: ${typ}.`
    );
  }
  if (er < 1) {
    tips.push("Reply under bigger accounts in your niche to lift your engagement rate.");
  }
  if (niches.totalHits === 0 || niches.concentration < 0.4) {
    const lane = niches.top && niches.top !== "Crypto Twitter" ? niches.top : "one lane";
    const extra = niches.secondary ? ` Your posts scatter toward ${niches.secondary} too.` : "";
    tips.push(`Pick a lane and double down on ${lane}.${extra}`);
  }
  if (bestType && typeShare < 0.35) {
    if (bestType.id === "media") {
      tips.push("Posts with media are your winners. Lead with images or clips more often.");
    } else if (bestType.id === "threads") {
      tips.push("Threads are your edge. Ship more of them through Q4.");
    } else if (bestType.id === "links") {
      tips.push("Your link posts punch above the rest. Share more sources, mints, or writes.");
    } else {
      tips.push("Your short, reply-free posts hit hardest. Keep them punchy and post more of them.");
    }
  }
  if (bestHour != null && tips.length < 3) {
    tips.push(`Your best hour is ${formatHour(bestHour)}. Post more in that window.`);
  }
  if (tips.length < 2) {
    tips.push("Open with a sharper first line so more people expand the post.");
  }
  if (tips.length < 2) {
    tips.push("Stay consistent through Q4 — a steady cadence beats one viral week.");
  }

  return tips.slice(0, 3);
}

function buildStrength({ er, trendPct, niches, postsPerWeek, bestType, typeLift }) {
  if (trendPct != null && trendPct >= 20) {
    return `You're heating up — engagement is up ${Math.round(trendPct)}% in the last 30 days.`;
  }
  if (er >= 2) {
    return "Your engagement rate is elite for your follower count.";
  }
  if (bestType && typeLift >= 1.35) {
    return `Your ${bestType.label.toLowerCase()} posts outperform everything else.`;
  }
  if (postsPerWeek >= 4 && postsPerWeek <= 14) {
    return `You show up ${postsPerWeek.toFixed(1).replace(/\.0$/, "")} times a week — consistency is your edge.`;
  }
  if (niches.top !== "Crypto Twitter" && niches.concentration >= 0.45) {
    return `You're known for ${niches.top} and it shows.`;
  }
  if (er >= 1) {
    return "People actually talk under your posts — that engagement will compound in Q4.";
  }
  return "You've got a base to work with — a tighter focus can still make Q4 big.";
}

function analyze(user, tweets) {
  const authorId = String(user.id);
  const followers = (user.public_metrics && user.public_metrics.followers_count) || 0;
  const texts = tweets.map((t) => t.text || "");
  const bio = user.description || "";
  const niches = classifyNiches(bio, texts);
  const threadIds = findThreadIds(tweets, authorId);

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last30 = [];
  const prev30 = [];

  const hours = Array.from({ length: 24 }, () => []);
  const typeBuckets = {
    media: [],
    threads: [],
    links: [],
    short: [],
  };

  const engs = tweets.map((t) => {
    const eng = engagement(t.public_metrics);
    const created = new Date(t.created_at).getTime();
    if (created >= now - 30 * day) last30.push(eng);
    else if (created >= now - 60 * day) prev30.push(eng);

    const hour = new Date(t.created_at).getUTCHours();
    hours[hour].push(eng);

    const flags = postTypeFlags(t, authorId, threadIds);
    for (const key of Object.keys(typeBuckets)) {
      if (flags[key]) typeBuckets[key].push(eng);
    }
    return { tweet: t, eng, created, flags };
  });

  const avgEng = average(engs.map((x) => x.eng));
  const er = followers > 0 ? (avgEng / followers) * 100 : 0;

  const times = engs.map((x) => x.created).sort((a, b) => a - b);
  const spanMs = times.length >= 2 ? Math.max(times[times.length - 1] - times[0], day) : 30 * day;
  const spanWeeks = Math.max(spanMs / (7 * day), 1 / 7);
  const postsPerWeek = tweets.length / spanWeeks;

  let trendPct = null;
  const lastSum = last30.reduce((a, b) => a + b, 0);
  const prevSum = prev30.reduce((a, b) => a + b, 0);
  if (last30.length && prev30.length) {
    const lastAvg = average(last30);
    const prevAvg = average(prev30);
    if (prevAvg > 0) trendPct = ((lastAvg - prevAvg) / prevAvg) * 100;
    else if (lastAvg > 0) trendPct = 100;
    else trendPct = 0;
  } else if (last30.length && !prev30.length && lastSum > 0) {
    trendPct = 100;
  } else if (!last30.length && prev30.length && prevSum > 0) {
    trendPct = -100;
  }

  let bestType = null;
  let bestTypeAvg = -1;
  let typeShare = 0;
  const overallAvg = avgEng || 1;
  for (const type of POST_TYPES) {
    const bucket = typeBuckets[type.id];
    if (bucket.length < 2) continue;
    const avg = average(bucket);
    if (avg > bestTypeAvg) {
      bestTypeAvg = avg;
      bestType = type;
      typeShare = bucket.length / tweets.length;
    }
  }
  const typeLift = bestType ? bestTypeAvg / overallAvg : 0;

  let bestHour = null;
  let bestHourAvg = -1;
  hours.forEach((bucket, hour) => {
    if (bucket.length < 2) return;
    const avg = average(bucket);
    if (avg > bestHourAvg) {
      bestHourAvg = avg;
      bestHour = hour;
    }
  });
  if (bestHour == null) {
    hours.forEach((bucket, hour) => {
      if (!bucket.length) return;
      const avg = average(bucket);
      if (avg > bestHourAvg) {
        bestHourAvg = avg;
        bestHour = hour;
      }
    });
  }

  const parts = {
    er: scoreEngagementRate(er),
    freq: scoreFrequency(postsPerWeek),
    trend: scoreTrend(trendPct),
    niche: scoreNiche(niches.concentration, niches.totalHits),
    volume: scoreVolume(tweets.length, Boolean(bestType)),
  };
  const score = clamp(parts.er + parts.freq + parts.trend + parts.niche + parts.volume, 0, 100);
  const label = scoreLabel(score);

  const tipInput = {
    er,
    postsPerWeek,
    trendPct,
    niches,
    bestType,
    bestHour,
    typeShare,
  };

  let direction = "flat";
  if (trendPct != null && trendPct >= 5) direction = "up";
  else if (trendPct != null && trendPct <= -5) direction = "down";

  const pfp = enlargePfp(user.profile_image_url || "");

  return {
    you: {
      handle: user.username,
      name: user.name || user.username,
      pfp,
      followers,
      bio,
    },
    score,
    label,
    niches: { top: niches.top, secondary: niches.secondary },
    metrics: {
      avgEngagement: round1(avgEng),
      engagementRate: round2(er),
      postsPerWeek: round1(postsPerWeek),
      postCount: tweets.length,
      bestPostType: bestType ? bestType.label : null,
      bestHourUtc: bestHour,
      bestHourLabel: bestHour != null ? formatHour(bestHour) : null,
      trend: {
        direction,
        percent: trendPct == null ? null : Math.round(trendPct),
      },
    },
    strength: buildStrength({
      er,
      trendPct,
      niches,
      postsPerWeek,
      bestType,
      typeLift,
    }),
    tips: buildTips(tipInput),
  };
}

function enlargePfp(url) {
  if (!url) return "";
  return url.replace("_normal.", "_400x400.").replace("_bigger.", "_400x400.");
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function hashString(str) {
  let h = 2166136261;
  for (const c of str) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DEMO_BIOS = [
  "NFT hunter. WL farmer. Probably nothing.",
  "Onchain since forever. Calling mints, missing sleep.",
  "Crypto + culture. Building in public.",
  "Memes, charts, and too much coffee.",
  "DeFi degens welcome. NFA.",
];

const DEMO_TEMPLATES = [
  "New mint looking clean. Floor is still early nfa",
  "WL spots for the next drop, drop your wallet if you're in",
  "This collection has actual lore, few understand",
  "gm CT, shipping a little more every week",
  "We are so back, volume on this chart is screaming",
  "Alpha: the allowlist is still open, don't fade this one",
  "Giveaway later today, rt and follow, 3 wl spots",
  "Just shipped a small update, more coming this week",
  "Airdrop snapshot rumor is getting loud, stay eligible",
  "This jpeg might actually cook, watching the floor",
  "Thread: how I think about mints going into Q4 1/",
  "Probably nothing but the discord is heating up",
  "Reply guy hours, who is actually bullish here",
  "Aped a little, thesis still intact",
  "Building in public, today's commit is live on testnet",
  "Memecoin szn flashbacks, staying in NFTs though",
  "Free mint tonight? Read the contract first",
  "Q4 setup feels good if you stay consistent",
  "Best entry was yesterday, still not too late imo",
  "gn, chart looks calmer than my group chat",
];

function buildDemo(handle) {
  const seed = hashString(handle.toLowerCase());
  const rand = rng(seed);
  const followers = 600 + (seed % 24000);
  const postCount = 18 + (seed % 13);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const name = handle.charAt(0).toUpperCase() + handle.slice(1);
  const bio = DEMO_BIOS[seed % DEMO_BIOS.length];
  const id = String(100000 + (seed % 900000));
  const trendUp = seed % 4 !== 0;
  const erBoost = 0.7 + (seed % 6) * 0.35;

  const tweets = [];
  for (let i = 0; i < postCount; i++) {
    const ageDays = trendUp ? rand() * 50 : 10 + rand() * 50;
    const created = new Date(now - ageDays * day - rand() * 12 * 60 * 60 * 1000);
    const base = (6 + rand() * 28 + (followers / 380) * (0.5 + rand())) * erBoost;
    const boost = ageDays < 30
      ? (trendUp ? 1.2 + rand() * 0.45 : 0.55 + rand() * 0.3)
      : (trendUp ? 0.7 + rand() * 0.3 : 1.15 + rand() * 0.4);
    const likes = Math.round(base * boost);
    const replies = Math.round(likes * (0.08 + rand() * 0.15));
    const retweets = Math.round(likes * (0.05 + rand() * 0.12));
    const quotes = Math.round(likes * (0.02 + rand() * 0.08));
    const impressions = Math.round(followers * (0.2 + rand() * 1.4) + likes * 12);
    const text = DEMO_TEMPLATES[Math.floor(rand() * DEMO_TEMPLATES.length)];
    const isThread = rand() < 0.18;
    const hasMedia = rand() < 0.4;
    const hasLink = !hasMedia && rand() < 0.15;
    const conversationId = isThread ? `conv-${Math.floor(i / 2)}` : `t-${i}`;

    tweets.push({
      id: `demo-${i}`,
      text,
      created_at: created.toISOString(),
      conversation_id: conversationId,
      in_reply_to_user_id: isThread && i % 2 === 1 ? id : undefined,
      public_metrics: {
        like_count: likes,
        reply_count: replies,
        retweet_count: retweets,
        quote_count: quotes,
        impression_count: impressions,
      },
      attachments: hasMedia ? { media_keys: ["m1"] } : undefined,
      entities: hasLink
        ? { urls: [{ expanded_url: "https://example.com/drop", display_url: "example.com/drop" }] }
        : undefined,
    });
  }

  const user = {
    id,
    name,
    username: handle,
    description: bio,
    profile_image_url: "",
    public_metrics: { followers_count: followers },
  };

  const result = analyze(user, tweets);
  result.you.pfp = "";
  return result;
}

module.exports = {
  analyze,
  buildDemo,
  enlargePfp,
  formatHour,
  scoreLabel,
};
