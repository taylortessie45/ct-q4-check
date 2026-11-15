"use strict";

const $ = (id) => document.getElementById(id);
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

const QUESTIONS = [
  {
    id: "niche",
    text: "What's your main niche?",
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
    options: [
      { value: "under1k", label: "Under 1K", mid: 500, reach: 2 },
      { value: "1to5k", label: "1K – 5K", mid: 3000, reach: 3 },
      { value: "5to20k", label: "5K – 20K", mid: 12500, reach: 4 },
      { value: "20kplus", label: "20K+", mid: 40000, reach: 5 },
    ],
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
    options: [
      { value: "under10", label: "Under 10", mid: 5 },
      { value: "10to50", label: "10 – 50", mid: 30 },
      { value: "50to200", label: "50 – 200", mid: 125 },
      { value: "200plus", label: "200+", mid: 350 },
    ],
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
    options: [
      { value: "consistency", label: "Consistency", score: 4 },
      { value: "time", label: "Time", score: 9 },
      { value: "engagement", label: "Low engagement", score: 8 },
      { value: "plan", label: "No clear plan", score: 5 },
      { value: "network", label: "Network", score: 12 },
      { value: "funds", label: "Funds", score: 10 },
    ],
  },
  {
    id: "opportunities",
    text: "What kind of opportunities are you looking for?",
    multi: true,
    hint: "Select all that apply, then continue.",
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
    text: "What's one thing you're determined to change before the year ends?",
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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreLabel(score) {
  if (score >= 80) return "Q4 Giga Chad";
  if (score >= 60) return "Q4 Ready";
  if (score >= 45) return "Rising";
  if (score >= 30) return "Warming Up";
  return "Q4 Sleeper";
}

function optionByValue(id, value) {
  const q = QUESTIONS.find((item) => item.id === id);
  return q.options.find((o) => o.value === value);
}

function optionLabel(id, value) {
  const opt = optionByValue(id, value);
  return opt ? opt.label : "";
}

function buildTips(answers) {
  const tips = [];
  const niche = answers.niche;
  const followers = optionByValue("followers", answers.followers);
  const likes = optionByValue("likes", answers.likes);
  const erScore = engagementScore(followers.mid, likes.mid);

  if (answers.blocker === "consistency" || answers.consistency === "irregular") {
    tips.push("Lock a 20-minute daily slot like a mint time — one post beats a burst and a silence.");
  } else if (answers.blocker === "time") {
    tips.push("Batch content twice a week so busy days don't kill your streak.");
  } else if (answers.blocker === "engagement") {
    tips.push("Reply under bigger accounts in " + niche + " and lead with a sharper first line.");
  } else if (answers.blocker === "plan") {
    tips.push("Write a one-page Q4 plan: one goal, one weekly action, one number you track.");
  } else if (answers.blocker === "network") {
    tips.push("Start 3 genuine convos a day with people already in " + niche + ".");
  } else if (answers.blocker === "funds") {
    tips.push("Trade time for leverage — collabs and proof of work beat waiting on capital.");
  }

  if (answers.trend === "down" && tips.length < 3) {
    tips.push("Engagement slipped last month — bounce back with tighter hooks and more visuals.");
  }
  if (erScore < 14 && answers.blocker !== "engagement" && tips.length < 3) {
    tips.push("Reply under bigger accounts in " + niche + " to lift likes relative to your following.");
  }
  if (answers.consistency === "weekly" && tips.length < 3) {
    tips.push("Bump to most days so the algo and your audience both remember you.");
  } else if (answers.consistency === "daily" && tips.length < 3) {
    tips.push("You're already showing up. Raise the quality now — fewer filler posts, stronger takes.");
  } else if (answers.consistency === "most" && tips.length < 3) {
    tips.push("Protect the streak through Q4, then raise the quality of each post.");
  }

  if (tips.length < 3 && answers.mission === "daily") {
    tips.push("Queue tomorrow's post tonight so the daily streak is already won.");
  } else if (tips.length < 3 && answers.mission === "followers") {
    tips.push("Pair a daily post with replies under larger " + niche + " accounts to grow faster.");
  } else if (tips.length < 3 && answers.mission === "overtrading") {
    tips.push("Write the thesis before you size in — and review the trade, not just the entry.");
  } else if (tips.length < 3 && answers.mission === "ship") {
    tips.push("Ship something small in public every week, even if it's ugly.");
  } else if (tips.length < 3 && answers.mission === "connections") {
    tips.push("Give value in replies and DMs first. Opportunities follow the people who show up.");
  } else if (tips.length < 3 && answers.mission === "brand") {
    tips.push("Make " + niche + " obvious in your bio, pinned post, and every hook.");
  }
  if (tips.length < 2) {
    tips.push("Make " + niche + " obvious in your bio, pinned post, and every hook.");
  }
  return tips.slice(0, 3);
}

function engagementScore(followersMid, likesMid) {
  const er = followersMid > 0 ? (likesMid / followersMid) * 100 : 0;
  if (er <= 0) return 0;
  return clamp(Math.round(30 * (1 - Math.exp(-er / 1.4))), 0, 30);
}

function scoreAnswers(answers) {
  const followers = optionByValue("followers", answers.followers);
  const likes = optionByValue("likes", answers.likes);
  const consistency = optionByValue("consistency", answers.consistency);
  const trend = optionByValue("trend", answers.trend);
  const blocker = optionByValue("blocker", answers.blocker);
  const mission = optionByValue("mission", answers.mission);
  const score = clamp(
    (consistency.score || 0) +
      engagementScore(followers.mid, likes.mid) +
      (trend.score || 0) +
      (blocker.score || 0) +
      (mission.score || 0) +
      (followers.reach || 0),
    0,
    100
  );
  return {
    score,
    label: scoreLabel(score),
    niche: answers.niche,
    followers: followers.label,
    likes: likes.label,
    blocker: blocker.label,
    opportunities: (answers.opportunities || []).map((value) => optionLabel("opportunities", value)),
    mission: mission.label,
    trend,
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
  setView("quiz");
  renderQuestion();
}

function selectedValues(id) {
  const raw = state.answers[id];
  if (Array.isArray(raw)) return raw;
  if (raw) return [raw];
  return [];
}

function updateContinue() {
  const q = QUESTIONS[state.index];
  const btn = $("continueBtn");
  if (!q.multi) return;
  btn.disabled = selectedValues(q.id).length === 0;
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

  const continueBtn = $("continueBtn");
  continueBtn.classList.toggle("hidden", !q.multi);
  updateContinue();

  const root = $("options");
  root.className = "options" + (q.layout === "grid-3" ? " grid-3" : "");
  root.innerHTML = "";
  const picked = new Set(selectedValues(q.id));
  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    if (picked.has(opt.value)) btn.classList.add("picked");
    btn.textContent = opt.label;
    btn.addEventListener("click", () => pickOption(q, opt.value, btn));
    root.appendChild(btn);
  });
}

function pickOption(q, value, btn) {
  if (q.multi) {
    const current = new Set(selectedValues(q.id));
    if (current.has(value)) current.delete(value);
    else current.add(value);
    state.answers[q.id] = q.options.map((o) => o.value).filter((v) => current.has(v));
    btn.classList.toggle("picked");
    updateContinue();
    return;
  }

  state.answers[q.id] = value;
  $("options").querySelectorAll(".option").forEach((el) => el.classList.remove("picked"));
  btn.classList.add("picked");
  window.setTimeout(() => {
    if (state.index < QUESTIONS.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      showResult();
    }
  }, 140);
}

function continueMulti() {
  const q = QUESTIONS[state.index];
  if (!q.multi || selectedValues(q.id).length === 0) return;
  if (state.index < QUESTIONS.length - 1) {
    state.index += 1;
    renderQuestion();
  } else {
    showResult();
  }
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
  (items || []).filter(Boolean).forEach((name, i) => {
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
    li.textContent = tip;
    ul.appendChild(li);
  });
}

function shareText(data) {
  return `My 2026 Q4 Growth Card: ${data.score} (${data.label}) 🚀 Q4 mission: ${data.mission}. Get yours 👉 ${window.location.origin}`;
}

function renderStats(data) {
  $("stats").innerHTML =
    `<div class="stat"><b>${data.followers}</b><span>Followers</span></div>` +
    `<div class="stat"><b>${data.likes}</b><span>Avg likes</span></div>`;
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
  el.innerHTML =
    `<span class="arrow">${arrow}</span>` +
    `<span class="pct">${trend.phrase}</span>`;
}

function showResult() {
  const data = scoreAnswers(state.answers);
  const handle = state.handle;
  setView("result");
  setPfp(handle);
  $("youHandle").textContent = `@${handle}`;
  $("score").textContent = String(data.score);
  $("label").textContent = data.label;
  renderChips($("nicheChips"), [data.niche], true);
  renderStats(data);
  renderProgress(data.trend);
  $("blocker").textContent = data.blocker;
  renderChips($("openChips"), data.opportunities, false);
  $("mission").textContent = data.mission;
  renderTips(data.tips);
  $("shareBtn").href =
    "https://x.com/intent/post?text=" + encodeURIComponent(shareText(data));
  $("downloadBtn").dataset.handle = handle;
}

function resetAll() {
  state.handle = "";
  state.index = 0;
  state.answers = {};
  $("handle").value = "";
  showHome();
  $("handle").focus();
}

async function downloadCard() {
  const btn = $("downloadBtn");
  const node = $("shareCard");
  if (typeof html2canvas !== "function") {
    alert("Couldn't load the image tool. Try again.");
    return;
  }
  btn.disabled = true;
  const prev = btn.textContent;
  btn.textContent = "Saving…";
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const canvas = await html2canvas(node, {
      backgroundColor: "#141417",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const link = document.createElement("a");
    const handle = btn.dataset.handle || "result";
    link.download = `q4-growth-card-@${handle}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch {
    alert("Couldn't build the card image. Try a screenshot instead.");
  } finally {
    btn.disabled = false;
    btn.textContent = prev;
  }
}

$("startBtn").addEventListener("click", startQuiz);
$("handle").addEventListener("keydown", (e) => {
  if (e.key === "Enter") startQuiz();
});
$("backBtn").addEventListener("click", goBack);
$("continueBtn").addEventListener("click", continueMulti);
$("againBtn").addEventListener("click", resetAll);
$("homeLink").addEventListener("click", resetAll);
$("downloadBtn").addEventListener("click", downloadCard);
