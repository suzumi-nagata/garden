import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const BackToBlog: QuartzComponent = ({ cfg, displayClass }: QuartzComponentProps) => {
  const blogUrl = cfg?.baseBlogUrl
    ? `https://${cfg.baseBlogUrl}`
    : cfg?.baseUrl
      ? `https://${cfg.baseUrl}`
      : undefined
  return (
    <a href={blogUrl} class={`back-to-blog ${displayClass ?? ""}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        style="margin-right: 4px;"
      >
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Main Blog
    </a>
  )
}

export default (() => BackToBlog) satisfies QuartzComponentConstructor
