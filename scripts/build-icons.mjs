// Draws the PNG icons that older browsers and phones need, from public/favicon.svg.
// Browsers that read SVG icons use the SVG itself; Safari and the iOS home screen want PNGs.
//
// Usage: node scripts/build-icons.mjs
// Output: public/favicon-32.png (transparent, like the SVG) and public/apple-touch-icon.png (180 px)
//
// The home screen icon gets a white background with some room round the symbol, because iOS
// paints a transparent icon black. The tab icons stay transparent.
//
// It uses `sharp`, which is already installed as a dependency of vite-imagetools.

import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const svg = readFileSync('public/favicon.svg')
// A high density keeps the edges crisp when the 40 px drawing is scaled up.
const draw = (size) => sharp(svg, { density: Math.ceil((size / 40) * 72 * 2) }).resize(size, size)

await draw(32).png().toFile('public/favicon-32.png')
console.log('wrote public/favicon-32.png')

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }
const inner = await draw(132).png().toBuffer()
await sharp(inner)
  .extend({ top: 24, bottom: 24, left: 24, right: 24, background: WHITE })
  .flatten({ background: WHITE })
  .png()
  .toFile('public/apple-touch-icon.png')
console.log('wrote public/apple-touch-icon.png')
