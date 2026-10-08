/**
 * Mobile explorer behaviours ported from the Quartz 4 garden setup, where they
 * lived inline in `quartz/components/scripts/explorer.inline.ts`.
 *
 * The v4 patch did three things. The first (collapsing the explorer by default
 * on mobile *navigation*) is now built into the upstream v5 explorer plugin, so
 * this plugin carries the other two:
 *
 *   1. Collapse the explorer when the window is resized into the mobile
 *      layout — otherwise a desktop-open sidebar stays expanded and its
 *      full-screen drawer covers the page.
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

  // Collapse when the mobile layout kicks in (the mobile hamburger becomes
  // visible). No-op on desktop, where the hamburger is display:none.
  window.addEventListener("resize", () => {
    const explorer = document.querySelector(".explorer")
    if (!explorer) return
    const mobileExplorer = explorer.querySelector(".mobile-explorer")
    if (mobileExplorer && mobileExplorer.checkVisibility && mobileExplorer.checkVisibility()) {
      explorer.classList.add("collapsed")
      explorer.setAttribute("aria-expanded", "false")
      document.documentElement.classList.remove("mobile-no-scroll")
    }
  })

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
