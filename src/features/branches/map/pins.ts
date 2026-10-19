import type { Map as MapLibreMap } from 'maplibre-gl'
import { ATM_ICON, BRANCH_ICON, type IconShape } from '../../../shared/ui/typeIcons'
import { PIN_IMAGES } from './config'
import type { MapColors } from './layers'

/** Pins are drawn at twice the size they show at, so they stay sharp on high-density screens. */
export const PIN_PIXEL_RATIO = 2

// Sizes are in CSS pixels. Every image has a margin all round, for the soft shadow and the halo.
const MARGIN = 8
const BRANCH_SIZE = 34
const BRANCH_RADIUS = 8
const TAIL_HALF_WIDTH = 6
const TAIL_LENGTH = 8
const BRANCH_BORDER = 2.5
const ATM_RADIUS = 14
const ATM_RING = 3
const ATM_OUTER = 2
const HALO_WIDTH = 9

/** How big each pin is, relative to the standard one. */
export const PIN_SCALE = { branch: 1, atm: 1, selected: 1.3, selectedAtm: 1.3 } as const

export type PinKind = keyof typeof PIN_SCALE

const isAtmKind = (kind: PinKind) => kind === 'atm' || kind === 'selectedAtm'

/**
 * A branch pin is anchored by the tip of its tail and the image has a margin below it, so the layer
 * lifts the image by this much (in CSS pixels) for the tip to land exactly on the branch. An ATM pin
 * is anchored by its centre and needs no lift.
 */
export function pinTipOffset(kind: PinKind): number {
  return isAtmKind(kind) ? 0 : MARGIN * PIN_SCALE[kind]
}

/** Draws one of the line icons, given its path data, centred on a point. */
function drawIcon(
  context: CanvasRenderingContext2D,
  icon: IconShape,
  size: number,
  centreX: number,
  centreY: number,
  color: string,
) {
  context.save()
  context.translate(centreX - size / 2, centreY - size / 2)
  context.scale(size / 24, size / 24) // the icon paths are drawn in a 24 by 24 box
  Object.assign(context, { lineWidth: icon.strokeWidth, strokeStyle: color, lineCap: 'round', lineJoin: 'round' })
  context.stroke(new Path2D(icon.path))
  context.restore()
}

/** A rounded square with a pointed tail at the bottom centre. */
function branchOutline(context: CanvasRenderingContext2D, left: number, top: number) {
  const right = left + BRANCH_SIZE
  const bottom = top + BRANCH_SIZE
  const centre = left + BRANCH_SIZE / 2

  context.beginPath()
  context.moveTo(left + BRANCH_RADIUS, top)
  context.lineTo(right - BRANCH_RADIUS, top)
  context.arcTo(right, top, right, top + BRANCH_RADIUS, BRANCH_RADIUS)
  context.lineTo(right, bottom - BRANCH_RADIUS)
  context.arcTo(right, bottom, right - BRANCH_RADIUS, bottom, BRANCH_RADIUS)
  context.lineTo(centre + TAIL_HALF_WIDTH, bottom)
  context.lineTo(centre, bottom + TAIL_LENGTH)
  context.lineTo(centre - TAIL_HALF_WIDTH, bottom)
  context.lineTo(left + BRANCH_RADIUS, bottom)
  context.arcTo(left, bottom, left, bottom - BRANCH_RADIUS, BRANCH_RADIUS)
  context.lineTo(left, top + BRANCH_RADIUS)
  context.arcTo(left, top, left + BRANCH_RADIUS, top, BRANCH_RADIUS)
  context.closePath()
}

const SHADOW_ON = { shadowColor: 'rgba(0, 0, 0, 0.35)', shadowBlur: 4, shadowOffsetY: 2 }
const SHADOW_OFF = { shadowColor: 'transparent', shadowBlur: 0, shadowOffsetY: 0 }

function drawBranch(context: CanvasRenderingContext2D, colors: MapColors, selected: boolean) {
  branchOutline(context, MARGIN, MARGIN)

  if (selected) {
    // A soft ring around the chosen branch, which is drawn first so the pin covers its inner half.
    Object.assign(context, { globalAlpha: 0.22, lineWidth: HALO_WIDTH, strokeStyle: colors.deep, lineJoin: 'round' })
    context.stroke()
    context.globalAlpha = 1
  }

  Object.assign(context, SHADOW_ON, { fillStyle: selected ? colors.deep : colors.strong })
  context.fill()
  Object.assign(context, SHADOW_OFF, { lineWidth: BRANCH_BORDER, strokeStyle: colors.white, lineJoin: 'round' })
  context.stroke()

  drawIcon(context, BRANCH_ICON, 18, MARGIN + BRANCH_SIZE / 2, MARGIN + BRANCH_SIZE / 2, colors.white)
}

function drawAtm(context: CanvasRenderingContext2D, colors: MapColors, selected: boolean) {
  const centre = ATM_RADIUS + ATM_OUTER + MARGIN
  const circle = (radius: number, fill: string) => {
    context.beginPath()
    context.arc(centre, centre, radius, 0, Math.PI * 2)
    context.fillStyle = fill
    context.fill()
  }

  if (selected) {
    context.globalAlpha = 0.22
    circle(ATM_RADIUS + ATM_OUTER + 4, colors.deep)
    context.globalAlpha = 1
  }

  Object.assign(context, SHADOW_ON)
  circle(ATM_RADIUS + ATM_OUTER, colors.white) // a thin white edge, so the ring stands out from the map
  Object.assign(context, SHADOW_OFF)
  circle(ATM_RADIUS, colors.deep) // the ring
  circle(ATM_RADIUS - ATM_RING, selected ? colors.tint : colors.white)

  drawIcon(context, ATM_ICON, 16, centre, centre, colors.deep)
}

/** The size of a pin's image in CSS pixels, before scaling. */
function pinSize(atm: boolean): { width: number; height: number } {
  if (atm) {
    const side = (ATM_RADIUS + ATM_OUTER + MARGIN) * 2
    return { width: side, height: side }
  }
  return { width: BRANCH_SIZE + MARGIN * 2, height: BRANCH_SIZE + TAIL_LENGTH + MARGIN * 2 }
}

/** Draws a pin to a canvas and returns its pixels, or null where the browser cannot draw to a canvas. */
function createPin(kind: PinKind, colors: MapColors): ImageData | null {
  const scale = PIN_SCALE[kind]
  const atm = isAtmKind(kind)
  const { width, height } = pinSize(atm)

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * scale) * PIN_PIXEL_RATIO
  canvas.height = Math.ceil(height * scale) * PIN_PIXEL_RATIO
  const context = canvas.getContext('2d')
  if (!context) return null

  context.scale(PIN_PIXEL_RATIO * scale, PIN_PIXEL_RATIO * scale)
  const selected = kind === 'selected' || kind === 'selectedAtm'
  if (atm) drawAtm(context, colors, selected)
  else drawBranch(context, colors, selected)

  return context.getImageData(0, 0, canvas.width, canvas.height)
}

/**
 * Registers the four pins with the map. A branch is a blue rounded square with a tail and a building
 * in it; an ATM is a white circle with a dark ring and a card in it, so shape tells them apart and
 * colour is not the only cue. The chosen one of each is larger, with a soft halo, and the chosen ATM
 * is tinted. The icons are drawn from the same files the page uses.
 */
export function addPinImages(map: Pick<MapLibreMap, 'addImage'>, colors: MapColors): void {
  const pins: [string, PinKind][] = [
    [PIN_IMAGES.branch, 'branch'],
    [PIN_IMAGES.atm, 'atm'],
    [PIN_IMAGES.selected, 'selected'],
    [PIN_IMAGES.selectedAtm, 'selectedAtm'],
  ]

  for (const [name, kind] of pins) {
    const image = createPin(kind, colors)
    if (image) map.addImage(name, image, { pixelRatio: PIN_PIXEL_RATIO })
  }
}
