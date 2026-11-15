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
    hint: "Type the exact number, like 16.2k or 17,000.",
    placeholder: "e.g. 16.2k or 17,000",
    label: "Follower count",
    max: 500000000,
    emptyError: "Enter how many followers you have.",
    invalidError: "Use a number like 850, 16.2k, or 17,000.",
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
    hint: "Type the exact number, like 85 or 1.2k.",
    placeholder: "e.g. 85 or 1.2k",
    label: "Average likes",
    max: 10000000,
    emptyError: "Enter your average likes on a post.",
    invalidError: "Use a number like 85, 1.2k, or 1,200.",
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
    invalidError: (question && question.invalidError) || "Use a number like 85, 1.2k, or 1,200.",
    negativeError: (question && question.negativeError) || "That number can't be negative.",
    placeholder: (question && question.placeholder) || "e.g. 85 or 1.2k",
    label: (question && question.label) || (question && question.text) || "Number",
  };
}

function parseCountInput(raw, q) {
  const cfg = countConfig(q);
  if (raw == null) return { ok: false, error: cfg.emptyError };
  const original = String(raw).trim();
  if (!original) return { ok: false, error: cfg.emptyError };

  const compact = original.replace(/,/g, "").replace(/\s+/g, "");
  if (/^-/.test(compact)) return { ok: false, error: cfg.negativeError };

  const match = compact.match(/^(\d+(?:\.\d+)?)([kKmM])?$/);
  if (!match) return { ok: false, error: cfg.invalidError };

  let amount = Number(match[1]);
  if (!Number.isFinite(amount)) return { ok: false, error: cfg.invalidError };

  const suffix = (match[2] || "").toLowerCase();
  if (!suffix && /\./.test(match[1])) {
    return { ok: false, error: "Use a whole number, or add k or m (like 1.2k)." };
  }
  if (suffix === "k") amount *= 1000;
  if (suffix === "m") amount *= 1000000;

  const value = Math.round(amount);
  if (value < 0) return { ok: false, error: cfg.negativeError };
  if (value > cfg.max) return { ok: false, error: "That number looks too high. Check it and try again." };
  return { ok: true, value };
}

function formatCount(count) {
  const n = Math.round(Number(count) || 0);
  if (!Number.isFinite(n) || n < 0) return "—";
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

function buildTips(answers) {
  const tips = [];
  const niche = nichePhrase(answers);
  const erScore = engagementScore(followerCount(answers), likesCount(answers));
  const nothing = hasAnswer("blocker", "nothing", answers);

  if (nothing) {
    tips.push("You're locked in — scale what already works and spend more time in bigger " + niche + " rooms.");
  } else if (hasAnswer("blocker", "consistency", answers) || hasAnswer("consistency", "irregular", answers)) {
    tips.push("Lock a 20-minute daily slot like a mint time — one post beats a burst and a silence.");
  } else if (hasAnswer("blocker", "time", answers)) {
    tips.push("Batch content twice a week so busy days don't kill your streak.");
  } else if (hasAnswer("blocker", "engagement", answers)) {
    tips.push("Reply under bigger accounts in " + niche + " and lead with a sharper first line.");
  } else if (hasAnswer("blocker", "plan", answers)) {
    tips.push("Write a one-page Q4 plan: one goal, one weekly action, one number you track.");
  } else if (hasAnswer("blocker", "network", answers)) {
    tips.push("Start 3 genuine convos a day with people already in " + niche + ".");
  } else if (hasAnswer("blocker", "funds", answers)) {
    tips.push("Trade time for leverage — collabs and proof of work beat waiting on capital.");
  } else if (hasAnswer("blocker", "other", answers)) {
    tips.push("Write the blocker down, then pick one weekly action that chips away at it.");
  }

  if (hasAnswer("trend", "down", answers) && tips.length < 3) {
    tips.push("Engagement slipped last month — bounce back with tighter hooks and more visuals.");
  }
  if (erScore < 14 && !hasAnswer("blocker", "engagement", answers) && tips.length < 3) {
    tips.push("Reply under bigger accounts in " + niche + " to lift likes relative to your following.");
  }
  if (hasAnswer("consistency", "weekly", answers) && tips.length < 3) {
    tips.push("Bump to most days so the algo and your audience both remember you.");
  } else if (hasAnswer("consistency", "daily", answers) && tips.length < 3) {
    tips.push("You're already showing up. Raise the quality now — fewer filler posts, stronger takes.");
  } else if (hasAnswer("consistency", "most", answers) && tips.length < 3) {
    tips.push("Protect the streak through Q4, then raise the quality of each post.");
  }

  if (tips.length < 3 && hasAnswer("mission", "daily", answers)) {
    tips.push("Queue tomorrow's post tonight so the daily streak is already won.");
  } else if (tips.length < 3 && hasAnswer("mission", "followers", answers)) {
    tips.push("Pair a daily post with replies under larger " + niche + " accounts to grow faster.");
  } else if (tips.length < 3 && hasAnswer("mission", "overtrading", answers)) {
    tips.push("Write the thesis before you size in — and review the trade, not just the entry.");
  } else if (tips.length < 3 && hasAnswer("mission", "ship", answers)) {
    tips.push("Ship something small in public every week, even if it's ugly.");
  } else if (tips.length < 3 && hasAnswer("mission", "connections", answers)) {
    tips.push("Give value in replies and DMs first. Opportunities follow the people who show up.");
  } else if (tips.length < 3 && hasAnswer("mission", "brand", answers)) {
    tips.push("Make " + niche + " obvious in your bio, pinned post, and every hook.");
  }
  if (tips.length < 2) {
    tips.push("Make " + niche + " obvious in your bio, pinned post, and every hook.");
  }
  return tips.slice(0, 3).map(cleanText);
}

function blockerDisplay(answers) {
  if (hasAnswer("blocker", "nothing", answers)) return ["Nothing — locked in"];
  return selectedValues("blocker", answers)
    .map((value) => {
      if (value === "other") return cleanText(answers.blockerOther || "Something else");
      return optionLabel("blocker", value);
    })
    .filter(Boolean);
}

function scoreAnswers(answers) {
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
    opportunities: selectedLabels("opportunities", answers),
    missions: selectedLabels("mission", answers),
    trend: trend || null,
    tips: buildTips(answers),
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

function isOtherOpen() {
  const q = QUESTIONS[state.index];
  return Boolean(q && q.id === "blocker" && hasAnswer("blocker", "other") && !hasAnswer("blocker", "nothing"));
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
  if (isOtherOpen()) {
    wrap.classList.remove("hidden");
    if ($("otherInput").value !== (state.answers.blockerOther || "")) {
      $("otherInput").value = state.answers.blockerOther || "";
    }
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
    if (q.id === "blocker" && value !== "other" && !current.has("other")) {
      delete state.answers.blockerOther;
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
  if (isOtherOpen()) {
    const text = $("otherInput").value.trim().slice(0, 40);
    if (!text) return;
    state.answers.blockerOther = text;
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
    li.appendChild(document.createTextNode(cleanText(tip)));
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
  state.answers.blockerOther = $("otherInput").value.slice(0, 40);
  updateContinue();
});
$("otherInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    continueQuiz();
  }
});
$("countInput").addEventListener("input", () => {
  if ($("countErr").classList.contains("show")) showCountError("");
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
