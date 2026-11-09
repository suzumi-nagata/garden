# Themed Folder Page

A page type for themed folder landing pages. It renders the normal folder
listing (`FolderContent`) but uses the `themed-folder` layout name, which has no
`byPageType` override and therefore gets the standard right sidebar (graph,
backlinks, table of contents).

A folder landing matches when its `index.md` has a `theme:` frontmatter value
(the SRS Grimoire uses `theme: witch`). Folders without a theme keep the normal
`folder` layout.

The listing is sorted by the page title with numeric collation, not by modified
date, so a numbered diary stays in entry order when older notes are edited.
