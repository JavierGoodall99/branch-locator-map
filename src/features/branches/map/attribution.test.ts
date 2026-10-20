import { waitFor } from '@testing-library/react'
import { collapseAttribution } from './attribution'

const SHOW = 'maplibregl-compact-show'

function mapWithCredit(classes: string) {
  const map = document.createElement('div')
  const credit = document.createElement('details')
  credit.className = `maplibregl-ctrl maplibregl-ctrl-attrib ${classes}`
  map.append(credit)
  return { map, credit }
}

describe('collapseAttribution', () => {
  it('closes a credit that is already open', () => {
    const { map, credit } = mapWithCredit(`maplibregl-compact ${SHOW}`)

    collapseAttribution(map)

    expect(credit).not.toHaveClass(SHOW)
    expect(credit).toHaveClass('maplibregl-compact')
  })

  it('closes the credit when MapLibre opens it a moment later, as the style fills it in', async () => {
    const { map, credit } = mapWithCredit('maplibregl-attrib-empty')
    collapseAttribution(map)

    credit.classList.remove('maplibregl-attrib-empty')
    credit.classList.add('maplibregl-compact', SHOW)

    await waitFor(() => expect(credit).not.toHaveClass(SHOW))
    expect(credit).toHaveClass('maplibregl-compact')
  })

  it('closes it only once, so the info button still opens it', async () => {
    const { map, credit } = mapWithCredit('maplibregl-attrib-empty')
    collapseAttribution(map)
    credit.classList.add('maplibregl-compact', SHOW)
    await waitFor(() => expect(credit).not.toHaveClass(SHOW))

    // The user presses the info button, which MapLibre answers by adding the class.
    credit.classList.add(SHOW)
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(credit).toHaveClass(SHOW)
  })

  it('stops watching when told to', async () => {
    const { map, credit } = mapWithCredit('maplibregl-attrib-empty')
    const stop = collapseAttribution(map)

    stop()
    credit.classList.add('maplibregl-compact', SHOW)
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(credit).toHaveClass(SHOW)
  })

  it('holds the credit at its closed size until it has been closed, then lets it size itself', async () => {
    const { map, credit } = mapWithCredit('maplibregl-attrib-empty')
    collapseAttribution(map)
    expect(credit).toHaveAttribute('data-settling')

    credit.classList.add('maplibregl-compact', SHOW)

    await waitFor(() => expect(credit).not.toHaveAttribute('data-settling'))
  })

  it('does not hold a credit that is already closed once it is told to stop', () => {
    const { map, credit } = mapWithCredit('maplibregl-attrib-empty')

    collapseAttribution(map)()

    expect(credit).not.toHaveAttribute('data-settling')
  })

  it('stops holding the credit if MapLibre never opens it', () => {
    vi.useFakeTimers()
    try {
      const { map, credit } = mapWithCredit('maplibregl-attrib-empty')
      collapseAttribution(map)

      vi.advanceTimersByTime(15_000)

      expect(credit).not.toHaveAttribute('data-settling')
    } finally {
      vi.useRealTimers()
    }
  })

  it('does nothing when the credit is not there', () => {
    expect(() => collapseAttribution(document.createElement('div'))()).not.toThrow()
  })
})
