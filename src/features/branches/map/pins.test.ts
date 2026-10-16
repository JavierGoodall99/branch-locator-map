import { PIN_IMAGES } from './config'
import type { MapColors } from './layers'
import { addPinImages, PIN_PIXEL_RATIO, PIN_SCALE, pinTipOffset } from './pins'

const colors: MapColors = {
  primary: '#111111',
  strong: '#222222',
  deep: '#333333',
  ink: '#000000',
  white: '#ffffff',
  location: '#444444',
}

type Context = Record<string, unknown> & { fill: ReturnType<typeof vi.fn> }

/** A canvas 2D context that records what is drawn, since jsdom cannot draw. */
function stubCanvas() {
  const contexts: Context[] = []
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    const context: Context = {
      scale: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4),
      })),
    }
    contexts.push(context)
    return context as unknown as CanvasRenderingContext2D
  } as never)
  return contexts
}

describe('addPinImages', () => {
  afterEach(() => vi.restoreAllMocks())

  it('adds a branch pin, an ATM pin and a larger selected pin', () => {
    stubCanvas()
    const map = { addImage: vi.fn() }

    addPinImages(map as never, colors)

    expect(map.addImage.mock.calls.map((call) => call[0])).toEqual(Object.values(PIN_IMAGES))
  })

  it('draws each pin at the screen density, so it stays sharp', () => {
    stubCanvas()
    const map = { addImage: vi.fn() }

    addPinImages(map as never, colors)

    for (const call of map.addImage.mock.calls) {
      expect(call[2]).toEqual({ pixelRatio: PIN_PIXEL_RATIO })
      expect(call[1].width).toBeGreaterThan(0)
      expect(call[1].height).toBeGreaterThan(call[1].width) // a teardrop is taller than it is wide
    }
  })

  it('makes the selected pin larger than the others', () => {
    stubCanvas()
    const map = { addImage: vi.fn() }

    addPinImages(map as never, colors)

    const size = (name: string) => map.addImage.mock.calls.find((call) => call[0] === name)![1].height
    expect(size(PIN_IMAGES.selected)).toBeGreaterThan(size(PIN_IMAGES.branch))
  })

  it('draws a filled shape and an outline for every pin', () => {
    const contexts = stubCanvas()

    addPinImages({ addImage: vi.fn() } as never, colors)

    expect(contexts).toHaveLength(3)
    for (const context of contexts) {
      expect(context.fill).toHaveBeenCalled()
      expect(context.stroke).toHaveBeenCalled()
    }
  })

  it('leaves the pins out, without throwing, when the browser cannot draw', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const map = { addImage: vi.fn() }

    expect(() => addPinImages(map as never, colors)).not.toThrow()
    expect(map.addImage).not.toHaveBeenCalled()
  })

  it('lifts each pin by the margin below its tip, more for a bigger pin', () => {
    // The image has a margin below the tip for its shadow; the layer lifts the image by this much.
    expect(pinTipOffset('branch')).toBeGreaterThan(0)
    expect(pinTipOffset('selected')).toBeGreaterThan(pinTipOffset('branch'))
    expect(pinTipOffset('atm')).toBeLessThan(pinTipOffset('branch'))
    expect(PIN_SCALE.selected).toBeGreaterThan(PIN_SCALE.branch)
  })
})
