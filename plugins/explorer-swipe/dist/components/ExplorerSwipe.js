/**
 * Mobile explorer behaviours ported from the Quartz 4 garden setup, where they
 * lived inline in `quartz/components/scripts/explorer.inline.ts`.
 *
 * The v4 patch did three things. The first (collapsing the explorer by default
 * on mobile *navigation*) is now built into the upstream v5 explorer plugin, so
 * this plugin carries the other two:
 *
 *   1. Keep the explorer's open/closed state in step with the layout when the
 *      window is resized across the mobile breakpoint (the mobile hamburger
 *      becomes visible):
 *        - desktop → mobile: close it, otherwise a desktop-open sidebar stays
 *          expanded and its full-screen drawer covers the page.
 *        - mobile → desktop: put it back the way it was on desktop. The mobile
 *          drawer being closed says nothing about the desktop tree, and
 *          leaving `collapsed` on folds the tree away (its content box
 *          collapses to zero height).
 *   2. Swipe gestures:
 *        - swipe right (Δx > 50px) on a collapsed explorer → open it
 *        - swipe left  (Δx < -50px) on an open explorer   → close it
 *      Vertical-ish gestures are ignored so scrolling is unaffected.
 */
const script = `
(() => {
  // Guard against double registration across SPA navigations
  if (window.__gardenExplorerSwipe) return
  window.__gardenExplorerSwipe = true

  let startX = 0
  let startY = 0
  const SWIPE_THRESHOLD = 50

  // null until the first sync tells us which layout we started in
  let wasMobile = null
  // The explorer's fold state as last seen in the desktop layout
  let desktopCollapsed = false

  const isVisible = (el) => {
    if (!el) return false
    return el.checkVisibility ? el.checkVisibility() : getComputedStyle(el).display !== "none"
  }

  // Read the layout from the desktop Explorer header, which the explorer
  // stylesheet hides below the breakpoint. The mobile hamburger can't answer
  // this before the explorer's own handler has run: it ships with the
  // hide-until-loaded class (display: none) until the content index has
  // loaded, so an earlier check would read a phone as a desktop.
  const isMobileLayout = (explorer) => {
    const desktopExplorer = explorer.querySelector(".desktop-explorer")
    if (desktopExplorer) return !isVisible(desktopExplorer)
    return isVisible(explorer.querySelector(".mobile-explorer"))
  }

  // Act only on layout *changes*: a resize within the same layout (address bar
  // or on-screen keyboard, for instance) must not close an open drawer. No-op
  // on desktop, where the hamburger is display:none.
  const syncExplorer = () => {
    const explorer = document.querySelector(".explorer")
    if (!explorer) return
    const mobile = isMobileLayout(explorer)

    if (mobile) {
      if (wasMobile === false) {
        // desktop → mobile: remember the desktop state, then close the drawer
        desktopCollapsed = explorer.classList.contains("collapsed")
        explorer.classList.add("collapsed")
        explorer.setAttribute("aria-expanded", "false")
        document.documentElement.classList.remove("mobile-no-scroll")
      }
    } else if (wasMobile !== false) {
      // mobile → desktop (or the first run, already in the desktop layout):
      // restore the desktop state instead of leaving the tree folded
      explorer.classList.toggle("collapsed", desktopCollapsed)
      explorer.setAttribute("aria-expanded", desktopCollapsed ? "false" : "true")
      document.documentElement.classList.remove("mobile-no-scroll")
    } else {
      // desktop → desktop: remember a manual fold for the next round trip
      desktopCollapsed = explorer.classList.contains("collapsed")
    }
    wasMobile = mobile
  }

  window.addEventListener("resize", syncExplorer)
  syncExplorer()

  document.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0]
      if (!t) return
      startX = t.pageX
      startY = t.pageY
    },
    { passive: true },
  )

  document.addEventListener(
    "touchend",
    (e) => {
      const t = e.changedTouches[0]
      if (!t) return
      const deltaX = t.pageX - startX
      const deltaY = Math.abs(t.pageY - startY)
      if (deltaY > SWIPE_THRESHOLD) return
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return

      const explorer = document.querySelector(".explorer")
      if (!explorer) return

      const isCollapsed = explorer.classList.contains("collapsed")
      if (isCollapsed && deltaX > 0) {
        explorer.classList.remove("collapsed")
        explorer.setAttribute("aria-expanded", "true")
        document.documentElement.classList.add("mobile-no-scroll")
      } else if (!isCollapsed && deltaX < 0) {
        explorer.classList.add("collapsed")
        explorer.setAttribute("aria-expanded", "false")
        document.documentElement.classList.remove("mobile-no-scroll")
      }
    },
    { passive: true },
  )
})()
`

export default function ExplorerSwipe() {
  // Renders nothing — only contributes the script above.
  const Component = () => null
  Component.afterDOMLoaded = script
  return Component
}
