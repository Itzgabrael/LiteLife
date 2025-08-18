(function(){
  const THEME_KEY = "lite_theme"; // "light" | "dark"

  function applyTheme(theme){
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }

  function detectInitial(){
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    // system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? "dark" : "light";
  }

  function toggle(){
    const current = localStorage.getItem(THEME_KEY) || detectInitial();
    applyTheme(current === "dark" ? "light" : "dark");
  }

  // Expose
  window.ThemeManager = { toggle, applyTheme };

  // Initialize
  applyTheme(detectInitial());

  // Hook header toggle button if present
  document.getElementById("themeToggle")?.addEventListener("click", toggle);
})();