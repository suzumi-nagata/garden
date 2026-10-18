# bibliography-heading

Local Quartz v5 transformer plugin. It adds a "References" heading above the
bibliography that `@quartz-community/citations` appends to a page.

The citations plugin only emits the bibliography when at least one entry is
registered — via `[@citekey]` in the body or a `noCite` frontmatter list (used
by the literature-note template) — and it inserts the `<div id="refs">` at the
very end of the article with no heading of its own.

This plugin runs after the citations transformer (order 86 vs. 85), finds that
div in the HAST tree, and inserts an `h1` (configurable) immediately before it.
Pages without a bibliography are untouched, so no empty section ever appears and
no `[^ref]` marker is needed in the note source.

If a heading with the same label already sits directly before the bibliography
(for example when a note uses the `[^ref]` insertion marker), the plugin leaves
it alone rather than adding a duplicate.

Options:

| Option  | Type     | Default        |
| ------- | -------- | -------------- |
| `label` | `string` | `"References"` |
| `level` | `number` | `1`            |

`dist/` is committed as the plugin source; there is no build step.
