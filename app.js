const tipContainer = document.getElementById("tipContainer");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll("#categoryButtons button");

let savedTips = JSON.parse(localStorage.getItem("savedTips")) || [];
let pinnedTipId = localStorage.getItem("pinnedTipId") || null;
let userTips = JSON.parse(localStorage.getItem("userTips")) || [];
let currentCategory = "All";
let showingFavoritesOnly = false;
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