import { render, screen, within } from '@testing-library/react'
import type { ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import type { UseBranchesResult } from '../model/useBranches'
import type { Branch } from '../types'
import { DEFAULT_FILTERS } from '../model/filters'
import { BranchResults } from './BranchResults'

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

const now = new Date('2026-10-14T08:00:00Z')
const retry = vi.fn()

const clear = vi.fn()

/** BranchResults with sensible defaults, so each test only states what it cares about. */
function Results(props: Partial<ComponentProps<typeof BranchResults>> & Pick<ComponentProps<typeof BranchResults>, 'state'>) {
  return <BranchResults filters={DEFAULT_FILTERS} now={now} onClearFilters={clear} {...props} />
}

const success = (branches: Branch[]): UseBranchesResult => ({ status: 'success', branches, retry })

describe('BranchResults', () => {
  beforeEach(() => {
    retry.mockReset()
    clear.mockReset()
  })

  it('shows a single h1 and labels the data as sample data', () => {
    render(<Results state={success([])} />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('Sample data')).toBeInTheDocument()
  })

  it('announces loading and shows placeholders instead of cards', () => {
    render(<Results state={{ status: 'loading', retry }} />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading branches')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('lists branches sorted by name and announces the count', () => {
    render(
      <Results
        state={success([branch('b', 'Capitec Bank Paarl'), branch('a', 'Capitec Bank Durban')])}
      />,
    )

    const cards = screen.getAllByRole('article')
    expect(cards.map((card) => within(card).getByRole('heading').textContent)).toEqual([
      'Capitec Bank Durban',
      'Capitec Bank Paarl',
    ])
    expect(screen.getByRole('status')).toHaveTextContent('2 locations, sorted by name')
  })

  it('uses the singular for one location', () => {
    render(<Results state={success([branch('a', 'Capitec Bank Durban')])} />)

    expect(screen.getByRole('status')).toHaveTextContent('1 location, sorted by name')
  })

  it('hides permanently closed sites but keeps temporarily closed ones', () => {
    render(
      <Results
        state={success([
          branch('open', 'Capitec Bank Open'),
          branch('temp', 'Capitec Bank Temp', { status: 'temporarily-closed' }),
          branch('gone', 'Capitec Bank Gone', { status: 'permanently-closed' }),
        ])}
      />,
    )

    expect(screen.queryByRole('article', { name: 'Capitec Bank Gone' })).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Capitec Bank Temp' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 locations')
  })

  it('explains an empty result', () => {
    render(<Results state={success([])} />)

    expect(screen.getByRole('heading', { name: 'No branches to show' })).toBeInTheDocument()
  })

  it('shows an error as an alert with a working retry', async () => {
    render(
      <Results
        state={{ status: 'error', message: 'Could not reach the branch service.', retry }}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the branch service.')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('applies the filters to the list', () => {
    render(
      <Results
        state={success([
          branch('a', 'Capitec Bank Paarl', { province: 'Western Cape' }),
          branch('b', 'Capitec Bank Durban', { province: 'KwaZulu-Natal' }),
          branch('c', 'Capitec ATM Paarl', { type: 'atm' }),
        ])}
        filters={{ ...DEFAULT_FILTERS, show: 'both', query: 'paarl' }}
      />,
    )

    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.queryByRole('article', { name: 'Capitec Bank Durban' })).not.toBeInTheDocument()
  })

  it('shows only ATMs when ATMs are selected', () => {
    render(
      <Results
        state={success([branch('a', 'Capitec Bank Paarl'), branch('c', 'Capitec ATM Paarl', { type: 'atm' })])}
        filters={{ ...DEFAULT_FILTERS, show: 'atms' }}
      />,
    )

    expect(screen.getByRole('article', { name: 'Capitec ATM Paarl' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Capitec Bank Paarl' })).not.toBeInTheDocument()
  })

  it('explains when filters match nothing and offers to clear them', async () => {
    render(
      <Results
        state={success([branch('a', 'Capitec Bank Paarl')])}
        filters={{ ...DEFAULT_FILTERS, query: 'nowhere' }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'No matches found' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('does not offer to clear filters when none are applied', () => {
    render(<Results state={success([])} />)

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
  })
})
