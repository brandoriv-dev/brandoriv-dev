export { MossTheme, MossThemeProvider, createMossTheme, DEFAULT_THEME } from "./theme.js";
export { MossIcon, MOSS_ICON_NAMES, registerIconPack, setIconPack, getIconPack, listIconPacks, describeIconPack, iconMarkup } from "./icons.js";

import { registerIconPack, iconMarkup } from "./icons.js";
import { iconoir } from "./icon-packs/iconoir.js";

// Iconoir is the default pack, not a requirement. Register another pack and
// call setIconPack to replace every icon at once. See design/icons.md.
registerIconPack(iconoir);

const listen = (target, event, handler, options) => {
  target.addEventListener(event, handler, options);
  return () => target.removeEventListener(event, handler, options);
};

class MossDisclosure extends HTMLElement {
  connectedCallback() {
    const trigger = this.querySelector(":scope > button:first-child");
    const panel = this.querySelector(":scope > [data-panel]");
    if (!trigger || !panel || this.cleanup) return;
    if (!panel.id) panel.id = `moss-disclosure-${crypto.randomUUID()}`;
    trigger.setAttribute("aria-controls", panel.id);
    trigger.setAttribute("aria-expanded", String(!panel.hidden));
    this.cleanup = listen(trigger, "click", () => {
      const open = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
    });
  }
  disconnectedCallback() { this.cleanup?.(); this.cleanup = null; }
}

class MossRail extends HTMLElement {
  connectedCallback() {
    const toggle = this.querySelector("[data-rail-toggle]");
    const themeRoot = this.closest("[data-moss-rail-collapsible]") || document.documentElement;
    if (themeRoot.dataset.mossRailCollapsible === "false") { this.removeAttribute("collapsed"); return; }
    if (this.cleanup) return;
    const key = this.getAttribute("persist-key");
    let persisted = null;
    try { persisted = key ? localStorage.getItem(key) : null; } catch { /* storage is optional */ }
    // A persisted user choice is stronger than the host's first-load default.
    if (persisted === "collapsed") this.setAttribute("collapsed", "");
    else if (persisted === "expanded") this.removeAttribute("collapsed");
    else if (this.hasAttribute("default-collapsed") || this.dataset.defaultCollapsed === "true") this.setAttribute("collapsed", "");
    else if (this.hasAttribute("expanded")) this.removeAttribute("collapsed");
    const sync = (persist = false) => {
      const collapsed = this.hasAttribute("collapsed");
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(!collapsed));
        toggle.setAttribute("aria-label", collapsed ? "Expand navigation" : "Collapse navigation");
        toggle.querySelector("moss-icon")?.setAttribute("name", collapsed ? "expand-rail" : "collapse-rail");
      }
      this.dataset.state = collapsed ? "collapsed" : "expanded";
      if (persist && key) try { localStorage.setItem(key, collapsed ? "collapsed" : "expanded"); } catch { /* storage is optional */ }
    };
    this.cleanup = toggle ? listen(toggle, "click", () => { this.toggleAttribute("collapsed"); sync(true); }) : () => {};
    sync();
  }
  disconnectedCallback() { this.cleanup?.(); this.cleanup = null; }
}

// A role=switch has no native toggle behavior. Moss supplies only that small
// interaction; product state remains the host's responsibility.
const toggleRoleSwitch = (control) => {
  if (control.getAttribute("aria-disabled") === "true" || control.dataset.state === "busy") return;
  const next = control.getAttribute("aria-checked") !== "true";
  control.setAttribute("aria-checked", String(next));
  control.dispatchEvent(new Event("input", { bubbles: true }));
  control.dispatchEvent(new Event("change", { bubbles: true }));
};
document.addEventListener("click", (event) => {
  const control = event.target.closest?.('.moss-switch[role="switch"]');
  if (control) toggleRoleSwitch(control);
});
document.addEventListener("keydown", (event) => {
  const control = event.target.closest?.('.moss-switch[role="switch"]');
  // Native buttons synthesize click for Enter. Handling Enter here as well would
  // toggle twice; Space is the ARIA switch keyboard contract for every host.
  if (control && event.key === " ") { event.preventDefault(); toggleRoleSwitch(control); }
});

// A stable chart host remembers that its one-shot line draw completed. Products can
// replace the SVG marks for a range change without replaying the entrance motion.
document.addEventListener("animationend", (event) => {
  if (event.animationName !== "moss-chart-draw" || event.target?.dataset?.draw !== "once") return;
  const chart = event.target.closest?.(".moss-chart");
  if (chart) chart.dataset.drawn = "true";
});

class MossMenu extends HTMLElement {
  connectedCallback() {
    const trigger = this.querySelector("[data-menu-trigger]");
    const menu = this.querySelector("[data-menu]");
    if (!trigger || !menu || this.cleanups) return;
    if (!menu.id) menu.id = `moss-menu-${crypto.randomUUID()}`;
    trigger.setAttribute("aria-controls", menu.id);
    trigger.setAttribute("aria-haspopup", "menu");
    const close = (focus = false) => { menu.hidden = true; trigger.setAttribute("aria-expanded", "false"); if (focus) trigger.focus(); };
    const open = () => { menu.hidden = false; trigger.setAttribute("aria-expanded", "true"); menu.querySelector("button,a,[tabindex]")?.focus(); };
    this.cleanups = [
      listen(trigger, "click", () => menu.hidden ? open() : close()),
      listen(document, "pointerdown", (event) => { if (!this.contains(event.target)) close(); }),
      listen(this, "keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); close(true); } })
    ];
    close();
  }
  disconnectedCallback() { this.cleanups?.forEach((cleanup) => cleanup()); this.cleanups = null; }
}

class MossToastStack extends HTMLElement {
  connectedCallback() {
    this.setAttribute("aria-live", this.getAttribute("aria-live") || "polite");
    this.setAttribute("aria-atomic", "false");
    this.cleanup = listen(window, "moss-toast", ({ detail }) => this.push(detail));
  }
  disconnectedCallback() { this.cleanup?.(); }
  push(detail = {}) {
    const toast = document.createElement("div");
    toast.className = "moss-toast";
    toast.setAttribute("role", detail.tone === "critical" ? "alert" : "status");
    const message = document.createElement("span");
    message.textContent = detail.message || "Done";
    const close = document.createElement("button");
    close.type = "button"; close.setAttribute("aria-label", "Dismiss notification"); close.innerHTML = iconMarkup("close");
    close.addEventListener("click", () => toast.remove(), { once: true });
    toast.append(message, close); this.append(toast);
    setTimeout(() => toast.remove(), Number(detail.duration) || 4000);
  }
}

class MossTabs extends HTMLElement {
  connectedCallback() {
    if (this.cleanup) return;
    const tabs=[...this.querySelectorAll('[role="tab"]')],panels=[...this.querySelectorAll('[role="tabpanel"]')];
    const select=(tab,focus=false)=>{tabs.forEach(item=>{const active=item===tab;item.setAttribute("aria-selected",String(active));item.tabIndex=active?0:-1;});panels.forEach(panel=>panel.hidden=panel.id!==tab.getAttribute("aria-controls"));if(focus)tab.focus();};
    const handler=event=>{const tab=event.target.closest('[role="tab"]');if(!tab||!this.contains(tab))return;if(event.type==="click")select(tab);if(event.type==="keydown"&&["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){event.preventDefault();let index=tabs.indexOf(tab);if(event.key==="ArrowRight")index=(index+1)%tabs.length;if(event.key==="ArrowLeft")index=(index-1+tabs.length)%tabs.length;if(event.key==="Home")index=0;if(event.key==="End")index=tabs.length-1;select(tabs[index],true);}};
    tabs.forEach((tab,index)=>{if(!tab.id)tab.id=`moss-tab-${crypto.randomUUID()}`;const panel=panels[index];if(panel){if(!panel.id)panel.id=`moss-panel-${crypto.randomUUID()}`;tab.setAttribute("aria-controls",panel.id);panel.setAttribute("aria-labelledby",tab.id);}});
    this.addEventListener("click",handler);this.addEventListener("keydown",handler);this.cleanup=()=>{this.removeEventListener("click",handler);this.removeEventListener("keydown",handler);};select(tabs.find(tab=>tab.getAttribute("aria-selected")==="true")||tabs[0]);
  }
  disconnectedCallback(){this.cleanup?.();this.cleanup=null;}
}

/**
 * Tabs that change which records a surface shows. Unlike moss-tabs there is no
 * panel to swap: the surface stays put and the host reloads its own rows when
 * moss-view-change fires. Point `controls` at that surface so the selected tab
 * names it for assistive technology.
 */
class MossViewTabs extends HTMLElement {
  connectedCallback() {
    if (this.cleanup) return;
    if (!this.querySelector('[role="tablist"]')) return;
    const panel = document.getElementById(this.getAttribute("controls") || "");
    if (panel) {
      if (!panel.id) panel.id = `moss-view-panel-${crypto.randomUUID()}`;
      panel.setAttribute("role", "tabpanel");
    }
    const tabs = () => [...this.querySelectorAll('[role="tab"]')];
    this.select = (tab, { focus = false, notify = false, reveal = false } = {}) => {
      if (!tab) return;
      if (!tab.id) tab.id = `moss-view-tab-${crypto.randomUUID()}`;
      for (const item of tabs()) {
        const active = item === tab;
        item.setAttribute("aria-selected", String(active));
        item.tabIndex = active ? 0 : -1;
        if (panel && active) { item.setAttribute("aria-controls", panel.id); panel.setAttribute("aria-labelledby", item.id); }
      }
      if (reveal) tab.scrollIntoView({ block: "nearest", inline: "nearest" });
      if (focus) tab.focus();
      if (notify) this.dispatchEvent(new CustomEvent("moss-view-change", { bubbles: true, detail: { view: this.value } }));
    };
    const handler = (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (!tab || !this.contains(tab)) return;
      if (event.type === "click") { this.select(tab, { notify: true, reveal: true }); return; }
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const items = tabs();
      let index = items.indexOf(tab);
      if (event.key === "ArrowRight") index = (index + 1) % items.length;
      if (event.key === "ArrowLeft") index = (index - 1 + items.length) % items.length;
      if (event.key === "Home") index = 0;
      if (event.key === "End") index = items.length - 1;
      this.select(items[index], { focus: true, notify: true, reveal: true });
    };
    this.addEventListener("click", handler);
    this.addEventListener("keydown", handler);
    this.cleanup = () => { this.removeEventListener("click", handler); this.removeEventListener("keydown", handler); };
    this.select(tabs().find((tab) => tab.getAttribute("aria-selected") === "true") || tabs()[0]);
  }
  disconnectedCallback() { this.cleanup?.(); this.cleanup = null; }
  get value() { return this.querySelector('[role="tab"][aria-selected="true"]')?.dataset.view ?? null; }
  set value(view) { this.select?.(this.querySelector(`[role="tab"][data-view="${CSS.escape(String(view))}"]`)); }
  /** Counts describe the host's data, so the host keeps them current. Zero stays blank. */
  setCount(view, count, tone) {
    const slot = this.querySelector(`[role="tab"][data-view="${CSS.escape(String(view))}"] [data-count]`);
    if (!slot) return;
    slot.textContent = count ? String(count) : "";
    if (tone) slot.dataset.tone = tone; else delete slot.dataset.tone;
  }
}

/**
 * Chips that hold the active query on the surface they filter, so there is no
 * detached filter bar and nothing to submit. Each chip owns a menu the host
 * fills; Moss owns opening, closing, keyboard, and the clear affordance.
 * Hosts listen for moss-filter-change and moss-filter-clear.
 */
class MossFilterChips extends HTMLElement {
  connectedCallback() {
    if (this.cleanups) return;
    for (const trigger of this.querySelectorAll("[data-chip]")) {
      const menu = this.menuFor(trigger.dataset.chip);
      if (!menu) continue;
      if (!menu.id) menu.id = `moss-chip-menu-${crypto.randomUUID()}`;
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-controls", menu.id);
      trigger.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    }
    const onClick = (event) => {
      const clear = event.target.closest("[data-chip-clear]");
      if (clear && this.contains(clear)) {
        this.close();
        this.set(clear.dataset.chipClear, "");
        this.dispatchEvent(new CustomEvent("moss-filter-clear", { bubbles: true, detail: { name: clear.dataset.chipClear } }));
        return;
      }
      const apply = event.target.closest("[data-chip-apply]");
      if (apply && this.contains(apply)) {
        const name = apply.closest("[data-chip-menu]")?.dataset.chipMenu;
        this.close();
        this.dispatchEvent(new CustomEvent("moss-filter-change", {
          bubbles: true,
          detail: { name, value: apply.dataset.chipValue ?? null, label: apply.dataset.chipLabel ?? apply.textContent.trim() }
        }));
        return;
      }
      const trigger = event.target.closest("[data-chip]");
      if (trigger && this.contains(trigger)) this.toggle(trigger.dataset.chip);
    };
    const onKeydown = (event) => {
      if (event.key !== "Escape" || !this.openChip) return;
      event.preventDefault();
      const name = this.openChip;
      this.close();
      this.querySelector(`[data-chip="${CSS.escape(name)}"]`)?.focus();
    };
    this.addEventListener("click", onClick);
    this.addEventListener("keydown", onKeydown);
    this.cleanups = [
      () => this.removeEventListener("click", onClick),
      () => this.removeEventListener("keydown", onKeydown),
      listen(document, "pointerdown", (event) => { if (!this.contains(event.target)) this.close(); })
    ];
  }
  disconnectedCallback() { this.cleanups?.forEach((cleanup) => cleanup()); this.cleanups = null; }
  menuFor(name) { return name ? this.querySelector(`[data-chip-menu="${CSS.escape(name)}"]`) : null; }
  toggle(name) { return this.openChip === name ? this.close() : this.show(name); }
  show(name) {
    this.close();
    const menu = this.menuFor(name);
    if (!menu) return;
    menu.hidden = false;
    this.openChip = name;
    this.querySelector(`[data-chip="${CSS.escape(name)}"]`)?.setAttribute("aria-expanded", "true");
    menu.querySelector("input, select, button, a, [tabindex]")?.focus();
  }
  close() {
    for (const menu of this.querySelectorAll("[data-chip-menu]")) menu.hidden = true;
    for (const trigger of this.querySelectorAll("[data-chip]")) trigger.setAttribute("aria-expanded", "false");
    this.openChip = null;
  }
  /** An empty value returns the chip to its resting label and hides the clear control. */
  set(name, label) {
    const trigger = this.querySelector(`[data-chip="${CSS.escape(String(name))}"]`);
    const chip = trigger?.closest(".moss-chip");
    if (!chip) return;
    const slot = trigger.querySelector("[data-chip-text]");
    if (slot) slot.textContent = label || slot.dataset.chipEmpty || "Any";
    chip.dataset.state = label ? "active" : "idle";
  }
}

class MossDialog extends HTMLElement {
  connectedCallback(){if(this.cleanups)return;const dialog=this.querySelector("dialog"),openers=document.querySelectorAll(`[data-dialog-open="${this.id}"]`),closers=this.querySelectorAll("[data-dialog-close]");if(!dialog)return;this.cleanups=[...openers].map(button=>listen(button,"click",()=>dialog.showModal()));this.cleanups.push(...[...closers].map(button=>listen(button,"click",()=>dialog.close())));this.cleanups.push(listen(dialog,"click",event=>{if(event.target===dialog)dialog.close();}));}
  disconnectedCallback(){this.cleanups?.forEach(cleanup=>cleanup());this.cleanups=null;}
}

customElements.define("moss-disclosure", MossDisclosure);
customElements.define("moss-rail", MossRail);
customElements.define("moss-menu", MossMenu);
customElements.define("moss-toast-stack", MossToastStack);
customElements.define("moss-tabs", MossTabs);
customElements.define("moss-view-tabs", MossViewTabs);
customElements.define("moss-filter-chips", MossFilterChips);
customElements.define("moss-dialog", MossDialog);

export { MossDisclosure, MossRail, MossMenu, MossToastStack, MossTabs, MossViewTabs, MossFilterChips, MossDialog };
