// Renders ` ```mermaid ` code blocks to static SVG at build time with Pele.
//
// Pele accepts the same Mermaid syntax but produces its own, cleaner SVG and
// runs synchronously in Node, so diagrams are baked into the page: no Mermaid
// bundle, no CDN request, no client-side re-render on theme changes.
//
// The Obsidian Flavored Markdown plugin must have `mermaid: false` in
// quartz.config.yaml, otherwise it also injects the Mermaid.js client script.
//
// `dist/` is committed as the plugin source; there is no build step.

import { render } from "pele"

const DEFAULT_MAX_WIDTH = 800
const DEFAULT_MOBILE_MAX_WIDTH = 390

const isMermaidBlock = (node) => node?.type === "code" && node.lang === "mermaid"

// Walk the mdast, replacing Mermaid code blocks in place. Blocks can be nested
// in blockquotes/lists, so recurse through every children array.
const replaceDiagrams = (node, replace) => {
  if (!Array.isArray(node.children)) return
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (isMermaidBlock(child)) {
      const replacement = replace(child)
      if (replacement) node.children[i] = replacement
    } else {
      replaceDiagrams(child, replace)
    }
  }
}

const PeleDiagrams = (opts = {}) => {
  const options = {
    maxWidth: DEFAULT_MAX_WIDTH,
    mobileMaxWidth: DEFAULT_MOBILE_MAX_WIDTH,
    ...opts,
  }

  return {
    name: "PeleDiagrams",
    markdownPlugins(ctx) {
      // Pele's Node text measurer ignores the family, but the font names become
      // the SVG's fallback stack and keep output consistent with the theme.
      const typography = ctx?.cfg?.configuration?.theme?.typography ?? {}
      const baseOptions = {
        responsive: true,
        ...(typeof typography.body === "string" ? { fontFamily: typography.body } : {}),
        ...(typeof typography.code === "string" ? { fontFamilyMono: typography.code } : {}),
      }

      return [
        () => (tree, file) => {
          let index = 0

          replaceDiagrams(tree, (node) => {
            const current = index++
            try {
              const wide = render(node.value, {
                ...baseOptions,
                maxWidth: options.maxWidth,
                idPrefix: `pele-w-${current}`,
              })

              // Wide diagrams become unreadable when CSS shrinks them into a
              // phone column. Render a second layout at the mobile width; Pele
              // switches direction below its 640px breakpoint. Diagrams that
              // already fit (or lay out identically) stay as a single SVG.
              let narrow = null
              if (wide.width > options.mobileMaxWidth) {
                try {
                  const candidate = render(node.value, {
                    ...baseOptions,
                    maxWidth: options.mobileMaxWidth,
                    idPrefix: `pele-n-${current}`,
                  })
                  if (candidate.svg !== wide.svg) narrow = candidate
                } catch {
                  // Keep the wide layout if the narrow pass fails.
                }
              }

              file.data.hasMermaidDiagram = true
              return {
                type: "html",
                value: narrow
                  ? `<div class="pele-diagram"><div class="pele-diagram-wide">${wide.svg}</div><div class="pele-diagram-narrow">${narrow.svg}</div></div>`
                  : `<div class="pele-diagram">${wide.svg}</div>`,
              }
            } catch (error) {
              const where = file.data?.relativePath ?? file.path ?? "unknown file"
              const line = node.position?.start?.line
              console.warn(`[pele-diagrams] ${where}${line ? `:${line}` : ""}: ${error.message}`)
              // Leave the code block in place: with OFM's Mermaid renderer
              // disabled it falls back to an ordinary, highlighted code block.
              return undefined
            }
          })
        },
      ]
    },
  }
}

export default PeleDiagrams
