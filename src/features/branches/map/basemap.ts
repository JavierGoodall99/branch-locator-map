import type { Map as MapLibreMap } from 'maplibre-gl'

/**
 * Tunes OpenFreeMap's "liberty" style toward the look of Google Maps: pale land, light blue water,
 * green parks, yellow motorways and white streets with grey outlines, dark grey labels, and far
 * less clutter. Google's own tiles are proprietary, so this recolours a free style by layer name.
 */

export interface LayerInfo {
  id: string
  type: string
}

export interface BasemapChange {
  id: string
  kind: 'paint' | 'layout'
  property: string
  value: string
}

interface PaintRule {
  match: RegExp
  property: string
  value: string
}

const ROAD = '(road|bridge|tunnel)'
const MAJOR = '(motorway|trunk_primary|motorway_link)'
const MEDIUM = '(secondary_tertiary|link)'
const MINOR = '(minor|street|service_track)'

export const BASEMAP_PAINT_RULES: PaintRule[] = [
  // Land and water
  { match: /^background$/, property: 'background-color', value: '#f3f3f0' },
  { match: /^water$/, property: 'fill-color', value: '#aadaff' },
  { match: /^waterway_/, property: 'line-color', value: '#aadaff' },
  { match: /^park$/, property: 'fill-color', value: '#c8e8b8' },
  { match: /^park$/, property: 'fill-outline-color', value: '#c8e8b8' },
  { match: /^landcover_wood$/, property: 'fill-color', value: '#cfe8bd' },
  { match: /^landcover_grass$/, property: 'fill-color', value: '#d6ecc6' },
  { match: /^building$/, property: 'fill-color', value: '#e8e9ed' },
  { match: /^building-3d$/, property: 'fill-extrusion-color', value: '#e8e9ed' },

  // Roads: yellow motorways, white everything else, with light grey outlines
  { match: new RegExp(`^${ROAD}_${MAJOR}$`), property: 'line-color', value: '#fde293' },
  { match: new RegExp(`^${ROAD}_${MAJOR}_casing$`), property: 'line-color', value: '#f1c35b' },
  { match: new RegExp(`^${ROAD}_${MEDIUM}$`), property: 'line-color', value: '#ffffff' },
  { match: new RegExp(`^${ROAD}_${MEDIUM}_casing$`), property: 'line-color', value: '#dadce0' },
  { match: new RegExp(`^${ROAD}_${MINOR}_casing$`), property: 'line-color', value: '#dadce0' },

  // Labels: dark grey, not black
  { match: /^label_(city|city_capital|town|country_[123])$/, property: 'text-color', value: '#202124' },
  { match: /^label_(village|other|state)$/, property: 'text-color', value: '#3c4043' },
  { match: /^highway-name-(minor|major)$/, property: 'text-color', value: '#5f6368' },
  { match: /^water_name_(point|line)_label$/, property: 'text-color', value: '#4a7fb0' },
]

/** Points of interest and residential shading compete with our pins, so they are hidden. */
export const BASEMAP_HIDDEN: RegExp[] = [/^poi_/, /^landuse_residential$/]

/** MapLibre rejects a paint property that does not belong to the layer's type, so check first. */
function propertyFits(layerType: string, property: string): boolean {
  switch (layerType) {
    case 'background':
      return property.startsWith('background-')
    case 'fill':
      return property.startsWith('fill-') && !property.startsWith('fill-extrusion-')
    case 'fill-extrusion':
      return property.startsWith('fill-extrusion-')
    case 'line':
      return property.startsWith('line-')
    case 'symbol':
      return property.startsWith('text-') || property.startsWith('icon-')
    default:
      return false
  }
}

/** Works out what to change for a style's layers. Pure, so it can be tested without a map. */
export function planBasemapChanges(layers: LayerInfo[]): BasemapChange[] {
  const changes: BasemapChange[] = []

  for (const layer of layers) {
    if (BASEMAP_HIDDEN.some((pattern) => pattern.test(layer.id))) {
      changes.push({ id: layer.id, kind: 'layout', property: 'visibility', value: 'none' })
      continue
    }

    for (const rule of BASEMAP_PAINT_RULES) {
      if (rule.match.test(layer.id) && propertyFits(layer.type, rule.property)) {
        changes.push({ id: layer.id, kind: 'paint', property: rule.property, value: rule.value })
      }
    }
  }

  return changes
}

// The properties come from our rules, which are checked against the real style by tests, so they
// are cast to MapLibre's narrow property-name types here.
type LayoutProperty = Parameters<MapLibreMap['setLayoutProperty']>[1]
type PaintProperty = Parameters<MapLibreMap['setPaintProperty']>[1]

/** Applies the Google-like look to a loaded map. Call it before adding our own layers. */
export function applyBasemapLook(map: Pick<MapLibreMap, 'getStyle' | 'setPaintProperty' | 'setLayoutProperty'>): void {
  for (const change of planBasemapChanges(map.getStyle().layers ?? [])) {
    if (change.kind === 'layout') map.setLayoutProperty(change.id, change.property as LayoutProperty, change.value)
    else map.setPaintProperty(change.id, change.property as PaintProperty, change.value)
  }
}
