"use strict";

const $ = (id) => document.getElementById(id);

function showHomeError(msg) {
  const el = $("homeErr");
  el.textContent = msg || "";
  el.classList.toggle("show", Boolean(msg));
}

function showHome() {
  $("home").classList.remove("hidden");
  $("result").classList.add("hidden");
  document.querySelector(".card").classList.remove("showing-result");
  showHomeError("");
}

function avatarUrl(handle, pfp) {
  const params = new URLSearchParams();
  if (handle) params.set("handle", handle);
  if (pfp) params.set("url", pfp);
  return `/api/avatar?${params.toString()}`;
}

function setPfp(handle, pfp) {
  const img = $("pfp");
  const wrap = img.parentElement;
  wrap.querySelectorAll(".pfp-fallback").forEach((n) => n.remove());
  img.classList.remove("hidden");
  img.alt = `@${handle} profile picture`;
  img.onload = () => {
    img.classList.remove("hidden");
  };
  img.onerror = () => {
    img.classList.add("hidden");
    if (!wrap.querySelector(".pfp-fallback")) {
      const fallback = document.createElement("div");
      fallback.className = "pfp-fallback";
      fallback.textContent = (handle || "?").charAt(0).toUpperCase();
      wrap.appendChild(fallback);
    }
  };
  img.src = avatarUrl(handle, pfp);
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

function renderStats(metrics) {
  const er = metrics.engagementRate != null ? `${metrics.engagementRate}%` : "—";
  const freq = metrics.postsPerWeek != null ? String(metrics.postsPerWeek) : "—";
  const best = metrics.bestPostType || "—";
  $("stats").innerHTML = [
    ["<b>" + freq + "</b><span>Posts / week</span>"],
    ["<b>" + er + "</b><span>Eng. rate</span>"],
    ["<b>" + best + "</b><span>Best type</span>"],
  ]
    .map((row) => `<div class="stat">${row}</div>`)
    .join("");
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
  if (!trend || trend.percent == null) {
    el.innerHTML = "Not enough recent posts to show a 30-day trend.";
    return;
  }
  const dir = trend.direction || "flat";
  el.classList.add(dir);
  const arrow = dir === "up" ? "↑" : dir === "down" ? "↓" : "→";
  const sign = trend.percent > 0 ? "+" : "";
  el.innerHTML =
    `<span class="arrow">${arrow}</span>` +
    `<span class="pct">${sign}${trend.percent}%</span>` +
    `<span>vs previous 30 days</span>`;
}

function shareText(data) {
  const niche = (data.niches && data.niches.top) || "Crypto Twitter";
  return `My Q4 score is ${data.score} (${data.label}) 🚀 Niche: ${niche}. Check yours 👉 ${window.location.origin}`;
}

function showResult(data) {
  const handle = data.you.handle;
  $("home").classList.add("hidden");
  $("result").classList.remove("hidden");
  document.querySelector(".card").classList.add("showing-result");
  $("demoBadge").classList.toggle("hidden", !data.demo);
  setPfp(handle, data.you.pfp);
  $("youHandle").textContent = `@${handle}`;
  $("score").textContent = String(data.score);
  $("label").textContent = data.label;
  renderChips(data.niches);
  renderStats(data.metrics || {});
  $("strength").textContent = data.strength || "";
  renderTips(data.tips);
  renderProgress(data.metrics && data.metrics.trend);
  $("shareBtn").href =
    "https://x.com/intent/post?text=" + encodeURIComponent(shareText(data));
  $("downloadBtn").dataset.handle = handle;
}

async function checkHandle(preset) {
  const input = $("handle");
  const btn = $("checkBtn");
  const handle = (preset || input.value || "").trim();
  showHomeError("");
  btn.disabled = true;
  const prev = btn.textContent;
  btn.textContent = "Reading the timeline…";
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    const data = await res.json();
    if (!res.ok) {
      showHomeError(data.error || "Something went wrong.");
      showHome();
      input.value = handle.replace(/^@+/, "");
      return;
    }
    input.value = data.you.handle;
    showResult(data);
  } catch {
    showHomeError("Couldn't reach the server. Try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = prev;
  }
}

async function downloadCard() {
  const btn = $("downloadBtn");
  const node = $("shareCard");
  if (typeof html2canvas !== "function") {
    showHomeError("Couldn't load the image tool. Try again.");
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

$("checkBtn").addEventListener("click", () => checkHandle());
$("handle").addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkHandle();
});
$("againBtn").addEventListener("click", () => {
  $("handle").value = "";
  showHome();
  $("handle").focus();
});
$("homeLink").addEventListener("click", () => {
  showHome();
  $("handle").focus();
});
$("downloadBtn").addEventListener("click", downloadCard);
