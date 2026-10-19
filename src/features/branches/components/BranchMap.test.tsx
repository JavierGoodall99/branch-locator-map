import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  HOVER_SOURCE_ID,
  LAYERS,
  MAP_STYLE_URL,
  NEAREST_TO_SHOW,
  SELECTED_ZOOM,
  SOURCE_ID,
  USER_LAYERS,
  USER_SOURCE_ID,
} from '@/features/branches/map/config'
import { applyBasemapLook } from '@/features/branches/map/basemap'
import { selectedFilters } from '@/features/branches/map/layers'
import { addPinImages } from '@/features/branches/map/pins'
import { isWebGLAvailable } from '@/features/branches/map/webgl'
import type { Branch, Coordinates } from '@/features/branches/types'
import { BranchMap } from './BranchMap'

// jsdom has no WebGL, so MapLibre is replaced by a fake that records what the component asks of it.
const mocks = vi.hoisted(() => {
  type Handler = (event?: unknown) => void

  class FakeMap {
    options: Record<string, unknown>
    handlers = new Map<string, Handler[]>()
    sources: string[] = []
    layers: string[] = []
    canvas = { style: { cursor: '' } }
    touchZoomRotate = { disableRotation: vi.fn() }
    setData = vi.fn()
    userSetData = vi.fn()
    hoverSetData = vi.fn()
    getClusterExpansionZoom = vi.fn().mockResolvedValue(15)
    addControl = vi.fn()
    addSource = vi.fn((id: string) => void this.sources.push(id))
    addLayer = vi.fn((layer: { id: string }) => void this.layers.push(layer.id))
    getSource = vi.fn((id: string) => ({
      // The user's dot and the branches are separate sources, so tests can tell them apart.
      setData: id === 'user-location' ? this.userSetData : id === 'hovered' ? this.hoverSetData : this.setData,
      getClusterExpansionZoom: this.getClusterExpansionZoom,
    }))
    setFilter = vi.fn()
    fitBounds = vi.fn()
    easeTo = vi.fn()
    getZoom = vi.fn(() => 8)
    // A real element, as MapLibre gives, that is 800px high; jsdom does no layout, so nothing else has a size.
    getContainer = () => Object.defineProperty(document.createElement('div'), 'clientHeight', { value: 800 })
    getCanvas = () => this.canvas
    remove = vi.fn()

    constructor(options: Record<string, unknown>) {
      this.options = options
      mocks.maps.push(this)
    }

    on(type: string, layerOrHandler: string | Handler, handler?: Handler) {
      const key = typeof layerOrHandler === 'string' ? `${type}:${layerOrHandler}` : type
      const fn = typeof layerOrHandler === 'string' ? handler! : layerOrHandler
      this.handlers.set(key, [...(this.handlers.get(key) ?? []), fn])
    }

    emit(key: string, event?: unknown) {
      this.handlers.get(key)?.forEach((handler) => handler(event))
    }
  }

  const mocks = { maps: [] as FakeMap[], FakeMap, setWorkerUrl: vi.fn() }
  return mocks
})

vi.mock('maplibre-gl', () => ({
  Map: mocks.FakeMap,
  NavigationControl: class {},
  setWorkerUrl: mocks.setWorkerUrl,
}))
vi.mock('@/features/branches/map/webgl', () => ({ isWebGLAvailable: vi.fn(() => true) }))
// The base map's recolouring has its own tests, against the real layer list.
vi.mock('@/features/branches/map/basemap', () => ({ applyBasemapLook: vi.fn() }))
// Pins are drawn on a canvas, which jsdom cannot do; pins.ts has its own tests.
vi.mock('@/features/branches/map/pins', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/branches/map/pins')>()),
  addPinImages: vi.fn(),
}))

// setWorkerUrl runs once, when BranchMap is first imported, so record it before any test can reset mocks.
const workerUrlCalls = [...mocks.setWorkerUrl.mock.calls]

function branch(id: string, lat = -26.2, lng = 28.05, overrides: Partial<Branch> = {}): Branch {
  return {
    id,
    name: `Capitec ${id}`,
    type: 'branch',
    services: ['Branch'],
    address: '1 Test Street',
    province: 'Gauteng',
    postalCode: '2000',
    phone: null,
    location: { lat, lng },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
    ...overrides,
  }
}

const currentMap = () => mocks.maps.at(-1)!
const loadMap = () => act(() => currentMap().emit('load'))

function setup(
  branches: Branch[] = [branch('a'), branch('b', -33.9, 18.4)],
  selectedId: string | null = null,
  userLocation: Coordinates | null = null,
  hoveredId: string | null = null,
) {
  const onSelect = vi.fn()
  const view = render(
    <BranchMap
      branches={branches}
      selectedId={selectedId}
      hoveredId={hoveredId}
      userLocation={userLocation}
      onSelect={onSelect}
    />,
  )
  const update = (next: {
    branches?: Branch[]
    selectedId?: string | null
    hoveredId?: string | null
    userLocation?: Coordinates | null
  }) =>
    view.rerender(
      <BranchMap
        branches={next.branches ?? branches}
        hoveredId={'hoveredId' in next ? (next.hoveredId ?? null) : hoveredId}
        // `in`, not `??`: null is a real value here (nothing selected), not "unchanged".
        selectedId={'selectedId' in next ? (next.selectedId ?? null) : selectedId}
        userLocation={'userLocation' in next ? (next.userLocation ?? null) : userLocation}
        onSelect={onSelect}
      />,
    )
  return { onSelect, update, ...view }
}

describe('BranchMap', () => {
  beforeEach(() => {
    mocks.maps.length = 0
    vi.mocked(addPinImages).mockClear()
    vi.mocked(applyBasemapLook).mockClear()
    vi.mocked(isWebGLAvailable).mockReturnValue(true)
  })

  it('creates one map with the OpenFreeMap style and zoom buttons', () => {
    setup()

    expect(mocks.maps).toHaveLength(1)
    expect(currentMap().options.style).toBe(MAP_STYLE_URL)
    expect(MAP_STYLE_URL).toContain('tiles.openfreemap.org')
    expect(currentMap().addControl).toHaveBeenCalledTimes(1)
  })

  it('tells MapLibre where its worker is, since the bundler moves the library', () => {
    expect(workerUrlCalls).toHaveLength(1)
    expect(workerUrlCalls[0][0]).toContain('maplibre-gl-worker')
  })

  it('says it is loading until the map style has loaded', async () => {
    setup()
    expect(screen.getByRole('status')).toHaveTextContent('Loading map')

    await loadMap()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('adds the branch source and every pin layer once the style has loaded', async () => {
    setup()
    await loadMap()

    expect(currentMap().sources).toEqual([SOURCE_ID, HOVER_SOURCE_ID, USER_SOURCE_ID])
    expect(currentMap().layers).toEqual([...Object.values(LAYERS), ...Object.values(USER_LAYERS)])
  })

  it('recolours the base map before adding any of our own layers', async () => {
    setup()
    await loadMap()

    expect(applyBasemapLook).toHaveBeenCalledTimes(1)
    expect(applyBasemapLook).toHaveBeenCalledWith(currentMap())
    const recoloured = vi.mocked(applyBasemapLook).mock.invocationCallOrder[0]
    expect(recoloured).toBeLessThan(currentMap().addSource.mock.invocationCallOrder[0])
  })

  it('draws the pin images before the layers that use them', async () => {
    setup()
    await loadMap()

    expect(addPinImages).toHaveBeenCalledTimes(1)
    const pinsFirst = vi.mocked(addPinImages).mock.invocationCallOrder[0]
    const firstLayer = currentMap().addLayer.mock.invocationCallOrder[0]
    expect(pinsFirst).toBeLessThan(firstLayer)
  })

  it('sends the branches to the map and fits them in view', async () => {
    setup()
    await loadMap()

    expect(currentMap().setData).toHaveBeenCalledTimes(1)
    expect(currentMap().setData.mock.calls[0][0].features).toHaveLength(2)
    expect(currentMap().fitBounds).toHaveBeenCalledTimes(1)
    expect(currentMap().fitBounds.mock.calls[0][0]).toEqual([
      [18.4, -33.9],
      [28.05, -26.2],
    ])
  })

  it('does not move the map when the same branches arrive in a new array', async () => {
    const { update } = setup([branch('a'), branch('b')])
    await loadMap()

    update({ branches: [branch('a'), branch('b')] })

    expect(currentMap().setData).toHaveBeenCalledTimes(1)
    expect(currentMap().fitBounds).toHaveBeenCalledTimes(1)
  })

  it('updates and refits when the set of branches changes', async () => {
    const { update } = setup([branch('a'), branch('b')])
    await loadMap()

    update({ branches: [branch('a')] })

    expect(currentMap().setData).toHaveBeenCalledTimes(2)
    expect(currentMap().fitBounds).toHaveBeenCalledTimes(2)
  })

  it('clears the pins without moving the map when nothing matches', async () => {
    const { update } = setup([branch('a')])
    await loadMap()

    update({ branches: [] })

    expect(currentMap().setData).toHaveBeenLastCalledWith({ type: 'FeatureCollection', features: [] })
    expect(currentMap().fitBounds).toHaveBeenCalledTimes(1)
  })

  it.each([LAYERS.branches, LAYERS.atms])('selects the branch whose pin on the %s layer is clicked', async (layer) => {
    const { onSelect } = setup()
    await loadMap()

    act(() => currentMap().emit(`click:${layer}`, { features: [{ properties: { id: 'b' } }] }))

    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('ignores a click that carries no branch id', async () => {
    const { onSelect } = setup()
    await loadMap()

    act(() => currentMap().emit(`click:${LAYERS.branches}`, { features: [] }))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('zooms into a cluster when it is clicked', async () => {
    setup()
    await loadMap()

    await act(async () => {
      currentMap().emit(`click:${LAYERS.clusters}`, {
        features: [{ geometry: { type: 'Point', coordinates: [28, -26] }, properties: { cluster_id: 7 } }],
      })
    })

    expect(currentMap().getClusterExpansionZoom).toHaveBeenCalledWith(7)
    expect(currentMap().easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [28, -26], zoom: 15 }))
  })

  it('shows a pointer cursor over pins and clears it when the mouse leaves', async () => {
    setup()
    await loadMap()

    act(() => currentMap().emit(`mouseenter:${LAYERS.branches}`))
    expect(currentMap().canvas.style.cursor).toBe('pointer')

    act(() => currentMap().emit(`mouseleave:${LAYERS.branches}`))
    expect(currentMap().canvas.style.cursor).toBe('')
  })

  it('highlights the selected branch and moves it into view', async () => {
    const { update } = setup([branch('a', -26.2, 28.05)])
    await loadMap()

    update({ selectedId: 'a' })

    expect(currentMap().setFilter).toHaveBeenCalledWith(LAYERS.selected, selectedFilters('a').branch)
    expect(currentMap().setFilter).toHaveBeenCalledWith(LAYERS.selectedAtm, selectedFilters('a').atm)
    expect(currentMap().easeTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [28.05, -26.2], zoom: SELECTED_ZOOM }),
    )
  })

  it('keeps the details sheet clear when it moves to the selected branch, on a phone', async () => {
    const { update } = setup([branch('a', -26.2, 28.05)])
    await loadMap()

    update({ selectedId: 'a' })

    // The container is 800px high in the fake, and the details sheet covers 42% of it.
    expect(currentMap().easeTo).toHaveBeenCalledWith(
      expect.objectContaining({ padding: expect.objectContaining({ bottom: 336 }) }),
    )
  })

  describe('the credit', () => {
    const addCredit = () => {
      const container = currentMap().options.container as HTMLElement
      const credit = document.createElement('details')
      credit.className = 'maplibregl-ctrl-attrib maplibregl-compact maplibregl-compact-show'
      container.append(credit)
      return credit
    }

    afterEach(() => vi.unstubAllGlobals())

    it('starts closed on a phone, behind its info button', async () => {
      setup()
      const credit = addCredit()

      await loadMap()

      expect(credit).not.toHaveClass('maplibregl-compact-show')
    })

    it('is left as MapLibre opens it on a wide screen, where there is room', async () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({ matches: query === '(min-width: 768px)', media: query })),
      )
      setup()
      const credit = addCredit()

      await loadMap()

      expect(credit).toHaveClass('maplibregl-compact-show')
    })
  })

  it('removes the highlight when nothing is selected any more', async () => {
    const { update } = setup([branch('a')], 'a')
    await loadMap()

    update({ selectedId: null })

    expect(currentMap().setFilter).toHaveBeenCalledWith(LAYERS.selected, selectedFilters('').branch)
    expect(currentMap().setFilter).toHaveBeenLastCalledWith(LAYERS.selectedAtm, selectedFilters('').atm)
  })

  describe('the place under the pointer in the list', () => {
    const drawn = () =>
      currentMap().hoverSetData.mock.lastCall![0].features.map(
        (feature: { properties: { id: string } }) => feature.properties.id,
      )

    it('is drawn on the map, without moving it', async () => {
      const { update } = setup([branch('a'), branch('b', -33.9, 18.4)])
      await loadMap()
      currentMap().easeTo.mockClear()
      currentMap().fitBounds.mockClear()

      update({ hoveredId: 'b' })

      expect(drawn()).toEqual(['b'])
      expect(currentMap().easeTo).not.toHaveBeenCalled()
      expect(currentMap().fitBounds).not.toHaveBeenCalled()
    })

    it('is taken off again when the pointer leaves', async () => {
      const { update } = setup([branch('a')], null, null, 'a')
      await loadMap()
      expect(drawn()).toEqual(['a'])

      update({ hoveredId: null })

      expect(drawn()).toEqual([])
    })

    it('follows the pointer from one card to the next', async () => {
      const { update } = setup([branch('a'), branch('b', -33.9, 18.4)])
      await loadMap()

      update({ hoveredId: 'a' })
      expect(drawn()).toEqual(['a'])
      update({ hoveredId: 'b' })
      expect(drawn()).toEqual(['b'])
    })

    it('is not drawn a second time for the chosen place, which has its own pin', async () => {
      const { update } = setup([branch('a'), branch('b', -33.9, 18.4)], 'a')
      await loadMap()

      update({ hoveredId: 'a' })

      expect(drawn()).toEqual([])
    })

    it('draws nothing for a place that is not on the map any more', async () => {
      const { update } = setup([branch('a')])
      await loadMap()

      update({ hoveredId: 'gone' })

      expect(drawn()).toEqual([])
    })

    it('does not touch the branch source, so the clusters are not rebuilt on every hover', async () => {
      const { update } = setup()
      await loadMap()
      currentMap().setData.mockClear()

      update({ hoveredId: 'a' })

      expect(currentMap().setData).not.toHaveBeenCalled()
    })
  })

  it('tells the user when the map cannot load, and builds a new map on retry', async () => {
    setup()
    act(() => currentMap().emit('error'))

    expect(screen.getByRole('alert')).toHaveTextContent('The map couldn’t load')
    const failed = currentMap()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(failed.remove).toHaveBeenCalled()
    expect(mocks.maps).toHaveLength(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading map')
  })

  it('ignores errors after the map has loaded, such as one missing tile', async () => {
    setup()
    await loadMap()

    act(() => currentMap().emit('error'))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('explains when the browser has no WebGL, without creating a map', () => {
    vi.mocked(isWebGLAvailable).mockReturnValue(false)

    setup()

    expect(screen.getByRole('status')).toHaveTextContent('can’t show the map')
    expect(mocks.maps).toHaveLength(0)
  })

  describe('the user’s location', () => {
    const user = { lat: -26.2, lng: 28.05 }

    it('starts with no dot', async () => {
      setup()
      await loadMap()

      expect(currentMap().userSetData).toHaveBeenLastCalledWith({ type: 'FeatureCollection', features: [] })
    })

    it('draws a dot where the user is, longitude first', async () => {
      const { update } = setup()
      await loadMap()

      update({ userLocation: user })

      const data = currentMap().userSetData.mock.lastCall![0]
      expect(data.features).toHaveLength(1)
      expect(data.features[0].geometry.coordinates).toEqual([28.05, -26.2])
    })

    it('frames the user together with the nearest few branches', async () => {
      const nearestFirst = [
        branch('1', -26.21, 28.06),
        branch('2', -26.3, 28.1),
        branch('3', -26.25, 28.0),
        branch('4', -33.9, 18.4),
      ]
      const { update } = setup(nearestFirst)
      await loadMap()
      currentMap().fitBounds.mockClear()

      update({ userLocation: user })

      expect(NEAREST_TO_SHOW).toBe(3)
      expect(currentMap().fitBounds).toHaveBeenCalledTimes(1)
      const [[west, south], [east, north]] = currentMap().fitBounds.mock.calls[0][0]
      // The far branch (Cape Town) is not nearest, so it must not widen the view.
      expect(west).toBeGreaterThan(27)
      expect(south).toBeGreaterThan(-27)
      expect(east).toBeLessThan(29)
      expect(north).toBeLessThan(-26)
    })

    it('does not move the map when there is no location', async () => {
      const { update } = setup([branch('a')], null, user)
      await loadMap()
      currentMap().fitBounds.mockClear()

      update({ userLocation: null })

      expect(currentMap().fitBounds).not.toHaveBeenCalled()
      expect(currentMap().userSetData).toHaveBeenLastCalledWith({ type: 'FeatureCollection', features: [] })
    })
  })

  it('removes the map when it unmounts', () => {
    const { unmount } = setup()
    const map = currentMap()

    unmount()

    expect(map.remove).toHaveBeenCalledTimes(1)
  })
})
