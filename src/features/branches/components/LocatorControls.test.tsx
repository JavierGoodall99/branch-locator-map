import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_FILTERS, type LocatorFilters } from '../model/filters'
import { LocatorControls } from './LocatorControls'

function setup(filters: LocatorFilters = DEFAULT_FILTERS) {
  const onChange = vi.fn()
  render(<LocatorControls filters={filters} onChange={onChange} />)
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

  it('turns open now on', async () => {
    const { onChange } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Open now' }))

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, openNow: true })
  })

  it('turns open now off when it is already on', async () => {
    const { onChange } = setup({ ...DEFAULT_FILTERS, openNow: true })

    const toggle = screen.getByRole('button', { name: 'Open now' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(toggle)

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, openNow: false })
  })

  it('filters by province and can return to all provinces', async () => {
    const { onChange } = setup()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Province' }), 'Gauteng')

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, province: 'Gauteng' })
  })

  it('maps "All provinces" back to no province', async () => {
    const onChange = vi.fn()
    render(<LocatorControls filters={{ ...DEFAULT_FILTERS, province: 'Gauteng' }} onChange={onChange} />)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Province' }), 'All provinces')

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, province: null })
  })

  it('only offers to clear filters when some are applied', () => {
    setup()

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
  })

  it('clears the filters but keeps the show switch', async () => {
    const { onChange } = setup({ query: 'paarl', show: 'atms', openNow: true, province: 'Western Cape' })

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, show: 'atms' })
  })
})
