import type { Map as MapLibreMap } from 'maplibre-gl'
import { PIN_IMAGES } from './config'
import type { MapColors } from './layers'

/** Pins are drawn at twice the size they show at, so they stay sharp on high-density screens. */
export const PIN_PIXEL_RATIO = 2

// Sizes are in CSS pixels. The image has a margin all round so the soft shadow is not clipped.
const PIN_WIDTH = 30
const PIN_HEIGHT = 42
const MARGIN = 5
const STROKE = 2.5

/** How big each pin is, relative to the standard branch pin. */
export const PIN_SCALE = { branch: 1, atm: 0.9, selected: 1.3 } as const

/**
 * Each image has a margin below the pin's tip, for its shadow, so the layer lifts the image by
 * this much (in CSS pixels) for the tip to land exactly on the branch. It grows with the pin.
 */
export function pinTipOffset(kind: keyof typeof PIN_SCALE): number {
  return (MARGIN + STROKE / 2) * PIN_SCALE[kind]
}

interface PinSpec {
  /** Relative to the standard pin. */
  scale: number
  fill: string
  outline: string
  dot: string
}

/**
 * Draws a map pin: a circle that narrows to a point, with a dot in the middle, like the pins
 * people know from other maps. Returns null where the browser cannot draw to a canvas.
 */
function drawPin({ scale, fill, outline, dot }: PinSpec): ImageData | null {
  const width = Math.ceil((PIN_WIDTH + MARGIN * 2) * scale)
  const height = Math.ceil((PIN_HEIGHT + MARGIN * 2) * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width * PIN_PIXEL_RATIO
  canvas.height = height * PIN_PIXEL_RATIO
  const context = canvas.getContext('2d')
  if (!context) return null

  context.scale(PIN_PIXEL_RATIO * scale, PIN_PIXEL_RATIO * scale)

  const radius = PIN_WIDTH / 2 - STROKE / 2
  const centreX = MARGIN + PIN_WIDTH / 2
  const centreY = MARGIN + STROKE / 2 + radius
  const tipY = MARGIN + PIN_HEIGHT - STROKE / 2

  // The straight edges meet the circle where they just touch it, which is `angle` either side of
  // straight down: cos(angle) = radius / distance from the centre to the tip.
  const angle = Math.acos(radius / (tipY - centreY))

  context.beginPath()
  context.arc(centreX, centreY, radius, Math.PI / 2 + angle, Math.PI / 2 - angle + Math.PI * 2)
  context.lineTo(centreX, tipY)
  context.closePath()

  Object.assign(context, {
    shadowColor: 'rgba(0, 0, 0, 0.35)',
    shadowBlur: 4,
    shadowOffsetY: 2,
    fillStyle: fill,
  })
  context.fill()

  // The outline and the dot are drawn without the shadow, so only the pin as a whole casts one.
  Object.assign(context, { shadowColor: 'transparent', shadowBlur: 0, shadowOffsetY: 0 })
  Object.assign(context, { lineWidth: STROKE, strokeStyle: outline, lineJoin: 'round' })
  context.stroke()

  context.beginPath()
  context.arc(centreX, centreY, radius * 0.42, 0, Math.PI * 2)
  Object.assign(context, { fillStyle: dot })
  context.fill()

  return context.getImageData(0, 0, canvas.width, canvas.height)
}

/**
 * Registers the branch, ATM and selected pins with the map. A branch is a solid brand-blue pin
 * with a white dot; an ATM is a white pin with a dark ring and dot, so fill tells them apart and
 * colour is not the only cue; the selected pin is larger, with a black outline.
 */
export function addPinImages(map: Pick<MapLibreMap, 'addImage'>, colors: MapColors): void {
  const pins: [string, PinSpec][] = [
    [PIN_IMAGES.branch, { scale: PIN_SCALE.branch, fill: colors.primary, outline: colors.white, dot: colors.white }],
    [PIN_IMAGES.atm, { scale: PIN_SCALE.atm, fill: colors.white, outline: colors.deep, dot: colors.deep }],
    [PIN_IMAGES.selected, { scale: PIN_SCALE.selected, fill: colors.strong, outline: colors.ink, dot: colors.white }],
  ]

  for (const [name, spec] of pins) {
    const image = drawPin(spec)
    if (image) map.addImage(name, image, { pixelRatio: PIN_PIXEL_RATIO })
  }
}
