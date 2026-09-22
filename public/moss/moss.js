export { MossTheme, MossThemeProvider, DEFAULT_THEME, MossThemePresets } from "./theme.js";

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
    close.type = "button"; close.setAttribute("aria-label", "Dismiss notification"); close.textContent = "×";
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

class MossDialog extends HTMLElement {
  connectedCallback(){if(this.cleanups)return;const dialog=this.querySelector("dialog"),openers=document.querySelectorAll(`[data-dialog-open="${this.id}"]`),closers=this.querySelectorAll("[data-dialog-close]");if(!dialog)return;this.cleanups=[...openers].map(button=>listen(button,"click",()=>dialog.showModal()));this.cleanups.push(...[...closers].map(button=>listen(button,"click",()=>dialog.close())));this.cleanups.push(listen(dialog,"click",event=>{if(event.target===dialog)dialog.close();}));}
  disconnectedCallback(){this.cleanups?.forEach(cleanup=>cleanup());this.cleanups=null;}
}

customElements.define("moss-disclosure", MossDisclosure);
customElements.define("moss-rail", MossRail);
customElements.define("moss-menu", MossMenu);
customElements.define("moss-toast-stack", MossToastStack);
customElements.define("moss-tabs", MossTabs);
customElements.define("moss-dialog", MossDialog);

export { MossDisclosure, MossRail, MossMenu, MossToastStack, MossTabs, MossDialog };
