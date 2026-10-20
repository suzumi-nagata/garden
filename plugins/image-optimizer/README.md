# Image Optimizer

Local Quartz transformer that optimizes images at build time.

- Converts local `.png`, `.jpg` and `.jpeg` images referenced from Markdown into
  WebP (max width 1400px, quality 82 by default).
- Leaves the Markdown untouched: keep writing `![[photo.png]]` or
  `![alt](images/photo.png)`. The emitted `<img src>` is rewritten to the
  generated `.webp`.
- Adds `loading="lazy"`, `decoding="async"` and intrinsic `width`/`height`
  (author-specified image dimensions are preserved).
- External images and Quartz static assets are not touched, but they still get
  lazy loading.
- Processed files are cached in `.quartz-cache/image-optimizer/`.

Options (in `quartz.config.yaml`):

```yaml
- source: ./plugins/image-optimizer
  enabled: true
  options:
    maxWidth: 1400
    quality: 82
```

`dist/index.js` is the committed source; there is no build step.
