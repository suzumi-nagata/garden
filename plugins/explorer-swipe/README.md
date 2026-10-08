# explorer-swipe

Local Quartz v5 plugin with the v4 garden's mobile explorer behaviours:

- **Resize**: collapse the explorer when the window is resized into the mobile
  layout (otherwise a desktop-open sidebar covers the screen with its
  full-screen drawer)
- **Swipe right** on a collapsed explorer → open it
- **Swipe left** on an open explorer → close it

Ported from `quartz/components/scripts/explorer.inline.ts` on the v4 branch.
The other half of that patch (collapsing the explorer by default on mobile
*navigation*) now exists upstream in `@quartz-community/explorer`.

## How it works

The plugin declares a single component (`ExplorerSwipe`) that renders `null` —
it exists only to contribute an `afterDOMLoaded` script. Quartz collects
resources from every registered component, so the script ships on every page
even though the component is never placed in a layout slot.

`dist/` is committed as the plugin source; there is no build step.
