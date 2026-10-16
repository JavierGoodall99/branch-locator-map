import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_FILTERS, type LocatorFilters } from '../model/filters'
import type { UseLocationResult } from '../model/useLocation'
import { LocatorControls } from './LocatorControls'

const idleLocation: UseLocationResult = { status: 'idle', request: vi.fn(), clear: vi.fn() }

function setup(filters: LocatorFilters = DEFAULT_FILTERS) {
  const onChange = vi.fn()
  render(<LocatorControls filters={filters} onChange={onChange} location={idleLocation} />)
  return { onChange }
}

describe('LocatorControls', () => {
  it('has a labelled search field inside a search landmark', () => {
    setup()

    expect(screen.getByRole('search')).toContainElement(
      screen.getByRole('searchbox', { name: 'Search by name, suburb, town or postcode' }),
    )
  })

  it('reports each typed character as the new query', async () => {
    const { onChange } = setup()

    await userEvent.type(screen.getByRole('searchbox'), 'p')

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, query: 'p' })
  })

  it('does not submit the form on Enter', async () => {
    setup()

    await userEvent.type(screen.getByRole('searchbox'), 'paarl{Enter}')

    expect(window.location.search).toBe('')
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

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, show: 'atms' })
  })
})
