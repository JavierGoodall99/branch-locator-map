import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import sample from '../public/branches.json'
import App from './App'

// There are ~190 cards, and role queries compute an accessible name for each, which is slow
// in jsdom and can time out on a busy machine. Counting cards with a plain selector keeps
// these tests quick; each card's own accessibility is covered by the BranchCard tests.
const cardCount = () => document.querySelectorAll('article').length

const stubSample = () =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(sample))))

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('loads the sample data and lists the branches', async () => {
    stubSample()
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading branches')

    const listed = sample.filter(
      (branch) => branch.status !== 'permanently-closed' && branch.type !== 'atm',
    ).length
    await waitFor(() => expect(cardCount()).toBe(listed))
    expect(screen.getByRole('status')).toHaveTextContent(`${listed} locations, sorted by name`)
  })

  it('recovers from a failed load when the user retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('down', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(sample)))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Branch service responded with status 503.',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('narrows the list as the user searches, and clears back', async () => {
    stubSample()
    render(<App />)
    await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
    const before = cardCount()

    await userEvent.type(screen.getByRole('searchbox'), 'sandton')

    expect(cardCount()).toBeGreaterThan(0)
    expect(cardCount()).toBeLessThan(before)

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(cardCount()).toBe(before)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('shows more locations when both branches and ATMs are selected', async () => {
    stubSample()
    render(<App />)
    await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
    const branchesOnly = cardCount()

    await userEvent.click(screen.getByRole('button', { name: 'Both' }))

    expect(cardCount()).toBeGreaterThan(branchesOnly)
  })
})
