// Vendored from @brandoriv/moss revision e8e0f10.
export { MossTheme, MossThemeProvider, DEFAULT_THEME, MossThemePresets } from "./theme.js";
const listen = (target, event, handler, options) => { target.addEventListener(event, handler, options); return () => target.removeEventListener(event, handler, options); };

class MossRail extends HTMLElement {
  connectedCallback() {
    const toggle = this.querySelector("[data-rail-toggle]");
    if (!toggle || this.cleanup) return;
    const key = this.getAttribute("persist-key");
    if (key && localStorage.getItem(key) === "collapsed") this.setAttribute("collapsed", "");
    const sync = () => {
      const collapsed = this.hasAttribute("collapsed");
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.setAttribute("aria-label", collapsed ? "Expand navigation" : "Collapse navigation");
      if (key) localStorage.setItem(key, collapsed ? "collapsed" : "expanded");
    };
    this.cleanup = listen(toggle, "click", () => { this.toggleAttribute("collapsed"); sync(); });
    sync();
  }
  disconnectedCallback() { this.cleanup?.(); this.cleanup = null; }
}

class MossToastStack extends HTMLElement {
  connectedCallback() { this.setAttribute("aria-live", this.getAttribute("aria-live") || "polite"); this.setAttribute("aria-atomic", "false"); this.cleanup = listen(window, "moss-toast", ({ detail }) => this.push(detail)); }
  disconnectedCallback() { this.cleanup?.(); }
  push(detail = {}) {
    const toast = document.createElement("div"); toast.className = "moss-toast"; toast.setAttribute("role", detail.tone === "critical" ? "alert" : "status");
    const message = document.createElement("span"); message.textContent = detail.message || "Done";
    const close = document.createElement("button"); close.type = "button"; close.setAttribute("aria-label", "Dismiss notification"); close.textContent = "×"; close.addEventListener("click", () => toast.remove(), { once: true });
    toast.append(message, close); this.append(toast); setTimeout(() => toast.remove(), Number(detail.duration) || 4000);
  }
}

if(!customElements.get("moss-rail")) customElements.define("moss-rail", MossRail);
if(!customElements.get("moss-toast-stack")) customElements.define("moss-toast-stack", MossToastStack);
export { MossRail, MossToastStack };
