import { render, screen, within } from '@testing-library/react'
import type { ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import type { UseBranchesResult } from '../model/useBranches'
import type { Branch } from '../types'
import { DEFAULT_FILTERS as APP_DEFAULTS, type LocatorFilters } from '../model/filters'
import { BranchResults } from './BranchResults'

// The page starts on both kinds within 25 km; these tests start from branches only, with any distance.
const DEFAULT_FILTERS: LocatorFilters = { ...APP_DEFAULTS, show: 'branches', radiusKm: null }

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
const select = vi.fn()

/** BranchResults with sensible defaults, so each test only states what it cares about. */
function Results(
  props: Partial<ComponentProps<typeof BranchResults>> & Pick<ComponentProps<typeof BranchResults>, 'state'>,
) {
  return <BranchResults filters={DEFAULT_FILTERS} now={now} onClearFilters={clear} onSelect={select} {...props} />
}

const success = (branches: Branch[]): UseBranchesResult => ({ status: 'success', branches, retry })

describe('BranchResults', () => {
  beforeEach(() => {
    retry.mockReset()
    clear.mockReset()
    select.mockReset()
  })

  it('shows a single h1', () => {
    render(<Results state={success([])} />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('announces loading and shows placeholders instead of cards', () => {
    render(<Results state={{ status: 'loading', retry }} />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading branches')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('lists branches sorted by name and announces the count', () => {
    render(<Results state={success([branch('b', 'Capitec Bank Paarl'), branch('a', 'Capitec Bank Durban')])} />)

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
    render(<Results state={{ status: 'error', message: 'Could not reach the branch service.', retry }} />)

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

  it('explains when the search matches nothing and offers to clear it', async () => {
    render(
      <Results
        state={success([branch('a', 'Capitec Bank Paarl')])}
        filters={{ ...DEFAULT_FILTERS, query: 'nowhere' }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'No matches found' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('explains when nothing is within the chosen distance and offers to clear the filters', async () => {
    render(
      <Results
        state={success([branch('a', 'Capitec Bank Paarl', { location: { lat: -33.7, lng: 18.97 } })])}
        filters={{ ...DEFAULT_FILTERS, radiusKm: 5 }}
        origin={{ lat: -26.2, lng: 28.05 }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'No matches found' })).toBeInTheDocument()
    expect(screen.getByText(/fewer filters/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('says the distance in the count that screen readers hear', () => {
    render(
      <Results
        state={success([branch('a', 'Capitec Bank Paarl')])}
        filters={{ ...DEFAULT_FILTERS, radiusKm: 25 }}
        origin={{ lat: -26.2, lng: 28.05 }}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('1 location within 25 km, nearest first')
  })

  it('does not offer to clear the search when there is none', () => {
    render(<Results state={success([])} />)

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('reports which branch was chosen', async () => {
    render(<Results state={success([branch('a', 'Capitec Bank Paarl')])} />)

    await userEvent.click(screen.getByRole('button', { name: 'Capitec Bank Paarl' }))

    expect(select).toHaveBeenCalledWith('a')
  })

  describe('with the user’s location', () => {
    const johannesburg = { lat: -26.2041, lng: 28.0473 }
    const state = success([
      branch('far', 'Alpha Cape Town', { location: { lat: -33.9, lng: 18.4 } }),
      branch('near', 'Zulu Johannesburg', { location: { lat: -26.21, lng: 28.05 } }),
    ])

    it('lists the nearest first, with distances, and says so', () => {
      render(<Results state={state} origin={johannesburg} />)

      const names = screen.getAllByRole('article').map((card) => within(card).getByRole('heading').textContent)
      expect(names).toEqual(['Zulu Johannesburg', 'Alpha Cape Town'])
      expect(screen.getByRole('status')).toHaveTextContent('2 locations, nearest first')
      expect(screen.getAllByText(/ km away$/).length).toBeGreaterThan(0)
    })

    it('lists by name, without distances, when there is no location', () => {
      render(<Results state={state} origin={null} />)

      const names = screen.getAllByRole('article').map((card) => within(card).getByRole('heading').textContent)
      expect(names).toEqual(['Alpha Cape Town', 'Zulu Johannesburg'])
      expect(screen.getByRole('status')).toHaveTextContent('sorted by name')
    })
  })
})
