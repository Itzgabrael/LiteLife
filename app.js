/***** DOM refs *****/
const tipContainer = document.getElementById("tipContainer");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll("#categoryButtons button");
const tipCountEl = document.getElementById("tipCount");

/***** State *****/
let savedTips       = JSON.parse(localStorage.getItem("savedTips")) || [];
let pinnedTipId     = localStorage.getItem("pinnedTipId") || null;
let userTips        = JSON.parse(localStorage.getItem("userTips")) || [];
let currentCategory = "All";
let showingFavoritesOnly = false;

let tipReactions = JSON.parse(localStorage.getItem("tipReactions")) || {};
let reactedTips  = JSON.parse(localStorage.getItem("reactedTips"))  || {};
let tipMetrics   = JSON.parse(localStorage.getItem("tipMetrics"))   || {}; // { id: {views, likes, saves, lastSeenAt} }

/***** Helpers *****/
function saveReactions(){ localStorage.setItem("tipReactions", JSON.stringify(tipReactions)); }
function saveReactedTips(){ localStorage.setItem("reactedTips", JSON.stringify(reactedTips)); }
function saveSavedTips(){ localStorage.setItem("savedTips", JSON.stringify(savedTips)); }
function saveTipMetrics(){ localStorage.setItem("tipMetrics", JSON.stringify(tipMetrics)); }

function allTipsNow(){
  return [...(typeof healthTips !== "undefined" ? healthTips : []), ...userTips];
}

/***** Trending recording *****/
function recordTipInteraction(tipId, type){
  if(!tipMetrics[tipId]) tipMetrics[tipId] = { views:0, likes:0, saves:0, lastSeenAt: Date.now() };
  switch(type){
    case "view":   tipMetrics[tipId].views += 1; break;
    case "like":   tipMetrics[tipId].likes += 1; break;
    case "save":   tipMetrics[tipId].saves += 1; break;
    case "unsave": tipMetrics[tipId].saves = Math.max(0, tipMetrics[tipId].saves - 1); break;
  }
  tipMetrics[tipId].lastSeenAt = Date.now();
  saveTipMetrics();
}

function computeTrendingScore(m){
  if(!m) return 0;
  const recencyBoost = Math.max(1, 1 + (Date.now() - m.lastSeenAt) / (1000*60*60*24) * (-0.05)); // light decay
  return Math.round((m.views*1 + m.likes*3 + m.saves*2) * recencyBoost);
}

/***** Rendering *****/
function displayTips(tips){
  if (tipCountEl) tipCountEl.textContent = `Showing ${tips.length} health tip${tips.length !== 1 ? "s" : ""}`;
  tipContainer.innerHTML = "";

  // pinned first
  tips.sort((a,b) => (a.id === pinnedTipId ? -1 : b.id === pinnedTipId ? 1 : 0));

  tips.forEach(tip => {
    // record view when card is rendered
    recordTipInteraction(tip.id, "view");

    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = tip.title;

    const content = document.createElement("p");
    content.textContent = tip.content;

    const row = document.createElement("div");

    // Save / Unsave
    const saveBtn = document.createElement("button");
    const isSaved = savedTips.includes(tip.id);
    saveBtn.textContent = isSaved ? "Saved ✓ (Click to Unsave)" : "Save Tip";
    if(isSaved) saveBtn.classList.add("saved");
    saveBtn.addEventListener("click", () => {
      // premium gate for >5 saved (example)
      if (!isSaved && savedTips.length >= 5 && !PremiumManager.isPremium()) {
        document.getElementById("premiumNotice").style.display = "block";
        return;
      }
      if (isSaved) {
        savedTips = savedTips.filter(id => id !== tip.id);
        recordTipInteraction(tip.id, "unsave");
      } else {
        savedTips.push(tip.id);
        recordTipInteraction(tip.id, "save");
      }
      saveSavedTips();
      applyFilters();
    });

    // Pin
    const pinBtn = document.createElement("button");
    pinBtn.textContent = tip.id === pinnedTipId ? "📍 Unpin" : "📌 Pin";
    pinBtn.style.background = "var(--warn)";
    pinBtn.style.color = "white";
    pinBtn.addEventListener("click", () => {
      if (tip.id === pinnedTipId) {
        pinnedTipId = null;
        localStorage.removeItem("pinnedTipId");
      } else {
        pinnedTipId = tip.id;
        localStorage.setItem("pinnedTipId", pinnedTipId);
      }
      applyFilters();
    });

    // If tip is user-created → Edit / Delete / Share / Download
    const isUserTip = userTips.some(u => u.id === tip.id);
    if (isUserTip) {
      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️ Edit";
      editBtn.style.background = "var(--accent)";
      editBtn.style.color = "#fff";
      editBtn.addEventListener("click", () => openEdit(tip));

      const shareBtn = document.createElement("button");
      shareBtn.textContent = "📤 Share";
      shareBtn.style.background = "var(--success)";
      shareBtn.style.color = "#fff";
      shareBtn.addEventListener("click", () => {
        const shareText = `${tip.title}: ${tip.content}`;
        if (navigator.share) {
          navigator.share({ title: "LiteLife Tip", text: shareText }).catch(console.error);
        } else {
          alert("Sharing is not supported on this browser.");
        }
      });

      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "💾 Download Image";
      downloadBtn.style.background = "var(--warn)";
      downloadBtn.style.color = "#fff";
      downloadBtn.addEventListener("click", () => {
        html2canvas(card).then(canvas => {
          const link = document.createElement("a");
          link.download = `${tip.title}.png`;
          link.href = canvas.toDataURL();
          link.click();
        });
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑 Delete";
      deleteBtn.style.background = "var(--danger)";
      deleteBtn.style.color = "#fff";
      deleteBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this tip?")) {
          userTips = userTips.filter(u => u.id !== tip.id);
          localStorage.setItem("userTips", JSON.stringify(userTips));
          const idx = savedTips.indexOf(tip.id);
          if (idx !== -1) { savedTips.splice(idx,1); saveSavedTips(); }
          applyFilters();
        }
      });

      row.appendChild(editBtn);
      row.appendChild(shareBtn);
      row.appendChild(downloadBtn);
      row.appendChild(deleteBtn);
    }

    row.appendChild(saveBtn);
    row.appendChild(pinBtn);

    // Reactions (like/dislike)
    const reactionDiv = document.createElement("div");
    reactionDiv.style.marginTop = "10px";

    const likeBtn = document.createElement("button");
    const dislikeBtn = document.createElement("button");

    const stats = tipReactions[tip.id] || { likes: 0, dislikes: 0 };
    likeBtn.textContent = `👍 ${stats.likes}`;
    dislikeBtn.textContent = `👎 ${stats.dislikes}`;

    [likeBtn, dislikeBtn].forEach(b => {
      b.style.marginRight = "10px";
      b.style.padding = "6px 12px";
      b.style.border = "none";
      b.style.borderRadius = "6px";
      b.style.cursor = "pointer";
      b.style.color = "#fff";
    });
    likeBtn.style.background = "var(--success)";
    dislikeBtn.style.background = "var(--danger)";

    const userReacted = reactedTips[tip.id]; // "like" | "dislike"
    likeBtn.disabled = userReacted === "like";
    dislikeBtn.disabled = userReacted === "dislike";

    likeBtn.addEventListener("click", () => {
      if (!tipReactions[tip.id]) tipReactions[tip.id] = { likes: 0, dislikes: 0 };
      const cur = reactedTips[tip.id];

      if (cur === "like") {
        tipReactions[tip.id].likes = Math.max(0, tipReactions[tip.id].likes - 1);
        delete reactedTips[tip.id];
      } else {
        if (cur === "dislike") tipReactions[tip.id].dislikes = Math.max(0, tipReactions[tip.id].dislikes - 1);
        tipReactions[tip.id].likes += 1;
        reactedTips[tip.id] = "like";
        recordTipInteraction(tip.id, "like"); // trending hook
      }
      saveReactions(); saveReactedTips(); applyFilters();
    });

    dislikeBtn.addEventListener("click", () => {
      if (!tipReactions[tip.id]) tipReactions[tip.id] = { likes: 0, dislikes: 0 };
      const cur = reactedTips[tip.id];

      if (cur === "dislike") {
        tipReactions[tip.id].dislikes = Math.max(0, tipReactions[tip.id].dislikes - 1);
        delete reactedTips[tip.id];
      } else {
        if (cur === "like") tipReactions[tip.id].likes = Math.max(0, tipReactions[tip.id].likes - 1);
        tipReactions[tip.id].dislikes += 1;
        reactedTips[tip.id] = "dislike";
      }
      saveReactions(); saveReactedTips(); applyFilters();
    });

    reactionDiv.appendChild(likeBtn);
    reactionDiv.appendChild(dislikeBtn);

    // Compose card
    card.appendChild(title);
    card.appendChild(content);
    card.appendChild(row);
    card.appendChild(reactionDiv);

    // Tooltip if reacted
    if (userReacted) {
      likeBtn.title = "You already reacted.";
      dislikeBtn.title = "You already reacted.";
    }

    tipContainer.appendChild(card);
  });
}

/***** Filters *****/
function applyFilters(){
  const keyword = (searchInput?.value || "").toLowerCase();
  let filtered = allTipsNow();

  if (currentCategory !== "All") {
    filtered = filtered.filter(t => t.category === currentCategory);
  }

  if (keyword.trim() !== "") {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(keyword) ||
      t.content.toLowerCase().includes(keyword)
    );
  }

  // (Optional future) Favorites-only filter hook
  if (showingFavoritesOnly) {
    const favoriteCategories = JSON.parse(localStorage.getItem("favoriteCategories")) || [];
    filtered = filtered.filter(t => favoriteCategories.includes(t.category));
  }

  displayTips(filtered);
}

/***** Edit Tip *****/
let editTipId = null;
function openEdit(tip){
  document.getElementById("editTitle").value = tip.title;
  document.getElementById("editContent").value = tip.content;
  document.getElementById("editCategory").value = tip.category;
  editTipId = tip.id;
  document.getElementById("editModal").style.display = "flex";
}
function closeEdit(){
  document.getElementById("editModal").style.display = "none";
  editTipId = null;
}
document.getElementById("saveEditBtn").addEventListener("click", () => {
  const title = document.getElementById("editTitle").value.trim();
  const content = document.getElementById("editContent").value.trim();
  const category = document.getElementById("editCategory").value;
  if (!title || !content || !category) return;

  const idx = userTips.findIndex(t => t.id === editTipId);
  if (idx !== -1) {
    userTips[idx].title = title;
    userTips[idx].content = content;
    userTips[idx].category = category;
    localStorage.setItem("userTips", JSON.stringify(userTips));
    closeEdit();
    applyFilters();
  }
});

/***** Category button wiring *****/
categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentCategory = btn.dataset.category;
    // active visual state
    document.querySelectorAll("#categoryButtons .chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    applyFilters();
  });
});

/***** Search wiring (icon/mic button just triggers search focus or voice stub) *****/
const homepageSearchBtn = document.getElementById("homepageSearchBtn");
if (homepageSearchBtn) {
  homepageSearchBtn.addEventListener("click", () => {
    // For now, just focus input; you can hook Web Speech later.
    searchInput?.focus();
    applyFilters();
  });
}
searchInput?.addEventListener("input", applyFilters);

/***** Daily Tip *****/
function showDailyTip(){
  const today = new Date().toISOString().slice(0,10);
  const lastTipData = JSON.parse(localStorage.getItem("dailyTipData")) || {};
  if (lastTipData.date === today) return;

  const combined = allTipsNow();
  if (!combined.length) return;

  const randomTip = combined[Math.floor(Math.random() * combined.length)];
  document.getElementById("dailyTipText").textContent = `${randomTip.title}: ${randomTip.content}`;
  document.getElementById("dailyTipPopup").style.display = "block";

  localStorage.setItem("dailyTipData", JSON.stringify({ date: today, tipId: randomTip.id }));
}
function closeDailyTip(){ document.getElementById("dailyTipPopup").style.display = "none"; }

/***** Motivation Banner *****/
const motivationalQuotes = {
  mindset: [
    "Small steps every day lead to big results.",
    "Self-care is how you take your power back.",
    "Your thoughts shape your reality.",
    "Consistency beats intensity."
  ],
  nutrition: [
    "You are what you eat. Make it count.",
    "Let food be thy medicine.",
    "Eat well, feel well, live well.",
    "Healthy food = healthy mood."
  ],
  fitness: [
    "A 30-minute workout is just 2% of your day.",
    "Be better than you were yesterday.",
    "Move your body, change your mind.",
    "Discipline builds strength."
  ],
  default: [
    "Health is not a destination; it’s a journey.",
    "A healthy outside starts from the inside.",
    "Live strong, live long."
  ]
};
function updateMotivationalBanner(){
  const banner = document.getElementById("motivationBanner");
  const text = document.getElementById("motivationText");
  if (!banner || !text) return;

  let categoryList = banner.dataset.category
    ? banner.dataset.category.split(",").map(c => c.trim())
    : ["default"];

  let quotes = categoryList.flatMap(cat => motivationalQuotes[cat] || []);
  if (!quotes.length) quotes = motivationalQuotes["default"];

  let index = 0;
  text.textContent = quotes[index];

  setInterval(() => {
    index = (index + 1) % quotes.length;
    text.style.opacity = 0;
    setTimeout(() => {
      text.textContent = quotes[index];
      text.style.opacity = 1;
    }, 350);
  }, 6000);
}

/***** FAB wiring *****/
(function setupFAB(){
  const fab = document.getElementById("fab");
  const fabBtn = document.getElementById("fabBtn");
  const options = document.getElementById("fabOptions");
  fabBtn.addEventListener("click", () => fab.classList.toggle("open"));
  options.addEventListener("click", (e) => {
    const btn = e.target.closest(".fab-option");
    if (!btn) return;
    const action = btn.dataset.action;
    if (!action) return;

    switch(action) {
      case "toggle-theme":
        window.ThemeManager?.toggle();
        break;
      case "open-goals":
        openGoals();
        break;
      case "daily-challenge":
        triggerDailyChallengeToast();
        break;
      case "goto-favorites":
        location.href = "favorites.html";
        break;
      case "goto-suggest":
        location.href = "suggest.html";
        break;
      case "goto-help":
        location.href = "help.html";
        break;
      case "goto-trending":
        location.href = "trending.html";
        break;
    }
    fab.classList.remove("open");
  });
})();

/***** Daily Challenge Toast *****/
const dailyChallenges = [
  "Drink 6–8 cups of water today 💧",
  "Walk for at least 20 minutes 🚶‍♀️",
  "Avoid sugary drinks today 🚫🥤",
  "Do 10 minutes of deep breathing 🧘",
  "Prep one healthy meal 🍲"
];
function triggerDailyChallengeToast(){
  const toast = document.getElementById("challengeToast");
  const pick = dailyChallenges[Math.floor(Math.random()*dailyChallenges.length)];
  toast.textContent = `⚡ Daily Challenge: ${pick}`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}

/***** Goals Modal *****/
function openGoals(){
  document.getElementById("goalsModal").style.display = "flex";
  renderGoals();
}
document.getElementById("closeGoals").addEventListener("click", () => {
  document.getElementById("goalsModal").style.display = "none";
});

const goalsKey = "lite_goals";
function getGoals(){ return JSON.parse(localStorage.getItem(goalsKey)) || []; }
function saveGoals(arr){ localStorage.setItem(goalsKey, JSON.stringify(arr)); }
function renderGoals(){
  const list = document.getElementById("goalsList");
  const goals = getGoals();
  list.innerHTML = "";
  goals.forEach((g, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span><strong>${g.title}</strong> — Target: ${g.target}</span>
      <span>
        <button class="btn small" data-idx="${idx}" data-act="inc">+1</button>
        <button class="btn small danger" data-idx="${idx}" data-act="del">Delete</button>
      </span>
    `;
    list.appendChild(li);
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if(!btn) return;
    const idx = +btn.dataset.idx;
    const act = btn.dataset.act;
    const goals = getGoals();
    if (act === "del") {
      goals.splice(idx,1);
      saveGoals(goals);
      renderGoals();
    } else if (act === "inc") {
      goals[idx].progress = (goals[idx].progress || 0) + 1;
      saveGoals(goals);
      renderGoals();
    }
  }, { once: true });
}

document.getElementById("goalsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title  = document.getElementById("goalTitle").value.trim();
  const target = document.getElementById("goalTarget").value.trim();
  if (!title || !target) return;
  const goals = getGoals();
  goals.push({ title, target, progress: 0, createdAt: Date.now() });
  saveGoals(goals);
  (e.target).reset();
  renderGoals();
});

/***** Init *****/
window.addEventListener("load", () => {
  updateMotivationalBanner();
  showDailyTip();
  applyFilters();
});