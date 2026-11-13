# explorer-defaults

Local Quartz v5 plugin that changes what the explorer looks like on a browser
that has never touched it, and adds a bulk fold control:

- **Open by default** — a reader with no saved state gets the explorer open on
  desktop (upstream's default already) with _every folder expanded_. On mobile
  the explorer stays hidden behind the hamburger; only the drawer's folders are
  expanded.
- **Expand/collapse all** — a chevrons button next to the "Explorer" title on
  desktop, and in the top-right corner of the mobile drawer. It offers whichever
  way the tree is not (expand while anything is folded, collapse once everything
  is open).

Saved state still wins: the button and the per-folder chevrons write to the
explorer's own `fileTree` localStorage store, and a folder with an entry there
is never re-opened by the default. So the default only shows up where the reader
has no opinion yet, and a fresh browser (or a cleared store) is the case it
changes.

## How it works

`@quartz-community/explorer` renders its tree into the DOM on every nav, treats
any folder without a saved entry as collapsed, and ships markup with nowhere to
put a button. So both behaviours are applied to the _rendered_ tree by a
MutationObserver on the explorer element — the observer callback runs in the
task that wrote the tree, before the browser paints it, so the empty tree is
never shown.

On mobile, the markup arrives without `collapsed`; the only thing keeping the
drawer hidden before the explorer's script runs is the `hide-until-loaded`
display:none guard on the hamburger. The first time the explorer's stylesheet
applies, it gives the drawer both its off-screen transform (0 -> -100vw) and
its 200ms transition in the same style update, so a cold load paints the drawer
open for one frame and then animates it shut. The plugin adds
`.explorer-booting` before that: while the class is present the stylesheet pins
the drawer off-screen with transitions disabled. It is released two frames
after the explorer has removed the guard and collapsed the drawer, so the
drawer simply starts closed while opening and closing keep their animation.

Opening a folder after insertion is still a style change, though, and the
explorer's stylesheet transitions the unfold (`grid-template-rows` and the
chevron rotation, 0.3s). Left alone, every navigation would replay that unfold
for every folder without saved state, which reads as the tree flickering open
as the page changes. The default open therefore runs with transitions
suppressed on the explorer (`.explorer-applying-defaults`) and flushes the
opened state before restoring them; a folder the reader folds or unfolds by
hand keeps its animation.

The default open also runs before the explorer's own scroll restore can work:
upstream re-applies the saved `explorerScrollTop` immediately after rebuilding
the tree, while the default folders are still collapsed, so the list is too
short, the assignment clamps to the top, and it is never retried. Once the
folders are open (and the toggle row has settled, which can change the header
height), the plugin re-applies the saved scroll position so a reader who
navigates from lower down the tree stays where they were.

The injected button does not survive a SPA navigation: micromorph compares
children by index, so an extra node is replaced by whatever the fetched HTML has
in that slot. The plugin re-injects it from its `nav` listener, which runs right
after the morph.

The plugin declares a single component (`ExplorerDefaults`) that renders `null` —
it exists only to contribute an `afterDOMLoaded` script and a stylesheet. Quartz
collects resources from every registered component, so they ship on every page
even though the component is never placed in a layout slot.

`dist/` is committed as the plugin source; there is no build step.
