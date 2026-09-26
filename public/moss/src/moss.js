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

const moveIndex = (key, index, length) => {
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return (index + (["ArrowUp", "ArrowLeft"].includes(key) ? -1 : 1) + length) % length;
};

const backdropClick = (event, dialog) => {
  if (event.target !== dialog) return false;
  const bounds = dialog.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
};

// Native top-layer surfaces escape table and chip scrolling containers.
const positionAnchored = (popup, trigger) => {
  if (matchMedia("(max-width: 44rem)").matches) return;
  const anchor = trigger.getBoundingClientRect();
  const bounds = popup.getBoundingClientRect();
  popup.style.left = `${Math.max(8, Math.min(anchor.left, innerWidth - bounds.width - 8))}px`;
  popup.style.top = `${Math.max(8, anchor.bottom + bounds.height + 6 > innerHeight ? anchor.top - bounds.height - 6 : anchor.bottom + 6)}px`;
};
const showAnchored = (popup, trigger) => { popup.hidden = false; popup.setAttribute("popover", "manual"); popup.showPopover(); positionAnchored(popup, trigger); };
const hideAnchored = (popup) => { if (popup.hasAttribute("popover")) popup.hidePopover(); popup.hidden = true; popup.style.removeProperty("left"); popup.style.removeProperty("top"); };

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
  // Native buttons synthesize click for both Enter and Space. Only custom hosts
  // need Moss to provide Space activation.
  if (control && control.localName !== "button" && event.key === " ") { event.preventDefault(); toggleRoleSwitch(control); }
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
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", trigger.textContent.trim() || trigger.getAttribute("aria-label") || "Actions");
    const items = () => [...menu.querySelectorAll("button:not(:disabled),a[href]")];
    items().forEach((item) => { item.setAttribute("role", "menuitem"); item.tabIndex = -1; });
    const close = (focus = false) => { hideAnchored(menu); trigger.setAttribute("aria-expanded", "false"); if (focus) trigger.focus(); };
    const open = (last = false) => { showAnchored(menu, trigger); trigger.setAttribute("aria-expanded", "true"); items().at(last ? -1 : 0)?.focus(); };
    this.cleanups = [
      listen(trigger, "click", () => menu.hidden ? open() : close()),
      listen(document, "pointerdown", (event) => { if (!this.contains(event.target)) close(); }),
      listen(menu, "click", (event) => { if (event.target.closest('[role="menuitem"]')) close(true); }),
      listen(window, "resize", () => close()),
      listen(document, "scroll", (event) => { if (!menu.hidden && !menu.contains(event.target)) positionAnchored(menu, trigger); }, true),
      listen(this, "keydown", (event) => {
        if (event.key === "Escape") { event.preventDefault(); close(true); }
        if (event.key === "Tab") close(true);
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          if (event.target === trigger) open(event.key === "ArrowUp" || event.key === "End");
          else { const options = items(); options[moveIndex(event.key, options.indexOf(document.activeElement), options.length)]?.focus(); }
        }
      })
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
    const owns = (element) => element.parentElement.closest('moss-tabs, moss-view-tabs, [role="tabpanel"]') === this;
    const tabs = [...this.querySelectorAll('[role="tab"]')].filter(owns);
    const panels = [...this.querySelectorAll('[role="tabpanel"]')].filter(owns);
    if (!tabs.length) return;
    const select = (tab, focus = false) => {
      tabs.forEach((item) => { const active = item === tab; item.setAttribute("aria-selected", String(active)); item.tabIndex = active ? 0 : -1; });
      panels.forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute("aria-controls"); });
      if (focus) { tab.focus(); tab.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    };
    const handler = (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (!tabs.includes(tab)) return;
      if (event.type === "click") select(tab);
      if (event.type === "keydown" && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault(); select(tabs[moveIndex(event.key, tabs.indexOf(tab), tabs.length)], true);
      }
    };
    tabs.forEach((tab, index) => {
      if (!tab.id) tab.id = 'moss-tab-' + crypto.randomUUID();
      const panel = panels[index];
      if (panel) { if (!panel.id) panel.id = 'moss-panel-' + crypto.randomUUID(); tab.setAttribute("aria-controls", panel.id); panel.setAttribute("aria-labelledby", tab.id); }
    });
    this.cleanup = () => { offClick(); offKey(); };
    const offClick = listen(this, "click", handler), offKey = listen(this, "keydown", handler);
    select(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0]);
  }
  disconnectedCallback() { this.cleanup?.(); this.cleanup = null; }
}


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
      const index = moveIndex(event.key, items.indexOf(tab), items.length);
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
      trigger.setAttribute("aria-haspopup", "dialog");
      menu.setAttribute("role", "dialog");
      menu.setAttribute("aria-label", trigger.textContent.trim());
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
    const trigger = this.querySelector(`[data-chip="${CSS.escape(name)}"]`);
    showAnchored(menu, trigger);
    this.openChip = name;
    this.querySelector(`[data-chip="${CSS.escape(name)}"]`)?.setAttribute("aria-expanded", "true");
    menu.querySelector("input, select, button, a, [tabindex]")?.focus();
  }
  close() {
    for (const menu of this.querySelectorAll("[data-chip-menu]")) hideAnchored(menu);
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
  connectedCallback() {
    if (this.cleanups) return;
    const dialog = this.querySelector("dialog");
    if (!dialog || !this.id) return;
    const openers = document.querySelectorAll(`[data-dialog-open="${CSS.escape(this.id)}"]`);
    this.cleanups = [...openers].map((button) => listen(button, "click", () => dialog.showModal()));
    this.cleanups.push(...[...this.querySelectorAll("[data-dialog-close]")].map((button) => listen(button, "click", () => dialog.close())));
    this.cleanups.push(listen(dialog, "click", (event) => { if (backdropClick(event, dialog)) dialog.close(); }));
  }
  disconnectedCallback() { this.cleanups?.forEach((cleanup) => cleanup()); this.cleanups = null; }
}

/**
 * A bounded multi-select combobox. The host authors the available options and
 * Moss owns filtering, token removal, listbox focus, and change notification.
 */
class MossTokenField extends HTMLElement {
  connectedCallback() {
    if (this.cleanups) return;
    this.input = this.querySelector("[data-token-input]");
    this.options = this.querySelector("[data-token-options]");
    this.status = this.querySelector("[data-token-status]");
    if (!this.input || !this.options) return;
    if (!this.options.id) this.options.id = `moss-token-options-${crypto.randomUUID()}`;
    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-autocomplete", "list");
    this.input.setAttribute("aria-controls", this.options.id);
    this.input.setAttribute("aria-expanded", "false");
    const onInput = () => this.filter(this.input.value);
    const onFocus = () => this.filter(this.input.value);
    const onClick = (event) => {
      const option = event.target.closest("[data-token-value]");
      if (option && !option.hidden && !this.options.hidden && this.options.contains(option)) this.add(option.dataset.tokenValue, option.dataset.tokenLabel || option.textContent.trim());
      const remove = event.target.closest("[data-token-remove]");
      if (remove && this.contains(remove)) this.remove(remove.closest("[data-token]"));
    };
    const onKeydown = (event) => {
      const visible = this.visibleOptions();
      if (event.key === "Escape") { this.close(); this.input.focus(); return; }
      if (event.target === this.input && event.key === "Backspace" && !this.input.value) {
        const token = [...this.querySelectorAll("[data-token]")].at(-1);
        if (token) { event.preventDefault(); this.remove(token); }
      }
      if (event.target === this.input && event.key === "Enter" && visible.length && !event.isComposing) {
        event.preventDefault();
        const option = visible[0];
        this.add(option.dataset.tokenValue, option.dataset.tokenLabel || option.textContent.trim());
      }
      if (event.target === this.input && event.key === "ArrowDown" && visible.length) { event.preventDefault(); visible[0].focus(); }
      if (event.target.matches?.("[data-token-value]") && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        visible[moveIndex(event.key, visible.indexOf(event.target), visible.length)]?.focus();
      }
    };
    this.input.addEventListener("input", onInput);
    this.input.addEventListener("focus", onFocus);
    this.addEventListener("click", onClick);
    this.addEventListener("keydown", onKeydown);
    this.cleanups = [
      () => this.input.removeEventListener("input", onInput),
      () => this.input.removeEventListener("focus", onFocus),
      () => this.removeEventListener("click", onClick),
      () => this.removeEventListener("keydown", onKeydown),
      listen(document, "pointerdown", (event) => { if (!this.contains(event.target)) this.close(); })
    ];
    this.sync();
  }
  disconnectedCallback() { this.cleanups?.forEach((cleanup) => cleanup()); this.cleanups = null; }
  visibleOptions() { return [...this.options.querySelectorAll("[data-token-value]:not([hidden])")]; }
  filter(query = "") {
    const selected = new Set(this.value);
    const max = Number(this.getAttribute("max")) || Infinity;
    const atMax = selected.size >= max;
    const needle = query.trim().toLocaleLowerCase();
    let count = 0;
    for (const option of this.options.querySelectorAll("[data-token-value]")) {
      const match = !atMax && !selected.has(option.dataset.tokenValue) && (!needle || (option.dataset.tokenLabel || option.textContent).toLocaleLowerCase().includes(needle));
      option.hidden = !match;
      if (match) count += 1;
    }
    this.options.hidden = false;
    this.input.setAttribute("aria-expanded", "true");
    if (this.status) this.status.textContent = atMax ? `Maximum ${max} selected` : count ? `${count} suggestion${count === 1 ? "" : "s"}` : "No suggestions";
  }
  add(value, label = value) {
    const max = Number(this.getAttribute("max")) || Infinity;
    if (!value || this.value.includes(value) || this.value.length >= max) return;
    const token = document.createElement("span");
    token.className = "moss-token"; token.dataset.token = value;
    const text = document.createElement("span"); text.textContent = label;
    const remove = document.createElement("button"); remove.type = "button"; remove.dataset.tokenRemove = ""; remove.setAttribute("aria-label", `Remove ${label}`); remove.innerHTML = iconMarkup("close");
    token.append(text, remove); this.input.before(token);
    this.input.value = ""; this.sync(); this.filter(); this.input.focus(); this.notify();
  }
  remove(token) { if (!token) return; const label = token.textContent.trim(); token.remove(); this.sync(); if (this.status) this.status.textContent = `${label} removed`; this.input.focus(); this.notify(); }
  close() { this.options.hidden = true; this.input.setAttribute("aria-expanded", "false"); }
  sync() { for (const option of this.options.querySelectorAll("[data-token-value]")) option.setAttribute("aria-selected", String(this.value.includes(option.dataset.tokenValue))); }
  notify() { this.dispatchEvent(new CustomEvent("moss-token-change", { bubbles: true, composed: true, detail: { value: this.value } })); }
  get value() { return [...this.querySelectorAll("[data-token]")].map((token) => token.dataset.token); }
}

/** A modal task drawer: right-edge on wide screens and full-screen on phones. */
class MossDrawer extends HTMLElement {
  connectedCallback() {
    if (this.cleanups) return;
    this.dialog = this.querySelector("dialog");
    if (!this.dialog || !this.id) return;
    const openers = document.querySelectorAll(`[data-drawer-open="${CSS.escape(this.id)}"]`);
    const closers = this.querySelectorAll("[data-drawer-close]");
    this.cleanups = [...openers].map((button) => listen(button, "click", () => this.open(button)));
    this.cleanups.push(...[...closers].map((button) => listen(button, "click", () => this.requestClose("button"))));
    this.cleanups.push(listen(this.dialog, "click", (event) => { if (backdropClick(event, this.dialog)) this.requestClose("backdrop"); }));
    this.cleanups.push(listen(this.dialog, "cancel", (event) => { event.preventDefault(); this.requestClose("escape"); }));
    this.cleanups.push(listen(this.dialog, "close", () => { this.trigger?.isConnected && this.trigger.focus(); this.dispatchEvent(new CustomEvent("moss-drawer-close", { bubbles: true, composed: true, detail: { result: this.dialog.returnValue } })); }));
  }
  disconnectedCallback() { this.cleanups?.forEach((cleanup) => cleanup()); this.cleanups = null; }
  open(trigger) { if (this.dialog.open) return; this.trigger = trigger || document.activeElement; this.dialog.showModal(); this.dispatchEvent(new CustomEvent("moss-drawer-open", { bubbles: true, composed: true })); }
  requestClose(reason = "programmatic") { if (!this.dialog.open) return false; const request = new CustomEvent("moss-drawer-request-close", { bubbles: true, composed: true, cancelable: true, detail: { reason } }); if (!this.dispatchEvent(request)) return false; this.dialog.close(reason); return true; }
  close() { return this.requestClose("programmatic"); }
}

/** Authored global results with Moss-owned filtering and keyboard movement. */
class MossSearch extends HTMLElement {
  connectedCallback() {
    if (this.cleanups || !this.id) return;
    this.dialog = this.querySelector("dialog"); this.input = this.querySelector("[data-search-input]"); this.empty = this.querySelector("[data-search-empty]"); this.status = this.querySelector("[data-search-status]");
    if (!this.dialog || !this.input) return;
    if (!this.status) { this.status = document.createElement("span"); this.status.className = "moss-visually-hidden"; this.status.dataset.searchStatus = ""; this.status.setAttribute("role", "status"); this.dialog.append(this.status); }
    const openers = document.querySelectorAll(`[data-search-open="${CSS.escape(this.id)}"]`);
    const open = (trigger) => { this.trigger = trigger; this.dialog.showModal(); this.input.value = ""; this.filter(); this.input.focus(); };
    const close = () => { this.dialog.close(); this.trigger?.focus(); };
    const onKey = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const editable = target?.matches("input,textarea,select") || target?.isContentEditable || Boolean(target?.closest("input,textarea,select,[contenteditable]:not([contenteditable='false'])"));
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k" && this.hasAttribute("shortcut")) {
        if (editable && !this.dialog.open) return;
        event.preventDefault(); if (!this.dialog.open) open(document.activeElement); return;
      }
      if (!this.dialog.open || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      if (event.target === this.input && ["Home", "End"].includes(event.key)) return;
      const results = this.results(); if (!results.length) return; event.preventDefault();
      const current = results.indexOf(document.activeElement);
      const index = current < 0 ? (event.key === "ArrowUp" ? results.length - 1 : 0) : moveIndex(event.key, current, results.length);
      results[index]?.focus();
    };
    this.cleanups = [...openers].map((button) => listen(button, "click", () => open(button)));
    this.cleanups.push(listen(this.input, "input", () => this.filter()), listen(document, "keydown", onKey));
    this.cleanups.push(...[...this.querySelectorAll("[data-search-close]")].map((button) => listen(button, "click", close)));
    this.filter();
  }
  disconnectedCallback() { this.cleanups?.forEach((cleanup) => cleanup()); this.cleanups = null; }
  results() { return [...this.querySelectorAll("[data-search-item]:not([hidden])")]; }
  filter() {
    const needle = this.input.value.trim().toLocaleLowerCase(); let count = 0;
    for (const item of this.querySelectorAll("[data-search-item]")) { const show = !needle || (item.dataset.searchText || item.textContent).toLocaleLowerCase().includes(needle); item.hidden = !show; if (show) count += 1; }
    for (const group of this.querySelectorAll(".moss-search-group")) group.hidden = !group.querySelector("[data-search-item]:not([hidden])");
    if (this.empty) this.empty.hidden = count > 0;
    this.status.textContent = count ? `${count} result${count === 1 ? "" : "s"}` : "No results";
  }
}

class MossWizard extends HTMLElement {
  connectedCallback() {
    if (this.cleanup) return;
    this.steps = [...this.querySelectorAll("[data-wizard-step]")]; if (!this.steps.length) return;
    this.index = Math.max(0, this.steps.findIndex((step) => !step.hidden));
    const click = (event) => {
      const next = event.target.closest("[data-wizard-next]"); const back = event.target.closest("[data-wizard-back]");
      if (next) { const invalid = [...this.steps[this.index].querySelectorAll("input,select,textarea")].find((field) => !field.checkValidity()); if (invalid) { invalid.reportValidity(); return; } this.show(this.index + 1, true); }
      if (back) this.show(this.index - 1, true);
    };
    this.addEventListener("click", click); this.cleanup = () => this.removeEventListener("click", click); this.show(this.index);
  }
  disconnectedCallback() { this.cleanup?.(); this.cleanup = null; }
  show(index, focus = false) {
    this.index = Math.max(0, Math.min(index, this.steps.length - 1));
    this.steps.forEach((step, stepIndex) => { step.hidden = stepIndex !== this.index; });
    const progress = this.querySelector("[data-wizard-progress]"); if (progress) progress.textContent = `Step ${this.index + 1} of ${this.steps.length}`;
    if (focus) { const target = this.steps[this.index].querySelector("h1,h2,h3,legend") || this.steps[this.index]; if (!target.hasAttribute("tabindex")) target.tabIndex = -1; target.focus(); }
    this.dispatchEvent(new CustomEvent("moss-wizard-change", { bubbles: true, composed: true, detail: { step: this.index + 1, total: this.steps.length } }));
  }
}

class MossFilePicker extends HTMLElement {
  connectedCallback() {
    if (this.cleanups) return;
    this.input = this.querySelector('input[type="file"]'); this.name = this.querySelector("[data-file-name]"); if (!this.input) return;
    const sync = () => { if (this.name) this.name.textContent = this.input.files?.length ? [...this.input.files].map((file) => file.name).join(", ") : "No file selected"; };
    const clear = () => { this.input.value = ""; sync(); this.input.dispatchEvent(new Event("input", { bubbles: true })); this.input.dispatchEvent(new Event("change", { bubbles: true })); this.input.focus(); };
    this.cleanups = [listen(this.input, "change", sync)];
    this.cleanups.push(...[...this.querySelectorAll("[data-file-clear]")].map((button) => listen(button, "click", clear)));
    sync();
  }
  disconnectedCallback() { this.cleanups?.forEach((cleanup) => cleanup()); this.cleanups = null; }
}

customElements.define("moss-disclosure", MossDisclosure);
customElements.define("moss-rail", MossRail);
customElements.define("moss-menu", MossMenu);
customElements.define("moss-toast-stack", MossToastStack);
customElements.define("moss-tabs", MossTabs);
customElements.define("moss-view-tabs", MossViewTabs);
customElements.define("moss-filter-chips", MossFilterChips);
customElements.define("moss-dialog", MossDialog);
customElements.define("moss-token-field", MossTokenField);
customElements.define("moss-drawer", MossDrawer);
customElements.define("moss-search", MossSearch);
customElements.define("moss-wizard", MossWizard);
customElements.define("moss-file-picker", MossFilePicker);

export { MossDisclosure, MossRail, MossMenu, MossToastStack, MossTabs, MossViewTabs, MossFilterChips, MossDialog, MossTokenField, MossDrawer, MossSearch, MossWizard, MossFilePicker };

// Tooltips remain dismissible without moving pointer or keyboard focus.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll("[data-moss-tooltip],moss-rail [data-label]").forEach((element) => element.setAttribute("data-tooltip-dismissed", ""));
});
for (const type of ["pointerout", "focusout"]) document.addEventListener(type, (event) => {
  const trigger = event.target.closest?.("[data-tooltip-dismissed]");
  if (trigger && !trigger.contains(event.relatedTarget)) trigger.removeAttribute("data-tooltip-dismissed");
});
