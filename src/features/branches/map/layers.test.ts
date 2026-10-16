import { LAYERS, PIN_IMAGES, SOURCE_ID, USER_LAYERS, USER_SOURCE_ID } from './config'
import { addBranchLayers, addUserLocationLayers, readMapColors, type MapColors } from './layers'

const colors: MapColors = {
  primary: '#111111',
  strong: '#222222',
  deep: '#333333',
  ink: '#000000',
  white: '#ffffff',
  location: '#444444',
}
const data = { type: 'FeatureCollection' as const, features: [] }

function setup() {
  const sources: Record<string, unknown> = {}
  const layers: Record<string, Record<string, unknown>> = {}
  const map = {
    addSource: vi.fn((id: string, source: unknown) => {
      sources[id] = source
    }),
    addLayer: vi.fn((layer: { id: string }) => {
      layers[layer.id] = layer as Record<string, unknown>
    }),
  }
  addBranchLayers(map as never, data, colors)
  return { sources, layers }
}

describe('addBranchLayers', () => {
  it('adds one clustered GeoJSON source', () => {
    const { sources } = setup()

    expect(sources[SOURCE_ID]).toMatchObject({ type: 'geojson', cluster: true, data })
  })

  it('adds a layer each for clusters, counts, branches, ATMs and the selection', () => {
    const { layers } = setup()

    expect(Object.keys(layers)).toEqual(Object.values(LAYERS))
  })

  it('draws every layer from the branch source', () => {
    const { layers } = setup()

    for (const layer of Object.values(layers)) expect(layer.source).toBe(SOURCE_ID)
  })

  it('colours the clusters from the colours it is given', () => {
    const { layers } = setup()

    expect(layers[LAYERS.clusters].paint).toMatchObject({ 'circle-color': colors.deep })
  })

  it('draws branches, ATMs and the selection as pins, each with its own image', () => {
    const { layers } = setup()

    expect(layers[LAYERS.branches]).toMatchObject({ type: 'symbol', layout: { 'icon-image': PIN_IMAGES.branch } })
    expect(layers[LAYERS.atms]).toMatchObject({ type: 'symbol', layout: { 'icon-image': PIN_IMAGES.atm } })
    expect(layers[LAYERS.selected]).toMatchObject({ type: 'symbol', layout: { 'icon-image': PIN_IMAGES.selected } })
  })

  it('anchors each pin by its tip, so the tip sits on the branch', () => {
    const { layers } = setup()

    for (const id of [LAYERS.branches, LAYERS.atms, LAYERS.selected]) {
      expect(layers[id].layout).toMatchObject({ 'icon-anchor': 'bottom' })
    }
  })

  it('never hides a pin to avoid a clash with another pin or a map label', () => {
    const { layers } = setup()

    for (const id of [LAYERS.branches, LAYERS.atms, LAYERS.selected]) {
      expect(layers[id].layout).toMatchObject({ 'icon-allow-overlap': true, 'icon-ignore-placement': true })
    }
  })

  it('keeps ATMs out of the branch layer and branches out of the ATM layer', () => {
    const { layers } = setup()

    expect(JSON.stringify(layers[LAYERS.branches].filter)).toContain('"!=",["get","type"],"atm"')
    expect(JSON.stringify(layers[LAYERS.atms].filter)).toContain('"==",["get","type"],"atm"')
  })

  it('starts with nothing selected', () => {
    const { layers } = setup()

    expect(layers[LAYERS.selected].filter).toEqual(['==', ['get', 'id'], ''])
  })
})

describe('addUserLocationLayers', () => {
  function setupUser() {
    const sources: Record<string, unknown> = {}
    const layers: Record<string, Record<string, unknown>> = {}
    const map = {
      addSource: vi.fn((id: string, source: unknown) => {
        sources[id] = source
      }),
      addLayer: vi.fn((layer: { id: string }) => {
        layers[layer.id] = layer as Record<string, unknown>
      }),
    }
    addUserLocationLayers(map as never, colors)
    return { sources, layers }
  }

  it('adds an unclustered source that starts empty', () => {
    const { sources } = setupUser()

    expect(sources[USER_SOURCE_ID]).toMatchObject({ type: 'geojson', data: { features: [] } })
    expect(sources[USER_SOURCE_ID]).not.toHaveProperty('cluster')
  })

  it('adds a halo and a dot', () => {
    const { layers } = setupUser()

    expect(Object.keys(layers)).toEqual(Object.values(USER_LAYERS))
  })

  it('draws the dot in the location colour, with a white ring', () => {
    const { layers } = setupUser()

    expect(layers[USER_LAYERS.dot].paint).toMatchObject({
      'circle-color': colors.location,
      'circle-stroke-color': colors.white,
    })
  })
})

describe('readMapColors', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--app-primary-deep')
  })

  it('falls back to the brand colours when the theme variables are missing', () => {
    expect(readMapColors().deep).toBe('#0033a0')
  })

  it('uses the familiar blue for the location dot whatever the theme says', () => {
    expect(readMapColors().location).toBe('#1a73e8')
  })

  it('reads the theme variables when they are set', () => {
    document.documentElement.style.setProperty('--app-primary-deep', '#123456')

    expect(readMapColors().deep).toBe('#123456')
  })
})
