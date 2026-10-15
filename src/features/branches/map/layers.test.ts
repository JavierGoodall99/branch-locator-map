import { LAYERS, SOURCE_ID } from './config'
import { addBranchLayers, readMapColors, type MapColors } from './layers'

const colors: MapColors = { primary: '#111111', strong: '#222222', deep: '#333333', ink: '#000000', white: '#ffffff' }
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

  it('colours pins from the colours it is given', () => {
    const { layers } = setup()

    expect(layers[LAYERS.branches].paint).toMatchObject({ 'circle-color': colors.primary })
    expect(layers[LAYERS.atms].paint).toMatchObject({ 'circle-stroke-color': colors.deep })
    expect(layers[LAYERS.clusters].paint).toMatchObject({ 'circle-color': colors.deep })
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

describe('readMapColors', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--app-primary-deep')
  })

  it('falls back to the brand colours when the theme variables are missing', () => {
    expect(readMapColors().deep).toBe('#0033a0')
  })

  it('reads the theme variables when they are set', () => {
    document.documentElement.style.setProperty('--app-primary-deep', '#123456')

    expect(readMapColors().deep).toBe('#123456')
  })
})
