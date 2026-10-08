# back-to-blog

Local Quartz v5 plugin that renders the "Main Blog" link in the left sidebar.

Ported from the v4 `quartz/components/BackToBlog.tsx` component, where the URL
came from a custom `baseBlogUrl` key in `quartz.config.ts`. In v5 it is a plugin
option (see `quartz.config.yaml`).

## Options

| Option  | Default                             | Description         |
| ------- | ----------------------------------- | ------------------- |
| `href`  | `https://suzumi-nagata.github.io`   | Link target         |
| `label` | `Main Blog`                         | Link text           |

## Structure

`dist/` is committed as the plugin source (same convention as the official
`quartz-community/plugin-template`) — there is no build step. `dist/index.js`
is the plugin entry, `dist/components/index.js` exports the component that the
manifest in `package.json` (`quartz.components`) declares.

Styled by `.back-to-blog` rules in `quartz/styles/custom.scss`.
