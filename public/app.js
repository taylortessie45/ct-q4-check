"use strict";

const $ = (id) => document.getElementById(id);
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
const MULTI_HINT = "Select all that apply, then continue.";
const SCORE_COLOR = "#ffc46a";

const QUESTIONS = [
  {
    id: "niche",
    text: "What's your main niche?",
    multi: true,
    hint: MULTI_HINT,
    layout: "grid-3",
    options: [
      { value: "NFTs", label: "NFTs" },
      { value: "Memecoins", label: "Memecoins" },
      { value: "DeFi", label: "DeFi" },
      { value: "Alpha/Calls", label: "Alpha/Calls" },
      { value: "Airdrops", label: "Airdrops" },
      { value: "Gaming", label: "Gaming" },
      { value: "AI", label: "AI" },
      { value: "Builder", label: "Builder" },
      { value: "Shitposting", label: "Shitposting" },
    ],
  },
  {
    id: "followers",
    text: "How many followers do you have?",
    input: "count",
    placeholder: "Type a number",
    label: "Follower count",
    max: 500000000,
    emptyError: "Enter a number.",
    invalidError: "Enter a number.",
    negativeError: "Follower count can't be negative.",
  },
  {
    id: "consistency",
    text: "How consistent have you been with your content?",
    options: [
      { value: "daily", label: "Every day", score: 25 },
      { value: "most", label: "Most days", score: 20 },
      { value: "weekly", label: "Few times a week", score: 12 },
      { value: "irregular", label: "On and off", score: 4 },
    ],
  },
  {
    id: "likes",
    text: "Average likes on a post?",
    input: "count",
    placeholder: "Type a number",
    label: "Average likes",
    max: 10000000,
    emptyError: "Enter a number.",
    invalidError: "Enter a number.",
    negativeError: "Average likes can't be negative.",
  },
  {
    id: "trend",
    text: "Last 30 days, how did engagement change?",
    options: [
      { value: "down", label: "Down", score: 4, direction: "down", phrase: "Down vs last 30 days" },
      { value: "flat", label: "About the same", score: 10, direction: "flat", phrase: "About the same vs last 30 days" },
      { value: "up", label: "Up a bit", score: 15, direction: "up", phrase: "Up vs last 30 days" },
      { value: "wayup", label: "Way up", score: 20, direction: "up", phrase: "Way up vs last 30 days" },
    ],
  },
  {
    id: "blocker",
    text: "What's holding you back from reaching your goals?",
    multi: true,
    hint: MULTI_HINT,
    options: [
      { value: "consistency", label: "Consistency", sub: "I start strong, then stop", score: 4 },
      { value: "time", label: "Time", sub: "Busy with work/life", score: 9 },
      { value: "engagement", label: "Low engagement", sub: "Posts don't get seen", score: 8 },
      { value: "plan", label: "No clear plan", sub: "Not sure what to post", score: 5 },
      { value: "network", label: "Network", sub: "Don't know the right people", score: 12 },
      { value: "funds", label: "Funds", sub: "No money to invest/grow", score: 10 },
      { value: "nothing", label: "Nothing", sub: "I'm doing good with what I do", score: 15 },
      { value: "other", label: "Something else", sub: "I'll type it in", score: 8 },
    ],
  },
  {
    id: "opportunities",
    text: "What kind of opportunities are you looking for?",
    multi: true,
    hint: MULTI_HINT,
    options: [
      { value: "collaborations", label: "Collaborations" },
      { value: "partnerships", label: "Partnerships" },
      { value: "career", label: "Career opportunities" },
      { value: "investments", label: "Investments" },
      { value: "networking", label: "Networking" },
      { value: "community", label: "Community building" },
      { value: "other", label: "Something else", sub: "I'll type it in" },
    ],
  },
  {
    id: "mission",
    text: "What are you determined to change before the year ends?",
    multi: true,
    hint: MULTI_HINT,
    options: [
      { value: "daily", label: "Post daily", score: 7 },
      { value: "followers", label: "Hit a follower goal", score: 6 },
      { value: "overtrading", label: "Stop overtrading", score: 7 },
      { value: "ship", label: "Ship my project", score: 8 },
      { value: "connections", label: "Build real connections", score: 6 },
      { value: "brand", label: "Level up my brand", score: 6 },
    ],
  },
];

const state = {
  handle: "",
  index: 0,
  answers: {},
};


function countConfig(q) {
  const question = typeof q === "string" ? QUESTIONS.find((item) => item.id === q) : q;
  return {
    max: (question && question.max) || 500000000,
    emptyError: (question && question.emptyError) || "Enter a number.",
    invalidError: (question && question.invalidError) || "Enter a number.",
    negativeError: (question && question.negativeError) || "That number can't be negative.",
    placeholder: (question && question.placeholder) || "Type a number",
    label: (question && question.label) || (question && question.text) || "Number",
  };
}

function digitsOnly(value) {
  return String(value == null ? "" : value).replace(/\D/g, "");
}

function sanitizeCountInput() {
  const el = $("countInput");
  const start = el.selectionStart;
  const before = el.value;
  const cleaned = digitsOnly(before);
  if (cleaned !== before) {
    const cursor = digitsOnly(before.slice(0, start)).length;
    el.value = cleaned;
    try { el.setSelectionRange(cursor, cursor); } catch (_) {}
  }
  if ($("countErr").classList.contains("show")) showCountError("");
}

function parseCountInput(raw, q) {
  const cfg = countConfig(q);
  const digits = digitsOnly(raw);
  if (!digits) return { ok: false, error: cfg.emptyError };
  const value = Number(digits);
  if (!Number.isFinite(value) || value < 0) return { ok: false, error: cfg.invalidError };
  if (value > cfg.max) return { ok: false, error: "That number looks too high. Check it and try again." };
  return { ok: true, value };
}

function formatCount(count) {
  const n = Math.round(Number(count) || 0);
  if (!Number.isFinite(n) || n < 0) return "n/a";
  if (n < 1000) return String(n);
  const base = n >= 1000000 ? 1000000 : 1000;
  const suffix = n >= 1000000 ? "M" : "K";
  const rounded = Math.round((n / base) * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return text + suffix;
}

function numericAnswer(id, answers = state.answers) {
  const n = Number(answers[id]);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function followerCount(answers = state.answers) {
  return numericAnswer("followers", answers);
}

function likesCount(answers = state.answers) {
  return numericAnswer("likes", answers);
}

function followerReach(count) {
  if (count < 1000) return 2;
  if (count < 5000) return 3;
  if (count < 20000) return 4;
  return 5;
}

function isCountQuestion(q = QUESTIONS[state.index]) {
  return Boolean(q && q.input === "count");
}

function showCountError(msg) {
  const el = $("countErr");
  el.textContent = msg || "";
  el.classList.toggle("show", Boolean(msg));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function cleanText(value) {
  return String(value == null ? "" : value)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter((v) => v != null && v !== "");
  if (value == null || value === "") return [];
  return [value];
}

function selectedValues(id, answers = state.answers) {
  return asArray(answers[id]);
}

function optionByValue(id, value) {
  const q = QUESTIONS.find((item) => item.id === id);
  if (!q) return null;
  return q.options.find((o) => o.value === value) || null;
}

function optionLabel(id, value) {
  const opt = optionByValue(id, value);
  return cleanText(opt ? opt.label : "");
}

function selectedOptions(id, answers = state.answers) {
  return selectedValues(id, answers)
    .map((value) => optionByValue(id, value))
    .filter(Boolean);
}

function selectedLabels(id, answers = state.answers) {
  return selectedOptions(id, answers).map((opt) => cleanText(opt.label)).filter(Boolean);
}

function hasAnswer(id, value, answers = state.answers) {
  return selectedValues(id, answers).includes(value);
}

function firstOption(id, answers = state.answers) {
  return selectedOptions(id, answers)[0] || null;
}

function listPhrase(labels) {
  const clean = (labels || []).map(cleanText).filter(Boolean);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return clean[0] + " and " + clean[1];
  return clean.slice(0, -1).join(", ") + ", and " + clean[clean.length - 1];
}

function averageScore(opts) {
  if (!opts.length) return 0;
  const total = opts.reduce((sum, opt) => sum + (Number(opt.score) || 0), 0);
  return total / opts.length;
}

function scoreLabel(score) {
  if (score >= 80) return "Q4 Giga Chad";
  if (score >= 60) return "Q4 Ready";
  if (score >= 45) return "Rising";
  if (score >= 30) return "Warming Up";
  return "Q4 Sleeper";
}

function engagementScore(followersMid, likesMid) {
  const followers = Number(followersMid) || 0;
  const likes = Number(likesMid) || 0;
  const er = followers > 0 ? (likes / followers) * 100 : 0;
  if (er <= 0) return 0;
  return clamp(Math.round(30 * (1 - Math.exp(-er / 1.4))), 0, 30);
}

function nichePhrase(answers) {
  return listPhrase(selectedLabels("niche", answers)) || "your niche";
}

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickFrom(list, seed, salt) {
  if (!list || !list.length) return "";
  return list[hashSeed(String(seed) + "::" + salt) % list.length];
}

function fillTip(template, vars) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => (
    vars[key] == null ? "" : String(vars[key])
  ));
}

function sanitizeTip(text) {
  return String(text || "")
    .replace(/[—–−‒―]/g, " ")
    .replace(/\s+-\s+/g, " ")
    .replace(/@\w+/g, "")
    .replace(/@/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRate(rate) {
  if (!Number.isFinite(rate) || rate <= 0) return "0";
  if (rate < 1) return String(Math.round(rate * 100) / 100).replace(/0+$/, "").replace(/\.$/, "");
  if (rate < 10) return String(Math.round(rate * 10) / 10).replace(/\.0$/, "");
  return String(Math.round(rate));
}

function rateBand(rate) {
  if (rate < 0.5) return "veryLow";
  if (rate < 1.5) return "low";
  if (rate < 5) return "healthy";
  return "high";
}

function followerTier(count) {
  if (count < 500) return "micro";
  if (count < 2000) return "early";
  if (count < 10000) return "mid";
  if (count < 50000) return "large";
  return "huge";
}

function tipSeed(answers, handle) {
  return [
    handle || "",
    selectedValues("niche", answers).join(","),
    String(followerCount(answers)),
    String(likesCount(answers)),
    selectedValues("consistency", answers)[0] || "",
    selectedValues("trend", answers)[0] || "",
    selectedValues("blocker", answers).join(","),
    answers.blockerOther || "",
    selectedValues("opportunities", answers).join(","),
    answers.opportunitiesOther || "",
    selectedValues("mission", answers).join(","),
  ].join("|");
}

function tipVars(answers, handle) {
  const followers = followerCount(answers);
  const likes = likesCount(answers);
  const rate = followers > 0 ? (likes / followers) * 100 : 0;
  const writeIn = (value) => cleanText(value).replace(/[-—–−‒―]/g, " ").replace(/\s+/g, " ").trim();
  return {
    niches: nichePhrase(answers),
    followers: formatCount(followers),
    likes: formatCount(likes),
    rate: formatRate(rate),
    blockerOther: writeIn(answers.blockerOther) || "that",
    oppOther: writeIn(answers.opportunitiesOther) || "that",
    _followers: followers,
    _likes: likes,
    _rate: rate,
    _band: rateBand(rate),
    _tier: followerTier(followers),
  };
}

const NICHE_TIPS = {
  NFTs: [
    "In NFTs, show the art and the reason you minted, not just a floor price update. Taste is the product.",
    "Jump into collection Spaces after a mint day. People buy from voices they have already heard.",
    "Reply under collection threads in the first 20 minutes with a sharp take, not just gm. That is how NFT accounts get seen.",
    "Pin a short thread on the artists or collections you actually believe in so new visitors get your taste fast.",
  ],
  Memecoins: [
    "In memecoins, speed and clarity win. Post the setup, the invalidation, and a screenshot, then stay in the replies.",
    "Avoid empty hype posts. A calm, early thread with risk laid out is what gets bookmarked in meme rooms.",
    "Be in the main meme coin threads when US hours open. Early, funny, and precise replies travel farther than late calls.",
  ],
  DeFi: [
    "In DeFi, teach one mechanic a week in a thread. People follow the account that makes yields and risks simple.",
    "Post a plain English walkthrough of a protocol you use, including the risk. That is how DeFi accounts earn trust.",
    "Jump into protocol Spaces and ask the question everyone is thinking. Useful curiosity builds a DeFi brand.",
  ],
  "Alpha/Calls": [
    "For alpha and calls, timestamp the idea, add the invalidation, and never hide the miss. Track record is the brand.",
    "Pin a performance thread with wins and losses. Call accounts grow when people can audit you.",
    "Keep calls short and the recap honest. A weekly scorecard post will separate you from noise accounts.",
  ],
  Airdrops: [
    "In airdrops, share the steps and the risk, not just a link dump. A clear checklist thread is the kind of post people bookmark and come back to.",
    "Post a weekly recap of what you farmed and why. Consistent, honest farming notes build an airdrop audience.",
    "Be early in farming chats and Spaces, then publish the playbook the same day while people still need it.",
  ],
  Gaming: [
    "In gaming, clip a highlight, add your take, and post it while the match or mint is still live.",
    "Host a short Space after a patch or drop. Gaming rooms follow accounts that show up in the moment.",
    "A weekly recap of what you played, earned, or missed is stronger than random screenshots.",
  ],
  AI: [
    "In AI, show the workflow, not just the output. A before and after thread of a prompt or agent is the kind of post people bookmark.",
    "Post one practical AI tool or prompt a day that crypto people can use in research or content.",
    "Join AI plus crypto Spaces and demo something live. Builders follow accounts that show work, not slogans.",
  ],
  Builder: [
    "As a builder, ship in public every week and pin the latest demo. CT funds and follows what it can click.",
    "Post a build log: what shipped, what broke, what is next. That rhythm attracts users and other builders.",
    "Drop a short demo clip in the first post, then a thread with how it works. Builders who teach get the DMs.",
  ],
  Shitposting: [
    "Shitposting still needs a recognizable voice. Make the joke tight, post when the timeline is active, and stay in the replies.",
    "Pair the meme with a real opinion so people remember you when the joke fades.",
    "Quote a live CT moment fast. Timing is the skill, and a pinned best of thread shows the range.",
  ],
};

const RATE_TIPS = {
  veryLow: [
    "Your {likes} likes on {followers} followers is a {rate}% rate, which is very low. Spend 30 minutes in reply windows under bigger {niches} accounts right after they post.",
    "A {rate}% like rate on {followers} followers means posts are not landing. Lead with a sharper first line and a visual, then reply while the big {niches} threads are still fresh.",
    "Your {likes} likes at {followers} followers is a {rate}% rate. Jump into live Spaces and reply in the first 15 minutes of bigger posts to get seen.",
    "At a {rate}% like rate on {followers} followers, original posts are not carrying enough. Trade an hour of posting time for focused replies under accounts already moving.",
    "A {rate}% rate with {likes} likes on {followers} followers is a reach problem. Put a clear point in the first line and add a screenshot so the post is easier to stop on.",
    "With only {likes} likes on {followers} followers ({rate}%), start every session in the replies of the largest {niches} accounts posted in the last hour.",
    "Your {rate}% like rate at {followers} followers says the opening is not earning the click. Rewrite the first line last, then post when US timelines are waking up.",
    "At {followers} followers and {likes} likes, a {rate}% rate needs more surface area. Leave 15 specific replies a day in busy {niches} rooms before you publish anything new.",
  ],
  low: [
    "Your {likes} likes on {followers} followers is a {rate}% rate, which is on the low side for CT. Reply under larger {niches} accounts in the first 20 minutes they post.",
    "A {rate}% like rate at {followers} followers can improve fast. Add a visual to every post and stay in the replies of the first hour.",
    "Your {likes} likes on {followers} followers is a {rate}% rate. Try a clearer first line for seven days and note which posts earn the most replies.",
    "A {rate}% rate with {likes} likes on {followers} followers is fixable. Quote a live {niches} topic, add your own take, and stay in that thread for 20 minutes.",
    "At {followers} followers, {likes} likes is a {rate}% rate. Post one short thread this week that teaches a single useful thing, then pin the best result.",
    "Your {rate}% like rate means some posts are being skipped. Cut the preamble, put the point in line one, and add a chart or screenshot.",
    "With {likes} likes on {followers} followers ({rate}%), use the first 30 minutes after posting only to reply. That second wave is how mid size posts get a second look.",
    "A {rate}% rate at {followers} followers often means the topic is fine and the opening is weak. Write three hooks, pick the most specific one, and post at a busy hour.",
    "Your {likes} likes on {followers} followers is a {rate}% rate. Review which of your past posts got replies, then repeat that format for the next week.",
  ],
  healthy: [
    "Your {likes} likes on {followers} followers is a {rate}% rate, which is solid. Keep that format and post it when US timelines are waking up.",
    "A {rate}% like rate at {followers} followers is healthy. Turn your best post of the week into a short thread and pin it.",
    "Your {likes} likes on {followers} followers is a {rate}% rate. You have a working format, so repeat it on the days you usually get reach.",
    "A {rate}% rate at {followers} followers is a good base. Make a weekly series from the format that already works so people know when to look for you.",
  ],
  high: [
    "Your {likes} likes on {followers} followers is a {rate}% rate, which is strong. Turn those winning posts into a pinned thread so new visitors see your best work first.",
    "A {rate}% like rate at {followers} followers is excellent. Package that format into a weekly series so people know when to show up.",
    "Your {likes} likes on {followers} followers is a {rate}% rate, which is strong. Host a Space on the same topic while that attention is still warm.",
    "A {rate}% rate at {followers} followers means the room already trusts the format. Use the next post to invite people into a thread or Space.",
  ],
};

const TIER_TIPS = {
  micro: [
    "At {followers} followers, replies beat original posts for reach. Sit in 3 busy {niches} threads a day and leave a real take.",
    "With {followers} followers, a daily useful reply in {niches} rooms will grow you faster than a quiet original post.",
    "At {followers} followers, the highest leverage move is to be early and useful in {niches} threads, not to shout into an empty timeline.",
  ],
  early: [
    "From {followers} followers, a tight personal brand starts to compound. Make {niches} obvious in your bio and pinned post.",
    "At {followers} followers, one clear point of view plus daily replies will move you through the next stage faster than random posts.",
    "With {followers} followers, publish a weekly {niches} recap so people have a reason to follow.",
  ],
  mid: [
    "At {followers} followers you can start attracting collabs. Publish one useful {niches} breakdown a week and ask one person to hop on a Space.",
    "With {followers} followers, turn your best replies into original posts. That is how mid size {niches} accounts cross 10K.",
    "At {followers} followers people notice consistency. A fixed weekly thread or Space gives them a reason to come back.",
  ],
  large: [
    "With {followers} followers, host a weekly Space or a collab thread. Your replies still move {niches} rooms more than lurkers think.",
    "At {followers} followers, use the reach to lift smaller voices in {niches} and ask for one serious collab a week.",
    "{followers} followers is enough to set the room. Pin a proof of work thread and invite people into a regular Space.",
  ],
  huge: [
    "At {followers} followers, people already watch you. Post less often, make stronger calls, and keep a pinned proof of work.",
    "With {followers} followers, your name carries rooms. Protect the signal and let fewer, better {niches} posts do the work.",
    "At {followers} followers the next leap is curation and Spaces, not more volume.",
  ],
};

const CONSIST_TIPS = {
  irregular: [
    "Your posting is on and off, which resets the algo. Lock a 20 minute slot like a mint time and show up every day for two weeks.",
    "CT forgets quiet accounts fast. Queue one post the night before so a busy day never becomes a missed day.",
    "On and off posting is the main leak. Write 5 short {niches} posts on Sunday and schedule them through the week.",
  ],
  weekly: [
    "A few times a week is not enough for the algo to remember you. Bump to most days, even if the post is short.",
    "Weekly posting leaves too many quiet days. Add a daily reply block in {niches} threads even when you do not have a full post.",
    "Move from a few posts a week to most days for this Q4 sprint and reassess after 30 days.",
  ],
  most: [
    "You already post most days. Protect that streak and spend the extra time writing a stronger first line.",
    "Most days is a good base. Keep it through Q4, then raise the quality of each {niches} post rather than adding volume.",
    "You are almost daily. Queue tomorrow's post tonight so a busy day cannot break the streak.",
  ],
  daily: [
    "You already post daily, so quality is the lever now. Cut filler and make every hook worth a follow.",
    "Daily posting is done. Use the extra discipline on replies and a weekly {niches} thread that can be pinned.",
    "You already show up every day. Cut filler posts and spend the extra care on stronger takes and cleaner visuals.",
  ],
};

const TREND_TIPS = {
  down: [
    "Engagement is down versus last month. Bounce back with tighter hooks, a visual on every post, and faster replies under bigger accounts.",
    "The last 30 days slipped. Audit which {niches} posts died, then reuse only the hook styles that still got replies.",
    "Engagement is down versus last month. Spend a week in reply windows and Spaces before you judge the next format.",
  ],
  flat: [
    "Engagement is flat versus last month. Change the hook style for a week and track which posts break the pattern.",
    "A flat 30 days is a signal to test, not to disappear. Try a thread, a visual, and a Space, then keep the winner.",
  ],
  up: [
    "Engagement is up versus last month. Double down on the formats that caused the lift and pin the best one.",
    "The last 30 days are up. Ride that with a follow up thread and a Space this week while people are already watching.",
  ],
  wayup: [
    "Engagement is way up versus last month. Ride that wave with a thread and a Space this week while the room is still warm.",
    "Engagement is way up versus last month. Package the winning format into a weekly series before the lift fades.",
  ],
};

const BLOCKER_TIPS = {
  consistency: null,
  time: [
    "Time is tight, so batch two days of {niches} posts on Sunday and schedule them. Busy mornings will not kill the streak.",
    "When work gets heavy, keep a note of 5 reply ideas so you can still show up in {niches} threads in ten minutes.",
    "Protect a 20 minute evening slot. That is enough to post once and reply in the rooms that matter.",
  ],
  engagement: [
    "Posts are not getting seen. Reply under bigger {niches} accounts in the first 20 minutes and lead with a sharper first line.",
    "Low visibility is usually a hook problem. Write the first line last, add a visual, and stay in the replies.",
    "If posts feel invisible, spend the first 30 minutes of your session only on high traffic {niches} threads.",
  ],
  plan: [
    "You do not have a clear plan. Write one Q4 goal, one weekly {niches} action, and one number you track on a pinned note.",
    "Pick a simple Q4 plan: one audience, one format, one metric. Post that plan, then report it every Friday.",
    "A one page plan beats random posting. Choose the {niches} topic you can talk about for 90 days and stick to it.",
  ],
  network: [
    "You need the right people. Start 3 genuine convos a day with active {niches} accounts and offer a useful reply before any ask.",
    "Network by being useful first. Leave a specific comment on 5 {niches} posts a day, then send one short DM that references it.",
    "The right people are already posting. Be early in their threads and Spaces for two weeks before you pitch anything.",
  ],
  funds: [
    "You do not need a budget to grow on CT. Trade time for leverage with collabs, proof of work, and consistent replies.",
    "Skip paid growth for now. A public {niches} build log and three genuine collabs will do more than ads at this stage.",
    "Capital is tight, so make the work visible. Proof in a pinned thread attracts the people who can fund or hire you.",
  ],
  other: [
    "You said {blockerOther} is holding you back. Pick one weekly public action that chips away at it and post the progress.",
    "You named {blockerOther} as the blocker. Turn it into a 30 day challenge and share the recap each Friday.",
    "Treat {blockerOther} like a project. Break it into one visible step a week so the timeline can hold you to it.",
  ],
  nothing: [
    "You are locked in. Scale what already works and spend more time in bigger {niches} rooms and Spaces.",
    "Nothing is blocking you, so raise the ceiling. Pitch one collab and host one Space this month.",
    "Since you are already doing well, use this Q4 to go bigger: a weekly Space, a pinned proof thread, and one serious collab.",
  ],
};

const MISSION_TIPS = {
  daily: [
    "For the daily posting mission, write tomorrow's post tonight and keep a 7 draft buffer so the streak is already won.",
    "To post daily, use a simple rotation: one take, one reply dump, one visual. That mix is easier to sustain than a long thread every day.",
    "The daily mission is won the night before. Queue the post, then spend the morning in {niches} replies.",
  ],
  followers: [
    "To hit a follower goal from {followers} followers, pair one post a day with 20 thoughtful replies under larger {niches} accounts.",
    "Follower growth at {followers} is mostly reply windows and a clear pinned post. Do both every day for 30 days.",
    "To grow past {followers} followers, be early in 3 {niches} threads each morning and pin your strongest proof of work.",
  ],
  overtrading: [
    "To stop overtrading, write the thesis in a post before you size in, and review the trade in public, not just the entry.",
    "Make a rule you can post: no size without a written invalidation. The timeline can help you keep it.",
    "Slow the triggers. A same day recap thread after each trade will expose leftovers and build trust.",
  ],
  ship: [
    "To ship your project, drop something small and public every week, even if it is ugly, and pin the latest demo.",
    "Shipping means a date. Announce the next demo on Monday, post the update on Friday, and keep that cadence for Q4.",
    "Pin a build log and update it weekly. CT backs builders it can click, not roadmaps it can only read.",
  ],
  connections: [
    "To build real connections, give value in replies and DMs first. Opportunities on CT follow the people who show up.",
    "Pick 10 {niches} accounts and be useful in their threads for two weeks. Then send a short, specific DM, not a pitch deck.",
    "Real connections come from repeated presence. A weekly Space plus honest replies will do more than mass DMs.",
  ],
  brand: [
    "To level up the brand, make {niches} obvious in your bio, pinned post, and every hook for the next 30 days.",
    "Brand is repetition. Use the same promise in your bio, your header, and the first line of your posts until it sticks.",
    "Treat the profile as a landing page. A stranger should know your {niches} lane in three seconds.",
  ],
};

const OPP_TIPS = {
  collaborations: [
    "For collabs, DM two {niches} accounts this week with a specific idea, not a blank let's work. Mention a post you actually liked.",
    "Collabs start in public. Quote or reply with real value, then suggest a joint thread or Space once they have seen you.",
    "Write a one sentence collab offer and send it to 3 people whose {niches} work you already respect.",
  ],
  partnerships: [
    "For partnerships, pin a one page proof of work thread so a busy founder can judge you in 30 seconds.",
    "Partnerships come faster when your profile looks ready. Clear bio, pinned results, and a way to contact you in the first line of the bio.",
    "Post a short note on what you can help with, then pin it. That is the partnership landing page.",
  ],
  career: [
    "For career opportunities, pin a thread of your best {niches} work and put a clear open to work line in your bio.",
    "Career leads on CT come from visible proof. Post a weekly recap of what you shipped and who can message you.",
    "A pinned portfolio thread plus a clear note in your bio that you are open to work does the asking for you.",
  ],
  investments: [
    "For investments, publish the thesis before the call. A clear writeup in a thread is how serious people find you.",
    "If you want investment conversations, show process: thesis, risk, recap. One honest thread a week beats a dozen vague calls.",
    "Put your best thesis in a pinned thread. Capital on CT follows a trail of public thinking.",
  ],
  networking: [
    "For networking, be early in {niches} Spaces, say one useful thing, and follow up with a short DM the same day.",
    "Network in public first. Five specific replies a day in {niches} rooms will open more DMs than a cold outreach blast.",
    "Pick one recurring Space and become a regular. Familiar voices get the intros.",
  ],
  community: [
    "For community building, start a weekly {niches} thread or Space at a fixed time so people know when to show up.",
    "A community needs a ritual. Same day, same format, same promise. Invite people in the replies to come back next week.",
    "Name the gathering and run it for 4 weeks before you judge it. Consistency is what turns lurkers into regulars.",
  ],
  other: [
    "You said you are open to {oppOther}. Add that to your bio and mention it at the end of your next thread so the right people can reply.",
    "You are looking for {oppOther}. Say it in your pinned post and in one Space intro this week.",
    "Make {oppOther} easy to see. One line in the bio and one line at the end of your best posts is enough to start the DMs.",
  ],
};

function buildTips(answers, handle) {
  const seed = tipSeed(answers, handle);
  const vars = tipVars(answers, handle);
  const pool = [];
  const usedIds = new Set();

  function add(id, cat, priority, variants) {
    if (!variants || !variants.length || usedIds.has(id)) return;
    const text = sanitizeTip(fillTip(pickFrom(variants, seed, id), vars));
    if (!text || text.includes("@") || (handle && text.includes(handle))) return;
    usedIds.add(id);
    pool.push({ id, cat, priority, text });
  }

  if (vars._followers > 0) {
    if (vars._band === "veryLow" || vars._band === "low") {
      add("rate", "rate", 10, RATE_TIPS[vars._band]);
    } else {
      add("rate", "rate", 52, RATE_TIPS[vars._band]);
    }
    add("followers", "followers", vars._tier === "micro" || vars._tier === "early" ? 18 : 44, TIER_TIPS[vars._tier]);
  }

  const consistency = selectedValues("consistency", answers)[0];
  if (consistency === "irregular" || hasAnswer("blocker", "consistency", answers)) {
    add("consist", "consist", 11, CONSIST_TIPS.irregular);
  } else if (consistency && CONSIST_TIPS[consistency]) {
    add("consist", "consist", consistency === "weekly" ? 22 : 46, CONSIST_TIPS[consistency]);
  }

  const trend = selectedValues("trend", answers)[0];
  if (trend === "down") add("trend", "trend", 13, TREND_TIPS.down);
  else if (trend === "flat") add("trend", "trend", 36, TREND_TIPS.flat);
  else if (trend && TREND_TIPS[trend]) add("trend", "trend", 48, TREND_TIPS[trend]);

  const blockers = selectedValues("blocker", answers);
  if (hasAnswer("blocker", "nothing", answers)) {
    add("locked", "locked", 28, BLOCKER_TIPS.nothing);
  } else {
    const ranked = blockers
      .filter((value) => value !== "consistency")
      .slice()
      .sort((a, b) => {
        const sa = (optionByValue("blocker", a) && optionByValue("blocker", a).score) || 99;
        const sb = (optionByValue("blocker", b) && optionByValue("blocker", b).score) || 99;
        return sa - sb;
      });
    ranked.forEach((value, i) => {
      if (BLOCKER_TIPS[value]) add("blocker:" + value, "blocker", 15 + i, BLOCKER_TIPS[value]);
    });
  }

  selectedValues("mission", answers).forEach((value, i) => {
    if (MISSION_TIPS[value]) add("mission:" + value, "mission", 30 + i, MISSION_TIPS[value]);
  });

  selectedValues("opportunities", answers).forEach((value, i) => {
    if (OPP_TIPS[value]) add("opp:" + value, "opp", 40 + i, OPP_TIPS[value]);
  });

  const niches = selectedValues("niche", answers);
  if (niches.length) {
    const chosen = niches[hashSeed(seed + "::nichepick") % niches.length];
    if (NICHE_TIPS[chosen]) add("niche:" + chosen, "niche", 42, NICHE_TIPS[chosen]);
  }

  pool.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  const out = [];
  const usedCat = new Set();

  function take(match) {
    const index = pool.findIndex((item) => !usedCat.has(item.cat) && match(item));
    if (index < 0) return;
    const item = pool.splice(index, 1)[0];
    usedCat.add(item.cat);
    out.push(item);
  }

  take((item) => item.priority <= 25);
  take((item) => item.cat === "mission");
  if (hashSeed(seed + "::lane") % 2 === 0) {
    take((item) => item.cat === "opp");
    take((item) => item.cat === "niche");
  } else {
    take((item) => item.cat === "niche");
    take((item) => item.cat === "opp");
  }
  while (out.length < 4 && pool.length) take(() => true);

  const texts = [];
  const seen = new Set();
  out.forEach((item) => {
    const key = item.text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    texts.push(item.text);
  });

  const four = texts.slice(0, 4);
  const tooLong = four.length > 3 && (four.some((t) => t.length > 160) || four.reduce((n, t) => n + t.length, 0) > 420);
  return (tooLong ? four.slice(0, 3) : four).map(sanitizeTip);
}


function opportunityDisplay(answers) {
  return selectedValues("opportunities", answers)
    .map((value) => {
      if (value === "other") return cleanText(answers.opportunitiesOther || "Something else");
      return optionLabel("opportunities", value);
    })
    .filter(Boolean);
}

function blockerDisplay(answers) {
  if (hasAnswer("blocker", "nothing", answers)) return ["Nothing, locked in"];
  return selectedValues("blocker", answers)
    .map((value) => {
      if (value === "other") return cleanText(answers.blockerOther || "Something else");
      return optionLabel("blocker", value);
    })
    .filter(Boolean);
}

function scoreAnswers(answers, handle) {
  const followers = followerCount(answers);
  const likes = likesCount(answers);
  const consistency = firstOption("consistency", answers);
  const trend = firstOption("trend", answers);
  const blockerOpts = selectedOptions("blocker", answers);
  const missionOpts = selectedOptions("mission", answers);
  const nothing = hasAnswer("blocker", "nothing", answers);

  let blockerPts = averageScore(blockerOpts);
  if (nothing) blockerPts = 20;

  const raw =
    (consistency && consistency.score ? consistency.score : 0) +
    engagementScore(followers, likes) +
    (trend && trend.score ? trend.score : 0) +
    blockerPts +
    averageScore(missionOpts) +
    followerReach(followers);

  let score = clamp(Math.round(Number(raw) || 0), 0, 100);
  if (!Number.isFinite(score)) score = 0;

  return {
    score,
    label: scoreLabel(score),
    niches: selectedLabels("niche", answers),
    followers: formatCount(followers),
    likes: formatCount(likes),
    blockers: blockerDisplay(answers),
    opportunities: opportunityDisplay(answers),
    missions: selectedLabels("mission", answers),
    trend: trend || null,
    tips: buildTips(answers, handle || state.handle),
  };
}

function normalizeHandle(input) {
  if (typeof input !== "string") return null;
  const handle = input.trim().replace(/^@+/, "");
  if (!HANDLE_RE.test(handle)) return null;
  return handle;
}

function showHomeError(msg) {
  const el = $("homeErr");
  el.textContent = msg || "";
  el.classList.toggle("show", Boolean(msg));
}

function setView(view) {
  $("home").classList.toggle("hidden", view !== "home");
  $("quiz").classList.toggle("hidden", view !== "quiz");
  $("result").classList.toggle("hidden", view !== "result");
  $("card").classList.toggle("showing-quiz", view === "quiz");
  $("card").classList.toggle("showing-result", view === "result");
}

function showHome() {
  setView("home");
  showHomeError("");
}

function startQuiz() {
  const handle = normalizeHandle($("handle").value);
  showHomeError("");
  if (!handle) {
    showHomeError("Enter a valid X username (1–15 letters, numbers, or underscores).");
    return;
  }
  state.handle = handle;
  state.index = 0;
  state.answers = {};
  $("handle").value = handle;
  $("otherInput").value = "";
  $("countInput").value = "";
  showCountError("");
  setView("quiz");
  renderQuestion();
}

function writeInKey(q) {
  return q.id + "Other";
}

function isOtherOpen(q = QUESTIONS[state.index]) {
  if (!q || !q.options || !q.options.some((opt) => opt.value === "other")) return false;
  if (q.id === "blocker" && hasAnswer("blocker", "nothing")) return false;
  return hasAnswer(q.id, "other");
}

function syncOtherInput(q) {
  const input = $("otherInput");
  input.placeholder = q && q.id === "opportunities" ? "What are you looking for?" : "What's getting in the way?";
  const saved = (q && state.answers[writeInKey(q)]) || "";
  if (input.value !== saved) input.value = saved;
}

function updateContinue() {
  const q = QUESTIONS[state.index];
  const btn = $("continueBtn");
  const wrap = $("otherWrap");
  const countWrap = $("countWrap");
  if (isCountQuestion(q)) {
    wrap.classList.add("hidden");
    countWrap.classList.remove("hidden");
    btn.classList.remove("hidden");
    btn.disabled = false;
    return;
  }
  countWrap.classList.add("hidden");
  if (!q.multi) {
    wrap.classList.add("hidden");
    btn.classList.add("hidden");
    return;
  }

  btn.classList.remove("hidden");
  if (isOtherOpen(q)) {
    wrap.classList.remove("hidden");
    syncOtherInput(q);
    btn.disabled = selectedValues(q.id).length === 0 || !$("otherInput").value.trim();
  } else {
    wrap.classList.add("hidden");
    btn.disabled = selectedValues(q.id).length === 0;
  }
}

function advance() {
  if (state.index < QUESTIONS.length - 1) {
    state.index += 1;
    renderQuestion();
  } else {
    showResult();
  }
}

function renderQuestion() {
  const q = QUESTIONS[state.index];
  const total = QUESTIONS.length;
  $("stepLabel").textContent = `${state.index + 1} of ${total}`;
  $("barFill").style.width = `${((state.index + 1) / total) * 100}%`;
  $("question").textContent = q.text;
  $("backBtn").disabled = state.index === 0;

  const hint = $("quizHint");
  if (q.hint) {
    hint.textContent = q.hint;
    hint.classList.remove("hidden");
  } else {
    hint.textContent = "";
    hint.classList.add("hidden");
  }

  updateContinue();

  const root = $("options");
  if (isCountQuestion(q)) {
    root.className = "options hidden";
    root.innerHTML = "";
    showCountError("");
    const cfg = countConfig(q);
    const input = $("countInput");
    input.placeholder = cfg.placeholder;
    input.setAttribute("aria-label", cfg.label);
    const raw = state.answers[q.id + "Raw"];
    if (raw != null && raw !== "") input.value = raw;
    else if (Number.isFinite(state.answers[q.id])) input.value = String(state.answers[q.id]);
    else input.value = "";
    window.requestAnimationFrame(() => input.focus());
    return;
  }

  root.className = "options" + (q.layout === "grid-3" ? " grid-3" : "");
  if (q.options && q.options.some((opt) => opt.sub)) root.classList.add("has-subs");
  root.innerHTML = "";
  const picked = new Set(selectedValues(q.id));
  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option" + (opt.sub ? " has-sub" : "");
    if (picked.has(opt.value)) btn.classList.add("picked");
    const title = document.createElement("span");
    title.className = "option-title";
    title.textContent = opt.label;
    btn.appendChild(title);
    if (opt.sub) {
      const sub = document.createElement("span");
      sub.className = "option-sub";
      sub.textContent = opt.sub;
      btn.appendChild(sub);
    }
    btn.addEventListener("click", () => pickOption(q, opt.value, btn));
    root.appendChild(btn);
  });
}

function setPicked(value, selected) {
  $("options").querySelectorAll(".option").forEach((el) => {
    const title = el.querySelector(".option-title");
    const label = title ? title.textContent : el.textContent;
    const opt = QUESTIONS[state.index].options.find((o) => o.label === label);
    if (opt && opt.value === value) el.classList.toggle("picked", selected);
  });
}

function pickOption(q, value, btn) {
  if (!q.multi) {
    state.answers[q.id] = value;
    $("options").querySelectorAll(".option").forEach((el) => el.classList.remove("picked"));
    btn.classList.add("picked");
    window.setTimeout(advance, 140);
    return;
  }

  let current = new Set(selectedValues(q.id));
  if (q.id === "blocker" && value === "nothing") {
    current = current.has("nothing") ? new Set() : new Set(["nothing"]);
    delete state.answers.blockerOther;
    $("otherInput").value = "";
  } else {
    if (q.id === "blocker") current.delete("nothing");
    if (current.has(value)) current.delete(value);
    else current.add(value);
    if (value !== "other" && !current.has("other")) {
      delete state.answers[writeInKey(q)];
    }
  }
  state.answers[q.id] = q.options.map((o) => o.value).filter((v) => current.has(v));
  $("options").querySelectorAll(".option").forEach((el) => el.classList.remove("picked"));
  current.forEach((v) => setPicked(v, true));
  updateContinue();
  if (value === "other" && current.has("other")) $("otherInput").focus();
}

function continueQuiz() {
  const q = QUESTIONS[state.index];
  if (isCountQuestion(q)) {
    const raw = $("countInput").value;
    const parsed = parseCountInput(raw, q);
    if (!parsed.ok) {
      showCountError(parsed.error);
      $("countInput").focus();
      return;
    }
    showCountError("");
    state.answers[q.id] = parsed.value;
    state.answers[q.id + "Raw"] = String(raw).trim();
    advance();
    return;
  }
  if (!q.multi || selectedValues(q.id).length === 0) return;
  if (isOtherOpen(q)) {
    const text = $("otherInput").value.trim().slice(0, 40);
    if (!text) return;
    state.answers[writeInKey(q)] = text;
  }
  advance();
}

function goBack() {
  if (state.index === 0) {
    showHome();
    return;
  }
  state.index -= 1;
  renderQuestion();
}

function avatarUrl(handle) {
  return `/api/avatar?handle=${encodeURIComponent(handle)}`;
}

function setPfp(handle) {
  const img = $("pfp");
  const wrap = img.parentElement;
  wrap.querySelectorAll(".pfp-fallback").forEach((n) => n.remove());
  img.classList.remove("hidden");
  img.alt = `@${handle} profile picture`;
  img.onload = () => img.classList.remove("hidden");
  img.onerror = () => {
    img.classList.add("hidden");
    if (!wrap.querySelector(".pfp-fallback")) {
      const fallback = document.createElement("div");
      fallback.className = "pfp-fallback";
      fallback.textContent = (handle || "?").charAt(0).toUpperCase();
      wrap.appendChild(fallback);
    }
  };
  img.src = avatarUrl(handle);
}

function renderChips(root, items, accentFirst) {
  root.innerHTML = "";
  (items || []).map(cleanText).filter(Boolean).forEach((name, i) => {
    const chip = document.createElement("span");
    chip.className = "chip" + (accentFirst && i === 0 ? " accent" : "");
    chip.textContent = name;
    root.appendChild(chip);
  });
}

function renderTips(tips) {
  const ul = $("tips");
  ul.innerHTML = "";
  (tips || []).forEach((tip) => {
    const li = document.createElement("li");
    const bullet = document.createElement("span");
    bullet.className = "bullet";
    bullet.textContent = "• ";
    li.appendChild(bullet);
    li.appendChild(document.createTextNode(sanitizeTip(tip)));
    ul.appendChild(li);
  });
}

function renderStats(data) {
  $("stats").innerHTML =
    `<div class="stat"><b></b><span>Followers</span></div>` +
    `<div class="stat"><b></b><span>Avg likes</span></div>`;
  const blocks = $("stats").querySelectorAll("b");
  blocks[0].textContent = data.followers;
  blocks[1].textContent = data.likes;
}

function renderProgress(trend) {
  const el = $("progress");
  el.className = "progress";
  if (!trend) {
    el.textContent = "";
    return;
  }
  el.classList.add(trend.direction || "flat");
  const arrow = trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→";
  const arrowEl = document.createElement("span");
  arrowEl.className = "arrow";
  arrowEl.textContent = arrow;
  const phraseEl = document.createElement("span");
  phraseEl.className = "pct";
  phraseEl.textContent = trend.phrase || "";
  el.innerHTML = "";
  el.appendChild(arrowEl);
  el.appendChild(phraseEl);
}

function shareText(data) {
  const mission = listPhrase(data.missions) || "Q4";
  return `My 2026 Q4 Growth Card: ${data.score} (${data.label}) 🚀 Q4 mission: ${mission}. Get yours 👉 ${window.location.origin}`;
}

function paintScore(el, score) {
  const num = Number(score);
  const value = Number.isFinite(num) ? String(Math.round(num)) : "0";
  el.textContent = value;
  el.style.color = SCORE_COLOR;
  el.style.background = "none";
  el.style.webkitBackgroundClip = "border-box";
  el.style.backgroundClip = "border-box";
  el.style.webkitTextFillColor = SCORE_COLOR;
}

function showResult() {
  const data = scoreAnswers(state.answers);
  const handle = state.handle;
  setView("result");
  setPfp(handle);
  $("youHandle").textContent = `@${handle}`;
  paintScore($("score"), data.score);
  $("label").textContent = data.label;
  renderChips($("nicheChips"), data.niches, true);
  renderStats(data);
  renderProgress(data.trend);
  renderChips($("blockerChips"), data.blockers, false);
  renderChips($("openChips"), data.opportunities, false);
  renderChips($("missionChips"), data.missions, false);
  renderTips(data.tips);
  $("cardUrl").textContent = window.location.host || "ctq4check";
  $("shareBtn").href =
    "https://x.com/intent/post?text=" + encodeURIComponent(shareText(data));
  $("downloadBtn").dataset.handle = handle;
}

function resetAll() {
  state.handle = "";
  state.index = 0;
  state.answers = {};
  $("handle").value = "";
  $("otherInput").value = "";
  $("countInput").value = "";
  showCountError("");
  showHome();
  $("handle").focus();
}

function waitForImages(root) {
  const images = [...root.querySelectorAll("img")];
  return Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 2000);
      });
    })
  );
}

function fitCanvas(source, width, height, fill) {
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  const scale = Math.min(width / source.width, height / source.height);
  const w = source.width * scale;
  const h = source.height * scale;
  const x = (width - w) / 2;
  const y = (height - h) / 2;
  ctx.drawImage(source, x, y, w, h);
  return out;
}

async function downloadCard() {
  const btn = $("downloadBtn");
  if (typeof html2canvas !== "function") {
    alert("Couldn't load the image tool. Try again.");
    return;
  }
  btn.disabled = true;
  const prev = btn.textContent;
  btn.textContent = "Saving…";
  const mount = $("exportMount");
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    mount.innerHTML = "";
    const poster = document.createElement("div");
    poster.className = "export-poster";
    const clone = $("shareCard").cloneNode(true);
    clone.id = "shareCardExport";
    clone.classList.add("export-card");
    const cloneScore = clone.querySelector(".score");
    if (cloneScore) paintScore(cloneScore, $("score").textContent);
    poster.appendChild(clone);
    mount.appendChild(poster);
    await waitForImages(clone);
    await new Promise((r) => setTimeout(r, 50));

    const captured = await html2canvas(poster, {
      backgroundColor: "#07080d",
      scale: 2,
      windowWidth: 540,
      useCORS: true,
      logging: false,
      onclone: (doc) => {
        const score = doc.querySelector("#shareCardExport .score") || doc.querySelector(".score");
        if (score) paintScore(score, $("score").textContent);
      },
    });
    const out = fitCanvas(captured, 1080, 1350, "#07080d");
    const link = document.createElement("a");
    const handle = btn.dataset.handle || "result";
    link.download = `q4-growth-card-@${handle}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
  } catch (err) {
    console.error(err);
    alert("Couldn't build the card image. Try a screenshot instead.");
  } finally {
    mount.innerHTML = "";
    btn.disabled = false;
    btn.textContent = prev;
  }
}

$("startBtn").addEventListener("click", startQuiz);
$("handle").addEventListener("keydown", (e) => {
  if (e.key === "Enter") startQuiz();
});
$("backBtn").addEventListener("click", goBack);
$("continueBtn").addEventListener("click", continueQuiz);
$("otherInput").addEventListener("input", () => {
  const q = QUESTIONS[state.index];
  if (q && q.options && q.options.some((opt) => opt.value === "other")) {
    state.answers[writeInKey(q)] = $("otherInput").value.slice(0, 40);
  }
  updateContinue();
});
$("otherInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    continueQuiz();
  }
});
$("countInput").addEventListener("input", sanitizeCountInput);
$("countInput").addEventListener("paste", () => {
  window.requestAnimationFrame(sanitizeCountInput);
});
$("countInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    continueQuiz();
  }
});
$("againBtn").addEventListener("click", resetAll);
$("homeLink").addEventListener("click", resetAll);
$("downloadBtn").addEventListener("click", downloadCard);

window.__ctq4 = { buildTips, scoreAnswers, formatCount, opportunityDisplay, hashSeed };
