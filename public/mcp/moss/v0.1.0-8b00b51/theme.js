import { MossTheme, createMossTheme, DEFAULT_THEME } from "./core/theme.js";

const MossElement = globalThis.HTMLElement ?? class {};
class MossThemeProvider extends MossElement {
  static observedAttributes = ["mode", "density", "persist-key"];
  connectedCallback() {
    const key = this.getAttribute("persist-key");
    if (key) this._value = MossTheme.load(key) || this._value;
    this._media = globalThis.matchMedia?.("(prefers-color-scheme: light)");
    this._systemChange = () => { if ((this.getAttribute("mode") || this._value?.mode) === "system") this.renderTheme(); };
    this._media?.addEventListener?.("change", this._systemChange);
    this.renderTheme();
  }
  disconnectedCallback() { this._media?.removeEventListener?.("change", this._systemChange); }
  attributeChangedCallback() { if (this.isConnected) this.renderTheme(); }
  set value(theme) { this._value = theme instanceof MossTheme ? theme : createMossTheme(theme); this.renderTheme(); }
  get value() { return this._value; }
  renderTheme() {
    const options = { mode: this.getAttribute("mode") || undefined, density: this.getAttribute("density") || undefined };
    const theme = this._value || createMossTheme();
    theme.apply(this, options);
    const key = this.getAttribute("persist-key");
    if (key) theme.with({ mode: options.mode || theme.mode, density: options.density || theme.density }).save(key);
  }
}

if (globalThis.customElements && !customElements.get("moss-theme-provider")) customElements.define("moss-theme-provider", MossThemeProvider);
export { MossTheme, MossThemeProvider, createMossTheme, DEFAULT_THEME };
