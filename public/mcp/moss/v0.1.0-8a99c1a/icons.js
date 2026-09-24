/**
 * Moss owns a small set of semantic icon names. An icon pack supplies the
 * artwork for those names. Swapping packs is a registration change, not an
 * edit to any component or product markup.
 *
 * @typedef {Object} MossIconPack
 * @property {string} name          Identifier used by `setIconPack`.
 * @property {string} [label]       Human-readable name for documentation.
 * @property {string} [version]     Upstream version this pack was built from.
 * @property {string} [license]     Upstream license.
 * @property {string} viewBox       Applied to every icon in the pack.
 * @property {Record<string,string>} [attributes] Presentation attributes shared
 *   by the pack, such as `fill` and `stroke-width`. Stroke packs and fill packs
 *   differ here rather than in component code.
 * @property {Record<string,string>} icons Moss name to inner SVG markup.
 */

/**
 * The contract a pack must satisfy. Adding a name here is a design decision:
 * it becomes something every pack is expected to answer.
 */
export const MOSS_ICON_NAMES = Object.freeze([
  "overview",
  "activity",
  "plans",
  "navigation",
  "actions",
  "signals",
  "data",
  "disclosure",
  "states",
  "search",
  "menu",
  "collapse-rail",
  "expand-rail",
  "chevron-down",
  "close",
  "overflow",
  "copy",
  "refresh",
  "forward",
  "external",
  "sign-out",
  "document",
  "message",
  "notification",
  "credential",
  "secure",
  "service",
  "money",
  "portfolio",
  "connect",
  "info",
  "warning",
  "critical",
  "success",
  "sun",
  "moon"
]);

const packs = new Map();
const mounted = new Set();
let activeName = null;
const warned = new Set();

/** Names the pack is missing, and names it defines that Moss does not use. */
export function describeIconPack(pack) {
  const defined = Object.keys(pack?.icons || {});
  return {
    missing: MOSS_ICON_NAMES.filter((name) => !defined.includes(name)),
    extra: defined.filter((name) => !MOSS_ICON_NAMES.includes(name))
  };
}

/** Register a pack. The first pack registered becomes the active one. */
export function registerIconPack(pack) {
  if (!pack?.name || !pack?.icons) throw new TypeError("An icon pack needs a name and an icons map");
  packs.set(pack.name, pack);
  if (!activeName) setIconPack(pack.name);
  return pack.name;
}

/** Switch packs. Every mounted `<moss-icon>` re-renders. */
export function setIconPack(name) {
  if (!packs.has(name)) throw new RangeError(`Unknown icon pack: ${name}. Register it first.`);
  activeName = name;
  warned.clear();
  mounted.forEach((icon) => icon.render());
  return packs.get(name);
}

export const getIconPack = (name = activeName) => packs.get(name) || null;
export const listIconPacks = () => [...packs.values()];

/** Inline SVG markup for a Moss icon name, or `""` when the pack lacks it. */
export function iconMarkup(name, { size } = {}) {
  const pack = getIconPack();
  const body = pack?.icons?.[name];
  if (!body) {
    if (pack && !warned.has(name)) {
      warned.add(name);
      console.warn(`Moss: icon pack "${pack.name}" has no icon named "${name}".`);
    }
    return "";
  }
  const attributes = { ...(pack.attributes || {}), viewBox: pack.viewBox, ...(size ? { width: size, height: size } : {}) };
  const serialized = Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" ${serialized} focusable="false">${body}</svg>`;
}

// Tools and tests import the name contract outside a browser, so the element
// base is resolved rather than referenced directly.
const ElementBase = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

/**
 * `<moss-icon name="overview">` is decorative by default. Give it a `label`
 * only when the icon is the sole carrier of meaning.
 */
export class MossIcon extends ElementBase {
  static observedAttributes = ["name", "label"];
  connectedCallback() { mounted.add(this); this.render(); }
  disconnectedCallback() { mounted.delete(this); }
  attributeChangedCallback() { if (this.isConnected) this.render(); }
  render() {
    const label = this.getAttribute("label");
    if (label) { this.setAttribute("role", "img"); this.setAttribute("aria-label", label); this.removeAttribute("aria-hidden"); }
    else { this.setAttribute("aria-hidden", "true"); this.removeAttribute("role"); this.removeAttribute("aria-label"); }
    this.innerHTML = iconMarkup(this.getAttribute("name"));
  }
}

if (typeof customElements !== "undefined" && !customElements.get("moss-icon")) customElements.define("moss-icon", MossIcon);
