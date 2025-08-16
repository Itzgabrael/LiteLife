const tipContainer = document.getElementById("tipContainer");
const searchInput = document.getElementById("searchInput");
const suggestionsList = document.getElementById("searchSuggestions");
const categoryButtons = document.querySelectorAll("#categoryButtons button");
const savedFavorites = JSON.parse(localStorage.getItem("favoriteCategories")) || [];

let savedTips = JSON.parse(localStorage.getItem("savedTips")) || [];
let pinnedTipId = localStorage.getItem("pinnedTipId") || null;
let userTips = JSON.parse(localStorage.getItem("userTips")) || [];
let currentCategory = "All";
let showingFavoritesOnly = false;


// Function to display suggestions
function showSuggestions(query) {
  showSuggestions.innerHTML = "";
  if (!query.trim()) return;

  const matches = healthTips.filter(tip =>
    tip.title.toLowerCase().includes(query.toLowerCase())
  );

  matches.forEach(match => {
    const suggestion = document.createElement("div");
    suggestion.textContent = match.title;
    suggestion.addEventListener("click", () => {
      searchInput.value = match.title;
      suggestion.innerHTML = "";
      performSearch(match.title); // Your existing search function
    });

  });
}
// Listen for typing in search box
searchInput.addEventListener("input", (e) => {
  showSuggestions(e.target.value);
});

let tipReactions = JSON.parse(localStorage.getItem("tipReactions")) || {};
function saveReactions() {
  localStorage.setItem("tipReactions", JSON.stringify(tipReactions));
}
let reactedTips = JSON.parse(localStorage.getItem("reactedTips")) || {};

function saveReactedTips() {
  localStorage.setItem("reactedTips", JSON.stringify(reactedTips));
}



// Define allTips based on hardcoded + user tips
const allTips = [...(typeof healthTips !== "undefined" ? healthTips : []), ...userTips];

function saveToStorage() {
  localStorage.setItem("savedTips", JSON.stringify(savedTips));
} 

function displayTips(tips) {
  const tipCountEl = document.getElementById("tipCount");
  if (tipCountEl) {
    tipCountEl.textContent = `Showing ${tips.length} health tip${tips.length !== 1 ? "s" : ""}`;
  }

  tipContainer.innerHTML = "";

 // 📍 Sort: Pinned tip always first
tips.sort((a, b) => {
  if (a.id === pinnedTipId) return -1;
  if (b.id === pinnedTipId) return 1;
  return 0;
});

tips.forEach((tip) => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = tip.title;

    const content = document.createElement("p");
    content.textContent = tip.content;
    
    const btn = document.createElement("button");
    const isSaved = savedTips.includes(tip.id);
    btn.textContent = isSaved ? "Saved ✓ (Click to Unsave)" : "Save Tip";
    btn.classList.toggle("saved", isSaved);

    btn.addEventListener("click", () => {
       // Limit to 5 tips if not Premium
  if (!isSaved && savedTips.length >= 5 && !PremiumManager.isPremium()) {
    document.getElementById("premiumNotice").style.display = "block";
    return;
  }
      if (isSaved) {
        savedTips = savedTips.filter((id) => id !== tip.id);
      } else {
        savedTips.push(tip.id);
      }
      saveToStorage();
      applyFilters();
    });


// 📌 Pin Tip Button
const pinBtn = document.createElement("button");
pinBtn.textContent = tip.id === pinnedTipId ? "📍 Unpin" : "📌 Pin";
pinBtn.style.marginLeft = "10px";
pinBtn.style.background = "#f39c12";
pinBtn.style.color = "white";
pinBtn.style.border = "none";
pinBtn.style.borderRadius = "6px";
pinBtn.style.padding = "6px 12px";

pinBtn.addEventListener("click", () => {
  if (tip.id === pinnedTipId) {
    pinnedTipId = null;
    localStorage.removeItem("pinnedTipId");
  } else {
    pinnedTipId = tip.id;
    localStorage.setItem("pinnedTipId", pinnedTipId);
  }
  applyFilters(); // re-render tips
});

card.appendChild(pinBtn);
    // Check if it's a user tip
    const isUserTip = userTips.some((userTip) => userTip.id === tip.id);
    if (isUserTip) {
      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️ Edit";
      editBtn.style.marginRight = "10px";
      editBtn.style.background = "#3498db";
      editBtn.style.color = "white";
      editBtn.style.border = "none";
      editBtn.style.borderRadius = "6px";
      editBtn.style.padding = "6px 12px";
      editBtn.addEventListener("click", () => {
        openEdit(tip);
      });
      // 📤 Share Tip Button
const shareBtn = document.createElement("button");
shareBtn.textContent = "📤 Share";
shareBtn.style.marginRight = "10px";
shareBtn.style.background = "#2ecc71";
shareBtn.style.color = "white";
shareBtn.style.border = "none";
shareBtn.style.borderRadius = "6px";
shareBtn.style.padding = "6px 12px";

shareBtn.addEventListener("click", () => {
  const shareText = `${tip.title}: ${tip.content}`;
  if (navigator.share) {
    navigator.share({
      title: "LiteLife Tip",
      text: shareText,
    }).catch(console.error);
  } else {
    alert("Sharing is not supported on this browser.");
  }
});
// 💾 Download as Image Button
const downloadBtn = document.createElement("button");
downloadBtn.textContent = "💾 Download Image";
downloadBtn.style.background = "#f39c12";
downloadBtn.style.color = "white";
downloadBtn.style.border = "none";
downloadBtn.style.borderRadius = "6px";
downloadBtn.style.padding = "6px 12px";

downloadBtn.addEventListener("click", () => {
  html2canvas(card).then((canvas) => {
    const link = document.createElement("a");
    link.download = `${tip.title}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
});

          //Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑 Delete";
      deleteBtn.style.background = "#e74c3c";
      deleteBtn.style.color = "white";
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "6px";
      deleteBtn.style.padding = "6px 12px";

      deleteBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this tip?")) {
          userTips = userTips.filter((userTip) => userTip.id !== tip.id);
          localStorage.setItem("userTips", JSON.stringify(userTips));

          const savedIndex = savedTips.indexOf(tip.id);
          if (savedIndex !== -1) {
            savedTips.splice(savedIndex, 1);
            saveToStorage();
          }

          applyFilters();
        }
      });

      card.appendChild(editBtn);
      card.appendChild(shareBtn);
      card.appendChild(downloadBtn);
      card.appendChild(deleteBtn);
    }

    card.appendChild(title);
    card.appendChild(content);
    card.appendChild(btn);
    // 👍👎 Reaction Buttons
const reactionDiv = document.createElement("div");
reactionDiv.style.marginTop = "10px";

const likeBtn = document.createElement("button");
const dislikeBtn = document.createElement("button");

const tipStats = tipReactions[tip.id] || { likes: 0, dislikes: 0 };
likeBtn.textContent = `👍 ${tipStats.likes}`;
dislikeBtn.textContent = `👎 ${tipStats.dislikes}`;

[likeBtn, dislikeBtn].forEach((btn) => {
  btn.style.marginRight = "10px";
  btn.style.padding = "6px 12px";
  btn.style.border = "none";
  btn.style.borderRadius = "6px";
  btn.style.cursor = "pointer";
});

likeBtn.style.background = "#2ecc71";     // green
dislikeBtn.style.background = "#e74c3c";  // red
likeBtn.style.color = "white";
dislikeBtn.style.color = "white";

// Prevent spamming multiple reactions
const userReacted = reactedTips[tip.id]; // "like" | "dislike" | undefined

likeBtn.disabled = userReacted === "like";
dislikeBtn.disabled = userReacted === "dislike";

likeBtn.addEventListener("click", () => {
  if (!tipReactions[tip.id]) tipReactions[tip.id] = { likes: 0, dislikes: 0 };

  const currentReaction = reactedTips[tip.id];

  if (currentReaction === "like") {
    tipReactions[tip.id].likes -= 1;
    delete reactedTips[tip.id];
  } else {
    if (currentReaction === "dislike") {
      tipReactions[tip.id].dislikes -= 1;
    }
    tipReactions[tip.id].likes += 1;
    reactedTips[tip.id] = "like";
    //✅Record this as a trending interaction 
  }

  // 👇 Prevent going below zero
  tipReactions[tip.id].likes = Math.max(0, tipReactions[tip.id].likes);
  tipReactions[tip.id].dislikes = Math.max(0, tipReactions[tip.id].dislikes);

  saveReactions();
  saveReactedTips();
  applyFilters();//refresh UI
});

dislikeBtn.addEventListener("click", () => {
  if (!tipReactions[tip.id]) tipReactions[tip.id] = { likes: 0, dislikes: 0 };

  const currentReaction = reactedTips[tip.id];

  if (currentReaction === "dislike") {
    tipReactions[tip.id].dislikes -= 1;
    delete reactedTips[tip.id];
  } else {
    if (currentReaction === "like") {
      tipReactions[tip.id].likes -= 1;
    }
    tipReactions[tip.id].dislikes += 1;
    reactedTips[tip.id] = "dislike";
  }

  // 👇 Prevent going below zero
  tipReactions[tip.id].likes = Math.max(0, tipReactions[tip.id].likes);
  tipReactions[tip.id].dislikes = Math.max(0, tipReactions[tip.id].dislikes);

  saveReactions();
  saveReactedTips();
  applyFilters(); //refresh UI
});
reactionDiv.appendChild(likeBtn);
reactionDiv.appendChild(dislikeBtn);
card.appendChild(reactionDiv);
if (userReacted) {
  likeBtn.title = "You already reacted.";
  dislikeBtn.title = "You already reacted.";
}

    tipContainer.appendChild(card);
  });
}

function applyFilters() {
  const keyword = searchInput.value.toLowerCase();
  let filteredTips = [...(typeof healthTips !== "undefined" ? healthTips : []), ...userTips];

  if (currentCategory !== "All") {
    filteredTips = filteredTips.filter((tip) => tip.category === currentCategory);
  }

  if (keyword.trim() !== "") {
    filteredTips = filteredTips.filter(
      (tip) =>
        tip.title.toLowerCase().includes(keyword) ||
        tip.content.toLowerCase().includes(keyword)
    );
  }

  // 🧠 Favorite category filtering
  if (showingFavoritesOnly) {
    const favoriteCategories = JSON.parse(localStorage.getItem("favoriteCategories")) || [];
    filteredTips = filteredTips.filter((tip) => favoriteCategories.includes(tip.category));
  }

  displayTips(filteredTips);
}

// 📌 Listen to category filter
categoryButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentCategory = btn.dataset.category;
    applyFilters();
  });
});

// 📌 Listen to search input
searchInput.addEventListener("input", () => {
  applyFilters();
});

// 🎬 Initial load
applyFilters();

// ✏️ Edit functionality
let editTipId = null;

function openEdit(tip) {
  document.getElementById("editTitle").value = tip.title;
  document.getElementById("editContent").value = tip.content;
  document.getElementById("editCategory").value = tip.category;
  editTipId = tip.id;
  document.getElementById("editModal").style.display = "flex";
}

function closeEdit() {
  document.getElementById("editModal").style.display = "none";
  editTipId = null;
}

document.getElementById("saveEditBtn").addEventListener("click", () => {
  const title = document.getElementById("editTitle").value.trim();
  const content = document.getElementById("editContent").value.trim();
  const category = document.getElementById("editCategory").value;

  if (!title || !content || !category) return;

  const index = userTips.findIndex((tip) => tip.id === editTipId);
  if (index !== -1) {
    userTips[index].title = title;
    userTips[index].content = content;
    userTips[index].category = category;
    localStorage.setItem("userTips", JSON.stringify(userTips));
    closeEdit();
    applyFilters();
  }
});
// 💚 Toggle between All Tips and Favorite Categories
const toggleTipsBtn = document.getElementById("toggleTipsBtn");
if (toggleTipsBtn) {
  toggleTipsBtn.addEventListener("click", () => {
    showingFavoritesOnly = !showingFavoritesOnly;
    toggleTipsBtn.textContent = showingFavoritesOnly ? "📂 Show All Tips" : "💚 Show My Categories";
    applyFilters();
  });
}
function showDailyTip() {
  const today = new Date().toISOString().slice(0, 10);
  const lastTipData = JSON.parse(localStorage.getItem("dailyTipData")) || {};

  // Already shown today
  if (lastTipData.date === today) return;

  const combinedTips = [...(typeof healthTips !== "undefined" ? healthTips : []), ...userTips];
  if (combinedTips.length === 0) return;

  // Pick a random tip
  const randomTip = combinedTips[Math.floor(Math.random() * combinedTips.length)];
  document.getElementById("dailyTipText").textContent = `${randomTip.title}: ${randomTip.content}`;

  // Show popup
  document.getElementById("dailyTipPopup").style.display = "block";

  // Save today's tip
  localStorage.setItem("dailyTipData", JSON.stringify({
    date: today,
    tipId: randomTip.id
  }));
}

function closeDailyTip() {
  document.getElementById("dailyTipPopup").style.display = "none";
}
// 🎯 Trigger daily tip after app loads
window.addEventListener("load", () => {
  showDailyTip();
});
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
    "Fitness is not about being better than someone else. It’s about being better than you used to be.",
    "Move your body, change your mind.",
    "Discipline builds strength."
  ],
  default: [
    "Health is not a destination, it’s a journey.",
    "A healthy outside starts from the inside.",
    "Live strong, live long."
  ]
};

function updateMotivationalBanner() {
  const banner = document.getElementById("motivationBanner");
  const text = document.getElementById("motivationText");

  if (!banner || !text) return;

 let categoryList = banner.dataset.category
  ? banner.dataset.category.split(",").map(c => c.trim())
  : ["default"];

let quotes = categoryList.flatMap(cat => motivationalQuotes[cat] || []);
if (quotes.length === 0) {
  quotes = motivationalQuotes["default"];
}
  let index = 0;

  // Show first quote immediately
  text.textContent = quotes[index];
  
setInterval(() => {
  index = (index + 1) % quotes.length;

  text.style.opacity = 0;
  setTimeout(() => {
    text.textContent = quotes[index];
    text.style.opacity = 1;
  }, 500);
}, 6000);
}

if (document.getElementById("motivationText")) {
  updateMotivationalBanner();
}
/* ===== BOOSTER: FAB + Goals Tracker START ===== */

(function () {
  // --- Safe DOM refs
  const fabContainer = document.getElementById('fabContainer');
  const fabMain = document.getElementById('fabMain');
  const fabOptions = document.getElementById('fabOptions');
  const options = document.querySelectorAll('.fab-option');

  // Toggle FAB open/close
  fabMain.addEventListener('click', () => {
    fabContainer.classList.toggle('open');
    fabOptions.setAttribute('aria-hidden', fabContainer.classList.contains('open') ? 'false' : 'true');
  });

  // ----- Goals data (localStorage)
  let goals = JSON.parse(localStorage.getItem('healthGoals')) || [];

  function saveGoals() {
    localStorage.setItem('healthGoals', JSON.stringify(goals));
  }

  function renderGoals() {
    const list = document.getElementById('goalsList');
    if (!list) return;
    list.innerHTML = '';
    goals.forEach((g, i) => {
      const div = document.createElement('div');
      div.className = 'goal-item';
      div.innerHTML = `
        <div class="goal-info">
          <strong>${escapeHtml(g.title)}</strong>
          <div> ${g.progress} / ${g.target}</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${(g.target? (g.progress/g.target*100) : 0)}%"></div></div>
        </div>
        <div class="goal-actions">
          <button data-action="inc" data-index="${i}">+1</button>
          <button data-action="reset" data-index="${i}">Reset</button>
          <button data-action="remove" data-index="${i}">❌</button>
        </div>
      `;
      list.appendChild(div);
    });
  }

  // Escape to avoid injecting text
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // Add goal UI
  const addBtn = document.getElementById('addGoalBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const titleInput = document.getElementById('goalTitle');
      const targetInput = document.getElementById('goalTarget');
      const title = titleInput.value.trim();
      const target = parseInt(targetInput.value, 10);
      if (!title || !target || target <= 0) return alert('Please enter a valid title and target number.');
      goals.push({ title, target, progress: 0 });
      titleInput.value = '';
      targetInput.value = '';
      saveGoals();
      renderGoals();
    });
  }

  // Goals action delegation
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const idx = parseInt(btn.dataset.index, 10);
    if (Number.isNaN(idx)) return;
    if (action === 'inc') {
      goals[idx].progress = Math.min(goals[idx].progress + 1, goals[idx].target);
    } else if (action === 'reset') {
      goals[idx].progress = 0;
    } else if (action === 'remove') {
      goals.splice(idx, 1);
    }
    saveGoals();
    renderGoals();
  });

  // Modal open/close
  const goalsModal = document.getElementById('goalsModal');
  const closeGoalsModal = document.getElementById('closeGoalsModal');
  function openGoalsModal(){ if (goalsModal) { goalsModal.style.display = 'flex'; renderGoals(); } }
  function closeGoals(){ if (goalsModal) goalsModal.style.display = 'none'; }

  if (closeGoalsModal) closeGoalsModal.addEventListener('click', closeGoals);

  // wire fab actions
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const action = opt.dataset.action;
      fabContainer.classList.remove('open'); // close menu on action
      if (action === 'goals') {
        openGoalsModal();
      } else if (action === 'theme') {
        // prefer global toggle if provided (themeManager.js)
        if (typeof toggleTheme === 'function') toggleTheme();
        else {
          // fallback: simple toggle that adds/removes 'dark-mode' and persists
          const current = localStorage.getItem('theme') || 'light';
          const newTheme = current === 'light' ? 'dark' : 'light';
          localStorage.setItem('theme', newTheme);
          document.body.classList.toggle('dark-mode', newTheme === 'dark');
        }
      } else if (action === 'search') {
        const si = document.getElementById('searchInput');
        if (si) { si.focus(); si.scrollIntoView({behavior:'smooth', block:'center'}); }
      } else if (action === 'random') {
        // show a random tip (uses your existing tips array)
        const combined = [...(typeof healthTips !== 'undefined' ? healthTips : []), ...userTips];
        if (combined.length === 0) return alert('No tips available.');
        const t = combined[Math.floor(Math.random() * combined.length)];
        alert(`${t.title}\n\n${t.content}`);
      }
    });
  });

  // Close modal when clicking outside inner
  if (goalsModal) {
    goalsModal.addEventListener('click', (e) => {
      if (e.target === goalsModal) closeGoals();
    });
  }

  // init: apply theme from storage if not already applied
  (function applySavedTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-mode', saved === 'dark');
  })();

  // render initial goals if modal exists
  if (goalsModal && goals.length) renderGoals();
})();

/* ===== BOOSTER: FAB + Goals Tracker END ===== */
document.addEventListener("DOMContentLoaded", () => {
    const dailyChallengeBtn = document.querySelector('.fab-option[data-action="daily-challenge"]');
    const popup = document.getElementById("daily-challenge-popup");
    const challengeText = document.getElementById("challenge-text");
    const closePopup = document.getElementById("close-popup");

    const challenges = [
        "Drink 8 glasses of water today 💧",
        "Walk 5,000 steps 🏃‍♂️",
        "Do 15 push-ups 💪",
        "Meditate for 10 minutes 🧘",
        "Eat at least 3 servings of vegetables 🥦",
        "Stretch for 5 minutes after waking up 🤸‍♀️",
        "Avoid sugary drinks today 🚫🥤"
    ];

    // Show popup when button clicked
    dailyChallengeBtn.addEventListener("click", () => {
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        challengeText.textContent = randomChallenge;
        popup.classList.add("show");

        // Auto hide after 8 seconds
        setTimeout(() => {
            popup.classList.remove("show");
        }, 8000);
    });

    // Close button
    closePopup.addEventListener("click", () => {
        popup.classList.remove("show");
    });
});
function renderTrendingTips() {
  let tips = JSON.parse(localStorage.getItem("tips")) || [];

  // Calculate trending score (likes + saves + views)
  tips.forEach(tip => {
    tip.trendingScore = (tip.likes || 0) + (tip.saves || 0) + (tip.views || 0);
  });

  // Sort highest score first
  tips.sort((a, b) => b.trendingScore - a.trendingScore);

  let container = document.getElementById("trending-container");
  if (!container) return;

  container.innerHTML = tips.length
    ? tips.map(tip => `
      <div class="tip-card">
        <h3>${tip.title}</h3>
        <p>${tip.category}</p>
        <small>🔥 Score: ${tip.trendingScore}</small>
      </div>
    `).join("")
    : `<p>No tips available yet.</p>`;
}