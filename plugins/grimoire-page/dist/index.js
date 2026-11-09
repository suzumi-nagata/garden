// Themed folder landings use the folder listing body, but a distinct page-type
// layout name so they inherit the standard right rail (graph, backlinks, TOC)
// instead of the bare folder layout. Today that is SRS Grimoire; the same
// plugin serves future themed folders such as Sbok.
import { FolderContent } from "@quartz-community/folder-page/components"

const isFolder = (page) => {
  const slug = page.slug ?? ""
  return slug.endsWith("/") || slug.endsWith("/index")
}

// The diary is numbered, so the Contents order must not depend on the
// modified date: editing an old entry shouldn't move it. Numeric collation
// keeps 002 before 010 even if the zero-padding ever changes.
const byEntryTitle = (a, b) => {
  const aFolder = isFolder(a)
  const bFolder = isFolder(b)
  if (aFolder !== bFolder) return aFolder ? -1 : 1
  const aTitle = a.frontmatter?.title ?? a.slug ?? ""
  const bTitle = b.frontmatter?.title ?? b.slug ?? ""
  return aTitle.localeCompare(bTitle, undefined, { numeric: true, sensitivity: "base" })
}

const body = () =>
  FolderContent({
    showFolderCount: false,
    showSubfolders: true,
    sort: byEntryTitle,
  })

export default function ThemedFolderPage() {
  return {
    name: "ThemedFolderPage",
    priority: 20,
    match: ({ slug, fileData }) => {
      if (!slug.endsWith("/index")) return false
      const theme = fileData.frontmatter?.theme
      return typeof theme === "string" && theme.trim().length > 0
    },
    layout: "themed-folder",
    body,
  }
}
