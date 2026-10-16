import { LAYERS, PIN_IMAGES, SOURCE_ID, USER_LAYERS, USER_SOURCE_ID } from './config'
import { addBranchLayers, addUserLocationLayers, readMapColors, selectedFilters, type MapColors } from './layers'

const colors: MapColors = {
  primary: '#111111',
  strong: '#222222',
  deep: '#333333',
  ink: '#000000',
  white: '#ffffff',
  tint: '#555555',
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

  it('adds a layer each for clusters, counts, branches, ATMs and the chosen branch and ATM', () => {
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
    expect(layers[LAYERS.selectedAtm]).toMatchObject({ type: 'symbol', layout: { 'icon-image': PIN_IMAGES.selectedAtm } })
  })

  it('holds a branch pin by the tip of its tail and an ATM pin by its centre, so each sits exactly on its branch', () => {
    const { layers } = setup()

    for (const id of [LAYERS.branches, LAYERS.selected]) {
      expect(layers[id].layout).toMatchObject({ 'icon-anchor': 'bottom' })
      expect((layers[id].layout as { 'icon-offset': number[] })['icon-offset'][1]).toBeGreaterThan(0)
    }
    for (const id of [LAYERS.atms, LAYERS.selectedAtm]) {
      expect(layers[id].layout).toMatchObject({ 'icon-anchor': 'center', 'icon-offset': [0, 0] })
    }
  })

  it('never hides a pin to avoid a clash with another pin or a map label', () => {
    const { layers } = setup()

    for (const id of [LAYERS.branches, LAYERS.atms, LAYERS.selected, LAYERS.selectedAtm]) {
      expect(layers[id].layout).toMatchObject({ 'icon-allow-overlap': true, 'icon-ignore-placement': true })
    }
  })

  it('keeps ATMs out of the branch layer and branches out of the ATM layer', () => {
    const { layers } = setup()

    expect(JSON.stringify(layers[LAYERS.branches].filter)).toContain('"!=",["get","type"],"atm"')
    expect(JSON.stringify(layers[LAYERS.atms].filter)).toContain('"==",["get","type"],"atm"')
  })

  it('starts with nothing chosen', () => {
    const { layers } = setup()
    const none = selectedFilters('')

    expect(layers[LAYERS.selected].filter).toEqual(none.branch)
    expect(layers[LAYERS.selectedAtm].filter).toEqual(none.atm)
  })
})

describe('selectedFilters', () => {
  it('matches the chosen id in both layers', () => {
    const filters = selectedFilters('abc')

    expect(JSON.stringify(filters.branch)).toContain('["==",["get","id"],"abc"]')
    expect(JSON.stringify(filters.atm)).toContain('["==",["get","id"],"abc"]')
  })

  it('keeps the chosen branch out of the ATM layer and the chosen ATM out of the branch layer', () => {
    const filters = selectedFilters('abc')

    expect(JSON.stringify(filters.branch)).toContain('"!=",["get","type"],"atm"')
    expect(JSON.stringify(filters.atm)).toContain('"==",["get","type"],"atm"')
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

  it('reads the light blue used behind the chosen ATM, with a fallback', () => {
    expect(readMapColors().tint).toBe('#cfdefb')
  })

  it('uses the familiar blue for the location dot whatever the theme says', () => {
    expect(readMapColors().location).toBe('#1a73e8')
  })

  it('reads the theme variables when they are set', () => {
    document.documentElement.style.setProperty('--app-primary-deep', '#123456')

    expect(readMapColors().deep).toBe('#123456')
  })
})
