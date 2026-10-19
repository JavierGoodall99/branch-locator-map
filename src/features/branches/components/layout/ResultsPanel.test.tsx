import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { DEFAULT_FILTERS, type LocatorFilters } from '@/features/branches/model/locatorFilters'
import type { UseBranchesResult } from '@/features/branches/model/useBranches'
import type { Branch } from '@/features/branches/types'
import { ResultsPanel } from './ResultsPanel'

function branch(id: string, name: string, overrides: Partial<Branch> = {}): Branch {
  return {
    id,
    name,
    type: 'branch',
    services: ['Branch'],
    address: '1 Test Street, Gauteng, 2000',
    province: 'Gauteng',
    postalCode: '2000',
    phone: null,
    location: { lat: -26.2, lng: 28.05 },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
    ...overrides,
  }
}

const branches = [branch('paarl', 'Capitec Bank Paarl'), branch('durban', 'Capitec Bank Durban')]
const loaded: UseBranchesResult = { status: 'success', branches, retry: vi.fn() }
// The page's defaults, with any distance, so nothing here depends on a location.
const filters: LocatorFilters = { ...DEFAULT_FILTERS, radiusKm: null }
const now = new Date('2026-10-14T08:00:00Z')

function setup(props: Partial<ComponentProps<typeof ResultsPanel>> = {}) {
  const onSelect = vi.fn()
  const view = render(
    <ResultsPanel
      state={loaded}
      filters={filters}
      now={now}
      origin={null}
      selectedId={null}
      onSelect={onSelect}
      onClearFilters={vi.fn()}
      {...props}
    />,
  )
  const show = (selectedId: string | null) =>
    view.rerender(
      <ResultsPanel
        state={loaded}
        filters={filters}
        now={now}
        origin={null}
        onSelect={onSelect}
        onClearFilters={vi.fn()}
        {...props}
        selectedId={selectedId}
      />,
    )
  return { onSelect, show }
}

describe('ResultsPanel', () => {
  it('shows the list when nothing is open', () => {
    setup()

    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Back to results' })).not.toBeInTheDocument()
  })

  it('shows the details of the open place instead of the list', () => {
    setup({ selectedId: 'durban' })

    expect(screen.getByRole('heading', { level: 1, name: 'Capitec Bank Durban' })).toBeInTheDocument()
    // The details are an article too, so look for the list's cards by name.
    expect(screen.queryByRole('article', { name: 'Capitec Bank Paarl' })).not.toBeInTheDocument()
  })

  it('shows the list again when the open place is no longer in it, for example after a filter', () => {
    setup({ selectedId: 'durban', filters: { ...filters, query: 'paarl' } })

    expect(screen.queryByRole('button', { name: 'Back to results' })).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Capitec Bank Paarl' })).toBeInTheDocument()
  })

  it('goes back by clearing the open place', async () => {
    const { onSelect } = setup({ selectedId: 'durban' })

    await userEvent.click(screen.getByRole('button', { name: 'Back to results' }))

    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('returns focus to the card of the place that was open, so a keyboard user is not sent to the top', () => {
    const { show } = setup({ selectedId: 'durban' })

    show(null)

    expect(screen.getByRole('button', { name: 'Capitec Bank Durban' })).toHaveFocus()
  })

  it('does not move focus when the list is shown the first time', () => {
    setup()

    expect(document.body).toHaveFocus()
  })
})
