(() => {
  const storageKey = "brandoriv-theme";
  const conceptStorageKey = "brandoriv-dashboard-concept";
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const validChoice = (value) => ["light", "dark", "system"].includes(value) ? value : "system";
  const validConcept = (value) => ["a", "b", "c"].includes(value) ? value : "a";
  const concepts = {
    a: { index: "A", name: "Command Deck", description: "Balanced operational scan with a persistent rail and a clear performance story." },
    b: { index: "B", name: "Field Guide", description: "Calm, document-first workspace with warm surfaces and top-level navigation." },
    c: { index: "C", name: "Control Room", description: "Dense technical workspace with sharp geometry and more data above the fold." },
  };
  let choice = "system";
  let concept = "a";

  try {
    choice = validChoice(window.localStorage.getItem(storageKey));
  } catch {
    // A blocked storage API must not prevent a usable theme or sign-in.
  }

  try {
    const requested = new URLSearchParams(window.location.search).get("concept");
    concept = validConcept(requested || window.localStorage.getItem(conceptStorageKey));
    if (requested) window.localStorage.setItem(conceptStorageKey, concept);
  } catch {
    concept = "a";
  }

  function applyTheme() {
    const resolved = choice === "system" ? (system.matches ? "dark" : "light") : choice;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = choice;
    document.querySelectorAll("[data-theme-toggle]").forEach((control) => {
      control.setAttribute("aria-pressed", String(resolved === "dark"));
      control.setAttribute("aria-label", `Switch to ${resolved === "dark" ? "light" : "dark"} mode`);
      control.querySelector("[data-theme-label]")?.replaceChildren(resolved === "dark" ? "Light" : "Dark");
    });
    // The browser chrome colour follows the sidebar token so the stylesheet stays the only source of hex values.
    const sidebar = getComputedStyle(document.documentElement).getPropertyValue("--sidebar").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", sidebar || (resolved === "dark" ? "#161817" : "#1d201f"));
  }

  function applyConcept(updateUrl = false) {
    const selected = concepts[concept];
    document.documentElement.dataset.concept = concept;
    document.querySelectorAll("[data-concept-choice]").forEach((control) => {
      const active = control.getAttribute("data-concept-choice") === concept;
      control.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-concept-index]").forEach((element) => element.replaceChildren(selected.index));
    document.querySelectorAll("[data-concept-name]").forEach((element) => element.replaceChildren(selected.name));
    document.querySelectorAll("[data-concept-description]").forEach((element) => element.replaceChildren(selected.description));
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("concept", concept);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  // This external, non-deferred script runs before the stylesheet and first paint.
  applyConcept();
  applyTheme();
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    applyConcept();
  }, { once: true });
  document.addEventListener("click", (event) => {
    const conceptControl = event.target instanceof Element ? event.target.closest("[data-concept-choice]") : null;
    if (conceptControl) {
      concept = validConcept(conceptControl.getAttribute("data-concept-choice"));
      try {
        window.localStorage.setItem(conceptStorageKey, concept);
      } catch {
        // A private browsing policy may block persistence; the current page still updates.
      }
      applyConcept(true);
      applyTheme();
      return;
    }
    const control = event.target instanceof Element ? event.target.closest("[data-theme-toggle]") : null;
    if (!control) return;
    choice = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
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
    if (event.key === conceptStorageKey || event.key === null) {
      concept = validConcept(event.newValue);
      applyConcept();
      applyTheme();
    }
  });
})();
