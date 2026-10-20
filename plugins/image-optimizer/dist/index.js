// Build-time image optimizer for the garden.
//
// Every local image referenced from Markdown (including `![[image.png]]`
// embeds) is converted to WebP when the build runs. The Markdown keeps
// pointing at the original PNG/JPEG; this transformer rewrites the emitted
// <img src> to the generated WebP and writes that WebP into `public/`.
//
// Also adds `loading="lazy"`, `decoding="async"` and intrinsic width/height
// (unless the author explicitly sized the image).
//
// `dist/` is committed as the plugin source; there is no build step.

import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import sharp from "sharp"
import { slugifyFilePath } from "@quartz-community/utils"

const CACHE_DIR = path.join(process.cwd(), ".quartz-cache", "image-optimizer")
const SOURCE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"])
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"])

const memoryCache = new Map()

function isRemote(src) {
  // Anything with a scheme or a protocol-relative URL is external.
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src)
}

function splitSuffix(src) {
  const i = src.search(/[?#]/)
  return i === -1 ? { pathname: src, suffix: "" } : { pathname: src.slice(0, i), suffix: src.slice(i) }
}

function replaceExtension(p, extension) {
  const ext = path.posix.extname(p)
  return ext ? p.slice(0, -ext.length) + extension : p + extension
}

function decode(pathname) {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

async function exists(p) {
  try {
    await fsp.access(p)
    return true
  } catch {
    return false
  }
}

// Map both the raw content-relative path and its slugified form to the file,
// so lookups work for plain Markdown paths and for Obsidian embeds (whose URL
// has already been slugified by the OFM plugin).
function buildImageMap(contentDir) {
  const map = new Map()

  const walk = (dir) => {
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(abs)
      } else if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        const rel = path.relative(contentDir, abs).split(path.sep).join("/")
        const value = { abs, rel }
        map.set(rel, value)
        map.set(slugifyFilePath(rel), value)
      }
    }
  }

  walk(contentDir)
  return map
}

async function processImage(absSource, options) {
  const stat = await fsp.stat(absSource)
  const key = `${absSource}\0${stat.mtimeMs}\0${stat.size}\0${options.maxWidth}\0${options.quality}`
  const cached = memoryCache.get(key)
  if (cached) return cached

  const hash = crypto.createHash("sha256").update(key).digest("hex").slice(0, 20)
  const cacheFile = path.join(CACHE_DIR, `${hash}.webp`)

  if (await exists(cacheFile)) {
    const metadata = await sharp(cacheFile).metadata()
    const result = { file: cacheFile, width: metadata.width, height: metadata.height }
    memoryCache.set(key, result)
    return result
  }

  const { data, info } = await sharp(absSource, { failOn: "none" })
    .rotate()
    .resize({ width: options.maxWidth, withoutEnlargement: true })
    .webp({ quality: options.quality, effort: 6 })
    .toBuffer({ resolveWithObject: true })

  await fsp.mkdir(CACHE_DIR, { recursive: true })
  const tmp = `${cacheFile}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`
  await fsp.writeFile(tmp, data)
  await fsp.rename(tmp, cacheFile)

  const result = { file: cacheFile, width: info.width, height: info.height }
  memoryCache.set(key, result)
  return result
}

async function copyTo(sourceFile, destination) {
  await fsp.mkdir(path.dirname(destination), { recursive: true })
  try {
    const [src, dst] = await Promise.all([fsp.stat(sourceFile), fsp.stat(destination)])
    if (src.size === dst.size) return
  } catch {
    // destination missing; copy below
  }
  const tmp = `${destination}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`
  await fsp.copyFile(sourceFile, tmp)
  await fsp.rename(tmp, destination)
}

function numericAttribute(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && /^\d+$/.test(value)) return Number.parseInt(value, 10)
  return null
}

function desiredDimensions(node, width, height) {
  const authorWidth = numericAttribute(node.properties.width)
  const authorHeight = numericAttribute(node.properties.height)

  if (authorWidth && authorHeight) return [authorWidth, authorHeight]
  if (authorWidth) return [authorWidth, Math.round((authorWidth * height) / width)]
  if (authorHeight) return [Math.round((authorHeight * width) / height), authorHeight]
  return [width, height]
}

function eachImage(node, fn) {
  if (!node || typeof node !== "object") return
  if (node.type === "element" && node.tagName === "img") fn(node)
  if (Array.isArray(node.children)) {
    for (const child of node.children) eachImage(child, fn)
  }
}

const ImageOptimizer = (opts = {}) => {
  const options = {
    maxWidth: 1400,
    quality: 82,
    ...opts,
  }

  return {
    name: "ImageOptimizer",
    htmlPlugins(ctx) {
      const contentDir = path.resolve(ctx.argv.directory)
      const outputDir = path.resolve(ctx.argv.output)
      const images = buildImageMap(contentDir)

      return [
        () => async (tree, file) => {
          const pageDir = path.posix.dirname(file.data.relativePath ?? "")
          const jobs = []

          eachImage(tree, (node) => {
            node.properties ??= {}
            if (node.properties.loading === undefined) node.properties.loading = "lazy"
            if (node.properties.decoding === undefined) node.properties.decoding = "async"

            const src = node.properties.src
            if (typeof src !== "string" || src.length === 0 || isRemote(src)) return

            const { pathname, suffix } = splitSuffix(src)
            const decodedPathname = decode(pathname)
            const extension = path.posix.extname(decodedPathname).toLowerCase()
            if (!SOURCE_EXTENSIONS.has(extension)) return

            const relKey = decodedPathname.startsWith("/")
              ? path.posix.normalize(decodedPathname.slice(1))
              : path.posix.normalize(path.posix.join(pageDir, decodedPathname))
            const image = images.get(relKey) ?? images.get(slugifyFilePath(relKey))
            if (!image) return

            jobs.push(
              (async () => {
                const webpRel = slugifyFilePath(replaceExtension(image.rel, ".webp"))
                const destination = path.join(outputDir, webpRel)
                const result = await processImage(image.abs, options)
                await copyTo(result.file, destination)

                node.properties.src = replaceExtension(pathname, ".webp") + suffix
                const [width, height] = desiredDimensions(node, result.width, result.height)
                node.properties.width = width
                node.properties.height = height

                if (ctx.argv.verbose) {
                  console.log(`[image-optimizer] ${image.rel} -> ${webpRel}`)
                }
              })().catch((error) => {
                console.warn(
                  `[image-optimizer] could not optimize ${image.abs}: ${error.message}`,
                )
              }),
            )
          })

          await Promise.all(jobs)
        },
      ]
    },
  }
}

export default ImageOptimizer
