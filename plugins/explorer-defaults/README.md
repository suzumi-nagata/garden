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
task that wrote the tree, before the browser paints it, so nothing flickers.

The injected button does not survive a SPA navigation: micromorph compares
children by index, so an extra node is replaced by whatever the fetched HTML has
in that slot. The plugin re-injects it from its `nav` listener, which runs right
after the morph.

The plugin declares a single component (`ExplorerDefaults`) that renders `null` —
it exists only to contribute an `afterDOMLoaded` script and a stylesheet. Quartz
collects resources from every registered component, so they ship on every page
even though the component is never placed in a layout slot.

`dist/` is committed as the plugin source; there is no build step.
