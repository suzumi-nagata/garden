import { i18n } from "../../i18n"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

/**
 * 404 page body, styled after the main blog's 404
 * (https://suzumi-nagata.github.io): outlined "404", a large headline, a
 * monospace apology and a floating character logo.
 *
 * Styles live in `quartz/styles/custom.scss` under "404 page".
 */
const NotFound: QuartzComponent = ({ cfg, ctx }: QuartzComponentProps) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = ctx.argv.serve ? "/" : url.pathname
  const root = baseDir.endsWith("/") ? baseDir : `${baseDir}/`

  return (
    <article class="not-found-hero">
      <div class="not-found-content">
        <div class="not-found-text">
          <h1 class="not-found-title">
            <span class="not-found-outline">404</span>
            <span class="not-found-heading">This Page Does Not Exist</span>
          </h1>
          <p class="not-found-subtitle">&gt; {i18n(cfg.locale).pages.error.notFound}</p>
          <a href={baseDir} class="not-found-button">
            {i18n(cfg.locale).pages.error.home}
          </a>
        </div>
        <div class="not-found-image">
          <img src={`${root}static/404-logo.png`} alt="" class="not-found-logo" />
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
          if (typeof fetchData !== "undefined") {
            fetchData.then(function(index) {
              var basePath = document.body.dataset.basepath || "";
              if (basePath.length > 1 && basePath.endsWith("/")) {
                basePath = basePath.slice(0, -1);
              }
              var pathname = window.location.pathname;
              var hasBasePrefix = basePath.length > 1 && pathname.startsWith(basePath);
              if (hasBasePrefix) {
                pathname = pathname.slice(basePath.length);
              }
              if (pathname.startsWith("/")) {
                pathname = pathname.slice(1);
              }
              if (pathname.endsWith("/")) {
                pathname = pathname.slice(0, -1);
              }
              if (pathname.endsWith(".html")) {
                pathname = pathname.slice(0, -5);
              }
              if (pathname.endsWith("/index")) {
                pathname = pathname.slice(0, -6);
              }
              var lowered = pathname.toLowerCase();
              if (lowered !== pathname && index[lowered] != null) {
                var prefix = hasBasePrefix ? basePath : "";
                var target = prefix + (prefix.endsWith("/") ? "" : "/") + lowered;
                window.location.replace(target);
              }
            });
          }
          `,
        }}
      />
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
