# Graph (local patch)

A copy of `@quartz-community/graph` with three small fixes:

1. The current page slug is read from `<body data-slug>` instead of the URL
   pathname. Folder landing URLs end in `/`, which the original normalizer
   turns into `folder` while the content index key is `folder/`, so the local
   graph on a folder landing showed only the current node.
2. Theme variables are read from `document.body` instead of
   `document.documentElement`, so body-scoped page themes (like the grimoire's
   moss and plum) colour the graph.
3. Link lines use `--graph-link`, falling back to `--gray`, so connections are
   visible on parchment instead of vanishing into `--lightgray`.

The component code is otherwise untouched. Re-copy `dist/index.js` from a newer
community release and re-apply those three replacements when upgrading.
