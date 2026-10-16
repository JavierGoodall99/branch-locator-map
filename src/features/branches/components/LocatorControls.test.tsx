import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_FILTERS, type LocatorFilters } from '../model/filters'
import type { UseLocationResult } from '../model/useLocation'
import type { Branch } from '../types'
import { LocatorControls } from './LocatorControls'

const idleLocation: UseLocationResult = { status: 'idle', request: vi.fn(), clear: vi.fn() }

const branches: Branch[] = [
  {
    id: 'sandton',
    name: 'Capitec Bank Sandton City',
    type: 'branch',
    services: ['Branch'],
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
  render(
    <LocatorControls
      filters={filters}
      onChange={onChange}
      location={location}
      branches={branches}
      onPickBranch={onPickBranch}
    />,
  )
  return { onChange, onPickBranch }
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
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, query: 'paarl' })
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

    expect(screen.getByRole('button', { name: 'Near me' })).toHaveAttribute('title', expect.stringContaining('stays on your device'))
    expect(screen.queryByText(/sorts by distance/)).not.toBeInTheDocument()
  })

  describe('the filters', () => {
    const located: UseLocationResult = {
      status: 'located',
      position: { lat: -26.2, lng: 28.05 },
      request: vi.fn(),
      clear: vi.fn(),
    }
    const filtersButton = () => screen.getByRole('button', { name: /^Filters/ })
    const openFilters = () => userEvent.click(filtersButton())

    it('has a Filters button beside the search, with the panel closed to begin with', () => {
      setup()

      expect(filtersButton()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('group', { name: 'Show' })).not.toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Within' })).not.toBeInTheDocument()
    })

    it('opens and closes the panel, and says which panel the button controls', async () => {
      setup()

      await openFilters()
      expect(filtersButton()).toHaveAttribute('aria-expanded', 'true')
      const panel = document.getElementById(filtersButton().getAttribute('aria-controls')!)!
      expect(within(panel).getByRole('group', { name: 'Show' })).toBeInTheDocument()

      await openFilters()
      expect(screen.queryByRole('group', { name: 'Show' })).not.toBeInTheDocument()
    })

    it('says how many filters are in use', () => {
      setup({ ...DEFAULT_FILTERS, show: 'atms', radiusKm: 10 }, located)

      expect(filtersButton()).toHaveAccessibleName('Filters, 2 in use')
    })

    it('shows no count for the defaults', () => {
      setup()

      expect(filtersButton()).toHaveAccessibleName('Filters')
      expect(document.querySelector('.filter-button__count')).toBeNull()
    })

    it('marks the current show option as pressed', async () => {
      setup({ ...DEFAULT_FILTERS, show: 'atms' })
      await openFilters()

      expect(screen.getByRole('button', { name: 'ATMs' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: 'Branches' })).toHaveAttribute('aria-pressed', 'false')
    })

    it('switches what is shown', async () => {
      const { onChange } = setup()
      await openFilters()

      await userEvent.click(screen.getByRole('button', { name: 'Both' }))

      expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, show: 'both' })
    })

    it('offers 5, 10, 25, 50 and 100 km once the location is known', async () => {
      setup(DEFAULT_FILTERS, located)
      await openFilters()

      const chips = within(screen.getByRole('group', { name: 'Within' })).getAllByRole('button')
      expect(chips.map((chip) => chip.textContent)).toEqual(['5 km', '10 km', '25 km', '50 km', '100 km'])
      expect(chips.every((chip) => chip.hasAttribute('disabled'))).toBe(false)
    })

    it('chooses a distance, and marks the chosen one', async () => {
      const { onChange } = setup({ ...DEFAULT_FILTERS, radiusKm: 25 }, located)
      await openFilters()

      expect(screen.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: '10 km' })).toHaveAttribute('aria-pressed', 'false')

      await userEvent.click(screen.getByRole('button', { name: '10 km' }))
      expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, radiusKm: 10 })
    })

    it('goes back to any distance when the chosen one is pressed again', async () => {
      const { onChange } = setup({ ...DEFAULT_FILTERS, radiusKm: 25 }, located)
      await openFilters()

      await userEvent.click(screen.getByRole('button', { name: '25 km' }))

      expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, radiusKm: null })
    })

    it('turns the distances off, and says why, until Near me is on', async () => {
      setup()
      await openFilters()

      const group = screen.getByRole('group', { name: 'Within' })
      for (const chip of within(group).getAllByRole('button')) expect(chip).toBeDisabled()
      expect(group).toHaveAccessibleDescription(/Turn on Near me/)
    })

    it('has no hint once Near me is on', async () => {
      setup(DEFAULT_FILTERS, located)
      await openFilters()

      expect(screen.queryByText(/Turn on Near me/)).not.toBeInTheDocument()
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

    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, query: 'Sandton' })
  })

  it('reports a chosen branch suggestion, so the page can open it', async () => {
    const { onPickBranch } = setup({ ...DEFAULT_FILTERS, query: 'sandton city' })

    await userEvent.click(search())
    await userEvent.click(screen.getByRole('option', { name: /Capitec Bank Sandton City/ }))

    expect(onPickBranch).toHaveBeenCalledWith('sandton')
  })
})
