import { ATM_ICON, BRANCH_ICON } from '../../../shared/ui/typeIcons'
import { PIN_IMAGES } from './config'
import type { MapColors } from './layers'
import { addPinImages, PIN_PIXEL_RATIO, PIN_SCALE, pinTipOffset } from './pins'

const colors: MapColors = {
  primary: '#111111',
  strong: '#222222',
  deep: '#333333',
  ink: '#000000',
  white: '#ffffff',
  tint: '#555555',
  location: '#444444',
}

type Context = Record<string, unknown> & {
  fill: ReturnType<typeof vi.fn>
  stroke: ReturnType<typeof vi.fn>
  arc: ReturnType<typeof vi.fn>
  arcTo: ReturnType<typeof vi.fn>
  lineTo: ReturnType<typeof vi.fn>
}

/** jsdom cannot draw, so a canvas context that records what is drawn, and a Path2D that remembers its path. */
function stubCanvas() {
  const contexts: Context[] = []
  const paths: string[] = []
  vi.stubGlobal(
    'Path2D',
    class {
      constructor(path: string) {
        paths.push(path)
      }
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
    const context: Context = {
      scale: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arcTo: vi.fn(),
      arc: vi.fn(),
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
  return { contexts, paths }
}

function register() {
  const map = { addImage: vi.fn() }
  addPinImages(map as never, colors)
  const image = (name: string) =>
    map.addImage.mock.calls.find((call) => call[0] === name)![1] as { width: number; height: number }
  return { map, image }
}

describe('addPinImages', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('adds a branch pin, an ATM pin, and a larger chosen version of each', () => {
    stubCanvas()
    const { map } = register()

    expect(map.addImage.mock.calls.map((call) => call[0])).toEqual(Object.values(PIN_IMAGES))
  })

  it('draws each pin at the screen density, so it stays sharp', () => {
    stubCanvas()
    const { map } = register()

    for (const call of map.addImage.mock.calls) {
      expect(call[2]).toEqual({ pixelRatio: PIN_PIXEL_RATIO })
      expect(call[1].width).toBeGreaterThan(0)
    }
  })

  it('gives a branch pin a tail, so it is taller than wide, and an ATM pin none, so it is round', () => {
    stubCanvas()
    const { image } = register()

    expect(image(PIN_IMAGES.branch).height).toBeGreaterThan(image(PIN_IMAGES.branch).width)
    expect(image(PIN_IMAGES.atm).height).toBe(image(PIN_IMAGES.atm).width)
  })

  it('makes the chosen pin of each kind larger than the ordinary one', () => {
    stubCanvas()
    const { image } = register()

    expect(image(PIN_IMAGES.selected).height).toBeGreaterThan(image(PIN_IMAGES.branch).height)
    expect(image(PIN_IMAGES.selectedAtm).height).toBeGreaterThan(image(PIN_IMAGES.atm).height)
  })

  it('draws the building and the card from the provided icon files', () => {
    const { paths } = stubCanvas()
    register()

    expect(paths).toContain(BRANCH_ICON.path)
    expect(paths).toContain(ATM_ICON.path)
  })

  it('draws a branch as a rounded square with a tail, and an ATM as circles', () => {
    const { contexts } = stubCanvas()
    register()
    const [branch, atm, selectedBranch, selectedAtm] = contexts

    expect(branch.arcTo).toHaveBeenCalledTimes(4) // four rounded corners
    expect(branch.arc).not.toHaveBeenCalled()
    expect(branch.lineTo.mock.calls.length).toBeGreaterThan(4) // the sides, and the tail
    expect(atm.arc).toHaveBeenCalled()
    expect(atm.arcTo).not.toHaveBeenCalled()
    // The chosen ones add a halo to the same shape.
    expect(selectedBranch.stroke.mock.calls.length).toBeGreaterThan(branch.stroke.mock.calls.length)
    expect(selectedAtm.arc.mock.calls.length).toBeGreaterThan(atm.arc.mock.calls.length)
  })

  it('leaves the pins out, without throwing, when the browser cannot draw', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const map = { addImage: vi.fn() }

    expect(() => addPinImages(map as never, colors)).not.toThrow()
    expect(map.addImage).not.toHaveBeenCalled()
  })
})

describe('pinTipOffset', () => {
  it('lifts a branch pin by the margin below its tail, more for the chosen one', () => {
    expect(pinTipOffset('branch')).toBeGreaterThan(0)
    expect(pinTipOffset('selected')).toBeGreaterThan(pinTipOffset('branch'))
    expect(PIN_SCALE.selected).toBeGreaterThan(PIN_SCALE.branch)
  })

  it('does not lift an ATM pin, which is held by its centre', () => {
    expect(pinTipOffset('atm')).toBe(0)
    expect(pinTipOffset('selectedAtm')).toBe(0)
  })
})
