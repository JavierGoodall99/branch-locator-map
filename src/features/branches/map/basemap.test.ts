import libertyLayers from '@/features/branches/map/fixtures/liberty-layers.json'
import { BASEMAP_HIDDEN, BASEMAP_PAINT_RULES, applyBasemapLook, planBasemapChanges } from './basemap'

const layers = libertyLayers as { id: string; type: string }[]

describe('planBasemapChanges', () => {
  const changes = planBasemapChanges(layers)
  const paint = (id: string, property: string) =>
    changes.find((change) => change.id === id && change.kind === 'paint' && change.property === property)

  it('recolours the land, water and parks', () => {
    expect(paint('background', 'background-color')).toBeDefined()
    expect(paint('water', 'fill-color')?.value).toBe('#aadaff')
    expect(paint('park', 'fill-color')).toBeDefined()
  })

  it('makes motorways yellow and ordinary roads white, with a light grey outline', () => {
    expect(paint('road_motorway', 'line-color')?.value).toBe('#fde293')
    expect(paint('road_secondary_tertiary', 'line-color')?.value).toBe('#ffffff')
    expect(paint('road_minor_casing', 'line-color')?.value).toBe('#dadce0')
  })

  it('applies the same colours to bridges and tunnels as to roads', () => {
    expect(paint('bridge_motorway', 'line-color')?.value).toBe('#fde293')
    expect(paint('tunnel_motorway', 'line-color')?.value).toBe('#fde293')
  })

  it('uses dark grey for place names instead of black', () => {
    expect(paint('label_city', 'text-color')?.value).toBe('#202124')
    expect(paint('label_village', 'text-color')?.value).toBe('#3c4043')
  })

  it('hides points of interest and residential shading so our pins carry the focus', () => {
    const hidden = changes.filter((change) => change.kind === 'layout' && change.property === 'visibility')

    expect(hidden.map((change) => change.id)).toEqual(
      expect.arrayContaining(['poi_r20', 'poi_r7', 'poi_r1', 'poi_transit', 'landuse_residential']),
    )
    expect(hidden.every((change) => change.value === 'none')).toBe(true)
  })

  it('leaves layers it has no opinion about alone', () => {
    const touched = new Set(changes.map((change) => change.id))

    expect(touched.has('boundary_2')).toBe(false)
    expect(touched.has('natural_earth')).toBe(false)
  })

  it('does not paint a hidden layer', () => {
    const hiddenIds = new Set(changes.filter((change) => change.kind === 'layout').map((change) => change.id))

    expect(changes.filter((change) => change.kind === 'paint' && hiddenIds.has(change.id))).toEqual([])
  })

  it('only sets properties that belong to the layer type, which MapLibre would reject otherwise', () => {
    const byId = new Map(layers.map((layer) => [layer.id, layer.type]))
    const prefixes: Record<string, string[]> = {
      background: ['background-'],
      fill: ['fill-'],
      'fill-extrusion': ['fill-extrusion-'],
      line: ['line-'],
      symbol: ['text-', 'icon-'],
    }

    for (const change of changes.filter((item) => item.kind === 'paint')) {
      const type = byId.get(change.id)!
      expect(prefixes[type].some((prefix) => change.property.startsWith(prefix))).toBe(true)
      if (type === 'fill') expect(change.property.startsWith('fill-extrusion-')).toBe(false)
    }
  })

  it('does nothing for an empty style', () => {
    expect(planBasemapChanges([])).toEqual([])
  })
})

describe('the rules match the real Liberty style', () => {
  // If OpenFreeMap renames its layers, a rule would silently stop doing anything. This catches it.
  it.each(BASEMAP_PAINT_RULES.map((rule) => [String(rule.match), rule] as const))(
    'rule %s matches a layer that exists',
    (_label, rule) => {
      const matched = planBasemapChanges(layers.filter((layer) => rule.match.test(layer.id)))

      expect(matched.some((change) => change.property === rule.property)).toBe(true)
    },
  )

  it.each(BASEMAP_HIDDEN.map((pattern) => [String(pattern), pattern] as const))(
    'the hide rule %s matches a layer that exists',
    (_label, pattern) => {
      expect(layers.some((layer) => pattern.test(layer.id))).toBe(true)
    },
  )
})

describe('applyBasemapLook', () => {
  it('reads the style, then paints and hides what the plan says', () => {
    const map = {
      getStyle: vi.fn(() => ({
        layers: [
          { id: 'water', type: 'fill' },
          { id: 'poi_r20', type: 'symbol' },
        ],
      })),
      setPaintProperty: vi.fn(),
      setLayoutProperty: vi.fn(),
    }

    applyBasemapLook(map as never)

    expect(map.setPaintProperty).toHaveBeenCalledWith('water', 'fill-color', '#aadaff')
    expect(map.setLayoutProperty).toHaveBeenCalledWith('poi_r20', 'visibility', 'none')
  })

  it('copes with a style that has no layers', () => {
    const map = { getStyle: () => ({}), setPaintProperty: vi.fn(), setLayoutProperty: vi.fn() }

    expect(() => applyBasemapLook(map as never)).not.toThrow()
    expect(map.setPaintProperty).not.toHaveBeenCalled()
  })
})
