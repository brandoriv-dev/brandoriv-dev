# Icons

Moss owns a set of semantic icon names. An icon pack supplies the artwork for
those names. Components and product markup refer only to the names, so changing
the entire visual family is a registration change rather than an edit to every
surface that draws an icon.

The default pack is [Iconoir](https://iconoir.com/) (MIT). Nothing in Moss
depends on it beyond one registration call.

## Using an icon

```html
<moss-icon name="overview"></moss-icon>
```

Icons are decorative by default and are marked `aria-hidden`. Pair them with a
visible label, as the rail does. When an icon is the only carrier of meaning,
give it a label so it is announced:

```html
<moss-icon name="search" label="Search"></moss-icon>
```

The element is an enhancement. Without JavaScript no icon is drawn, so the
accessible name must never live in the icon alone: icon-only controls carry
`aria-label` on the control itself.

Size comes from the `--moss-icon-size` custom property, set per context in
`moss.css` rather than per instance.

## The name contract

`MOSS_ICON_NAMES` in [`src/icons.js`](../src/icons.js) is the list every pack is
expected to answer.

| Group | Names |
|---|---|
| Destinations | `overview`, `activity`, `plans`, `navigation`, `actions`, `signals`, `data`, `disclosure`, `states`, `document`, `connect`, `service` |
| Controls | `search`, `menu`, `collapse-rail`, `expand-rail`, `chevron-down`, `close`, `overflow`, `copy`, `refresh`, `forward`, `external`, `sign-out`, `sun`, `moon` |
| Objects | `message`, `notification`, `credential`, `secure`, `money`, `portfolio` |
| Status | `info`, `warning`, `critical`, `success` |

Names describe the role in the interface, not the drawing. `plans` stays `plans`
whether a pack renders it as a calendar or a checklist. Adding a name is a design
decision, because it becomes something every future pack must supply.

## Swapping packs

A pack is data:

```js
export const myPack = {
  name: "my-pack",
  viewBox: "0 0 24 24",
  attributes: { fill: "none", "stroke-width": "1.5" },  // a filled pack declares its own
  icons: { overview: '<path d="…"/>', /* one entry per Moss name */ }
};
```

Register it and make it active:

```js
import { registerIconPack, setIconPack, describeIconPack } from "@brandoriv/moss/icons";
import { myPack } from "./my-pack.js";

console.log(describeIconPack(myPack).missing);  // check coverage first
registerIconPack(myPack);
setIconPack("my-pack");
```

Every mounted `<moss-icon>` re-renders. A name the pack does not define renders
nothing and warns once, so an incomplete pack is visible during review rather
than silently blank in production.

## Generating a pack

[`tools/build-icon-pack.mjs`](../tools/build-icon-pack.mjs) turns a directory of
SVG files into a pack module. It maps Moss names to source filenames, strips the
attributes the wrapper already carries, and fails if a Moss name is unmapped.

```
npm pack iconoir@7.12.1 && tar -xzf iconoir-7.12.1.tgz
node tools/build-icon-pack.mjs package/icons/regular
```

To evaluate another family, copy that script, change its `PACK` and `SOURCES`,
and point it at the new SVG directory. Generated pack files are not edited by
hand.

## Why not icon fonts or glyphs

Text glyphs such as `⇤` and `⌂` depend on the reader's font and on every layer
in between decoding the bytes correctly; a single mis-declared charset renders
them as mojibake. Inline SVG carries its own geometry, inherits `currentColor`,
and scales with the control it sits in. For the same reason the catalog's source
is plain ASCII, with typographic characters written as character references.
