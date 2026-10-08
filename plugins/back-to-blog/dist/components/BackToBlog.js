import { h } from "preact"

const defaultOptions = {
  href: "https://suzumi-nagata.github.io",
  label: "Main Blog",
}

/**
 * "Back to the main blog" link — ported from the Quartz 4 garden setup
 * (`quartz/components/BackToBlog.tsx`), where the URL came from a custom
 * `baseBlogUrl` config key. In v5 the URL is a plugin option instead:
 *
 *   - source: ./plugins/back-to-blog
 *     options:
 *       href: https://suzumi-nagata.github.io
 *       label: Main Blog
 *
 * Styling lives in `quartz/styles/custom.scss` (`.back-to-blog`).
 */
export default function BackToBlog(userOpts) {
  const opts = { ...defaultOptions, ...(userOpts ?? {}) }

  const Component = ({ displayClass }) =>
    h(
      "a",
      {
        href: opts.href,
        class: displayClass ? `back-to-blog ${displayClass}` : "back-to-blog",
      },
      h(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          width: "14",
          height: "14",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          style: "margin-right: 4px;",
        },
        h("line", { x1: "19", y1: "12", x2: "5", y2: "12" }),
        h("polyline", { points: "12 19 5 12 12 5" }),
      ),
      opts.label,
    )

  return Component
}
