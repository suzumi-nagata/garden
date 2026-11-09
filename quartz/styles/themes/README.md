# Page themes

Themes in this folder are ordinary Sass scoped to a page's `<body>`. They are
compiled into the site's main stylesheet, so SPA navigation costs no extra
request and a theme can never leak outside the pages it names.

## How a page joins a theme

Two mechanisms, usable together:

1. **Folder** — every page whose slug starts with `<folder>/`, including the
   folder landing page. Folder names are slugified by Quartz:
   `SRS Grimoire` → `srs-grimoire`, `Suzumi's Book` → `suzumi's-book`.
2. **Note** — `theme: <name>` in frontmatter. `renderPage` copies this to
   `<body data-garden-theme="<name>">`, so a single note anywhere in the garden
   can borrow a theme without moving it into the folder.

The shared mixins in `_scopes.scss` generate both selector sets.

## Adding a theme

1. Create `quartz/styles/themes/_<name>.scss`.
2. Wrap each mode in the scopes:

   ```scss
   @use "../variables" as *;
   @use "./scopes" as *;

   @include theme-scope("spatial", "space") {
     --light: #f4f7ff;
     --secondary: #3559a8;
     /* ...shared + light rules... */
   }

   @include theme-scope-dark("spatial", "space") {
     --light: #070b16;
     --secondary: #8fb3ff;
   }
   ```

3. Register it once in `quartz/styles/custom.scss`:

   ```scss
   @use "./themes/spatial";
   ```

That is the whole build change. If the theme needs artwork or fonts, put them
under `quartz/static/themes/<name>/` and reference them from the stylesheet as
`url("static/themes/<name>/...")` — the compiled `index.css` sits at the site
root, so those paths resolve under the site's base path in both dev and
production.

## Adding a folder to an existing theme

Pass another slug to the mixin:

```scss
@include theme-scope("witch", "srs-grimoire", "notes/witchcraft") { ... }
@include theme-scope-dark("witch", "srs-grimoire", "notes/witchcraft") { ... }
```

A page can also opt in without touching the folder list:

```yaml
---
title: "A note that wandered in"
theme: witch
---
```

The witch theme also hardcodes its landing slug in the `$landing` variable at
the top of `_witch.scss` for the hero layout. If that folder is renamed, update
both the mixin argument and `$landing`.

## What the mixins emit

`theme-scope("witch", "srs-grimoire")` produces one rule whose selector list is:

```
:root body[data-garden-theme="witch"],
:root body[data-slug^="srs-grimoire/"]
```

`theme-scope-dark(...)` narrows the same set to
`:root[saved-theme="dark"]`. The `:root` prefix is deliberate: it outranks the
site-wide `:root[saved-theme="light"] body` rules in `custom.scss` without
`!important`.

## Conventions that keep it modular

- Put **all** theme rules inside the two mixin blocks. A bare `body { ... }`
  in a theme file would leak to the rest of the garden.
- Prefer the existing CSS variables (`--light`, `--lightgray`, `--gray`,
  `--darkgray`, `--dark`, `--secondary`, `--tertiary`, `--highlight`,
  `--textHighlight`, `--bodyFont`, `--headerFont`, `--titleFont`). Components,
  search, the graph, and the TOC inherit them automatically.
- Theme-specific variables should start with `--garden-` to avoid clashing with
  Quartz or community components.
- Scope one-off layout changes to the landing slug, not the folder:
  `body[data-slug="srs-grimoire/index"]`.
- Content images live under `content/images/` and are referenced with normal
  Markdown. The build's image optimizer converts PNG/JPEG to WebP and writes
  intrinsic dimensions. Social preview images live at the static root (for
  example `quartz/static/grimoire-og.jpeg`) and are referenced with
  `socialImage`.
- Fonts go in `quartz/static/themes/<name>/fonts/` with `@font-face` and
  `font-display: swap`. Browsers only download a face when a page actually
  uses it. Keep the OFL license text beside the font files.

## Current themes

| Theme   | Attached to                                         | Notes                                                                                                     |
| ------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `witch` | folder `srs-grimoire`; any note with `theme: witch` | Inline grimoire cover on the landing, parchment entries, automatic book index, IM Fell English + Alegreya |

The grimoire cover is `content/images/srs-grimoire.png`; its 1200×630 social
version is `quartz/static/grimoire-og.jpeg`.

The grimoire's index is the normal folder listing; the `Contents` heading lives
at the end of `content/SRS Grimoire/index.md`, and new notes under that folder
appear in the list automatically, ordered by entry title (numeric) rather than
modified date — so editing an older note does not move it.
