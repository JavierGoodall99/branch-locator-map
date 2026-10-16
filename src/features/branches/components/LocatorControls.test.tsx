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

  it('reports each typed character as the new query', async () => {
    const { onChange } = setup()

    await userEvent.type(search(), 'p')

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, query: 'p' })
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

  it('explains Near me under the search before it is used', () => {
    setup()

    expect(screen.getByText(/sorts by distance. Your location stays on your device/)).toBeInTheDocument()
  })

  it('marks the current show option as pressed', () => {
    setup({ ...DEFAULT_FILTERS, show: 'atms' })

    expect(screen.getByRole('button', { name: 'ATMs' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Branches' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches what is shown', async () => {
    const { onChange } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Both' }))

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, show: 'both' })
  })

  it('only offers to clear the search when there is one', () => {
    setup()

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('clears the search but keeps the show switch', async () => {
    const { onChange } = setup({ query: 'paarl', show: 'atms' })

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(onChange).toHaveBeenCalledWith({ query: '', show: 'atms' })
  })

  it('searches for a place when a place suggestion is chosen', async () => {
    const { onChange } = setup({ query: 'sand', show: 'branches' })

    await userEvent.click(search())
    await userEvent.click(screen.getByRole('option', { name: /^Sandton/ }))

    expect(onChange).toHaveBeenLastCalledWith({ query: 'Sandton', show: 'branches' })
  })

  it('reports a chosen branch suggestion, so the page can open it', async () => {
    const { onPickBranch } = setup({ query: 'sandton city', show: 'branches' })

    await userEvent.click(search())
    await userEvent.click(screen.getByRole('option', { name: /Capitec Bank Sandton City/ }))

    expect(onPickBranch).toHaveBeenCalledWith('sandton')
  })
})
