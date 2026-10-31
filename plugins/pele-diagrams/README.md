# Pele Diagrams

Local Quartz transformer that renders Mermaid diagrams with
[Pele](https://github.com/obsidianmd/pele) at build time.

- Finds ` ```mermaid ` code blocks during the Markdown transform and replaces
  them with inline SVG, so the published page contains no Mermaid.js and makes
  no client-side diagram request.
- Uses Mermaid syntax unchanged; Pele is a Mermaid-compatible renderer with its
  own cleaner layout and styling.
- Diagrams wider than a phone column get a second, vertically reflowed SVG,
  switched by a container query in `custom.scss`. Diagrams that already fit are
  emitted once.
- Theme colors come from CSS variables set in `quartz/styles/custom.scss`
  (`--pele-*`), so light/dark mode recolors the SVG without re-rendering.
- If a diagram fails to parse, the build logs a warning and leaves the code
  block intact instead of failing the page.

`@quartz-community/obsidian-flavored-markdown` must have `mermaid: false`, or it
will also inject the Mermaid.js client script.

Options (in `quartz.config.yaml`):

```yaml
- source: ./plugins/pele-diagrams
  enabled: true
  options:
    maxWidth: 800
    mobileMaxWidth: 390
```

`maxWidth` is the desktop layout width; `mobileMaxWidth` is used for the narrow
variant and is also the threshold below which a single SVG is considered to fit.

`dist/index.js` is the committed source; there is no build step.
