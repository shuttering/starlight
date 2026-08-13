# @shuttering/starlight

A [Starlight](https://starlight.astro.build) docs theme cut from the
[shuttering](https://github.com/shuttering) design contract. Token-driven grounds
and palettes, a quiet low-border surface, and shuttering's reveal-on-intent
scrollbar — so every docs site in the org reads as one system while keeping its
own accent.

Starlight isn't Tailwind, so it can't consume `@shuttering/tokens` directly. This
package is the bridge: it maps the shuttering **contract** onto Starlight's own
`--sl-color-*` system, then quiets the stock chrome. It's the one public-npm
member of the shuttering family — public docs CI pulls it without a token.

## The contract

A **ground** supplies six vars, a **palette** one; Starlight's full 7-step scale,
accents, and surfaces are **derived** from those with `color-mix`, so any ground
drops in without hand-tuning a scale.

| Seam        | Vars                                                                              |
| ----------- | --------------------------------------------------------------------------------- |
| **ground**  | `--background` `--foreground` `--card` `--muted` `--muted-foreground` `--border` (+ `--scrollbar-thumb`) |
| **palette** | `--primary`                                                                       |
| **fonts**   | `--font-sans-face` `--font-mono-face` (bring-your-own)                             |

Because a ground flips `--background`/`--foreground` between light and dark, the
mapping is written once and resolves in both.

## Use it

```js
// astro.config.mjs
starlight({
  customCss: [
    '@shuttering/starlight/grounds/void.css', // pick a ground
    '@shuttering/starlight/palettes/beam.css', // pick a palette
    '@shuttering/starlight', // the mapping (import last)
    './src/styles/site.css', // your fonts + any per-site touch
  ],
});
```

```css
/* src/styles/site.css — bring your typefaces */
:root {
  --font-sans-face: 'Inter', system-ui, sans-serif;
  --font-mono-face: 'JetBrains Mono', ui-monospace, monospace;
}
```

## Where it's published

Both **npmjs** and **GitHub Packages**, with identical contents.

npmjs is the primary and the reason this package exists there at all: public docs CI
pulls it without a token, which nothing else in the family can offer. That has not
changed.

GitHub Packages is the second copy, and it exists for a problem that only appears in
repos consuming starlight *alongside* another `@shuttering/*` package. Those live on
GitHub Packages, so such a repo carries

```
@shuttering:registry=https://npm.pkg.github.com
```

in its `.npmrc` — and scope mapping is all-or-nothing. npm has no per-package registry
key, so that one line sends *every* `@shuttering` request to GitHub Packages, starlight
included. The only local escape is pinning starlight to a hardcoded tarball URL:

```jsonc
// don't do this any more
"pnpm": {
  "overrides": {
    "@shuttering/starlight": "https://registry.npmjs.org/@shuttering/starlight/-/starlight-0.2.0.tgz"
  }
}
```

which works, has no semver range, and can therefore never float — one consumer sat
frozen at `0.2.0` because of it. Publishing to both registries means the scope mapping
resolves starlight like every sibling and the override can be deleted.

**Which one you get:** if your `.npmrc` maps the `@shuttering` scope, GitHub Packages
(and you'll need `NODE_AUTH_TOKEN`, as you already do for the others). Otherwise npmjs,
tokenless, exactly as before.

## Reference grounds & palettes

| Ground  | Look        | Home       | | Palette  | Accent    | Home      |
| ------- | ----------- | ---------- |-| -------- | --------- | --------- |
| `void`  | indigo navy | nanohype   | | `beam`   | `#3b82f6` | nanohype  |
| `slate` | steel slate | rackctl    | | `steel`  | steel     | rackctl   |
| `paper` | cool neutral| default    | | `indigo` | indigo    | shuttering|

## Bring your own

Any `[data-ground]`-free CSS that fills the six ground vars (on `:root` for dark,
`:root[data-theme='light']` for light) plus `--primary` works — set them yourself
instead of importing a preset. Mirror new presets into `src/grounds` / `src/palettes`.

## License

[Apache 2.0](LICENSE)
