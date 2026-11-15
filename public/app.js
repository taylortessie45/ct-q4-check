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
      { value: "under1k", label: "Under 1K", mid: 500 },
      { value: "1to5k", label: "1K – 5K", mid: 3000 },
      { value: "5to20k", label: "5K – 20K", mid: 12500 },
      { value: "20kplus", label: "20K+", mid: 40000 },
    ],
  },
  {
    id: "cadence",
    text: "How do you post?",
    options: [
      { value: "bursts", label: "In bursts, then I go quiet", score: 6 },
      { value: "weekly", label: "A few times a week", score: 12 },
      { value: "most", label: "Most days, pretty consistent", score: 18 },
      { value: "daily", label: "Every day, no skips", score: 20 },
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
    id: "threads",
    text: "Do you post threads?",
    options: [
      { value: "rarely", label: "Rarely", score: 3 },
      { value: "sometimes", label: "Sometimes", score: 7 },
      { value: "often", label: "Often", score: 10 },
    ],
  },
  {
    id: "replies",
    text: "Do you reply to bigger accounts daily?",
    options: [
      { value: "never", label: "Almost never", score: 3 },
      { value: "sometimes", label: "Sometimes", score: 7 },
      { value: "daily", label: "Yes, daily", score: 12 },
    ],
  },
  {
    id: "media",
    text: "Do you post images or videos?",
    options: [
      { value: "rarely", label: "Rarely", score: 3 },
      { value: "sometimes", label: "Sometimes", score: 7 },
      { value: "always", label: "Almost always", score: 10 },
    ],
  },
  {
    id: "trend",
    text: "Last 30 days, how did engagement change?",
    options: [
      { value: "down", label: "It went down", score: 4, direction: "down", phrase: "Down vs last 30 days" },
      { value: "flat", label: "About the same", score: 10, direction: "flat", phrase: "About the same vs last 30 days" },
      { value: "up", label: "Up a bit", score: 14, direction: "up", phrase: "Up vs last 30 days" },
      { value: "wayup", label: "Way up", score: 18, direction: "up", phrase: "Way up vs last 30 days" },
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

function engagementScore(followersMid, likesMid) {
  const er = followersMid > 0 ? (likesMid / followersMid) * 100 : 0;
  if (er <= 0) return 0;
  return clamp(Math.round(30 * (1 - Math.exp(-er / 1.4))), 0, 30);
}

function buildTips(parts, answers) {
  const tips = [];
  const niche = answers.niche;
  if (answers.cadence === "bursts") {
    tips.push("Post at least 4 times a week so the algo keeps you in the feed.");
  } else if (answers.cadence === "weekly") {
    tips.push("Bump your cadence to most days — consistency is what Q4 rewards.");
  }
  if (answers.trend === "down") {
    tips.push("Engagement slipped last month — bounce back with tighter hooks and more of your best format.");
  }
  if (parts.er < 14 && answers.replies !== "daily") {
    tips.push("Reply under bigger accounts in your niche every day to lift your engagement rate.");
  } else if (parts.er < 14) {
    tips.push("Open with a sharper first line so more people expand the post.");
  }
  if (answers.media === "rarely") {
    tips.push("Posts with images or clips usually travel further. Lead with a visual.");
  }
  if (answers.threads === "rarely") {
    tips.push("Try one " + niche + " thread a week. A clear take can outperform single posts.");
  }
  if (answers.replies === "never" && tips.length < 3) {
    tips.push("Spend 20 minutes a day replying to bigger accounts in your lane.");
  }
  if (tips.length < 3 && answers.threads !== "often") {
    tips.push("Ship a weekly thread in " + niche + " so people know where to find you.");
  }
  if (tips.length < 3 && answers.replies !== "daily") {
    tips.push("Quote bigger accounts in " + niche + " with your own read, not just an emoji.");
  }
  if (tips.length < 3 && (answers.cadence === "daily" || answers.cadence === "most")) {
    tips.push("You're already showing up. Push quality now — fewer filler posts, stronger opinions.");
  }
  if (tips.length < 3 && answers.media !== "always") {
    tips.push("Lead more posts with an image or clip so they stop the scroll.");
  }
  if (tips.length < 2) {
    tips.push("Make " + niche + " obvious in your bio, pinned post, and every hook.");
  }
  return tips.slice(0, 3);
}

function buildStrength(parts, answers) {
  if (answers.trend === "wayup") {
    return "You're heating up — engagement is way up in the last 30 days.";
  }
  if (parts.er >= 20) {
    return "Your likes are elite for your follower count.";
  }
  if (answers.cadence === "daily" || answers.cadence === "most") {
    return "You show up consistently — that cadence is your edge going into Q4.";
  }
  if (answers.threads === "often") {
    return "Threads are your edge. Keep shipping them.";
  }
  if (answers.media === "always") {
    return "Visuals are your edge. Your images and clips help posts travel.";
  }
  if (answers.replies === "daily") {
    return "You're already in the rooms that matter — daily replies will compound.";
  }
  if (answers.trend === "up") {
    return "You're trending the right way. A little more consistency can make Q4 big.";
  }
  return "You've got a base in " + answers.niche + " — a tighter focus can still make Q4 big.";
}

function habitChip(answers) {
  if (answers.threads === "often") return "Threads";
  if (answers.media === "always") return "Visuals";
  if (answers.replies === "daily") return "Reply game";
  if (answers.cadence === "daily") return "Consistent";
  return null;
}

function scoreAnswers(answers) {
  const followers = optionByValue("followers", answers.followers);
  const likes = optionByValue("likes", answers.likes);
  const cadence = optionByValue("cadence", answers.cadence);
  const threads = optionByValue("threads", answers.threads);
  const replies = optionByValue("replies", answers.replies);
  const media = optionByValue("media", answers.media);
  const trend = optionByValue("trend", answers.trend);

  const parts = {
    er: engagementScore(followers.mid, likes.mid),
    cadence: cadence.score,
    threads: threads.score,
    replies: replies.score,
    media: media.score,
    trend: trend.score,
  };
  const score = clamp(
    parts.er + parts.cadence + parts.threads + parts.replies + parts.media + parts.trend,
    0,
    100
  );
  const secondary = habitChip(answers);
  return {
    score,
    label: scoreLabel(score),
    niches: { top: answers.niche, secondary },
    strength: buildStrength(parts, answers),
    tips: buildTips(parts, answers),
    trend,
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

function renderQuestion() {
  const q = QUESTIONS[state.index];
  const total = QUESTIONS.length;
  $("stepLabel").textContent = `${state.index + 1} of ${total}`;
  $("barFill").style.width = `${((state.index + 1) / total) * 100}%`;
  $("question").textContent = q.text;
  $("backBtn").disabled = state.index === 0;
  const root = $("options");
  root.className = "options" + (q.layout === "grid-3" ? " grid-3" : "");
  root.innerHTML = "";
  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    if (state.answers[q.id] === opt.value) btn.classList.add("picked");
    btn.textContent = opt.label;
    btn.addEventListener("click", () => pickOption(q.id, opt.value, btn));
    root.appendChild(btn);
  });
}

function pickOption(id, value, btn) {
  state.answers[id] = value;
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

function renderChips(niches) {
  const root = $("chips");
  root.innerHTML = "";
  const items = [niches && niches.top, niches && niches.secondary].filter(Boolean);
  items.forEach((name, i) => {
    const chip = document.createElement("span");
    chip.className = "chip" + (i === 0 ? " accent" : "");
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

function shareText(data) {
  const niche = (data.niches && data.niches.top) || "Crypto Twitter";
  return `My Q4 score is ${data.score} (${data.label}) 🚀 Niche: ${niche}. Check yours 👉 ${window.location.origin}`;
}

function showResult() {
  const data = scoreAnswers(state.answers);
  const handle = state.handle;
  setView("result");
  setPfp(handle);
  $("youHandle").textContent = `@${handle}`;
  $("score").textContent = String(data.score);
  $("label").textContent = data.label;
  renderChips(data.niches);
  $("strength").textContent = data.strength;
  renderTips(data.tips);
  renderProgress(data.trend);
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
    link.download = `q4-check-@${handle}.png`;
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
$("againBtn").addEventListener("click", resetAll);
$("homeLink").addEventListener("click", resetAll);
$("downloadBtn").addEventListener("click", downloadCard);
