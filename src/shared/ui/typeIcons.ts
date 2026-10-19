import atmSvg from '@/assets/atm-icon.svg?raw'
import branchSvg from '@/assets/branch-icon.svg?raw'

/** What is needed to draw one of the line icons, wherever it is drawn: in the page or on a canvas. */
export interface IconShape {
  /** SVG path data, in a 24 by 24 box. */
  path: string
  strokeWidth: number
}

/**
 * Reads the path and stroke width out of an SVG icon file. The asset files are the single source of
 * truth for these icons, so the map pins, the cards and the search all draw exactly the same shape.
 */
export function parseIconSvg(svg: string): IconShape {
  const path = /<path[^>]*\sd="([^"]+)"/.exec(svg)?.[1]
  if (!path) throw new Error('The icon has no path.')
  const strokeWidth = Number(/stroke-width="([\d.]+)"/.exec(svg)?.[1] ?? 2)
  return { path, strokeWidth }
}

export const BRANCH_ICON = parseIconSvg(branchSvg)
export const ATM_ICON = parseIconSvg(atmSvg)
