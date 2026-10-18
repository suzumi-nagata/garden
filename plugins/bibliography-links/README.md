# bibliography-links

Local Quartz v5 transformer plugin. It turns the bare URLs that citeproc emits
in `@quartz-community/citations` bibliographies into clickable anchors.

Citeproc renders `URL` values as plain text, and Quartz's normal autolinking
happens at the Markdown stage — before the bibliography HTML is generated — so
a bare `https://…` in a reference is never linkified otherwise.

The plugin runs after the citations transformer (order 87 vs. 85), finds the
generated `<div id="refs">`, and replaces URL text with `<a href="…">…</a>`.
Trailing sentence punctuation is left outside the anchor, and text inside
existing links, `code`, `pre`, `script` and `style` elements is skipped.

Pages without a bibliography are untouched.

`dist/` is committed as the plugin source; there is no build step.
