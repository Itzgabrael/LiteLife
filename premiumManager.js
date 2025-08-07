// premiumManager.js 🔐 LiteLife Premium Logic

const PremiumManager = {
  isPremium: () => {
    return localStorage.getItem("isPremium") === "true";  // By default = false
  },
  activatePremium: () => {
    localStorage.setItem("isPremium", "true");
    alert("✅ LiteLife Premium Activated!");
  },
  deactivatePremium: () => {
    localStorage.setItem("isPremium", "false");
    alert("❌ Premium Deactivated.");
  }
};