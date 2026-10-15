import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UseBranchesResult } from '../model/useBranches'
import type { Branch } from '../types'
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

const success = (branches: Branch[]): UseBranchesResult => ({ status: 'success', branches, retry })

describe('BranchResults', () => {
  beforeEach(() => retry.mockReset())

  it('shows a single h1 and labels the data as sample data', () => {
    render(<BranchResults state={success([])} now={now} />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('Sample data')).toBeInTheDocument()
  })

  it('announces loading and shows placeholders instead of cards', () => {
    render(<BranchResults state={{ status: 'loading', retry }} now={now} />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading branches')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('lists branches sorted by name and announces the count', () => {
    render(
      <BranchResults
        state={success([branch('b', 'Capitec Bank Paarl'), branch('a', 'Capitec Bank Durban')])}
        now={now}
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
    render(<BranchResults state={success([branch('a', 'Capitec Bank Durban')])} now={now} />)

    expect(screen.getByRole('status')).toHaveTextContent('1 location, sorted by name')
  })

  it('hides permanently closed sites but keeps temporarily closed ones', () => {
    render(
      <BranchResults
        state={success([
          branch('open', 'Capitec Bank Open'),
          branch('temp', 'Capitec Bank Temp', { status: 'temporarily-closed' }),
          branch('gone', 'Capitec Bank Gone', { status: 'permanently-closed' }),
        ])}
        now={now}
      />,
    )

    expect(screen.queryByRole('article', { name: 'Capitec Bank Gone' })).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Capitec Bank Temp' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 locations')
  })

  it('explains an empty result', () => {
    render(<BranchResults state={success([])} now={now} />)

    expect(screen.getByRole('heading', { name: 'No branches to show' })).toBeInTheDocument()
  })

  it('shows an error as an alert with a working retry', async () => {
    render(
      <BranchResults
        state={{ status: 'error', message: 'Could not reach the branch service.', retry }}
        now={now}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the branch service.')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledTimes(1)
  })
})
