import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_FILTERS, type LocatorFilters } from '../model/filters'
import type { UseLocationResult } from '../model/useLocation'
import type { Branch } from '../types'
import { LocatorControls } from './LocatorControls'

const idleLocation: UseLocationResult = { status: 'idle', request: vi.fn(), clear: vi.fn() }

const located: UseLocationResult = {
  status: 'located',
  position: { lat: -26.2, lng: 28.05 },
  request: vi.fn(),
  clear: vi.fn(),
}

const branches: Branch[] = [
  {
    id: 'sandton',
    name: 'Capitec Bank Sandton City',
    type: 'branch',
    services: ['Branch', 'SmartID Services'],
    address: 'Sandton City, Rivonia Road, Sandton, Gauteng, 2196',
    province: 'Gauteng',
    postalCode: '2196',
    phone: null,
    location: { lat: -26.1, lng: 28.05 },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
  },
]

function setup(filters: LocatorFilters = DEFAULT_FILTERS, location: UseLocationResult = idleLocation) {
  const onChange = vi.fn()
  const onPickBranch = vi.fn()
  const countResults = vi.fn<(filters: LocatorFilters) => number>().mockReturnValue(1)
  render(
    <LocatorControls
      filters={filters}
      onChange={onChange}
      location={location}
      branches={branches}
      onPickBranch={onPickBranch}
      countResults={countResults}
    />,
  )
  return { onChange, onPickBranch, countResults }
}

const search = () => screen.getByRole('combobox', { name: 'Search by name, suburb, town or postcode' })

describe('LocatorControls', () => {
  it('has a labelled search field inside a search landmark', () => {
    setup()

    expect(screen.getByRole('search')).toContainElement(search())
  })

  it('does not change the search while the user types', async () => {
    const { onChange } = setup()

    await userEvent.type(search(), 'paarl')

    expect(search()).toHaveValue('paarl')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('searches when the user presses Enter', async () => {
    const { onChange } = setup()

    await userEvent.type(search(), 'paarl{Enter}')

    expect(onChange).toHaveBeenCalledTimes(1)
    // A search sets the distance aside, so a place anywhere in the country is found.
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, query: 'paarl', radiusKm: null })
  })

  it('does not submit the form on Enter', async () => {
    setup()

    await userEvent.type(search(), 'paarl{Enter}')

    expect(window.location.search).toBe('')
  })

  it('puts Near me inside the search bar', () => {
    setup()

    expect(within(screen.getByRole('search')).getByRole('button', { name: 'Near me' })).toBeInTheDocument()
  })

  it('asks for the location only when Near me is pressed', async () => {
    const request = vi.fn()
    setup(DEFAULT_FILTERS, { status: 'idle', request, clear: vi.fn() })
    expect(request).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Near me' }))

    expect(request).toHaveBeenCalledTimes(1)
  })

  it('explains Near me in its tooltip, not as text on the page', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Near me' })).toHaveAttribute(
      'title',
      expect.stringContaining('stays on your device'),
    )
    expect(screen.queryByText(/sorts by distance/)).not.toBeInTheDocument()
  })

  describe('the show switch and the distances', () => {
    it('puts Both first, and chooses it by default', () => {
      setup()

      const show = within(screen.getByRole('group', { name: 'Show' })).getAllByRole('button')
      expect(show.map((button) => button.textContent)).toEqual(['Both', 'Branches', 'ATMs'])
      expect(screen.getByRole('button', { name: 'Both' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('shows the switch and the distances without opening anything', () => {
      setup()

      expect(screen.getByRole('group', { name: 'Show' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Distance from you' })).toBeInTheDocument()
    })

    it('marks the current show option as pressed', () => {
      setup({ ...DEFAULT_FILTERS, show: 'atms' })

      expect(screen.getByRole('button', { name: 'ATMs' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: 'Branches' })).toHaveAttribute('aria-pressed', 'false')
    })

    it('switches what is shown', async () => {
      const { onChange } = setup()

      await userEvent.click(screen.getByRole('button', { name: 'ATMs' }))

      expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, show: 'atms' })
    })

    it('offers 5, 10, 25, 50 and 100 km once the location is known', () => {
      setup(DEFAULT_FILTERS, located)

      const chips = within(screen.getByRole('group', { name: 'Distance from you' })).getAllByRole('button')
      expect(chips.map((chip) => chip.textContent)).toEqual(['5 km', '10 km', '25 km', '50 km', '100 km'])
      expect(chips.every((chip) => chip.hasAttribute('disabled'))).toBe(false)
    })

    it('has no "Within" label and no visible hint', () => {
      setup()

      expect(screen.queryByText('Within')).not.toBeInTheDocument()
      expect(screen.getByText(/Choosing a distance asks for your location/)).toHaveClass('visually-hidden')
    })

    it('chooses a distance, and marks the chosen one', async () => {
      const { onChange } = setup({ ...DEFAULT_FILTERS, radiusKm: 25 }, located)

      expect(screen.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: '10 km' })).toHaveAttribute('aria-pressed', 'false')

      await userEvent.click(screen.getByRole('button', { name: '10 km' }))
      expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, radiusKm: 10 })
    })

    it('goes back to any distance when the chosen one is pressed again', async () => {
      const { onChange } = setup({ ...DEFAULT_FILTERS, radiusKm: 25 }, located)

      await userEvent.click(screen.getByRole('button', { name: '25 km' }))

      expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, radiusKm: null })
    })

    it('keeps the distances on before the location is known, with none of them chosen', () => {
      setup()

      const group = screen.getByRole('group', { name: 'Distance from you' })
      for (const chip of within(group).getAllByRole('button')) {
        expect(chip).toBeEnabled()
        expect(chip).toHaveAttribute('aria-pressed', 'false')
      }
      expect(group).toHaveAccessibleDescription(/asks for your location/)
    })

    it('asks for the location when a distance is chosen before it is known, and keeps the distance', async () => {
      const request = vi.fn()
      const { onChange } = setup(DEFAULT_FILTERS, { status: 'idle', request, clear: vi.fn() })

      await userEvent.click(screen.getByRole('button', { name: '10 km' }))

      expect(request).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, radiusKm: 10 })
    })

    it('asks again after a refusal, from the distance pills too', async () => {
      const request = vi.fn()
      setup(DEFAULT_FILTERS, { status: 'denied', request, clear: vi.fn() })

      await userEvent.click(screen.getByRole('button', { name: '50 km' }))

      expect(request).toHaveBeenCalledTimes(1)
    })

    it('shows the chosen distance as pressed while the location is on its way, and does not ask twice', async () => {
      const request = vi.fn()
      const { onChange } = setup({ ...DEFAULT_FILTERS, radiusKm: 25 }, { status: 'locating', request, clear: vi.fn() })

      expect(screen.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'true')
      await userEvent.click(screen.getByRole('button', { name: '5 km' }))

      expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, radiusKm: 5 })
      expect(request).not.toHaveBeenCalled()
    })

    it('does not ask for the location when the location is already known', async () => {
      const request = vi.fn()
      setup(DEFAULT_FILTERS, { ...located, request })

      await userEvent.click(screen.getByRole('button', { name: '10 km' }))

      expect(request).not.toHaveBeenCalled()
    })
  })

  describe('the Filters window', () => {
    const filtersButton = () => screen.getByRole('button', { name: /^Filters/ })
    const dialog = () => screen.getByRole('dialog', { name: 'Filters' })

    it('has a Filters button beside the search that opens a window, and leaves the switch alone', async () => {
      setup()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      await userEvent.click(filtersButton())

      expect(dialog()).toBeInTheDocument()
      expect(filtersButton()).toHaveAttribute('aria-haspopup', 'dialog')
      expect(within(dialog()).queryByRole('group', { name: 'Show' })).not.toBeInTheDocument()
      expect(within(dialog()).queryByText(/km/)).not.toBeInTheDocument()
    })

    it('groups pills under When, Services, Province and Sort by, from our own data', async () => {
      setup(DEFAULT_FILTERS, located)
      await userEvent.click(filtersButton())

      const window = within(dialog())
      const when = within(window.getByRole('group', { name: 'When' }))
      expect(when.getAllByRole('button').map((chip) => chip.textContent)).toEqual(['Open now', 'Open 24 hours'])
      expect(
        within(window.getByRole('group', { name: 'Services' })).getByRole('button', { name: 'SmartID Services' }),
      ).toBeInTheDocument()
      expect(within(window.getByRole('group', { name: 'Province' })).getAllByRole('button')).toHaveLength(9)
      expect(
        within(window.getByRole('radiogroup', { name: 'Sort by' }))
          .getAllByRole('radio')
          .map((chip) => chip.textContent),
      ).toEqual(['Distance', 'Name'])
    })

    it('offers no days of the week, because the data has one set of hours for every day', async () => {
      setup()
      await userEvent.click(filtersButton())

      expect(within(dialog()).queryByText(/Saturday|Sunday/)).not.toBeInTheDocument()
    })

    it('marks Distance as the chosen sort when the location is known', async () => {
      setup(DEFAULT_FILTERS, located)
      await userEvent.click(filtersButton())

      expect(within(dialog()).getByRole('radio', { name: 'Distance' })).toBeChecked()
      expect(within(dialog()).getByRole('radio', { name: 'Name' })).not.toBeChecked()
    })

    it('says how many filters are in use on the button', () => {
      setup({ ...DEFAULT_FILTERS, openNow: true, province: 'Gauteng' })

      expect(filtersButton()).toHaveAccessibleName('Filters, 2 in use')
    })

    it('shows no count for the switch, the distance or the sort, which are not filters in the window', () => {
      setup({ ...DEFAULT_FILTERS, show: 'atms', radiusKm: 10, sort: 'name' })

      expect(filtersButton()).toHaveAccessibleName('Filters')
      expect(document.querySelector('.filter-button__count')).toBeNull()
    })

    it('applies the choices together when the button is pressed, and says how many places they leave', async () => {
      const { onChange, countResults } = setup()
      countResults.mockReturnValue(12)
      await userEvent.click(filtersButton())

      await userEvent.click(within(dialog()).getByRole('button', { name: 'Open now' }))
      await userEvent.click(within(dialog()).getByRole('button', { name: 'Gauteng' }))
      expect(onChange).not.toHaveBeenCalled()
      await userEvent.click(within(dialog()).getByRole('button', { name: 'Show 12 results' }))

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, openNow: true, province: 'Gauteng' })
      expect(countResults).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, openNow: true, province: 'Gauteng' })
    })

    it('applies open 24 hours, chosen services and a sort by name', async () => {
      const { onChange } = setup(DEFAULT_FILTERS, located)
      await userEvent.click(filtersButton())

      await userEvent.click(within(dialog()).getByRole('button', { name: 'Open 24 hours' }))
      await userEvent.click(within(dialog()).getByRole('button', { name: 'SmartID Services' }))
      await userEvent.click(within(dialog()).getByRole('radio', { name: 'Name' }))
      await userEvent.click(within(dialog()).getByRole('button', { name: 'Show 1 result' }))

      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_FILTERS,
        open24Hours: true,
        services: ['SmartID Services'],
        sort: 'name',
      })
    })

    it('chooses one province at a time, and goes back to all when it is pressed again', async () => {
      const { onChange } = setup()
      await userEvent.click(filtersButton())
      const province = (name: string) => within(dialog()).getByRole('button', { name })

      await userEvent.click(province('Gauteng'))
      await userEvent.click(province('Limpopo'))
      expect(province('Gauteng')).toHaveAttribute('aria-pressed', 'false')
      expect(province('Limpopo')).toHaveAttribute('aria-pressed', 'true')

      await userEvent.click(province('Limpopo'))
      await userEvent.click(within(dialog()).getByRole('button', { name: /^Show/ }))

      expect(onChange).toHaveBeenCalledWith(DEFAULT_FILTERS)
    })

    it('cannot sort by distance without the location', async () => {
      setup()
      await userEvent.click(filtersButton())

      expect(within(dialog()).getByRole('radio', { name: 'Distance' })).toBeDisabled()
      expect(within(dialog()).getByRole('radio', { name: 'Name' })).toBeChecked()
    })

    it('cannot apply choices that leave nothing', async () => {
      const { countResults } = setup()
      countResults.mockReturnValue(0)
      await userEvent.click(filtersButton())

      expect(within(dialog()).getByRole('button', { name: 'No results' })).toBeDisabled()
    })

    it('changes nothing when the window is closed without applying', async () => {
      const { onChange } = setup()
      await userEvent.click(filtersButton())
      await userEvent.click(within(dialog()).getByRole('button', { name: 'Open now' }))

      await userEvent.click(within(dialog()).getByRole('button', { name: 'Close' }))

      expect(onChange).not.toHaveBeenCalled()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('starts from what is applied, and clears all of it', async () => {
      const { onChange } = setup({ ...DEFAULT_FILTERS, openNow: true, province: 'Gauteng' })
      await userEvent.click(filtersButton())
      expect(within(dialog()).getByRole('button', { name: 'Open now' })).toHaveAttribute('aria-pressed', 'true')
      expect(within(dialog()).getByRole('button', { name: 'Gauteng' })).toHaveAttribute('aria-pressed', 'true')

      await userEvent.click(within(dialog()).getByRole('button', { name: 'Clear all' }))
      expect(within(dialog()).getByRole('button', { name: 'Open now' })).toHaveAttribute('aria-pressed', 'false')
      expect(within(dialog()).getByRole('button', { name: 'Clear all' })).toBeDisabled()
      await userEvent.click(within(dialog()).getByRole('button', { name: /^Show/ }))

      expect(onChange).toHaveBeenCalledWith(DEFAULT_FILTERS)
    })
  })

  it('only offers to clear the search when there is one', () => {
    setup()

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('clears the search but keeps the show switch', async () => {
    const { onChange } = setup({ ...DEFAULT_FILTERS, query: 'paarl', show: 'atms' })

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, query: '', show: 'atms' })
  })

  it('searches for a place when a place suggestion is chosen', async () => {
    const { onChange } = setup({ ...DEFAULT_FILTERS, query: 'sand' })

    await userEvent.click(search())
    await userEvent.click(screen.getByRole('option', { name: /^Sandton/ }))

    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, query: 'Sandton', radiusKm: null })
  })

  it('reports a chosen branch suggestion, so the page can open it', async () => {
    const { onPickBranch } = setup({ ...DEFAULT_FILTERS, query: 'sandton city' })

    await userEvent.click(search())
    await userEvent.click(screen.getByRole('option', { name: /Capitec Bank Sandton City/ }))

    expect(onPickBranch).toHaveBeenCalledWith('sandton')
  })
})
