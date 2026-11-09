# chapter-nav

Local Quartz v5 component plugin: previous/next links between numbered sibling
notes, rendered at the end of the page.

The SRS Grimoire is one note per chapter, numbered in the title (`001 - …`,
`002 - …`). This component looks at the other notes in the same folder, keeps
the ones whose title matches `numberPattern`, orders them numerically (the
same ordering the grimoire index uses), and links to the immediate neighbours.
Notes whose titles are not numbered get no navigation, so other folders are
unaffected.

## Options

| Option          | Default              | Description                                            |
| --------------- | -------------------- | ------------------------------------------------------ |
| `numberPattern` | `^\s*(\d+)`          | Regex whose first capture group is the chapter number. |
| `previousLabel` | `Previous chapter`   | Label above the previous link.                         |
| `nextLabel`     | `Next chapter`       | Label above the next link.                             |
| `ariaLabel`     | `Chapter navigation` | `aria-label` for the `<nav>` element.                  |

## Structure

`dist/` is committed as the plugin source (same convention as the other local
plugins) — there is no build step. `dist/index.js` is the plugin entry,
`dist/components/index.js` exports the component declared in the manifest in
`package.json` (`quartz.components`).

Styled by the component's own `.css` string (uses the site's theme variables,
so per-folder themes apply automatically).
