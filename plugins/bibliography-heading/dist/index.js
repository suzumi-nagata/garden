// Adds a heading above the bibliography that @quartz-community/citations
// appends to every page with a reference. Runs after the citations transformer
// (order 85; this plugin is 86), so the generated `#refs` div is already in
// the tree.
//
// `dist/` is committed as the plugin source; there is no build step.

const textOf = (node) => {
  if (!node) return ""
  if (node.type === "text") return node.value
  if (!Array.isArray(node.children)) return ""
  return node.children.map(textOf).join("")
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const insertHeading = (node, label, level) => {
  if (!node || !Array.isArray(node.children)) return false

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]

    if (child.type === "element" && child.tagName === "div" && child.properties?.id === "refs") {
      // If the note already ends with a matching heading (e.g. the author put
      // one before a `[^ref]` marker), leave it alone.
      for (let j = i - 1; j >= 0; j--) {
        const prev = node.children[j]
        if (prev.type === "text" && prev.value.trim() === "") continue
        if (
          prev.type === "element" &&
          /^h[1-6]$/.test(prev.tagName) &&
          textOf(prev).trim().toLowerCase() === label.toLowerCase()
        ) {
          return false
        }
        break
      }

      node.children.splice(i, 0, {
        type: "element",
        tagName: `h${level}`,
        properties: { id: slugify(label) },
        children: [{ type: "text", value: label }],
      })
      return true
    }

    if (insertHeading(child, label, level)) return true
  }

  return false
}

const BibliographyHeading = (opts = {}) => {
  const label = opts.label ?? "References"
  const level = Math.min(Math.max(opts.level ?? 1, 1), 6)

  return {
    name: "BibliographyHeading",
    htmlPlugins() {
      return [
        () => (tree) => {
          insertHeading(tree, label, level)
        },
      ]
    },
  }
}

export default BibliographyHeading
