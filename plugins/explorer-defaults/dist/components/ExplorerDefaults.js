/**
 * Explorer defaults for the garden:
 *
 *   1. A reader who has never touched the explorer gets the whole tree: open
 *      on desktop (upstream already leaves it that way) with every folder
 *      expanded. A phone still gets the explorer hidden — the drawer is
 *      opened by tapping the hamburger — but its folders are expanded too.
 *      Folders the reader has folded stay folded: an explicit entry in the
 *      explorer's own `fileTree` store always wins over the default, so this
 *      only changes what a *fresh* browser sees.
 *   2. An expand/collapse-all button — next to the "Explorer" title on
 *      desktop, in the drawer's top-right corner on mobile — which writes the
 *      resulting state to that same store, so it survives navigation exactly
 *      like folding a single folder does.
 *
 * The upstream explorer renders its tree into the DOM on every nav and treats
 * any folder without a saved entry as collapsed, so the default is applied to
 * the rendered tree rather than by seeding the store up front: a
 * MutationObserver on the explorer re-runs the fix-up in the same task the
 * tree is written in, i.e. before the browser paints it.
 *
 * The button is injected for the same reason — the markup the explorer ships
 * has no place to put it — and is re-injected whenever a SPA navigation morphs
 * the page (micromorph compares children by index, so an extra node does not
 * survive it).
 */
const script = `
(() => {
  // Guard against double registration across SPA navigations
  if (window.__gardenExplorerDefaults) return
  window.__gardenExplorerDefaults = true

  // Where the explorer keeps per-folder fold state: [{ path, collapsed }, ...]
  const STORAGE_KEY = "fileTree"
  const TOGGLE_CLASS = "explorer-expand-toggle"
  const LABELS = {
    expand: "Expand all folders",
    collapse: "Collapse all folders",
  }
  // lucide's chevrons-up-down (expand) / chevrons-down-up (collapse)
  const ICONS = {
    expand: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
    collapse: '<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>',
  }

  const readSaved = () => {
    const saved = new Map()
    try {
      for (const entry of JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")) {
        if (entry && typeof entry.path === "string") saved.set(entry.path, !!entry.collapsed)
      }
    } catch (err) {}
    return saved
  }

  const writeSaved = (saved) => {
    try {
      const entries = []
      for (const [path, collapsed] of saved) entries.push({ path, collapsed })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch (err) {}
  }

  // Only folders the explorer has actually rendered: the <template> it clones
  // from holds a .folder-container too, but no data-folderpath until cloned.
  const foldersOf = (explorer) => {
    const folders = []
    for (const container of explorer.querySelectorAll(".folder-container[data-folderpath]")) {
      const outer = container.nextElementSibling
      if (outer && outer.classList.contains("folder-outer")) {
        folders.push({ path: container.dataset.folderpath, outer })
      }
    }
    return folders
  }

  const isOpen = (folder) => folder.outer.classList.contains("open")

  const iconSvg = (action) =>
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
    ' stroke-linejoin="round" aria-hidden="true">' + ICONS[action] + "</svg>"

  // The button offers whichever way the tree is not: expand while anything is
  // folded, collapse once everything is open.
  const syncToggles = (explorer) => {
    const folders = foldersOf(explorer)
    const action = folders.some((folder) => !isOpen(folder)) ? "expand" : "collapse"
    for (const toggle of explorer.querySelectorAll("." + TOGGLE_CLASS)) {
      toggle.classList.toggle("is-visible", folders.length > 0)
      if (toggle.dataset.action === action) continue
      toggle.dataset.action = action
      toggle.innerHTML = iconSvg(action)
      toggle.setAttribute("aria-label", LABELS[action])
      toggle.title = LABELS[action]
    }
  }

  const setAll = (explorer, open) => {
    const saved = readSaved()
    for (const folder of foldersOf(explorer)) {
      folder.outer.classList.toggle("open", open)
      saved.set(folder.path, !open)
    }
    writeSaved(saved)
    syncToggles(explorer)
  }

  // Folders without a saved entry open here, which is what makes a fresh
  // browser show the whole tree. Only ever opens: the explorer has already run
  // its own "open the folders on the way to this page" rule by now, so a
  // folder is collapsed only because it was saved that way.
  const applyDefaultOpen = (explorer) => {
    const saved = readSaved()
    for (const folder of foldersOf(explorer)) {
      if (!saved.has(folder.path)) folder.outer.classList.add("open")
    }
  }

  const buildToggle = (explorer, variant) => {
    const toggle = document.createElement("button")
    toggle.type = "button"
    toggle.className = TOGGLE_CLASS + " " + variant
    const drawer = explorer.querySelector(".explorer-content")
    if (drawer && drawer.id) toggle.setAttribute("aria-controls", drawer.id)
    toggle.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      setAll(explorer, toggle.dataset.action === "expand")
    })
    return toggle
  }

  const addToggles = (explorer) => {
    // Desktop: a header row holding the title button and the toggle. The title
    // button is moved into the row — the explorer looks it up by class, so
    // wrapping it changes nothing for its own handlers.
    let header = explorer.querySelector(".explorer-header")
    if (!header) {
      const title = explorer.querySelector(".desktop-explorer")
      if (title) {
        header = document.createElement("div")
        header.className = "explorer-header"
        title.replaceWith(header)
        header.appendChild(title)
      }
    }
    if (header && !header.querySelector("." + TOGGLE_CLASS)) {
      header.appendChild(buildToggle(explorer, "desktop-expand-toggle"))
    }

    // Mobile: the drawer covers the screen while it is open, so the toggle
    // goes in its top-right corner, mirroring the hamburger on the left. It
    // slides away with the drawer and stays hidden while that is closed.
    const drawer = explorer.querySelector(".explorer-content")
    if (drawer && !drawer.querySelector("." + TOGGLE_CLASS)) {
      drawer.appendChild(buildToggle(explorer, "mobile-expand-toggle"))
    }
  }

  const refresh = (explorer) => {
    addToggles(explorer)
    applyDefaultOpen(explorer)
    syncToggles(explorer)
  }

  const watched = new WeakSet()
  const watch = (explorer) => {
    if (watched.has(explorer)) return
    watched.add(explorer)
    new MutationObserver(() => refresh(explorer)).observe(explorer, {
      childList: true,
      subtree: true,
    })
  }

  // Runs on load, on every SPA navigation (which also drops the injected
  // buttons) and on every tree the explorer renders.
  const init = () => {
    for (const explorer of document.querySelectorAll(".explorer")) {
      watch(explorer)
      refresh(explorer)
    }
  }

  document.addEventListener("nav", init)
  init()
})()
`

const css = `
/* Expand/collapse-all control for the explorer (plugin: explorer-defaults). */
.explorer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.explorer-expand-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0.25rem;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: var(--secondary);
  cursor: pointer;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.explorer-expand-toggle:hover {
  color: var(--tertiary);
}

.explorer-expand-toggle svg {
  display: block;
}

/* Desktop: the toggle lives in the title row and only makes sense while the
   tree itself is showing. */
@media all and (min-width: 801px) {
  .explorer-expand-toggle.desktop-expand-toggle.is-visible {
    display: flex;
  }

  .explorer.collapsed .explorer-expand-toggle.desktop-expand-toggle {
    opacity: 0;
    pointer-events: none;
  }
}

/* Mobile: the desktop toggle stays out of the sticky top bar; the drawer
   toggle mirrors the hamburger across it. */
@media all and (max-width: 800px) {
  .explorer-expand-toggle.mobile-expand-toggle.is-visible {
    display: flex;
    position: absolute;
    top: 1rem;
    right: 1.5rem;
    padding: 0.6rem;
    color: var(--darkgray);
    z-index: 101;
  }
}
`

export default function ExplorerDefaults() {
  // Renders nothing — only contributes the script and styles above.
  const Component = () => null
  Component.afterDOMLoaded = script
  Component.css = css
  return Component
}
