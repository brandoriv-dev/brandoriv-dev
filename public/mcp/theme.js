(() => {
  const storageKey = "brandoriv-theme";
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const validChoice = (value) => ["light", "dark", "system"].includes(value) ? value : "system";
  let choice = "system";

  try {
    choice = validChoice(window.localStorage.getItem(storageKey));
  } catch {
    // A blocked storage API must not prevent a usable theme or sign-in.
  }

  function applyTheme() {
    const resolved = choice === "system" ? (system.matches ? "dark" : "light") : choice;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = choice;
    document.querySelectorAll("[data-theme-choice]").forEach((control) => {
      control.value = choice;
    });
    // The browser chrome colour follows the sidebar token so the stylesheet stays the only source of hex values.
    const sidebar = getComputedStyle(document.documentElement).getPropertyValue("--sidebar").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", sidebar || (resolved === "dark" ? "#161817" : "#1d201f"));
  }

  // This external, non-deferred script runs before the stylesheet and first paint.
  applyTheme();
  document.addEventListener("DOMContentLoaded", applyTheme, { once: true });
  document.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement) || !event.target.matches("[data-theme-choice]")) return;
    choice = validChoice(event.target.value);
    try {
      window.localStorage.setItem(storageKey, choice);
    } catch {
      // Keep the chosen theme for this page even when persistence is unavailable.
    }
    applyTheme();
  });
  system.addEventListener("change", () => {
    if (choice === "system") applyTheme();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) {
      choice = validChoice(event.newValue);
      applyTheme();
    }
  });
})();
