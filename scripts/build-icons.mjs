// Draws the PNG icons that older browsers and phones need, from public/favicon.svg.
// Browsers that read SVG icons use the SVG itself; Safari and the iOS home screen want PNGs.
//
// Usage: node scripts/build-icons.mjs
// Output: public/favicon-32.png and public/apple-touch-icon.png (180 px)
//
// It uses `sharp`, which is already installed as a dependency of vite-imagetools.

import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const svg = readFileSync('public/favicon.svg')

for (const [file, size] of [
  ['public/favicon-32.png', 32],
  ['public/apple-touch-icon.png', 180],
]) {
  // A high density keeps the edges crisp when the 40 px drawing is scaled up to 180.
  await sharp(svg, { density: Math.ceil((size / 40) * 72 * 2) })
    .resize(size, size)
    .png()
    .toFile(file)
  console.log(`wrote ${file}`)
}
