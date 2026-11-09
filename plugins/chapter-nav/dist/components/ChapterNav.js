import { h } from "preact"
import { resolveRelative } from "@quartz-community/utils"

const defaultOptions = {
  numberPattern: "^\\s*(\\d+)",
  previousLabel: "Previous chapter",
  nextLabel: "Next chapter",
  ariaLabel: "Chapter navigation",
}

const cleanSlug = (slug) => String(slug ?? "").replace(/\/+$/, "")

const parentOf = (slug) => {
  const clean = cleanSlug(slug)
  const cut = clean.lastIndexOf("/")
  return cut === -1 ? "" : clean.slice(0, cut)
}

const titleOf = (file) => {
  const title = file?.frontmatter?.title
  return typeof title === "string" ? title.trim() : ""
}

const chapterOf = (file, numberRe) => {
  const title = titleOf(file)
  const match = numberRe.exec(title)
  if (!match) return null
  const number = Number.parseInt(match[1], 10)
  if (!Number.isFinite(number)) return null
  return { file, title, number }
}

// Mirrors the grimoire index's `byEntryTitle`: numeric collation keeps
// "002" before "010" and does not depend on modified dates.
const byChapter = (a, b) =>
  a.number - b.number ||
  a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" }) ||
  cleanSlug(a.file.slug).localeCompare(cleanSlug(b.file.slug))

const css = `
.chapter-nav {
  display: flex;
  align-items: stretch;
  gap: 1rem;
  margin-top: 2.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--lightgray);
}

.chapter-nav-link {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 0 1 45%;
  min-width: 0;
  padding: 0.6rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--tertiary), transparent 72%);
  border-radius: 10px;
  background-color: color-mix(in srgb, var(--light), transparent 94%);
  text-decoration: none !important;
  transition:
    border-color 0.25s ease,
    background-color 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.chapter-nav-link:hover {
  border-color: var(--tertiary);
  background-color: color-mix(in srgb, var(--tertiary), transparent 92%);
  box-shadow: 0 0 15px color-mix(in srgb, var(--tertiary), transparent 82%);
  transform: translateY(-1px);
}

.chapter-nav-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--secondary);
}

.chapter-nav-title {
  font-size: 0.9rem;
  line-height: 1.3;
  color: var(--darkgray);
}

.chapter-nav-next {
  margin-left: auto;
  text-align: right;
}

.chapter-nav-spacer {
  flex: 1;
}

@media (max-width: 600px) {
  .chapter-nav {
    flex-direction: column;
    gap: 0.75rem;
  }

  .chapter-nav-link {
    flex: 1 1 auto;
    width: 100%;
  }

  .chapter-nav-next {
    margin-left: 0;
    text-align: left;
  }

  .chapter-nav-spacer {
    display: none;
  }
}
`

/**
 * Previous/next navigation between numbered sibling notes.
 *
 * The grimoire is one note per chapter, numbered in the title ("001 - …").
 * This component finds the other notes in the same folder whose titles match
 * `numberPattern`, orders them the same way the folder index does (numeric),
 * and renders links to the immediate neighbours at the end of the page.
 *
 * Notes whose titles do not start with a number get no navigation, so
 * non-sequential folders (Thoughts, Literature, …) are left alone. Adding a
 * new chapter is enough — no manual links or frontmatter.
 *
 * Config:
 *
 *   - source: ./plugins/chapter-nav
 *     enabled: true
 *     options:
 *       numberPattern: "^\\s*(\\d+)"
 *     layout:
 *       position: afterBody
 *       priority: 10
 */
export default function ChapterNav(userOpts) {
  const opts = { ...defaultOptions, ...(userOpts ?? {}) }

  let numberRe
  try {
    numberRe = new RegExp(opts.numberPattern)
  } catch {
    numberRe = new RegExp(defaultOptions.numberPattern)
  }

  const Component = ({ fileData, allFiles }) => {
    const currentSlug = cleanSlug(fileData?.slug)
    if (!currentSlug || currentSlug.endsWith("/index")) return null

    const current = chapterOf(fileData, numberRe)
    if (!current) return null

    const parent = parentOf(currentSlug)
    const siblings = []
    for (const file of allFiles ?? []) {
      const slug = cleanSlug(file?.slug)
      if (!slug || slug === currentSlug) continue
      if (file?.unlisted === true) continue
      if (parentOf(slug) !== parent) continue
      if (slug === parent || slug.endsWith("/index")) continue

      const chapter = chapterOf(file, numberRe)
      if (chapter) siblings.push(chapter)
    }

    const chapters = [current, ...siblings].sort(byChapter)
    const at = chapters.findIndex((chapter) => cleanSlug(chapter.file.slug) === currentSlug)
    if (at === -1) return null

    const previous = chapters[at - 1]
    const next = chapters[at + 1]
    if (!previous && !next) return null

    const link = (chapter, direction) =>
      h(
        "a",
        {
          class: `chapter-nav-link chapter-nav-${direction} internal`,
          href: resolveRelative(currentSlug, cleanSlug(chapter.file.slug)),
          rel: direction === "prev" ? "prev" : "next",
        },
        h(
          "span",
          { class: "chapter-nav-label" },
          direction === "prev" ? `← ${opts.previousLabel}` : `${opts.nextLabel} →`,
        ),
        h("span", { class: "chapter-nav-title" }, chapter.title),
      )

    return h(
      "nav",
      { class: "chapter-nav", "aria-label": opts.ariaLabel },
      previous
        ? link(previous, "prev")
        : h("span", { class: "chapter-nav-spacer", "aria-hidden": "true" }),
      next ? link(next, "next") : null,
    )
  }

  Component.css = css
  return Component
}
