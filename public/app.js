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
    id: "focus",
    text: "What are you currently spending most of your time on?",
    options: [
      { value: "content", label: "Creating content", score: 13 },
      { value: "trading", label: "Trading", score: 12 },
      { value: "building", label: "Building a project", score: 15 },
      { value: "community", label: "Growing a community", score: 14 },
      { value: "networking", label: "Networking/collabs", score: 13 },
      { value: "learning", label: "Learning", score: 8 },
    ],
  },
  {
    id: "achievement",
    text: "What's your biggest achievement so far this year?",
    options: [
      { value: "followers", label: "Grew my followers", score: 18 },
      { value: "collab", label: "Landed a collab/paid deal", score: 22 },
      { value: "trades", label: "Profitable trades", score: 20 },
      { value: "launched", label: "Launched a project", score: 25 },
      { value: "community", label: "Built a community", score: 22 },
      { value: "loading", label: "Still loading...", score: 4 },
    ],
  },
  {
    id: "blocker",
    text: "What's holding you back from reaching your goals?",
    options: [
      { value: "consistency", label: "Consistency", score: 4 },
      { value: "time", label: "Time", score: 10 },
      { value: "engagement", label: "Low engagement", score: 9 },
      { value: "plan", label: "No clear plan", score: 5 },
      { value: "network", label: "Network", score: 12 },
      { value: "funds", label: "Funds", score: 11 },
    ],
  },
  {
    id: "consistency",
    text: "How consistent have you been with your work and content?",
    options: [
      { value: "daily", label: "Every day", score: 30 },
      { value: "most", label: "Most days", score: 24 },
      { value: "weekly", label: "Few times a week", score: 14 },
      { value: "irregular", label: "On and off", score: 4 },
    ],
  },
  {
    id: "skill",
    text: "What skill do you want to improve before the end of Q4?",
    options: [
      { value: "writing", label: "Writing/threads" },
      { value: "visuals", label: "Design/visuals" },
      { value: "trading", label: "Trading" },
      { value: "networking", label: "Networking" },
      { value: "video", label: "Video" },
      { value: "building", label: "Building/dev" },
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
      { value: "daily", label: "Post daily", score: 9 },
      { value: "followers", label: "Hit a follower goal", score: 8 },
      { value: "overtrading", label: "Stop overtrading", score: 9 },
      { value: "ship", label: "Ship my project", score: 10 },
      { value: "connections", label: "Build real connections", score: 8 },
      { value: "brand", label: "Level up my brand", score: 8 },
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

  if (answers.skill === "writing") {
    tips.push("Ship one tight thread in " + niche + " each week so people know where to find you.");
  } else if (answers.skill === "visuals") {
    tips.push("Lead more posts with a custom visual so they stop the scroll.");
  } else if (answers.skill === "trading") {
    tips.push("Write the thesis before you size in — and share the review, not just the entry.");
  } else if (answers.skill === "networking") {
    tips.push("Give value in replies and DMs first. Opportunities follow the people who show up.");
  } else if (answers.skill === "video") {
    tips.push("Try one short clip a week — even a screen-recorded take can outperform text.");
  } else if (answers.skill === "building") {
    tips.push("Ship something small in public every week, even if it's ugly.");
  }

  if (answers.consistency === "weekly" && tips.length < 3) {
    tips.push("Bump to most days so the algo and your audience both remember you.");
  } else if (answers.consistency === "daily" && tips.length < 3) {
    tips.push("You're already showing up. Raise the quality now — fewer filler posts, stronger takes.");
  } else if (answers.consistency === "most" && tips.length < 3) {
    tips.push("Protect the streak through Q4, then raise the quality of each post.");
  }

  if (tips.length < 2 && answers.mission === "daily") {
    tips.push("Queue tomorrow's post tonight so the daily streak is already won.");
  }
  if (tips.length < 2) {
    tips.push("Make " + niche + " obvious in your bio, pinned post, and every hook.");
  }
  return tips.slice(0, 3);
}

function scoreAnswers(answers) {
  const focus = optionByValue("focus", answers.focus);
  const achievement = optionByValue("achievement", answers.achievement);
  const blocker = optionByValue("blocker", answers.blocker);
  const consistency = optionByValue("consistency", answers.consistency);
  const mission = optionByValue("mission", answers.mission);
  const opps = answers.opportunities || [];
  const openness = opps.length >= 3 ? 5 : opps.length === 2 ? 3 : 1;
  let score =
    (consistency.score || 0) +
    (achievement.score || 0) +
    (focus.score || 0) +
    (blocker.score || 0) +
    (mission.score || 0) +
    openness;
  if (
    answers.consistency === "daily" &&
    (answers.achievement === "launched" || answers.achievement === "collab" || answers.achievement === "community")
  ) {
    score += 3;
  }
  score = clamp(score, 0, 100);
  return {
    score,
    label: scoreLabel(score),
    niche: answers.niche,
    focus: focus.label,
    win: achievement.label,
    blocker: blocker.label,
    skill: optionLabel("skill", answers.skill),
    opportunities: opps.map((value) => optionLabel("opportunities", value)),
    mission: mission.label,
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

function showResult() {
  const data = scoreAnswers(state.answers);
  const handle = state.handle;
  setView("result");
  setPfp(handle);
  $("youHandle").textContent = `@${handle}`;
  $("score").textContent = String(data.score);
  $("label").textContent = data.label;
  renderChips($("nicheChips"), [data.niche], true);
  $("focus").textContent = data.focus;
  $("win").textContent = data.win;
  $("blocker").textContent = data.blocker;
  $("skill").textContent = data.skill;
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
